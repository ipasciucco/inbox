/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/m/UploadCollectionParameter",
	"sap/m/VBox",
	"sap/m/ObjectAttribute",
	"sap/m/ObjectStatus",
	"sap/m/Text",
	"sap/m/Label",
	"sap/base/Log",
	"sap/base/security/encodeURL",
	"sap/suite/ui/commons/TimelineItem",
	"sap/ui/thirdparty/jquery",
	"sap/ui/Device",
	"sap/ui/core/Fragment",
	"sap/ui/core/mvc/XMLView",
	"sap/ui/layout/form/FormElement",
	"sap/ui/layout/ResponsiveFlowLayoutData",
	"sap/ui/model/Context",
	"sap/ui/model/json/JSONModel",
	"cross/fnd/fiori/inbox/attachment/util/AttachmentFormatters",
	"cross/fnd/fiori/inbox/controller/BaseController",
	"cross/fnd/fiori/inbox/util/tools/Application",
	"cross/fnd/fiori/inbox/util/tools/CommonHeaderFooterHelper",
	"cross/fnd/fiori/inbox/util/ActionHelper",
	"cross/fnd/fiori/inbox/util/Forward",
	"cross/fnd/fiori/inbox/util/ForwardSimple",
	"cross/fnd/fiori/inbox/util/SupportInfo",
	"cross/fnd/fiori/inbox/util/Conversions",
	"cross/fnd/fiori/inbox/util/DataManager",
	"cross/fnd/fiori/inbox/util/Resubmit",
	"cross/fnd/fiori/inbox/util/Parser",
	"cross/fnd/fiori/inbox/util/ConfirmationDialogManager",
	"cross/fnd/fiori/inbox/util/EmployeeCard",
	"cross/fnd/fiori/inbox/util/ComponentCache",
	"cross/fnd/fiori/inbox/util/CommonFunctions",
	"cross/fnd/fiori/inbox/util/Utils",
	"sap/ui/core/format/DateFormat",
	"sap/ui/core/Component",
	"cross/fnd/fiori/inbox/annotationBasedTaskUI/Component"
], function (MessageBox, MessageToast, UploadCollectionParameter, VBox, ObjectAttribute, ObjectStatus, Text, Label,
	Log, encodeURL, TimelineItem, jQuery, Device, Fragment, XMLView, FormElement, ResponsiveFlowLayoutData, Context, JSONModel,
	AttachmentFormatters, BaseController, Application, CommonHeaderFooterHelper, ActionHelper, Forward,
	ForwardSimple, SupportInfo, Conversions, DataManager, Resubmit, Parser, ConfirmationDialogManager,
	EmployeeCard, ComponentCache, CommonFunctions, Utils, DateFormat, Component, ComponentBasedTaskUI
) {
	"use strict";

	return BaseController.extend("cross.fnd.fiori.inbox.view.S3", {
		//	Controller Hook method definitions
		//	This hook method can be used to perform additional requests for example
		//	It is called in the success callback of the detail data fetch
		extHookOnDataLoaded: null,
		//	This hook method can be used to add custom related entities to the expand list of the detail data request
		//	It is called when the detail view is displayed and before the detail data fetch starts
		extHookGetEntitySetsToExpand: null,
		//	This hook method can be used to add and change buttons for the detail view footer
		//	It is called when the decision options for the detail item are fetched successfully
		extHookChangeFooterButtons: null,
		// the model of the detail view
		oModel2: null,
		// cached detailed data for selected item
		oDetailData2: null,
		oGenericComponent: null,
		oGenericAttachmentComponent: null,
		oConfirmationDialogManager: ConfirmationDialogManager,
		fnFormatterSupportsProperty: Conversions.formatterSupportsProperty,
		oMapCountProperty: {
			"Comments": "CommentsCount",
			"Attachments": "AttachmentsCount",
			"ProcessingLogs": "ProcessingLogsCount"
		},
		bShowAdditionalAttributes: null,
		bTaskTitleInHeader: null,
		bStandaloneDetailDeep: null,
		sCustomTaskTitleAttribute: "CustomTaskTitle",
		sCustomNumberValueAttribute: "CustomNumberValue",
		sCustomNumberUnitValueAttribute: "CustomNumberUnitValue",
		sCustomObjectAttributeValue: "CustomObjectAttributeValue",
		sCustomCreatedByAttribute: "CustomCreatedBy",
		oCrossNavigationService: null,
		OPEN_MODES: ["embedIntoDetails","replaceDetails","external","genericEmbedIntoDetails","embedIntoDetailsNestedRouter"],
		sCustomCreatedByValue: null,
		// This counter will be used as an unique identifier of every task selection
		// It will be incremented on every task select. When the program flow face
		// asynchronious code (request, promise) we will bind the current count to the callback function.
		// When the operation is done and the callback is invoked, we will compare the binded count with the current one
		// so we know, that there were no other task selection while we was waiting
		_taskSwitchCount: 0,
		embedFioriElements: null,
		// Cache for oNavigationService component names get by intent
		compNameByIntent: {},
		// The name of the last target displayed to embed Fiori Elements app
		_lastTargetDisplayed: false,

		onExit: function() {
			this.oComponentCache.destroyCacheContent();
			delete this.oComponentCache;
		},

		onInit: function() {
			//-- set the default oData Model
			var oView = this.getView();

			this.i18nBundle = this.getResourceBundle();
			
			// creating a unique ID of add substitute fragment for the current instance of view
			this.sResubmitUniqueId = this.createId() + "DLG_RESUBMIT";
			ComponentBasedTaskUI.controller = this;
			
			//Subscribe to events
			var oEventBus = this.getOwnerComponent().getEventBus();
			oEventBus.subscribe("cross.fnd.fiori.inbox", "open_supportinfo", this.onSupportInfoOpenEvent, this);
			oEventBus.subscribe("cross.fnd.fiori.inbox.dataManager", "taskCollectionFailed", this.onTaskCollectionFailed.bind(this));
			oEventBus.subscribe("cross.fnd.fiori.inbox.dataManager", "showReleaseLoaderOnInfoTab", this.onShowReleaseLoaderOnInfoTab.bind(this));
			oEventBus.subscribe("cross.fnd.fiori.inbox.dataManager", "showReleaseLoader", this.onShowReleaseLoader.bind(this));
			oEventBus.subscribe("cross.fnd.fiori.inbox.dataManager", "UIExecutionLinkRequest", this.onShowReleaseLoader.bind(this));

			// for Handling Custom Attributes creation/removal
			this.aCA = [];
			this.aTaskDefinitionData = [];
			this.aUIExecutionLinkCatchedData = [];

			//if upload enabled, must set xsrf token
			//and the base64 encodingUrl service for IE9 support!
			this.oRouter = this.getOwnerComponent().getRouter();

			this.oRouter.attachRoutePatternMatched(this.handleNavToDetail, this);

			this.oRouter.attachBeforeRouteMatched(this.handleBeforeRouteMatched, this);

			this.oHeaderFooterOptions = {};

			this.oTabBar = oView.byId("tabBar");

			var oDataManager = this.getOwnerComponent().getDataManager();
			if (oDataManager) {
				//oDataManager.detailPage = this.getView();
				var iCacheSize = oDataManager.getCacheSize();
				if (iCacheSize) {
					this.oComponentCache = new ComponentCache(iCacheSize);
				}
				else {
					this.oComponentCache = new ComponentCache();
				}
			}
			else {
				this.oComponentCache = new ComponentCache();
			}

			this._setExtensionState(false);

			// Looking for SPACE button pressed on "InvisibleTabStop" at the end of Side Content
			this.getView().byId("InvisibleTabStop").addEventDelegate({
				onsapspace : function(oEvent) {
					var oTaskBtn = this.byId("LogButtonID");
					this.onLogBtnPress();

					setTimeout(function () {
						oTaskBtn.focus();
					}, 300);
				}
			},this);

			// fix for custom attributes to appear after refresh in detail deep or open with url with certain task
			if (!oDataManager.oServiceMetaModel) {
				//Execution can only continue - e.g.: metadata fetch success
				oDataManager.oModel.getMetaModel().loaded()
				.then(function() {
					oDataManager.oServiceMetaModel = oDataManager.oModel.getMetaModel();
				}.bind(this));
			}

			this.oAppImp = cross.fnd.fiori.inbox.util.tools.Application.getImpl();
		},  // End of init()

		onTaskCollectionFailed: function() {
			this.getView().setBusy(false);
		},

		onShowReleaseLoaderOnInfoTab: function(sChannelId, sEventId, oValue) {
			var oInfoTab = this.getView().byId("infoTabContent");
			if (oInfoTab) {
				oInfoTab.setBusyIndicatorDelay(0).setBusy(oValue.bValue);
			}
		},

		onShowReleaseLoader: function(sChannelId, sEventId, oValue) {
			this.getView().setBusyIndicatorDelay(1000);
			this.getView().setBusy(oValue.bValue);
		},

		// create Comments component and attach event listeners
		createGenericCommentsComponent: function(oView) {
			var oCommentsContainer = this._getEmbedIntoDetailsNestedRouter() ? oView.byId("commentsContainerInDetails") : oView.byId("commentsContainer");
			if (!jQuery.isEmptyObject(this.oGenericCommentsComponent)) {
				this.oGenericCommentsComponent.destroy();
				delete this.oGenericCommentsComponent;
			}
			this.oGenericCommentsComponent = sap.ui.getCore().createComponent({
				name: "cross.fnd.fiori.inbox.comments",
				componentData: {
					oModel: this.oModel2 // this model will contain the comments data object
						// oContainer: oView.byId("commentsContainer") mandatory setting in case of propagate model
				}
			});
			this.oGenericCommentsComponent.setContainer(oCommentsContainer);
			oCommentsContainer.setComponent(this.oGenericCommentsComponent);
			// Subscribe to events for comment added and to show business card
			this.oGenericCommentsComponent.getEventBus()
				.subscribe(null, "commentAdded", this.onCommentPost.bind(this));

			this.oGenericCommentsComponent.getEventBus()
				.subscribe(null, "businessCardRequested", this.onEmployeeLaunchCommentSender.bind(this));
		},

		resetDetailView: function() {

			if(!this.oModel2) return;

			this.oModel2.setProperty("/showDefaultView", false);
			this.oModel2.setProperty("/embedFioriElements", false);
			this.oModel2.setProperty("/showGenericComponent", false);
		},

		handleBeforeRouteMatched: function(){
			this._suspendTarget(this._lastTargetDisplayed);
		},

		handleNavToDetail: function(oEvent) {
			this.oRoutingParameters = oEvent.getParameters().arguments;
			if (oEvent.getParameter("name") === "detail" || oEvent.getParameter("name") === "detail_deep") {
				this.bIsTableViewActive = (oEvent.getParameter("name") === "detail_deep" && !this.bNavToFullScreenFromLog);
				var sInstanceID = oEvent.getParameter("arguments").InstanceID;
				var sContextPath = oEvent.getParameters().arguments.contextPath;
				var sOrigin = oEvent.getParameter("arguments").SAP__Origin;
				if (sInstanceID && sInstanceID.lastIndexOf(":") === (sInstanceID.length - 1)) {
					return;
				}
				// The task switch increments the count
				// Check the comments on the property's declaration
				this._taskSwitchCount++;
				this.resetDetailView();

				var sPath = "/TaskCollection(SAP__Origin='" + sOrigin + "',InstanceID='" + sInstanceID + "')";
				// Deep link scenario: needs to load the detail view first on executing a deep link URL
				if (jQuery.isEmptyObject(this.getView().getModel().getProperty(sPath))) {
					var oDataManager = this.getOwnerComponent().getDataManager();
					// fix for master detail custom attributes to appear after refresh or open with url to certain task
					oDataManager.oModel.getMetaModel().loaded().then(function(taskSwitchCount) {

						// Exit if another task was clicked while waiting
						if (taskSwitchCount !== this._taskSwitchCount) {
							Log.warning("getMetaModel: task switched while waiting!");
							return;
						}

						var that = this;
						var aParams = [];
						if (oDataManager.getShowAdditionalAttributes() && oDataManager.checkPropertyExistsInMetadata("CustomAttributeData")) {
							aParams.push("$expand=CustomAttributeData");
						}
						oDataManager.setCallFromDeepLinkURL(true);
						oDataManager.oDataRead(sPath, aParams,
							function(taskSwitchCount, oDetailData) {

								// Exit if another task was clicked while waiting
								if (taskSwitchCount !== this._taskSwitchCount) {
									Log.warning("oDataRead: task switched while waiting!");
									return;
								}

								oDataManager=that.getOwnerComponent().getDataManager();
								if (oDetailData === undefined || jQuery.isEmptyObject(oDetailData)) {
									oDataManager.setDetailPageLoadedViaDeepLinking(false);
								}
								else {
									var oItem = jQuery.extend(true, {}, oDetailData);
									if (that.fnIsTaskInstanceAllowed(oItem,oDataManager)) {
										oDataManager.setDetailPageLoadedViaDeepLinking(true);
										that.fnPerpareToRefreshData(sContextPath, sInstanceID, sOrigin);
									}
									else {
										oDataManager.setDetailPageLoadedViaDeepLinking(false);
										// standaloneDetailDeep mode works only when it is not navigated from master detail or table view
										if (oDataManager.getStandaloneDetailDeep() && !oDataManager.getTableView()
												&& !((typeof that.getView().getParent().getParent().isMasterShown === "function")
												&& that.getView().getParent().getParent().isMasterShown())) {
											that.oRouter.navTo("detail_deep_empty", null, false);
										}
									}
								}
							}.bind(this, this._taskSwitchCount),
							function(taskSwitchCount, oError) {

								// Exit if another task was clicked while waiting
								if (taskSwitchCount !== this._taskSwitchCount) {
									Log.warning("oDataRead(fail): task switched while waiting!");
									return;
								}
								
								that.getOwnerComponent().getDataManager().setDetailPageLoadedViaDeepLinking(false);
								var oDataManager = that.getOwnerComponent().getDataManager();
								// standaloneDetailDeep mode works only when it is not navigated from master detail or table view
								if (oDataManager.getStandaloneDetailDeep() && !oDataManager.getTableView()
										&& !((typeof that.getView().getParent().getParent().isMasterShown === "function")
										&& that.getView().getParent().getParent().isMasterShown())) {
									var sMessage = that.i18nBundle.getText("detailDeepEmptyView.closingTabMessage");
									var jsonResponse = null;
									if (oError.hasOwnProperty("responseText") && CommonFunctions.isJson(oError.responseText)) {
										jsonResponse = JSON.parse(oError.responseText);
									}

									if (jsonResponse && jsonResponse.error && jsonResponse.error.message && jsonResponse.error.message.value) {
										sMessage = jsonResponse.error.message.value + ". " + sMessage;
									}
									else if (oError.hasOwnProperty("message")) {
										sMessage = oError.message + ". " + sMessage;
									}
									that.getView().getModel().sDetailDeepEmptyMessage = sMessage;
									that.oRouter.navTo("detail_deep_empty", null, false);
								}
								else {
									that.showEmptyView(null, "detailDeepEmptyView.noLongerAvailableTaskMessage");
								}
							}.bind(this, this._taskSwitchCount)
						);
					}.bind(this, this._taskSwitchCount));
				}
				else {
					//In case of a list item selection the first tab shall be selected
					//Exception: Comment is added on the comment tab - this tab must stay selected or nav to detail on phone
					this.fnPerpareToRefreshData(sContextPath, sInstanceID, sOrigin);
				}
			}
		},

		fnPerpareToRefreshData: function(ctxPath, instanceID, sapOrigin) {
			if (!this.stayOnDetailScreen || Device.system.phone) {
				var oDescriptionTab = this.oTabBar.getItems()[0];
				this.oTabBar.setSelectedItem(oDescriptionTab);
			}
			else {
				this.stayOnDetailScreen = false;
			}

			var oRefreshData = {
				sCtxPath: "/" + ctxPath,
				sInstanceID: instanceID,
				sSAP__Origin: sapOrigin, // eslint-disable-line camelcase
				bCommentCreated: false
			};
			this.refreshData(oRefreshData);

			if (!Device.system.phone) {
				var oDataManager = this.getOwnerComponent().getDataManager();
				if (oDataManager && oDataManager.bOutbox) {
					Conversions.setShellTitleToOutbox(this.getOwnerComponent(), "cross.fnd.fiori.inbox.view.S3");
				}
			}
		},

		fnIsTaskInstanceAllowed: function(oItem,oDataManager) {
			if (oDataManager.bOutbox && ( oItem.Status === "COMPLETED" || oItem.Status === "FOR_RESUBMISSION")) {
				return true;
			}
			else if (!(oDataManager.bOutbox) && (oItem.Status === "READY" || oItem.Status === "RESERVED" || oItem.Status === "IN_PROGRESS" || oItem
				.Status === "EXECUTED")) {
				return true;
			}
			else {
				return false;
			}
		},

		fnGetUploadUrl: function(sContextPath) {
			return this.oContext.getModel().sServiceUrl + sContextPath + "/Attachments";
		},

		fnCreateAttachmentHandle: function(sContextPath) {
			var oAttachmentHandle = {
				fnOnAttachmentChange: this.onAttachmentChange.bind(this),
				fnOnAttachmentUploadComplete: this.onAttachmentUploadComplete.bind(this),
				fnOnAttachmentDeleted: this.onAttachmentDeleted.bind(this),
				detailModel: this.oModel2,
				uploadUrl: this.fnGetUploadUrl(this.sCtxPath)
			};
			return oAttachmentHandle;
		},

		fnRenderComponent: function(oComponentParameters) {
			//Do not use component cache, in case of debug mode
			if (this.oDataManager.bDebug) {
				var sPreservedKey = this.oGenericComponent && this.oGenericComponent.getId && this.oGenericComponent.getId();
				this.oComponentCache.destroyCacheContent(sPreservedKey);
			}

			var oDetailData = this.oModel2.getData();
			var sTaskDefinitionID = oDetailData ? oDetailData["TaskDefinitionID"] : "";
			var sSAPOrigin = oDetailData ? oDetailData["SAP__Origin"] : "";
			var sKey = sTaskDefinitionID.concat(sSAPOrigin);
			var sComponentId = undefined;
			if (oComponentParameters.ComponentName === "cross.fnd.fiori.inbox.annotationBasedTaskUI") {
				sKey = this.generateEscapedComponentKey(sKey);
				sComponentId = sKey;
			}
			var sPriorityText = Conversions.formatterPriority.call(this.getView(), sSAPOrigin, oDetailData ? oDetailData["Priority"] : "" );
			var sStatusText = oDetailData ? oDetailData["StatusText"] : "";
			if (!sStatusText) {
				sStatusText = Conversions.formatterStatus.call(this.getView(), sSAPOrigin, oDetailData ? oDetailData["Status"] : "" );
			}

			this.oModel2.setProperty("/PriorityText", sPriorityText);
			this.oModel2.setProperty("/StatusText", sStatusText);
			var oComponent = this.oComponentCache.getComponentByKey(sKey);

			var oParameters = {
				sServiceUrl: oComponentParameters.ServiceURL,
				sAnnoFileURI: oComponentParameters.AnnotationURL,
				sErrorMessageNoData: this.i18nBundle.getText("annotationcomponent.load.error"),
				sApplicationPath: oComponentParameters.ApplicationPath,
				oTaskModel:this.fnCloneTaskModel(oDetailData),
				oQueryParameters:oComponentParameters.QueryParameters
			};
			var oCompData = {
				startupParameters: {
					oParameters: oParameters,
					taskModel: this.fnCloneTaskModel(oDetailData),
					inboxAPI : {
						addAction: this.addAction.bind(this),
						removeAction: this.removeAction.bind(this),
						updateTask: this.updateTask.bind(this),
						getDescription: this.getDescription.bind(this),
						setShowFooter: this.setShowFooter.bind(this),
						setShowNavButton: this.setShowNavButton.bind(this),
						disableAction: this.disableAction.bind(this),
						disableAllActions: this.disableAllActions.bind(this),
						enableAction: this.enableAction.bind(this),
						enableAllActions: this.enableAllActions.bind(this)
					},
					//only for internal use
					inboxInternal:{
						//requests TaskDefinitionCollection and TaskCollection
						//to be used only when completing a task
						updateTaskList: this.updateTaskList.bind(this)
					}
				},

				inboxHandle: {
					attachmentHandle: this.fnCreateAttachmentHandle(this.sCtxPath),
					tabSelectHandle: {
						fnOnTabSelect: this.onTabSelect.bind(this)
					},
					inboxDetailView: this
				}
			};
			var oView = this.getView();
			if (!jQuery.isEmptyObject(this.oGenericComponent)) {
				if (!this.oComponentCache.getComponentById(this.oGenericComponent.getId())) {
					this.oGenericComponent.destroy();
				}
			}
			if (jQuery.isEmptyObject(oComponent)) {
				//if the Component is not in the same application
				if (oComponentParameters.ApplicationPath && oComponentParameters.ApplicationPath !== "") {
					var modulePath = oComponentParameters.ApplicationPath[0] === "/"
						? oComponentParameters.ApplicationPath
						: "/" + oComponentParameters.ApplicationPath;
					var moduleName = oComponentParameters.ComponentName.replace(/\./g, "/");
					var oPathsObject = {};
					oPathsObject[moduleName] = modulePath;

					sap.ui.loader.config({
						paths: oPathsObject
					});
				}
				try {
					var fnCreateComponent = function() {
						return sap.ui.getCore().createComponent({
							name: oComponentParameters.ComponentName,
							componentData: oCompData,
							id: sComponentId
						});
					};
					var oOwnerComponent = Component.getOwnerComponentFor(this.getView());
					if (oOwnerComponent && oOwnerComponent.runAsOwner && oComponent) {
						oComponent = oOwnerComponent.runAsOwner(fnCreateComponent);
					}
					else {
						oComponent = fnCreateComponent();
					}
					if (oComponent && oComponent.getIsCacheable && oComponent.getIsCacheable() === true) {
						try {
							this.oComponentCache.cacheComponent(sKey, oComponent);
						}
						catch (oErr) {
							Log.error(oErr);
						}
					}
				}
				catch (oError) {
					Log.error("Cannot create component" + oComponentParameters.ComponentName + "for smart template rendering. Showing standard task in the detail screen as a fallback: " + oError.message);
					return false;
				}
			}
			else if (oComponent && oComponent.updateBinding) {
					oComponent.updateBinding(oCompData);
				}
			oView.byId("genericComponentContainer").setComponent(oComponent);
			this.oGenericComponent = oComponent;

			return true;
		},

		_suspendTarget: function (targetName) {

			if (!targetName) {
				return;
			}
			var targets = this.oRouter.getTargets();
			var target = targets.getTarget(targetName);

			if (target === undefined) {
				return;
			}
			target.suspend();
		},

		getComponentViaRoutingTarget: function(
			intent,
			componentName,
			componentConfig,
			startParams,
			oItem,
			oRefreshData,
			fnSuccess
		){

			var targets = this.oRouter.getTargets();
			var targetAdded = false;

			if (targets.getTarget(componentName) === undefined) {
				
				targets.addTarget(componentName, {
					name: componentName,
					options: componentConfig,
					type: "Component",
					controlAggregation: "flexContent",
					id: componentName,
					controlId: "fioriElementsContainer",
					parent: "myInboxDetail"
				});
				targetAdded = true;
			}
			targets.display({
				name: componentName,
				prefix: intent,
				routeRelevant: true,
				ignoreInitialHash: true
			}).then(function(newTarget, startupParameters, taskSwitchCount, targetData){

				if (taskSwitchCount !== this._taskSwitchCount) {

					// The task has changed while waiting
					Log.warning("target.display: task switched while waiting!");
					return;
				}

				this.loadDecisionOptions(oItem, oRefreshData, "decisionOptions");

				if (newTarget) {

					// New targets display component in the right state
					return;
				}

				var componentInstance = targetData[0].view.getComponentInstance();
				componentInstance.navigateBasedOnStartupParameter(startupParameters);

			}.bind(
				this,
				targetAdded,
				JSON.parse(JSON.stringify(startParams)),
				this._taskSwitchCount
				)
			).catch(function(taskSwitchCount, oError){

				if (taskSwitchCount !== this._taskSwitchCount) {

					// The task has changed while waiting
					Log.warning("target.display(fail): task switched while waiting!");
					return;
				}
				// if cannot render component, open default view
				Log.error(oError);
				this.fnViewTaskInDefaultView(oItem, oRefreshData, fnSuccess);

			}.bind(this, this._taskSwitchCount));

			this._lastTargetDisplayed = componentName;
		},

		generateEscapedComponentKey: function(sUnencodedKey) {
			// Component id has to start with letter and only contain a-z0-9-_:.
			return "inb_" + btoa(sUnencodedKey).replace(/\+/g, "-").replace(/\//g, "_").replace(/[=]/g, "");
		},

		fnParseComponentParameters: function(sRawString) {
			var oParameters = Parser.fnParseComponentParameters(sRawString);
			this.isGenericComponentRendered = !jQuery.isEmptyObject(oParameters) ? this.fnRenderComponent(oParameters) : false;
			this.oModel2.setProperty("/showGenericComponent", this.isGenericComponentRendered);

			if(this.isGenericComponentRendered) {

				this.oModel2.setProperty("/embedFioriElements", false);
				this.oModel2.setProperty("/showDefaultView", false);

				this.embedFioriElements = false;
				this.showHideSideContent();
			}
			this.fnShowHideDetailScrollBar(!this.isGenericComponentRendered);
		},

		fnCloneTaskModel:function(oTaskJson) {
			var taskProperties = ["SAP__Origin",
								"InstanceID",
								"TaskDefinitionID",
								"TaskDefinitionName",
								"TaskTitle",
								"Priority",
								"PriorityText",
								"Status",
								"StatusText",
								"CreatedOn",
								"CreatedBy",
								"CreatedByName",
								"Processor",
								"ProcessorName",
								"SubstitutedUser",
								"SubstitutedUserName",
								"StartDeadLine",
								"CompletionDeadLine",
								"ExpiryDate",
								"IsEscalated",
								"PriorityNumber"];

			var cloneTaskJson = {};
			for (var i=0; i < taskProperties.length; i++) {
				if (oTaskJson.hasOwnProperty(taskProperties[i])) {
						cloneTaskJson[taskProperties[i]] = oTaskJson[taskProperties[i]];
				}
			}
			var oView = this.getView();
			var cloneTaskModel = oView.getModel("detailClone");
			if (!cloneTaskModel) {
				cloneTaskModel = new JSONModel();
				oView.setModel(cloneTaskModel, "detailClone");
			}
			cloneTaskModel.setData(cloneTaskJson, false);
			return cloneTaskModel;
		},

		fnShowHideDetailScrollBar: function(bShow) {
			if (bShow) {
				this.byId("mainPage").setEnableScrolling(true);
			}
			else {
				this.byId("mainPage").setEnableScrolling(false);
			}
		},

		switchToOutbox: function() {
			return this.oDataManager.bOutbox ? true : false;
		},

		_updateDetailModel: function(oItem, bMerge) {
			if (this.oModel2) {
				this.oModel2.setData(oItem, bMerge);
				this.fnCloneTaskModel(this.oModel2.getData());
			}
			else {
				Log.error("Detail Model is null.");
			}
		},

		_getCustomAttributesValue: function(oItem) {
			var aCustomAttributes = oItem.CustomAttributeData;
			var aCustomAttributeValues = [];
			for (var i=0; i<aCustomAttributes.length; i++) {
				aCustomAttributeValues[i] = this.getView().getModel().getProperty("/" + aCustomAttributes[i]);
			}
			return aCustomAttributeValues;
		},

		refreshData: function(oRefreshData, oDetailData) {
			if (oDetailData !== undefined) {
				this.aTaskDefinitionData = oDetailData;
			}
			else {
				// store taskdefinitions for the selected task
				var oTaskDefinitionModel = this.getView().getModel("taskDefinitionsModel");
				this.aTaskDefinitionData = oTaskDefinitionModel ? oTaskDefinitionModel.getData() : [];
			}
			if (!this.bIsControllerInited) {
				var oComponent = this.getOwnerComponent();
				this.oDataManager = oComponent.getDataManager();
				if (!this.oDataManager) {
					var oOriginalModel = this.getView().getModel();

					this.oDataManager = new DataManager(this);
					this.oDataManager.setModel(oOriginalModel);
					oComponent.setDataManager(this.oDataManager);
				}
				this.oDataManager.attachItemRemoved(this._handleItemRemoved.bind(this));
				this.oDataManager.attachRefreshDetails(this._handleDetailRefresh.bind(this));
				this.bIsControllerInited = true;
			}

			if (this.bIsTableViewActive === true) {
				this.aTaskDefinitionData = this.oDataManager.getTaskDefinitionModel();
			}

			//clearing already present custom attributes from DOM
			this.clearCustomAttributes();

			var oView = this.getView();
			this.oContext = new Context(oView.getModel(), oRefreshData.sCtxPath);
			oView.setBindingContext(this.oContext);

			// store the context path to be used for the delayed downloads
			this.sCtxPath = oRefreshData.sCtxPath;

			var oItem = jQuery.extend(true, {}, oView.getModel().getData(this.oContext.getPath(), this.oContext));
			if (jQuery.isEmptyObject(oItem)) {
				oItem = jQuery.extend(true, {}, oView.getModel().getData(encodeURI(this.oContext.getPath()), this.oContext));
			}

			// standaloneDetailDeep mode works only when it is not navigated from master detail or table view
			if (jQuery.isEmptyObject(oItem) && this._getStandaloneDetailDeep() && !this.oDataManager.getTableView()
					&& !((typeof this.getView().getParent().getParent().isMasterShown === "function")
					&& this.getView().getParent().getParent().isMasterShown())) {
				this.oRouter.navTo("detail_deep_empty", null, false);
				return;
			}

			if (jQuery.isEmptyObject(oItem)) {
				this.showEmptyView(null, "detailDeepEmptyView.noLongerAvailableTaskMessage");
				return;
			}

			var oActionHelper = this._getActionHelper();

			// store the two next possible tasks that needs to be selected if the already selected item gets removed from the list
			// two tasks will be: current task and the one next to it
			this.getOwnerComponent()
				.getEventBus().publish("cross.fnd.fiori.inbox", "storeNextItemsToSelect", {
					"sOrigin": oItem.SAP__Origin,
					"sInstanceID": oItem.InstanceID
			});

			// process custom attribute's data in case CustomAttributeData is already loaded using $expand for list
			if (this._getShowAdditionalAttributes() === true) {
				oItem = this._processCustomAttributesData(oItem);
			}

			//Set WorkflowLog property within TaskSupports in case of old tasks without this property - to avoid value from previous task
			if (oItem.TaskSupports && !oItem.TaskSupports.WorkflowLog) {
				oItem.TaskSupports.WorkflowLog = false;
			}

			if (!this.oModel2) {
				this.oModel2 = new JSONModel();
				oView.setModel(this.oModel2, "detail");
			}
			this._updateDetailModel(oItem, true);
			this.oModel2.setProperty("/CustomAttributeData", oItem.CustomAttributeData ? oItem.CustomAttributeData : []);
			this.oModel2.setProperty("/sServiceUrl", oView.getModel().sServiceUrl);
			//introduced theme property to handle background color for the header as per the theme applied
			this.oModel2.setProperty("/SapUiTheme", oActionHelper._getThemeandLanguageLocaleParams()["sap-ui-theme"]);

			var that = this;
			this._updateHeaderTitle(oItem);

			// destroy generic component if present and not cached
			var oComponentContainer = oView.byId("genericComponentContainer");
			var sComponentId = oComponentContainer && oComponentContainer.getComponent() ? oComponentContainer.getComponent() : null;

			if (sComponentId) {
				var oCachedComponent = this.oComponentCache.getComponentById(sComponentId) || null;
				if (!oCachedComponent) {
					var oGenericComponentInstance = sap.ui.getCore().getComponent(sComponentId);
					if (oGenericComponentInstance) {
						oGenericComponentInstance.destroy();
					}
				}
			}

			/*
			 * Manual detail request via DataManager in batch with decision options together
			 * Automatic request with view binding would cause a S2 list re-rendering - SAPUI5 issue
			 */
			var fnSuccess = function(oDetailData, oCustomAttributeDefinition) {

				if (that.extHookOnDataLoaded) {
					if (!oDetailData.CustomAttributeData) {
						oDetailData.CustomAttributeData = {};
						oDetailData.CustomAttributeData.results = this._getCustomAttributesValue(oItem);
					}
					/**
					 * @ControllerHook Provide custom logic after the item detail data received
					 * This hook method can be used to perform additional requests for example
					 * It is called in the success callback of the detail data fetch
					 * @callback cross.fnd.fiori.inbox.view.S3~extHookOnDataLoaded
					 * @param {object} oDetailData - contains the item detail data
					 * @return {void}
					 */
					that.extHookOnDataLoaded(oDetailData);
				}
				if (that.aCA.length > 0) {
					that.clearCustomAttributes();
				}

				// BCP incident: 0020751295 0000523953 2019
				// fix not appearing custom attributes in case when description is not expand and custrom attributes are on
				if (this._getShowAdditionalAttributes() === true) {
					if (oDetailData.CustomAttributeData && oDetailData.CustomAttributeData.hasOwnProperty("__deferred")) {
						delete oDetailData.CustomAttributeData;
					}
				}

				// needed for suport information to show custom attributes info
				if ((!this.aTaskDefinitionData || jQuery.isEmptyObject(this.aTaskDefinitionData)) && oCustomAttributeDefinition
						&& oCustomAttributeDefinition[0] && oCustomAttributeDefinition[0].TaskDefinitionID) {
					var TaskDefinitionID = oCustomAttributeDefinition[0].TaskDefinitionID;
					var CustomAttributeDefinitionData = {};
					CustomAttributeDefinitionData.results = oCustomAttributeDefinition;
					this.aTaskDefinitionData = [];
					this.aTaskDefinitionData[0] = new Object();
					this.aTaskDefinitionData[0].CustomAttributeDefinitionData = CustomAttributeDefinitionData;
					this.aTaskDefinitionData[0].TaskDefinitionID = TaskDefinitionID;
				}

				that._updateDetailModel(oDetailData, true);
				
				//save detail data (used to fix the flickering of ProcessingLogs tab after detail screen refresh)
				that.oDetailData2 = oDetailData;

				var sSelectedTabKey = that.byId("tabBar").getSelectedKey();
				if (sSelectedTabKey === "NOTES") {
					that.fnSetIconForCommentsFeedInput();
					this.fnFetchDataOnTabSelect("Comments");
				}
				else if (sSelectedTabKey === "ATTACHMENTS") {
					this.fnFetchDataOnTabSelect("Attachments");
				/*} else if (sSelectedTabKey === "PROCESSINGLOGS") {
					this.fnFetchDataOnTabSelect("ProcessingLogs");*/
				}
				else if (sSelectedTabKey === "OBJECTLINKS") {
					that.fnFetchObjectLinks();
				}
				else if (sSelectedTabKey === "DESCRIPTION") {
					that.byId("DescriptionContent").rerender();
				}

				if (!this._getShowAdditionalAttributes()) {
					if (oDetailData.CustomAttributeData.results && oDetailData.CustomAttributeData.results.length > 0) {
						that.oModel2.setProperty("/CustomAttributeData", oDetailData.CustomAttributeData.results);
					}
				}
				else if (this._getShowAdditionalAttributes() === true) {
					// set the CustomAttributeDefinitionData if not already set
					if (that.oModel2.getData().CustomAttributeDefinitionData == null && oCustomAttributeDefinition) {
						that.oModel2.setProperty("/CustomAttributeDefinitionData", oCustomAttributeDefinition);
					}
				}

				// create custom attributes elements if data is available
				var fnCreateCustomAttributesOnDataLoaded = that._createCustomAttributesOnDataLoaded.bind(that);
				fnCreateCustomAttributesOnDataLoaded(oCustomAttributeDefinition);
			};

			// At the start of each fetch:
			// - Initialize tabbar to show only description tab.
			// - Clear footer.
			var onBackHandler = null;
			if (this.bIsTableViewActive) {
				onBackHandler = this.fnNavBackToTableVw.bind(this);
			}
			else if (Device.system.phone && !this.bNavToFullScreenFromLog) {
				onBackHandler = this.fnOnNavBackInMobile.bind(this);
			}
			else if (this.bNavToFullScreenFromLog) {
				onBackHandler = this.fnOnNavBackFromLogDescription.bind(this);
			}
			if (this.getOwnerComponent().oShellUIService && onBackHandler) {
				this.getOwnerComponent().oShellUIService.setBackNavigation(onBackHandler);
			}
			if (this.oHeaderFooterOptions) {
				this.oHeaderFooterOptions = jQuery.extend(this.oHeaderFooterOptions, {
					oPositiveAction: null,
					oNegativeAction: null,
					buttonList: [],
					oJamOptions: null,
					oEmailSettings: null,
					oUpDownOptions: null,
					onBack: (this.getOwnerComponent().oShellUIService ? null : onBackHandler)
				});
				this.refreshHeaderFooterOptions();
			}

			if (this.oModel2 != null) {
				this.fnClearCachedData();
			}

			var fetchUIExecutionLinkCallback = function (taskSwitchCount, UIExecutionLinkData) {

				// Exit if another task was clicked while waiting
				if (taskSwitchCount !== this._taskSwitchCount) {
					Log.warning("fetchUIExecutionLinkCallback: task switched while waiting!");
					return;
				}

				// check if the selected task is annotation based task, also render annotation component if needed
				oItem.UIExecutionLink = UIExecutionLinkData;
				that.oModel2.setProperty("/UIExecutionLink", UIExecutionLinkData);

				this.fnHandleIntentValidationAndNavigation(oItem, oRefreshData, fnSuccess);
			}.bind(this, this._taskSwitchCount);

			this.oDataManager.fetchUIExecutionLink(oItem,
				fetchUIExecutionLinkCallback.bind(this),
				fetchUIExecutionLinkCallback.bind(this));
		},

		loadDecisionOptions: function(oItem, oRefreshData, sGroupName) {
			var bIsUIExecutionLinkSupported = oItem.TaskSupports && oItem.TaskSupports.UIExecutionLink;
			// load decision options for the selected task
			if (!this.oDataManager.bOutbox  && oItem.Status !== "COMPLETED" && oItem.Status !== "FOR_RESUBMISSION") {
				this.oDataManager.readDecisionOptions(oItem.SAP__Origin, oItem.InstanceID, oItem.TaskDefinitionID,
					function(taskSwitchCount, aDecisionOptions) {

						// Exit if another task was clicked while waiting
						if (taskSwitchCount !== this._taskSwitchCount) {
							Log.warning("readDecisionOptions: task switched while waiting!");
							return;
						}

						this.fnValidateDecisionOptionsAndCreatButtons(
							bIsUIExecutionLinkSupported, aDecisionOptions, oItem.UIExecutionLink, oRefreshData.sSAP__Origin);
					}.bind(this, this._taskSwitchCount),
					function(taskSwitchCount, oError) {
						
						Log.error("Error while loading decision options");

						// Exit if another task was clicked while waiting
						if (taskSwitchCount !== this._taskSwitchCount) {
							Log.warning("readDecisionOptions(fail): task switched while waiting!");
							return;
						}

						this.fnValidateDecisionOptionsAndCreatButtons(
							bIsUIExecutionLinkSupported, [], oItem.UIExecutionLink, oRefreshData.sSAP__Origin);
					}.bind(this, this._taskSwitchCount), false, sGroupName);
			}
			else {
				this.fnValidateDecisionOptionsAndCreatButtons(
					bIsUIExecutionLinkSupported, [], oItem.UIExecutionLink, oRefreshData.sSAP__Origin);
			}
		},

		/* validate the URL for an Intent.
		 * If validation passes, check for embed or external mode.
		 If embed mode , embed within detail view.
		 * If external mode navigate to the app if UI5
		 * If external mode open in new tab for legacy apps
		 * If both external and embed mode are not configured via the URL param in the target mapping , but Navigation is supported for the user open in the external mode.
		 * If the above validations fail, validate for an absolute URL and open in a new window
		 * The task opens either on click or on click of open task button.
		 * If the triggerOn taskSelect , it opens on task selection, in place
		 * If triggerOn openTask, it saves the intent configuration and default view is loaded, on click of open task later, the application is loaded in either embed or external mode
		 * */
		fnHandleIntentValidationAndNavigation: function(oItem, oRefreshData, fnSuccess) {
			var	that = this;
			var sURL = oItem.UIExecutionLink.GUI_Link;
			var oParsedParams = this._getParsedParamsForIntent(sURL);
			var xNavService = this._getCrossNavigationService();
			if (oParsedParams && xNavService) {
				var aIntents = this._getIntentParam(oParsedParams);
				xNavService.isNavigationSupported(aIntents, cross.fnd.fiori.inbox.util.tools.Application.getImpl().getComponent())
				.done(function(taskSwitchCount, aResponses) {

					// Exit if another task was clicked while waiting
					if (taskSwitchCount !== this._taskSwitchCount) {
						Log.warning("isNavigationSupported: task switched while waiting!");
						return;
					}

					var supportedOpenMode = that._getSupportedOpenMode(aResponses);
					if (supportedOpenMode) {
						that.fnHandleIntentNavigation(oParsedParams, supportedOpenMode, oItem, oRefreshData, fnSuccess);
					}
					else {
						that.fnViewTaskInDefaultView(oItem, oRefreshData, fnSuccess);
					}
				}.bind(this, this._taskSwitchCount)
				).fail(function(taskSwitchCount) {

					// Exit if another task was clicked while waiting
					if (taskSwitchCount !== this._taskSwitchCount) {
						Log.warning("isNavigationSupported(fail): task switched while waiting!");
						return;
					}

					that.fnViewTaskInDefaultView(oItem, oRefreshData, fnSuccess);

				}.bind(this, this._taskSwitchCount));
			}
			else {
				this.fnViewTaskInDefaultView(oItem, oRefreshData, fnSuccess);
			}
		},

		fnHandleIntentNavigation: function(oParsedParams, supportedOpenMode, oItem, oRefreshData, fnSuccess) {
			oParsedParams.params.openMode = supportedOpenMode;
			switch (supportedOpenMode) {
				case "embedIntoDetails":
				case "genericEmbedIntoDetails":
				case "embedIntoDetailsNestedRouter":
					this.fnRenderIntentBasedApp(oParsedParams, supportedOpenMode, oItem, oRefreshData, fnSuccess);
					break;
				case "replaceDetails":
				case "external":
					this.oEmbedModeIntentParams = {};
					this.oEmbedModeIntentParams[oRefreshData.sSAP__Origin + "_" + oRefreshData.sInstanceID] = jQuery.extend({
						"OpenInEmbedMode": (supportedOpenMode === "replaceDetails")
					}, oParsedParams);
					this.fnViewTaskInDefaultView(oItem, oRefreshData, fnSuccess);
					break;
				default:
			}
		},

		fnRenderIntentBasedApp: function(oParsedParams, supportedOpenMode, oItem, oRefreshData, fnSuccess) {

			var sNavIntent = oParsedParams.semanticObject + "-" + oParsedParams.action;
			var sNavigationIntent = "#" + sNavIntent;

			this.embedFioriElements = (oParsedParams.params.openMode === "embedIntoDetailsNestedRouter") ? true : false;
			this.showHideSideContent();
			// destroy generic component if present and not cached
			var oComponentContainer = this.byId("genericComponentContainer");
			var sComponentId = oComponentContainer && oComponentContainer.getComponent() ? oComponentContainer.getComponent() : null;
			if (sComponentId) {
				var oCachedComponent = this.oComponentCache.getComponentById(sComponentId) || null;
				if (!oCachedComponent) {
					var oGenericComponentInstance = sap.ui.getCore().getComponent(sComponentId);
					if (oGenericComponentInstance) {
						oGenericComponentInstance.destroy();
					}
				}
			}

			var oNavigationService = this._getCrossNavigationService();
			var oComponentData = {
				startupParameters: {
					taskModel:this.fnGetTaskModelClone(oRefreshData),
					queryParameters:oParsedParams.params,
					inboxAPI : {
						addAction: this.addAction.bind(this),
						removeAction: this.removeAction.bind(this),
						updateTask: this.updateTask.bind(this),
						getDescription: this.getDescription.bind(this),
						setShowFooter: this.setShowFooter.bind(this),
						setShowNavButton: this.setShowNavButton.bind(this),
						disableAction: this.disableAction.bind(this),
						disableAllActions: this.disableAllActions.bind(this),
						enableAction: this.enableAction.bind(this),
						enableAllActions: this.enableAllActions.bind(this)
					},
					//only for internal use
					inboxInternal:{
						//requests TaskDefinitionCollection and TaskCollection
						//to be used only when completing a task
						updateTaskList: this.updateTaskList.bind(this)
					}
					//applicationPath:,//Is this needed?
				},
				onTaskUpdate: this.fnDelegateTaskRefresh.bind(this)
			};
			// If we have the component name for that intent
			if(this.embedFioriElements && Utils.isString(this.compNameByIntent[sNavigationIntent])){

				this.oModel2.setProperty("/embedFioriElements", true);
				this.oModel2.setProperty("/showGenericComponent", false);
				this.oModel2.setProperty("/showDefaultView", false);

				this.getComponentViaRoutingTarget(
					sNavIntent,
					this.compNameByIntent[sNavigationIntent],
					{componentData: oComponentData},
					oParsedParams.params,
					oItem,
					oRefreshData,
					fnSuccess
				);
				this.fnGetTabCountersForSelectedTask(oItem, oRefreshData, fnSuccess);
			}
			else if(this.embedFioriElements && !this.compNameByIntent[sNavigationIntent]){

				// Ensure one oNavigationService invoke per intent
				this.compNameByIntent[sNavigationIntent] = true;

				var sParams = "?" + this.fnCreateURLParameters(oParsedParams.params);
				oNavigationService.createComponentData(sNavigationIntent + sParams)
				.then(function(intent, startParams, oResponse) {

					// Cache the component's name by intent
					this.compNameByIntent[intent] = oResponse.componentProperties.name;

					// If embedding still ON, and that's the last intent wanted
					if(this.embedFioriElements && intent === sNavigationIntent){

						this.oModel2.setProperty("/embedFioriElements", true);
						this.oModel2.setProperty("/showGenericComponent", false);
						this.oModel2.setProperty("/showDefaultView", false);

						var componentData = Object.assign(oComponentData, oResponse.componentData);
						var componentConfig = Object.assign({componentData: componentData}, oResponse.appPropertiesSafe.applicationDependencies);
	
						this.getComponentViaRoutingTarget(
							sNavIntent,
							oResponse.componentProperties.name,
							componentConfig,
							startParams,
							oItem,
							oRefreshData,
							fnSuccess
						);
						this.fnGetTabCountersForSelectedTask(oItem, oRefreshData, fnSuccess);
					}

				}.bind(this, sNavigationIntent, JSON.parse(JSON.stringify(oParsedParams.params))))
				.catch(function(taskSwitchCount, oError) {

					// Quit if task changed while waiting
					// More comments on the this._taskSwitchCount declaration
					if (taskSwitchCount !== this._taskSwitchCount) {
						Log.warning("createComponentData(fail): task switched while waiting!");
						return;
					}
					// if cannot render component, open default view
					Log.error(oError);
					this.fnViewTaskInDefaultView(oItem, oRefreshData, fnSuccess);
				}.bind(this, this._taskSwitchCount));
			}
			else if(!this.embedFioriElements){

				var sParams = "?" + this.fnCreateURLParameters(oParsedParams.params);
				oNavigationService.createComponentInstance(sNavigationIntent + sParams, {
					componentData: oComponentData
				}, this.getOwnerComponent())
				.done(function(taskSwitchCount, oComponent) {

					// Check if other task was selected while waiting
					// More comments on the this._taskSwitchCount declaration
					if (taskSwitchCount !== this._taskSwitchCount) {
						Log.warning("createComponentInstance: task switched while waiting!");
						return;
					}

					this.oModel2.setProperty("/embedFioriElements", false);
					this.oModel2.setProperty("/showGenericComponent", true);
					this.oModel2.setProperty("/showDefaultView", false);

					this.embedFioriElements = false;
					this.showHideSideContent();

					this.byId("genericComponentContainer").setComponent(oComponent);

					if (supportedOpenMode === "genericEmbedIntoDetails") {
						this.setShowFooter(false);
					}
					else if (supportedOpenMode === "embedIntoDetails") {
						this.loadDecisionOptions(oItem, oRefreshData, "decisionOptions");
					}

				}.bind(this, this._taskSwitchCount))
				.fail(function(taskSwitchCount, oError) {

					// Check if other task was selected while waiting
					// More comments on the this._taskSwitchCount declaration
					if (taskSwitchCount !== this._taskSwitchCount) {
						Log.warning("createComponentInstance(fail): task switched while waiting!");
						return;
					}

					if (supportedOpenMode === "genericEmbedIntoDetails") {
						this.setShowFooter(false);
					}

					// if cannot render component, open default view
					Log.error(oError);
					this.fnViewTaskInDefaultView(oItem, oRefreshData, fnSuccess);
				}.bind(this, this._taskSwitchCount));
			}
		},

		updateTask: function(sSapOrigin, TaskInstanceId) {
			var oDeferred = new jQuery.Deferred();
			var that = this;
			if (!sSapOrigin || !TaskInstanceId ) {
				oDeferred.reject("Input parameters SAP__Origin and TaskInstanceId are mandatory");
				return oDeferred.promise();
			}
			var fnSuccess = function(oData) {
				oDeferred.resolve();

				var sMessage = that.i18nBundle.getText("dialog.success.complete");
				// standaloneDetailDeep mode works only when it is not navigated from master detail or table view
				if (that._getStandaloneDetailDeep() && !that.oDataManager.getTableView()
						&& !((typeof that.getView().getParent().getParent().isMasterShown === "function")
						&& that.getView().getParent().getParent().isMasterShown())) {
					that.getView().getModel().sDetailDeepEmptyMessage = sMessage + ". " + that.i18nBundle.getText("detailDeepEmptyView.closingTabMessage");
					MessageToast.show(sMessage, {duration: 1000, onClose: that.oRouter.navTo.bind(that.oRouter, "detail_deep_empty", null, false)});
					return;
				}
				else {
					MessageToast.show(sMessage);
				}

				if (that.bIsTableViewActive) {
					that.fnNavBackToTableVw();
				}
				if (Device.system.phone) {
					that.fnOnNavBackInMobile();
				}
			};

			var fnError = function(oError) {
				oDeferred.reject(oError.message);
			};
			this.oDataManager.fnUpdateSingleTask(sSapOrigin, TaskInstanceId, fnSuccess, fnError);
			return oDeferred.promise();
		},

		updateTaskList: function() {
			//event subscribers: S2.controller and S2_TaskList.controller
			this.getOwnerComponent().getEventBus().publish("cross.fnd.fiori.inbox", "refreshListInternal");
		},

		getDescription: function (sSapOrigin, TaskInstanceId) {
			var oDeferred = new jQuery.Deferred();

			if (!sSapOrigin || !TaskInstanceId ) {
				oDeferred.reject("Input parameters SAP__Origin and TaskInstanceId are mandatory");
				return oDeferred.promise();
			}

			// success handler of read data request
			var fnSuccess = function(data) {
				oDeferred.resolve(data);
			};

			// error handler for read request
			var fnError = function(oError) {
				oDeferred.reject(oError.message);
			};

			this.oDataManager.readDescription(sSapOrigin, TaskInstanceId, fnSuccess, fnError);
			return oDeferred.promise();
		},

		_setExtensionState: function(bSetExtension) {
			if (bSetExtension) {
				this._isExtended = true;
			}
			else {
				this._isExtended = false;
			}
		},

		_getExtensionState: function() {
			if (this._isExtended) {
				return true;
			}
			else {
				return false;
			}
		},

		isMainScreen: function() {
			if (this._getExtensionState()) {
				return false;
			}
			else {
				if (this._oControlStore.oBackButton) {
					return false;
				}
				// for compatibility reasons in order to distinguish from overridden cases
				return "X";
			}
		},

		/**
		 * @public
		 * API: Show/hide footer of page
		 * @param {boolean} showFooter - default value = false
		 */
		setShowFooter: function(showFooter) {
			if (showFooter) {
				this.oHeaderFooterOptions = jQuery.extend(this.oHeaderFooterOptions,this._oPreviousHeaderFooterOptions);
				this.refreshHeaderFooterOptions();
				this._setExtensionState(false);
			}
			else {
				this._setExtensionState(true);
				//Store header/footer options before hiding footer
				this._oPreviousHeaderFooterOptions =  jQuery.extend({},this.oHeaderFooterOptions);
				//Nullify all attributes within header/footer options except title and set flag to suppress bookmark button
				this.oHeaderFooterOptions = jQuery.extend(this.oHeaderFooterOptions, {
					oPositiveAction: null,
					oNegativeAction: null,
					buttonList: null,
					oJamOptions: null,
					oEmailSettings: null,
					bSuppressBookmarkButton: true
				});
				this.refreshHeaderFooterOptions();
				//Ensure footer is hidden
				if (this.getView().getContent()[0].getShowFooter()) {
					Log.error("Hiding footer failed");
				}
			}
		},

		/**
		 * @public
		 * API: Show/hide navigation button in header of page
		 * @param {boolean} showNavButton - default value = false
		 * @param {function} navEventHandler - optional
		 */
		setShowNavButton: function(showNavButton, navEventHandler) {
			if (showNavButton) {
				if (navEventHandler) {
					this._backButtonHandler = navEventHandler;
				}
				else {
					//Set default Back button handler in header/footer options
					this._backButtonHandler = this.onNavButtonPress.bind(this);
				}
			}
			else {
				//Nullify back button handler within header/footer options
				this._backButtonHandler = null;
			}
			this.oHeaderFooterOptions = jQuery.extend(this.oHeaderFooterOptions, {
				onBack: this._backButtonHandler
			});
			this.refreshHeaderFooterOptions();
		},

		onNavButtonPress: function(oEvent) {
			//Navigate back
			if (window.history.length > 0) {
				window.history.back();
			}
			else {
				Log.error("Navigation history does not exist. Ensure that navigation history is maintained or provide custom event handler for back navigation button through setShowNavButton API");
			}
		},

		fnGetTaskModelClone: function(oRefreshData) {
			var oView = this.getView();
			var oContext = new Context(oView.getModel(), oRefreshData.sCtxPath);
			var oItem = jQuery.extend(true, {}, oView.getModel().getData(oContext.getPath(), oContext));
			return this.fnCloneTaskModel(oItem);
		},

		fnCreateURLParameters: function(data) {
			return Object.keys(data).map(function(key) {
				return [key, data[key]].map(encodeURIComponent).join("=");
			}).join("&");
		},

		fnValidateDecisionOptionsAndCreatButtons: function(bIsUIExecutionLinkSupported, aDecisionOptions, UIExecutionLinkData, sSapOrigin) {
			aDecisionOptions = aDecisionOptions ? aDecisionOptions : [];

			if (bIsUIExecutionLinkSupported) {
				this.createDecisionButtons(aDecisionOptions, UIExecutionLinkData, sSapOrigin);
			}
			else {
				this.createDecisionButtons(aDecisionOptions, {}, sSapOrigin);
			}
		},

		fnDelegateTaskRefresh: function() {
			var oNavigationParameters = this.oRoutingParameters;
			var sSAPOrigin = oNavigationParameters.SAP__Origin;
			var sInstanceId = oNavigationParameters.InstanceID;

			if (oNavigationParameters && sSAPOrigin && sInstanceId) {
				this.oDataManager.fnUpdateSingleTask(sSAPOrigin, sInstanceId);
			}
		},

		/*
		 * Navigates to an app, either externally or embeds it into the detail page
		 */
		fnNavigateToApp: function(oParsedParams, bEmbed) {
			if (!bEmbed) {
				this._getCrossNavigationService().toExternal({
					target: {
						semanticObject: oParsedParams.semanticObject,
						action: oParsedParams.action
					},
					params: oParsedParams.params,
					appSpecificRoute: oParsedParams.appSpecificRoute
				});
			}
			else {
				var sOpenMode = oParsedParams.params.openMode;
				this.fnEmbedApplicationInDetailView(oParsedParams, sOpenMode);
			}
		},

		fnViewTaskInDefaultView: function(oItem, oRefreshData, fnSuccess) {
			this.oModel2.setProperty("/showGenericComponent", false);
			this.oModel2.setProperty("/embedFioriElements", false);
			this.oModel2.setProperty("/showDefaultView", true);

			this.embedFioriElements = false;
			this.showHideSideContent();
			
			this.fnGetDetailsForSelectedTask(oItem, oRefreshData, fnSuccess);
		},

		// Fetches Tab Counts for embedIntoDetailsNestedRouter
		fnGetTabCountersForSelectedTask: function(oItem, oRefreshData, fnSuccess) {

			var aExpandEntitySets = [];
			var oItemData = this.oModel2.getData();
			var aTabCounts = [];

			var UIExecutionLinkData = oItemData.UIExecutionLink;

			if (!UIExecutionLinkData.GUI_Link) {
				UIExecutionLinkData.GUI_Link = "";
			}
			if (this.fnFormatterSupportsProperty(oItemData.TaskSupports.Comments, oItemData.SupportsComments)) {
				aTabCounts.push("Comments");
			}
			if (this.fnFormatterSupportsProperty(oItemData.TaskSupports.Attachments, oItemData.SupportsAttachments)) {
				aTabCounts.push("Attachments");
			}
			if (oItemData.TaskSupports.TaskObject && this.oDataManager.bShowTaskObjects) {
				aTabCounts.push("TaskObjects");
			}

			this.oDataManager.readDataOnTaskSelection(
				oRefreshData.sCtxPath,
				aExpandEntitySets,
				aTabCounts,
				oRefreshData.sSAP__Origin,
				oRefreshData.sInstanceID,
				oItemData.TaskDefinitionID,
				oItem,
				function(taskSwitchCount, oDetailData, oCustomAttributeDefinition, oTabCounts) {

					// Exit if another task was clicked while waiting
					if (taskSwitchCount !== this._taskSwitchCount) {
						return;
					}
					if (oTabCounts.sCommentsCount != null && oTabCounts.sCommentsCount !== "") {
						this.oModel2.setProperty("/CommentsCount", oTabCounts.sCommentsCount);
					}
					if (oTabCounts.sAttachmentsCount != null && oTabCounts.sAttachmentsCount !== "") {
						this.oModel2.setProperty("/AttachmentsCount", oTabCounts.sAttachmentsCount);
					}
					if (oTabCounts.sTaskObjectsCount != null && oTabCounts.sTaskObjectsCount !== "") {
						this.oModel2.setProperty("/ObjectLinksCount", oTabCounts.sTaskObjectsCount);
						this.fnHandleNoTextCreation("ObjectLinks");
					}
					oDetailData.UIExecutionLink = UIExecutionLinkData;
					fnSuccess.call(this, oDetailData, oCustomAttributeDefinition);
				}.bind(this, this._taskSwitchCount)
			);
		},

		// Fetches task details like Description, CustomAttributeData, Tab Counts based on whether the task is annotation based
		fnGetDetailsForSelectedTask: function(oItem, oRefreshData, fnSuccess) {
			var that = this;
			var oTaskSupports = that.oModel2.getData().TaskSupports;
			var bIsUIExLinkSupported = (oTaskSupports && oTaskSupports.UIExecutionLink) ? oTaskSupports.UIExecutionLink : false;

			// if the task has annotation based component, render it
			that.fnParseComponentParameters(bIsUIExLinkSupported ? oItem.UIExecutionLink.GUI_Link : "");

			var aExpandEntitySets = [];
			if (oTaskSupports && oTaskSupports.Description) {
				aExpandEntitySets.push("Description");
			}
			if (!this._getShowAdditionalAttributes() && oTaskSupports && oTaskSupports.CustomAttributeData) {
				aExpandEntitySets.push("CustomAttributeData");
			}

			/**
			 * @ControllerHook Add additional entities related to the work item
			 * This hook method can be used to add custom related entities to the expand list of the detail data request
			 * It is called when the detail view is displayed and before the detail data fetch starts
			 * @callback cross.fnd.fiori.inbox.view.S3~extHookGetEntitySetsToExpand
			 * @return {array} aEntitySets - contains the names of the related entities
			 */
			if (this.extHookGetEntitySetsToExpand) {
				var aEntitySets = this.extHookGetEntitySetsToExpand();
				// append custom entity sets to the default list
				aExpandEntitySets.push.apply(aExpandEntitySets, aEntitySets);
			}

			if (!oItem.UIExecutionLink.GUI_Link) {
				oItem.UIExecutionLink.GUI_Link = "";
			}

			var oItemData = that.oModel2.getData();
			if (!that.isGenericComponentRendered) {
				var aTabCounts = [];
				if (this.fnFormatterSupportsProperty(oItemData.TaskSupports.Comments, oItemData.SupportsComments)) {
					aTabCounts.push("Comments");
				}
				if (this.fnFormatterSupportsProperty(oItemData.TaskSupports.Attachments, oItemData.SupportsAttachments)) {
					aTabCounts.push("Attachments");
				}
				if (oItemData.TaskSupports.TaskObject && this.oDataManager.bShowTaskObjects) {
					aTabCounts.push("TaskObjects");
				}

				that.oDataManager.readDataOnTaskSelection(oRefreshData.sCtxPath, aExpandEntitySets,aTabCounts,
					oRefreshData.sSAP__Origin,
					oRefreshData.sInstanceID,
					oItemData.TaskDefinitionID,
					oItem,
					function(taskSwitchCount, oDetailData, oCustomAttributeDefinition, oTabCounts, aDecisionOptions) {

						// Exit if another task was clicked while waiting
						if (taskSwitchCount !== this._taskSwitchCount) {
							Log.warning("readDataOnTaskSelection: task switched while waiting!");
							return;
						}

						if (oTabCounts.sCommentsCount !== null && oTabCounts.sCommentsCount !== "") {
							that.oModel2.setProperty("/CommentsCount", oTabCounts.sCommentsCount);
						}
						if (oTabCounts.sAttachmentsCount !== null && oTabCounts.sAttachmentsCount !== "") {
							that.oModel2.setProperty("/AttachmentsCount", oTabCounts.sAttachmentsCount);
						}
						if (oTabCounts.sTaskObjectsCount !== null && oTabCounts.sTaskObjectsCount !== "") {
							that.oModel2.setProperty("/ObjectLinksCount", oTabCounts.sTaskObjectsCount);
							that.fnHandleNoTextCreation("ObjectLinks");
						}

						that.fnValidateDecisionOptionsAndCreatButtons(oItem.TaskSupports.UIExecutionLink, aDecisionOptions, oItem.UIExecutionLink, oRefreshData.sSAP__Origin );

						oDetailData.UIExecutionLink = oItem.UIExecutionLink;
						fnSuccess.call(that, oDetailData, oCustomAttributeDefinition);

					}.bind(this, this._taskSwitchCount)
				);

			}
			else { // if annotation based task, fetch task details, update counts for attachment component and comments component if implemented and fetch decision options
				var sGenericGroupName = "GenericComponentRendered";
				// set the value of DataManager flag bDetailPageLoaded to solve the busy loader issue after performing action.
				// TODO improve the busy loader implementation
				that.oDataManager.setDetailPageLoaded(true);
				if (that.byId("attachmentComponent") || that.byId("attachmentComponentInDetails")) {
					that.fnCountUpdater("Attachments", that.oModel2.getData().SAP__Origin, that.oModel2.getData().InstanceID, sGenericGroupName);
				}
				if (that.byId("commentsContainer") || that.byId("commentsContainerInDetails")) {
					that.fnCountUpdater("Comments", that.oModel2.getData().SAP__Origin, that.oModel2.getData().InstanceID, sGenericGroupName);
				}
				if (that._getObjectLinksList()) {
					that.fnCountUpdater("ObjectLinks", that.oModel2.getData().SAP__Origin, that.oModel2.getData().InstanceID, sGenericGroupName);
				}

				this.loadDecisionOptions(oItem, oRefreshData, sGenericGroupName);
			}
		},

		clearCustomAttributes: function() {
			if (this.aCA.length > 0) {
				for (var i = 0; i < this.aCA.length; i++) {
					this.aCA[i].destroy();
				}
				this.aCA = [];
			}
		},

		onAttachmentChange: function(e) {
			var oUploadCollection = e.getSource();
			var sFileName = e.getParameters().getParameters().files[0].name;
			if (oUploadCollection.getHeaderParameters()) {
				oUploadCollection.destroyHeaderParameters();
			}
			//Split filename and extension
			var iLastDot = sFileName.lastIndexOf(".");
			var extension = "";
			if (iLastDot != -1) {
				extension = sFileName.substr(iLastDot+1);
				sFileName = sFileName.substr(0, iLastDot);
			}

			oUploadCollection.addHeaderParameter(new UploadCollectionParameter({
				name: "x-csrf-token",
				value: this.getXsrfToken()
			}));
			oUploadCollection.addHeaderParameter(new UploadCollectionParameter({
				name: "slug",
				value: encodeURIComponent(sFileName)
			}));
			oUploadCollection.addParameter(new UploadCollectionParameter({
				name: "x-csrf-token",
				value: this.getXsrfToken()
			}));
			oUploadCollection.addParameter(new UploadCollectionParameter({
				name: "slug",
				value: sFileName
			}));
			oUploadCollection.addHeaderParameter(new UploadCollectionParameter({
				name: "Accept",
				value: "application/json"
			}));
			oUploadCollection.addParameter(new UploadCollectionParameter({
				name: "Accept",
				value: "application/json"
			}));
			if (extension !== "") {
				oUploadCollection.addHeaderParameter(new UploadCollectionParameter({
					name: "extension",
					value: extension
				}));
				oUploadCollection.addParameter(new UploadCollectionParameter({
					name: "extension",
					value: extension
				}));
			}
		},

		onAttachmentUploadComplete: function(e) {
			var oItem = this.oModel2.getData();
			var that = this;
			that.oEventSource = e.getSource();
			var fnClose = function() {
				this.oEventSource.updateAggregation("items");
				this.oEventSource.rerender();
			};
			if (e.getParameters().getParameters().status == 201) {
				var oFileData = JSON.parse(e.getParameters().files[0].responseRaw).d;
				// update the attachments data and attachments count
				if (oItem.Attachments && oItem.Attachments.results) {
					oItem.Attachments.results.unshift(oFileData);
				}
				else {
					oItem.Attachments = {
						results: [oFileData]
					};
				}
				oItem.AttachmentsCount = oItem.Attachments.results.length;
				this._updateDetailModel(oItem);
				that.fnHandleAttachmentsCountText("Attachments");
				MessageToast.show(this.i18nBundle.getText("dialog.success.attachmentUpload"));

				// update the counter on history tab
				//this.fnCountUpdater("ProcessingLogs", oItem.SAP__Origin, oItem.InstanceID);
			}
			else {
				var sErrorText = this.i18nBundle.getText("dialog.error.attachmentUpload");
				MessageBox.error(sErrorText, { onClose: fnClose.bind(that) });
			}
		},

		onAttachmentDeleted: function(e) {
			var that = this;
			var sAttachmentId = e.getParameters().documentId;
			var oItem = this.oModel2.getData();
			var oUploadCollectionControl = this._getUploadCollectionControl();
			this._setBusyIncdicatorOnDetailControls(oUploadCollectionControl, true);

			this.oDataManager.deleteAttachment(oItem.SAP__Origin, oItem.InstanceID, sAttachmentId,
				function() {
					// remove the deleted attachment from the data and update the model
					var oAttachmentsData = oItem.Attachments.results;
					jQuery.each(oAttachmentsData, function(i, oAttachment) {
						if (oAttachment.ID === sAttachmentId) {
							oAttachmentsData.splice(i, 1);
							return false;
						}
					});
					oItem.Attachments.results = oAttachmentsData;
					oItem.AttachmentsCount = oAttachmentsData.length;

					// update the no data text if no attachments any more
					if (oItem.AttachmentsCount === 0) {
						oUploadCollectionControl.setNoDataText(this.i18nBundle.getText("view.Attachments.noAttachments"));
					}
					this._setBusyIncdicatorOnDetailControls(oUploadCollectionControl, false);
					this._updateDetailModel(oItem);
					that.fnHandleAttachmentsCountText("Attachments");
					// update the counter on history tab
					//	this.fnCountUpdater("ProcessingLogs", oItem.SAP__Origin, oItem.InstanceID);

					MessageToast.show(this.i18nBundle.getText("dialog.success.attachmentDeleted"));
				}.bind(this),
				function(oError) {
					this._setBusyIncdicatorOnDetailControls(oUploadCollectionControl, false);
					var sErrorText = this.i18nBundle.getText("dialog.error.attachmentDelete");
					MessageBox.error(sErrorText);
				}.bind(this)
			);
		},

		getXsrfToken: function() {
			var sToken = this.getView().getModel().getHeaders()["x-csrf-token"];
			if (!sToken) {

				this.getView().getModel().refreshSecurityToken(
					function(e, o) {
						sToken = o.headers["x-csrf-token"];
					},
					function() {
						MessageBox.error("Could not get XSRF token");
					},
					false);
			}
			return sToken;
		},

		onFileUploadFailed: function(e) {
			var sErrorText = this.i18nBundle.getText("dialog.error.attachmentUpload");

			MessageBox.error(sErrorText,
				{ details: CommonFunctions.fnRemoveHtmlTags(e.getParameters().exception) });
		},

		addShareOnJamAndEmail: function(oButtonList) {
			var oJamOptions = {
				fGetShareSettings: this.getJamSettings.bind(this)
			};

			var oEmailSettings = {
				sSubject: this.getMailSubject(),
				fGetMailBody: this.getMailBody.bind(this)
			};

			oButtonList.oJamOptions = oJamOptions;
			oButtonList.oEmailSettings = oEmailSettings;

			this.oHeaderFooterOptions = jQuery.extend(this.oHeaderFooterOptions, {
				oJamOptions: oButtonList.oJamOptions,
				oEmailSettings: oButtonList.oEmailSettings
			});
		},

		_getDescriptionForShare: function(sDescriptionText) {
			var oData = this.oModel2.getData();
			var sBody = "\n\n" + this.i18nBundle.getText("share.email.body.detailsOfTheItem") + "\n\n";
			var oDateFormatter = DateFormat.getDateInstance();
			if (oData.TaskTitle && oData.TaskTitle.trim() !== "") {
				sBody += this.i18nBundle.getText("item.taskTitle", oData.TaskTitle.trim()) + "\n";
			}
			if (oData.Priority && oData.Priority !== "") {
				sBody += this.i18nBundle.getText("item.priority", Conversions.formatterPriority.call(this.getView(), oData.SAP__Origin,
					oData.Priority)) + "\n";
			}
			if (oData.CompletionDeadLine) {
				sBody += this.i18nBundle.getText("item.dueDate", oDateFormatter.format(oData.CompletionDeadLine, true)) + "\n";
			}
			if (sDescriptionText && sDescriptionText.trim() !== "") {
				// use override text if given
				sBody += this.i18nBundle.getText("item.description", sDescriptionText) + "\n";
			}
			else if ((oData.Description) && (oData.Description.Description) && (oData.Description.Description.trim() !== "")) {
				sBody += this.i18nBundle.getText("item.description", this._getTrimmedString(oData.Description.Description)) + "\n";
			}
			var sCreator = oData.CreatedByName;
			if (!sCreator || sCreator.trim() === "") {
				sCreator = oData.CreatedBy;
			}
			if (sCreator && sCreator.trim() !== "") {
				sBody += this.i18nBundle.getText("item.createdBy", sCreator) + "\n";
			}
			if (oData.CreatedOn) {
				sBody += this.i18nBundle.getText("item.createdOn", oDateFormatter.format(oData.CreatedOn, true)) + "\n";
			}
			if (oData.CompletedOn) {
				sBody += this.i18nBundle.getText("item.completedOn", oDateFormatter.format(oData.CompletedOn, true)) + "\n";
			}

			return sBody;
		},

		_getDescriptionForShareInMail: function(sDescriptionText) {
			var sBody = this._getDescriptionForShare(sDescriptionText);
			sBody += this.i18nBundle.getText("share.email.body.link", window.location.href.split("(").join("%28").split(")").join("%29").split(",").join("%2C")) + "\n";

			return sBody;
		},

		getJamSettings: function() {
			return {
				object: {
					id: window.location.href,
					share: this.getJamDescription()
				}
			};
		},

		getJamDescription: function() {
			var sBody = this._getDescriptionForShare();

			return sBody;
		},

		getMailSubject: function() {
			var oData = this.oModel2.getData();
			var sPriority = Conversions.formatterPriority.call(this.getView(), oData.SAP__Origin, oData.Priority);
			var sCreatedBy = oData.CreatedByName;
			var sTaskTitle = oData.TaskTitle;

			return Conversions.formatterMailSubject.call(this, sPriority, sCreatedBy, sTaskTitle);
		},

		getMailBody: function() {

			// Internet Explorer supports only shorter mailto urls, we pass only the items url this case
			if (Device.browser.msie) {
				return window.location.href.split("(").join("%28").split(")").join("%29").split(",").join("%2C");
			}

			var sFullMailBody = this._getDescriptionForShareInMail();
			var sMailSubject = this.getMailSubject();
			// due to a limitation in most browsers, don't let the mail link longer than 2000 chars
			var sFullMailUrl = sap.m.URLHelper.normalizeEmail(null, sMailSubject, sFullMailBody);
			if (sFullMailUrl.length > 2000) {
				// mail url too long, we need to reduce the description field's size
				var oData = this.oModel2.getData();
				var sMinimalMailBody = this._getDescriptionForShareInMail("...");
				var sMinimalMailUrl = sap.m.URLHelper.normalizeEmail(null, sMailSubject, sMinimalMailBody);
				var iMaxDescriptionLength = 2000 - sMinimalMailUrl.length;
				var sDescription = "";
				if (oData.Description && oData.Description.Description) {
					sDescription = window.encodeURIComponent(this._getTrimmedString(oData.Description.Description));
				}
				sDescription = sDescription.substring(0, iMaxDescriptionLength);

				// if we cut encoded chars in half the decoding won't work (encoded chars can have length of 9)
				// remove the encoded part from the end
				var bDecodeSucceeded = false;
				while (!bDecodeSucceeded || sDescription.length == 0) {
					bDecodeSucceeded = true;
					try {
						sDescription = window.decodeURIComponent(sDescription);
					}
					catch (oError) {
						sDescription = sDescription.substring(0, sDescription.length - 1);
						bDecodeSucceeded = false;
					}
				}
				sDescription = sDescription.substring(0, sDescription.length - 3) + "...";

				var sTruncatedMailBody = this._getDescriptionForShareInMail(sDescription);
				return sTruncatedMailBody;
			}

			return sFullMailBody;
		},

		_getIntentParam: function(oParsedParams) {
			var aMappingConfig = [];

			for (var i = 0; i < this.OPEN_MODES.length; i++) {
				aMappingConfig.push({
					target: {
						semanticObject: oParsedParams.semanticObject,
						action: oParsedParams.action
					},
					//If parsedParams.params contains "openMode" we should replace it with ours in new object
					//in order to check which navigation is supported:
					params: jQuery.extend({}, oParsedParams.params,	{"openMode": this.OPEN_MODES[i]})
				});
			}

			return aMappingConfig;
		},

		_getIntentWithOutParam: function(oParsedParams) {
			var aMappingConfig = [{
				target: {
					semanticObject: oParsedParams.semanticObject,
					action: oParsedParams.action
				},
				params: oParsedParams.params
			}];
			return aMappingConfig;
		},

		_getTrimmedString: function(sText) {
			// removes spaces in the beginning and at the end. Also removes new line characters, extra spaces and tabs in the description string.
			return sText.replace(/\s+/g, " ").trim();
		},

		_handleItemRemoved: function(oEvent) {
			//Successful request processing - navigate back to list on phone
			if (Device.system.phone && !this.getView().getParent().getParent().isMasterShown()) {

				if (!this.stayOnDetailScreen) {
					this.oRouter.navTo("master", {}, Device.system.phone);
					// after overwriting the history state that points to the
					// item which is not available any more, we can step back because
					// the previos history state is also the master list
					window.history.back();
				}
				else {
					var oRefreshData = {
						sCtxPath: this.getView().getBindingContext().getPath(),
						sInstanceID: this.oModel2.getData().InstanceID,
						sSAP__Origin: this.oModel2.getData().SAP__Origin, // eslint-disable-line camelcase
						bCommentCreated: true
					};
					this.refreshData(oRefreshData);
					this.stayOnDetailScreen = false;
				}
			}
		},

		_handleDetailRefresh: function(oEvent) {
			var oRefreshData;
			var bIsTableViewActive = oEvent.getParameter("bIsTableViewActive");
			var oView = this.getView();
			if (bIsTableViewActive || Device.system.phone || (this._getStandaloneDetailDeep() && !this.oDataManager.getTableView()
					&& !((typeof this.getView().getParent().getParent().isMasterShown === "function")
					&& this.getView().getParent().getParent().isMasterShown()))) {
				var oItem = jQuery.extend(true, {}, oView.getModel().getData(this.oContext.getPath(), this.oContext));
				if (jQuery.isEmptyObject(oItem)) {
					oItem = jQuery.extend(true, {}, oView.getModel().getData(encodeURI(this.oContext.getPath()), this.oContext));
				}
				var sAction = oEvent.getParameter("sAction");
				var sStatus = oEvent.getParameter("sStatus");
				if (oItem.Status === "COMPLETED" || oItem.Status === "FOR_RESUBMISSION" ||
					((sAction && sAction === "FORWARD") && (sStatus && sStatus === "Success"))
				) {
					// standaloneDetailDeep mode works only when it is not navigated from master detail or table view
					if (this._getStandaloneDetailDeep() && !this.oDataManager.getTableView()
							&& !((typeof this.getView().getParent().getParent().isMasterShown === "function")
							&& this.getView().getParent().getParent().isMasterShown())) {
						oView.getModel().bCheckPassed = true; // boolean that shows whether task has upper properties
						return;
					}
					if (bIsTableViewActive) {
						this.fnNavBackToTableVw();
					}
					else {
						this.fnOnNavBackInMobile();
					}
				}
				else if (this.isGenericComponentRendered) { // Make full refresh in case ob AnnotBasedTaskUI and Custom UI (WFS)
					oRefreshData = {
						sCtxPath: this.getView().getBindingContext().getPath(),
						sInstanceID: this.oModel2.getData().InstanceID,
						sSAP__Origin: this.oModel2.getData().SAP__Origin, // eslint-disable-line camelcase
						bCommentCreated: true
					};
					this.refreshData(oRefreshData);
				}
				else {
					// process custom attribute's data in case CustomAttributeData is already loaded using $expand for list
					if (oItem.TaskSupports && oItem.TaskSupports.CustomAttributeData) {
						oItem = this._processCustomAttributesData(oItem);
					}
					this._updateDetailModel(oItem, true);
					var aDecisionOptions = this.oDataManager.getDataFromCache("DecisionOptions", oItem);
					aDecisionOptions = aDecisionOptions ? aDecisionOptions : [];
					var oUIExecutionLink = this.oDataManager.getDataFromCache("UIExecutionLink", oItem);
					oUIExecutionLink = oUIExecutionLink ? oUIExecutionLink : {};
					var bIsUIExecutionLinkSupported = oItem.TaskSupports.UIExecutionLink;
					oUIExecutionLink = bIsUIExecutionLinkSupported ? oUIExecutionLink : {};
					this.createDecisionButtons(aDecisionOptions, oUIExecutionLink, this.oModel2.getData().SAP__Origin);
					//this.fnCountUpdater("ProcessingLogs", this.oModel2.getData().SAP__Origin, this.oModel2.getData().InstanceID); //Fix Int Incident 1670342234
				}
			}
			else {
				oRefreshData = {
					sCtxPath: this.getView().getBindingContext().getPath(),
					sInstanceID: this.oModel2.getData().InstanceID,
					sSAP__Origin: this.oModel2.getData().SAP__Origin, // eslint-disable-line camelcase
					bCommentCreated: true
				};
				this.refreshData(oRefreshData);
			}
			//this.stayOnDetailScreen = false;
		},

		_updateHeaderTitle: function(oData) {
			//-- update header
			if (oData) {
				var sTitle;
				if (this._getTaskTitleInHeader()) {
					sTitle = this._getShowAdditionalAttributes() ?
						Conversions.formatterTaskTitle.call(this.getView(), oData.TaskTitle, oData.CustomAttributeData) : oData.TaskTitle;
				}
				else {
					sTitle = oData.TaskDefinitionName;
				}

				if (!sTitle) {
					sTitle = this.i18nBundle.getText("ITEM_DETAIL_DISPLAY_NAME");
				}

				// object header fiori 2.0
				this.oHeaderFooterOptions = jQuery.extend(this.oHeaderFooterOptions, {
					sDetailTitle: sTitle
				});
				this.refreshHeaderFooterOptions();
			}
		},

		_isTaskConfirmable: function(oItem) {
			//    	if (oItem.TaskSupports.Confirm)
			if (oItem.Status === "EXECUTED") {
				return true;
			}
			else {
				return false;
			}
		},

		createDecisionButtons: function(aDecisionOptions, oUIExecutionLink, sOrigin) {
			var oPositiveAction = null;
			var oNegativeAction = null;
			var aButtonList = [];

			if (this.oHeaderFooterOptions) {
				oPositiveAction = this.oHeaderFooterOptions.oPositiveAction;
				oNegativeAction = this.oHeaderFooterOptions.oNegativeAction;
			}

			var iDisplayOrderPriorityTemp = 1;
			var iDisplayOrderPriorityValue = 0;

			var that = this;

			var oItem = this.oModel2.getData(),
			oActionHelper = that._getActionHelper();

			var bIsOpenButtonCreationInPromise = false;
			var bIsOutbox = false;

			var oParsedParams = this._getParsedParamsForIntent(oUIExecutionLink.GUI_Link);
			var xNavService = this._getCrossNavigationService();
			if (oParsedParams && xNavService) {
				var aIntents = this._getIntentParam(oParsedParams);
			}


			if (!this.switchToOutbox() && oItem.Status !== "COMPLETED" && oItem.Status !== "FOR_RESUBMISSION") {
				if (!this._isTaskConfirmable(oItem)) {
					for (var i = 0; i < aDecisionOptions.length; i++) {
						var oDecisionOption = aDecisionOptions[i];
						oDecisionOption.InstanceID = oItem.InstanceID;
						oDecisionOption.SAP__Origin = sOrigin; // eslint-disable-line camelcase

						if (!oDecisionOption.Nature) {
							iDisplayOrderPriorityValue = 400 + iDisplayOrderPriorityTemp;
							iDisplayOrderPriorityTemp++;
						}
						else if (oDecisionOption.Nature.toUpperCase() === "POSITIVE") {
							iDisplayOrderPriorityValue = iDisplayOrderPriorityTemp;
							iDisplayOrderPriorityTemp++;
						}
						else if (oDecisionOption.Nature.toUpperCase() === "NEGATIVE") {
							iDisplayOrderPriorityValue = 200 + iDisplayOrderPriorityTemp;
							iDisplayOrderPriorityTemp++;
						}
						else {
							iDisplayOrderPriorityValue = 400 + iDisplayOrderPriorityTemp;
							iDisplayOrderPriorityTemp++;
						}

						aButtonList.push({
							iDisplayOrderPriority: iDisplayOrderPriorityValue,
							nature: oDecisionOption.Nature,
							sBtnTxt: oDecisionOption.DecisionText,
							onBtnPressed: (function(oDecision) {
								return function() {
									that.showDecisionDialog(that.oDataManager.FUNCTION_IMPORT_DECISION, oDecision, true);
								};
							})(oDecisionOption)
						});
					}
				}
				else {
					iDisplayOrderPriorityValue = iDisplayOrderPriorityTemp;
					iDisplayOrderPriorityTemp++;

					// add the confirm button
					oPositiveAction = {
						iDisplayOrderPriority: iDisplayOrderPriorityValue,
						sI18nBtnTxt: "XBUT_CONFIRM",
						onBtnPressed: (function(oDecision) {
							return function() {
								that.showConfirmationDialog(that.oDataManager.FUNCTION_IMPORT_CONFIRM, oItem);
							};
						})(oItem)
					};
				}

				//add the log button
				//must be positioned before the ShowDetails button and the rest of the standard buttons (120x<130x<150x)
				if ((oItem.TaskSupports.ProcessingLogs || oItem.TaskSupports.WorkflowLog) && that.oDataManager.getShowLogEnabled()) {
					iDisplayOrderPriorityValue = 1200 + iDisplayOrderPriorityTemp;
					iDisplayOrderPriorityTemp++;
					aButtonList.push({
						sId: "LogButtonID", // Add stable ID for Log Button
						iDisplayOrderPriority: iDisplayOrderPriorityValue,
						sI18nBtnTxt: that.bShowLogs ? "XBUT_HIDELOG" : "XBUT_SHOWLOG",
						onBtnPressed: this.onLogBtnPress.bind(this)
					});
				}

				// add the claim button
				if (that.fnFormatterSupportsProperty(oItem.TaskSupports.Claim, oItem.SupportsClaim)) {
					iDisplayOrderPriorityValue = 1500 + iDisplayOrderPriorityTemp;
					iDisplayOrderPriorityTemp++;
					// add the claim button to the end
					aButtonList.push({
						iDisplayOrderPriority: iDisplayOrderPriorityValue,
						sI18nBtnTxt: "XBUT_CLAIM",
						onBtnPressed: function(oEvent) {
							if (Device.system.phone) {
								that.stayOnDetailScreen = true;
							}
							that.sendAction("Claim", oItem, null);
						}
					});
				}

				// add the release button
				if (that.fnFormatterSupportsProperty(oItem.TaskSupports.Release, oItem.SupportsRelease)) {
					iDisplayOrderPriorityValue = 1500 + iDisplayOrderPriorityTemp;
					iDisplayOrderPriorityTemp++;
					// add the release button to the end
					aButtonList.push({
						iDisplayOrderPriority: iDisplayOrderPriorityValue,
						sI18nBtnTxt: "XBUT_RELEASE",
						onBtnPressed: function(oEvent) {
							if (Device.system.phone) {
								that.stayOnDetailScreen = true;
							}
							that.sendAction("Release", oItem, null);
						}
					});
				}

				// add the forward button
				if (that.fnFormatterSupportsProperty(oItem.TaskSupports.Forward, oItem.SupportsForward)) {
					iDisplayOrderPriorityValue = 1500 + iDisplayOrderPriorityTemp;
					iDisplayOrderPriorityTemp++;
					aButtonList.push({
						iDisplayOrderPriority: iDisplayOrderPriorityValue,
						sI18nBtnTxt: "XBUT_FORWARD",
						onBtnPressed: this.onForwardPopUp.bind(this)
					});
				}

				// add the resubmit button
				if (oItem.TaskSupports) { // If task does not support TaskSupports
					if (oItem.TaskSupports.Resubmit) {
						iDisplayOrderPriorityValue = 1500 + iDisplayOrderPriorityTemp;
						iDisplayOrderPriorityTemp++;
						aButtonList.push({
							iDisplayOrderPriority: iDisplayOrderPriorityValue,
							sI18nBtnTxt: "XBUT_RESUBMIT",
							onBtnPressed: this.showResubmitPopUp.bind(this)
						});
					}
				}

				if (oParsedParams && xNavService) {
					bIsOpenButtonCreationInPromise = true;
					xNavService.isNavigationSupported(aIntents).done(
						function(aResponses) {
							var supportedOpenMode = that._getSupportedOpenMode(aResponses);
							//Display Open Task button if
							//- intent is supported with valid openMode OR openMode is not maintained at all
							//- button display is allowed (only for openMode 'external' and 'replaceDetails')
							//- openMode is not configured
							if (oActionHelper.isOpenTaskEnabled(oItem, (supportedOpenMode === "embedIntoDetails" || supportedOpenMode === "genericEmbedIntoDetails"))) {
								iDisplayOrderPriorityValue = 1500 + iDisplayOrderPriorityTemp;
								iDisplayOrderPriorityTemp++;
								aButtonList.push({
									iDisplayOrderPriority: iDisplayOrderPriorityValue,
									sI18nBtnTxt: "XBUT_OPEN",
									onBtnPressed: function(oEvent) {
										that.checkStatusAndOpenTaskUI();
									}
								});
							}
							// add the details button
							// must be positioned after the ShowLog button and the rest of the standard buttons (120x<130x<150x)
							// only if the current task supports any of Comments, Attachments or TaskObject
							if ((supportedOpenMode === "embedIntoDetailsNestedRouter") && that.taskSupportsCommAttRelObj(oItem)) {
								iDisplayOrderPriorityValue = 1300 + iDisplayOrderPriorityTemp;
								iDisplayOrderPriorityTemp++;
								aButtonList.push({
									sId: "DetailsButtonID", // Add stable ID for Details Button
									iDisplayOrderPriority: iDisplayOrderPriorityValue,
									sI18nBtnTxt: that.bShowDetails ? "XBUT_HIDEDETAILS" : "XBUT_SHOWDETAILS",
									onBtnPressed: function(oEvent) {
										that.onDetailsBtnPress();
									}
								});
							}
							that.showHideSideContent();
							that.addEmailAndCallExtentionHookForButtonOptions(aButtonList, oPositiveAction, oNegativeAction, oItem);
						}
					).fail(function() {
						that.addEmailAndCallExtentionHookForButtonOptions(aButtonList, oPositiveAction, oNegativeAction, oItem);
						Log.error("Error while creating open task buttons");
					});
				}
				else if (!that.oDataManager.isUIExecnLinkNavProp() && oItem.GUI_Link && oActionHelper.isOpenTaskEnabled(oItem, false)) {
					iDisplayOrderPriorityValue = 1500 + iDisplayOrderPriorityTemp;
					iDisplayOrderPriorityTemp++;
					aButtonList.push({
						iDisplayOrderPriority: iDisplayOrderPriorityValue,
						sI18nBtnTxt: "XBUT_OPEN",
						onBtnPressed: function(oEvent) {
							that.checkStatusAndOpenTaskUI();
						}
					});
				}
				else if (oItem.TaskSupports.UIExecutionLink && oItem.UIExecutionLink && oItem.UIExecutionLink.GUI_Link && oActionHelper.isOpenTaskEnabled(oItem, false)) {
					iDisplayOrderPriorityValue = 1500 + iDisplayOrderPriorityTemp;
					iDisplayOrderPriorityTemp++;
					aButtonList.push({
						iDisplayOrderPriority: iDisplayOrderPriorityValue,
						sI18nBtnTxt: "XBUT_OPEN",
						onBtnPressed: function(oEvent) {
							that.checkStatusAndOpenTaskUI();
						}
					});
				}

				//add calendar integration button if supported
				if (window.plugins && window.plugins.calendar) {
					var oData = this.oModel2.getData();
					var oDeadLine = oData.CompletionDeadLine;
					if (oDeadLine) {
						var fnAddReminderWithCheck = function(deadline) {
							if (deadline < new Date()) {
								this.oConfirmationDialogManager.showDecisionDialog({
									question: this.i18nBundle.getText("dialog.warning.mq.CalendarEventInThePast"),
									title: this.i18nBundle.getText("dialog.warning.mq.CalendarEventInThePast.title"),
									confirmButtonLabel: this.i18nBundle.getText("XBUT_OK"),
									noteMandatory: false,
									confirmActionHandler: this.createCalendarEvent.bind(this)
								});
							}
							else {
								this.createCalendarEvent();
							}
							// Display confirmation dialog for reminder in the past
						};
						iDisplayOrderPriorityValue = 1500 + iDisplayOrderPriorityTemp;
						iDisplayOrderPriorityTemp++;
						aButtonList.push({
							iDisplayOrderPriority: iDisplayOrderPriorityValue,
							sI18nBtnTxt: "XBUT_CALENDAR",
							onBtnPressed: fnAddReminderWithCheck.bind(this, oDeadLine)
						});
					}
				}
			}
			else {
				//Outbox buttons:

				 bIsOutbox = true;
				//add the log button
				//must be positioned before the ShowDetails button and the rest of the standard buttons (120x<130x<150x)
				if ((oItem.TaskSupports.ProcessingLogs || oItem.TaskSupports.WorkflowLog) && that.oDataManager.getShowLogEnabled()) {
					iDisplayOrderPriorityValue = 1200 + iDisplayOrderPriorityTemp;
					iDisplayOrderPriorityTemp++;
					aButtonList.push({
						sId: "LogButtonID", // Add stable ID for Log Button
						iDisplayOrderPriority: iDisplayOrderPriorityValue,
						sI18nBtnTxt: that.bShowLogs ? "XBUT_HIDELOG" : "XBUT_SHOWLOG",
						onBtnPressed: this.onLogBtnPress.bind(this)
					});
				}

				//add the resume button if the task is suspended
				if (oItem.TaskSupports.CancelResubmission) {
					iDisplayOrderPriorityValue = 1500 + iDisplayOrderPriorityTemp;
					iDisplayOrderPriorityTemp++;
					aButtonList.push({
						iDisplayOrderPriority: iDisplayOrderPriorityValue,
						sI18nBtnTxt: "XBUT_RESUME",
						onBtnPressed: function(oEvent) {
							that.sendAction("CancelResubmission", oItem, null);
						}
					});
				}

				if (oParsedParams && xNavService) {
					xNavService.isNavigationSupported(aIntents).done(
						function(aResponses) {
							var supportedOpenMode = that._getSupportedOpenMode(aResponses);
							// add the details button
							// must be positioned after the ShowLog button and the rest of the standard buttons (120x<130x<150x)
							// only if the current task supports any of Comments, Attachments or TaskObject
							if ((supportedOpenMode === "embedIntoDetailsNestedRouter") && that.taskSupportsCommAttRelObj(oItem)) {
								iDisplayOrderPriorityValue = 1300 + iDisplayOrderPriorityTemp;
								iDisplayOrderPriorityTemp++;
								aButtonList.push({
									sId: "DetailsButtonID", // Add stable ID for Details Button
									iDisplayOrderPriority: iDisplayOrderPriorityValue,
									sI18nBtnTxt: that.bShowDetails ? "XBUT_HIDEDETAILS" : "XBUT_SHOWDETAILS",
									onBtnPressed: function(oEvent) {
										that.onDetailsBtnPress();
									}
								});
								that.showHideSideContent();
								that.addEmailAndCallExtentionHookForButtonOptions(aButtonList, oPositiveAction, oNegativeAction, oItem);
							}
						}
					).fail(function() {
						that.addEmailAndCallExtentionHookForButtonOptions(aButtonList, oPositiveAction, oNegativeAction, oItem);
						Log.error("Error creating details buttons");
					});
				}

				
			}
			// When open button is not created yet, do not call extention for button options.
			// After button creation, extention is called from the promise.
			if (!bIsOpenButtonCreationInPromise || bIsOutbox) {
				// customUI and AnnoUI might load buttons into "oHeaderFooterOptions" prior standart "aButtonList" creation
				// it happens in fnRenderComponent (flow "fnViewTaskInDefaultView -> fnGetDetailsForSelectedTask -> fnParseComponentParameters -> fnRenderComponent")

				// oHeaderFooterOptions.buttonList will be cleared and replaced with "aButtonList" on later stage.
				if (JSON.stringify(this.oHeaderFooterOptions.buttonList) !== JSON.stringify(aButtonList)) {
					aButtonList = this.oHeaderFooterOptions.buttonList.concat(aButtonList);
				}

				this.addEmailAndCallExtentionHookForButtonOptions(aButtonList, oPositiveAction, oNegativeAction, oItem);
			}
		},

		addEmailAndCallExtentionHookForButtonOptions: function(aButtonList, oPositiveAction, oNegativeAction, oItem) {
			var oButtonList = {};
			oButtonList.oPositiveAction = oPositiveAction;
			oButtonList.oNegativeAction = oNegativeAction;
			oButtonList.aButtonList = aButtonList;

			// add email settings and jam share settings
			if (!this.oDataManager.bOutbox && oItem.Status !== "COMPLETED" && oItem.Status !== "FOR_RESUBMISSION") {
				this.addShareOnJamAndEmail(oButtonList);
			}

			/**
			 * @ControllerHook Modify the footer buttons
			 * This hook method can be used to add and change buttons for the detail view footer
			 * It is called when the decision options for the detail item are fetched successfully
			 * @callback cross.fnd.fiori.inbox.view.S3~extHookChangeFooterButtons
			 * @param {object} oButtonList - contains the positive, negative buttons and the additional button list.
			 * @return {void}
			 */
			if (this.extHookChangeFooterButtons) {
				this.extHookChangeFooterButtons(oButtonList);

				oPositiveAction = oButtonList.oPositiveAction;
				oNegativeAction = oButtonList.oNegativeAction;
				aButtonList = oButtonList.aButtonList;
			}

			this.oHeaderFooterOptions = jQuery.extend(this.oHeaderFooterOptions, {
				oPositiveAction: oPositiveAction,
				oNegativeAction: oNegativeAction,
				buttonList: aButtonList,
				oJamOptions: oButtonList.oJamOptions,
				oEmailSettings: oButtonList.oEmailSettings,
				// remove bookmark button
				bSuppressBookmarkButton: true
			});
			this.refreshHeaderFooterOptions();
		},

		startForwardFilter: function(oListItem, sQuery) {
			sQuery = sQuery.toLowerCase();
			var sFullName = oListItem.getBindingContext().getProperty("DisplayName").toLowerCase();
			var sDepartment = oListItem.getBindingContext().getProperty("Department").toLowerCase();

			return (sFullName.indexOf(sQuery) !== -1) ||
				(sDepartment.indexOf(sQuery) !== -1);
		},

		closeForwardPopUp: function(oResult) {
			if (oResult && oResult.bConfirmed) {
				var oItem = this.oModel2.getData();
				var sOrigin = oItem.SAP__Origin;
				var sInstanceID = oItem.InstanceID;

				this.oDataManager.doForward(sOrigin, sInstanceID,
					oResult.oAgentToBeForwarded.UniqueName, oResult.sNote, function() {
						var sMessage = this.i18nBundle.getText("dialog.success.forward", oResult.oAgentToBeForwarded.DisplayName);
						if (this._getStandaloneDetailDeep() && this.getView().getModel().bCheckPassed) {
							this.getView().getModel().sDetailDeepEmptyMessage = sMessage + ". " + this.i18nBundle.getText("detailDeepEmptyView.closingTabMessage");
							MessageToast.show(sMessage, {duration: 1000, onClose: this.oRouter.navTo.bind(this.oRouter, "detail_deep_empty", null, false)});
						}
						else {
							MessageToast.show(sMessage);
						}
					}.bind(this));
			}
		},

		onForwardPopUp: function() {
			var oItem = this.oModel2.getData();
			var sOrigin = oItem.SAP__Origin;
			var sInstanceID = oItem.InstanceID;

			//Number of items parameter is omitted here - S3 contains a single item.
			if (this.oDataManager.userSearch) {
				Forward.open(
					this.startForwardFilter.bind(this),
					this.closeForwardPopUp.bind(this)
				);

				var bHasPotentialOwners = Conversions.formatterTaskSupportsValue(oItem.TaskSupports.PotentialOwners, oItem.HasPotentialOwners);
				if (bHasPotentialOwners) {
					this.oDataManager.readPotentialOwners(sOrigin, sInstanceID,
						this._PotentialOwnersSuccess.bind(this));
				}
				else {
					this._PotentialOwnersSuccess({
						results: []
					});
				}
			}
			else {
				ForwardSimple.open(this.closeForwardPopUp.bind(this));
			}
		},

		_getSupportedOpenMode: function(aResponses) {
			// If all responses are "true" this might mean either that all open modes are configured in different catalogs
			// or none of them is set anywhere. Regardless of this an open mode is supported only if there is exactly ONE open mode set:
			var supportedModes = [];
			for (var i = 0; i < aResponses.length; i++) {
				if (aResponses[i].supported) {
					supportedModes.push(this.OPEN_MODES[i]);
				}
			}
			return (supportedModes.length === 1) ? supportedModes[0] : null;
		},

		_getParsedParamsForIntent: function(sURL) {
			var oParsedParams = null;
			this.oURLParsingService = this.oURLParsingService
				|| sap.ushell
				&& sap.ushell.Container
				&& sap.ushell.Container.getService
				&& sap.ushell.Container.getService("URLParsing");

			if (this.oURLParsingService && this.oURLParsingService.isIntentUrl(sURL)) {
				oParsedParams = this.oURLParsingService.parseShellHash(sURL);
			}
			return oParsedParams;
		},

		_getCrossNavigationService: function() {
			if (!this.oCrossNavigationService) {
				if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getService) {
					this.oCrossNavigationService = sap.ushell.Container.getService("CrossApplicationNavigation");
				}
			}
			return this.oCrossNavigationService;
		},

		_PotentialOwnersSuccess: function(oResult) {
			Forward.setAgents(oResult.results);
			Forward.setOrigin(this.oModel2.getData().SAP__Origin);
		},

		showResubmitPopUp: function() {
			Resubmit.open(
				this.sResubmitUniqueId,
				this,
				this.getView()
			);
		},

		handleResubmitPopOverOk: function(oEvent) {
			var oItem = this.oModel2.getData();
			var sOrigin = oItem.SAP__Origin;
			var sInstanceID = oItem.InstanceID;
			var oCalendar = Fragment.byId(this.sResubmitUniqueId, "DATE_RESUBMIT");
			var aSelectedDates = oCalendar.getSelectedDates();
			if (aSelectedDates.length > 0) {
				var oDate = aSelectedDates[0].getStartDate();
				var oFormat = DateFormat.getDateInstance({
					pattern: "yyyy-MM-ddTHH:mm:ss"
				});
				this.oDataManager.doResubmit(sOrigin, sInstanceID, "datetime'" + oFormat.format(oDate) + "'", function() {
					var sMessage = this.i18nBundle.getText("dialog.success.resubmit");
					if (this._getStandaloneDetailDeep() && this.getView().getModel().bCheckPassed) {
						this.getView().getModel().sDetailDeepEmptyMessage = sMessage + ". " + this.i18nBundle.getText("detailDeepEmptyView.closingTabMessage");
						MessageToast.show(sMessage, {duration: 1000, onClose: this.oRouter.navTo.bind(this.oRouter, "detail_deep_empty", null, false)});
					}
					else {
						MessageToast.show(sMessage);
					}
				}.bind(this));
				Resubmit.close();
			}
		},

		showEmployeeCard: function(sOrigin, sCreatedBy, oSelectedControl) {
			this._setBusyIncdicatorOnDetailControls(this.getView(), true);
			this.oDataManager.readUserInfo(sOrigin, sCreatedBy,
				function(oResult) {
					this._setBusyIncdicatorOnDetailControls(this.getView(), false);
					EmployeeCard.displayEmployeeCard(oSelectedControl, oResult);
				}.bind(this),
				function(oError) {
					this._setBusyIncdicatorOnDetailControls(this.getView(), false);
				}.bind(this),
				true);
		},

		onEmployeeLaunchTask: function(oEvent) {
			var oItem = this.oModel2.getData();
			this.showEmployeeCard(oItem.SAP__Origin, oItem.CreatedBy, Conversions.getSelectedControl(oEvent));
		},

		onEmployeeLaunchCommentSender: function(sChannel, sEventName, oEvent) {
			this.showEmployeeCard(this.oModel2.getData().SAP__Origin,
				oEvent.getSource().getBindingContext("detail").getProperty("CreatedBy"),
				Conversions.getSelectedControl(oEvent));
		},

		handleLogNavigation: function(oEvent) {
			var oBindingContext =  oEvent.getSource().getBindingContext("detail");
			var sSapOrigin = oBindingContext.getProperty("SAP__Origin");
			var sReferenceID = oBindingContext.getProperty("ReferenceInstanceID");
			var sContextPath = "TaskCollection(SAP__Origin='" + sSapOrigin+"',InstanceID='"+sReferenceID+"')";
			this.bNavToFullScreenFromLog = true;
			var oParameters = {
				SAP__Origin: sSapOrigin, // eslint-disable-line camelcase
				InstanceID: sReferenceID,
				contextPath: sContextPath
			};

			//Check if information of navigated task is available in loaded user's task list
			var oView = this.getView();
			this.oContext = new Context(oView.getModel(), sContextPath);
			oView.setBindingContext(this.oContext);
			var oItem = jQuery.extend(true, {}, oView.getModel().getData(this.oContext.getPath(), this.oContext));
			if (jQuery.isEmptyObject(oItem)) {
				//Load task information as task is viewed by navigating from Workflow Log and is not part of user's current inbox list
				var that = this;
				var oDataManager = that.getOwnerComponent().getDataManager();
				oDataManager.oDataRead("/TaskCollection(SAP__Origin='" + sSapOrigin +
						"',InstanceID='" + sReferenceID + "')", null,
						function(oDetailData) {
							if (oDetailData !== undefined && !jQuery.isEmptyObject(oDetailData)) {
								//Perform routing
								that.oRouter.navTo("detail_deep", oParameters, false);
							}
						},
						function(oError) {
							Log.error(oError);
							return;
						}
				);
			}
			else {
				//Perform routing
				this.oRouter.navTo("detail_deep", oParameters, false);
			}
		},

		onEmployeeLaunchCommentIcon: function(oEvent) {
			// Business card on Notes
			var sOrigin = oEvent.getSource().getBindingContext().getProperty("SAP__Origin");
			var sCreatedBy = oEvent.getSource().getBindingContext("detail").getModel().getProperty(oEvent.getSource().getBindingContext("detail").getPath())
				.CreatedBy;
			if (!sOrigin) {
				//Deep link scenario
				var oItem = this.oModel2.getData();
				sOrigin = oItem.SAP__Origin;
			}
			this.showEmployeeCard(sOrigin, sCreatedBy, Conversions.getSelectedControl(oEvent));
		},

		onAttachmentShow: function(oEvent) {
			var oContext = oEvent.getSource().getBindingContext("detail");
			var sMediaSrc = cross.fnd.fiori.inbox.attachment.getRelativeMediaSrc(oContext.getProperty().__metadata.media_src);
			sap.m.URLHelper.redirect(sMediaSrc, true);
		},

		showDecisionDialog: function(sFunctionImportName, oDecision, bShowNote) {
			// Could easily be scaled to downloading multiple things using Promise.all
			var reasonOptionsLoadedPromise = oDecision && (oDecision.ReasonRequired === "REQUIRED" || oDecision.ReasonRequired === "OPTIONAL") ?
				this.oConfirmationDialogManager.loadReasonOptions(oDecision, this.oDataManager) : null;

			var decisionDialogSettings = {
				question: this.i18nBundle.getText("XMSG_DECISION_QUESTION", oDecision.DecisionText),
				textAreaLabel : this.i18nBundle.getText("XFLD_TextArea_Decision"),
				showNote: bShowNote,
				title: this.i18nBundle.getText("XTIT_SUBMIT_DECISION"),
				confirmButtonLabel: this.i18nBundle.getText("XBUT_SUBMIT"),
				noteMandatory: oDecision.CommentMandatory,
				confirmActionHandler: function(oDecision, sNote, sReasonOptionKey) {
					this.sendAction(sFunctionImportName, oDecision, sNote, sReasonOptionKey);
				}.bind(this, oDecision)
			};

			// reason options won't be loaded 
			if (reasonOptionsLoadedPromise === null) {
				this.oConfirmationDialogManager.showDecisionDialog(decisionDialogSettings);
			} 
			else {
				// reason options will be loaded
				reasonOptionsLoadedPromise.then(function(reasonOptionsSettings) {
					decisionDialogSettings["reasonOptionsSettings"] = reasonOptionsSettings;
					this.oConfirmationDialogManager.showDecisionDialog(decisionDialogSettings);
				}.bind(this))
				.catch(function(oError) {
					// failed to load the reason options yet open the dialog without them.
					this.oConfirmationDialogManager.showDecisionDialog(decisionDialogSettings);
					Log.error("Could not load the reason options properly");
				}.bind(this));
			}
		},

		fnOnNavBackFromLogDescription: function(oEvent) {
			this.bNavToFullScreenFromLog = false;
			this.bShowLogs = true;
			window.history.back();
		},

		showConfirmationDialog: function(sFunctionImportName, oItem) {
			this.oConfirmationDialogManager.showDecisionDialog({
				question: this.i18nBundle.getText("XMSG_CONFIRM_QUESTION"),
				showNote: false,
				title: this.i18nBundle.getText("XTIT_SUBMIT_CONFIRM"),
				confirmButtonLabel: this.i18nBundle.getText("XBUT_CONFIRM"),
				confirmActionHandler: function(oItem, sNote) {

					this.sendAction(sFunctionImportName, oItem, sNote);
				}.bind(this, oItem)
			});
		},

		// executed when the event CommentAdded is fired from the Comment Component
		onCommentPost: function(sChannel, sEventName, oEvent) {
			var sComment = oEvent.getParameter("value");
			if (sComment && sComment.length > 0) {
				this.sendAction("AddComment", null, sComment);
			}
		},

		sendAction: function(sFunctionImportName, oDecision, sNote, sReasonOptionCode) {
			var that = this;
			var sSuccessMessage;

			switch (sFunctionImportName) {
				case "Release":
					sSuccessMessage = "dialog.success.release";
					break;
				case "Claim":
					sSuccessMessage = "dialog.success.reserve";
					break;
				case "AddComment":
					sSuccessMessage = "dialog.success.addComment";
					break;
				case "Confirm":
					sSuccessMessage = "dialog.success.completed";
					break;
				case "CancelResubmission":
					sSuccessMessage = "dialog.success.cancelResubmission";
					break;
				default:
					sSuccessMessage = "dialog.success.complete";
			}

			switch (sFunctionImportName) {
				case "AddComment":
					{
						var oItem = this.oModel2.getData();
						var oCommentsControl = this._getIconTabControl("Comments");
						this._setBusyIncdicatorOnDetailControls(oCommentsControl, true);
						// this.oDataManager.addComment(oItem.SAP__Origin, oItem.InstanceID, sNote,
						// function(data, response) {

						// 	// update the comments data and comments count
						// 	if (oItem.Comments && oItem.Comments.results) {
						// 		oItem.Comments.results.unshift(data);
						// 	}
						// 	else {
						// 		oItem.Comments = {
						// 			results: [data]
						// 		};
						// 	}
						// 	oItem.CommentsCount = oItem.Comments.results.length;
						// 	this._setBusyIncdicatorOnDetailControls(oCommentsControl, false);
						// 	this._updateDetailModel(oItem);

						// 	setTimeout(function() {
						// 		MessageToast.show(that.i18nBundle.getText(sSuccessMessage));
						// 	}, 500, this);

						// 	// update the counter on history tab
						// 	//this.fnCountUpdater("ProcessingLogs", oItem.SAP__Origin, oItem.InstanceID);
						// }.bind(this),
						// function(oError) {
						// 	this._setBusyIncdicatorOnDetailControls(oCommentsControl, false);
						// }.bind(this));

						//agregar comentario sin tocar el odata (Solo vista)
						var data = {
							CreatedAt: new Date(),
							CreatedBy: "S_PSILVEIRA",
							CreatedByDetails: { 
								__deferred: {
									uri: "https://vhpaaqvkci.sap.cap.cl:44300/sap/opu/odata/IWPGW/TASKPROCESSING;mo;v=2/CommentCollection(SAP__Origin='LOCAL_TGW',InstanceID='000021313842',ID='t-FOL33000000000004RAW48000000985682')/CreatedByDetails"
								} 
							},
							CreatedByName: "PABLO SILVEIRA",
							ID: "t-FOL33000000000004RAW48000000985682",
							InstanceID: "000021313842",
							SAP__Origin: "LOCAL_TGW",
							Text: sNote,
							__metadata: {
								id: "https://vhpaaqvkci.sap.cap.cl:44300/sap/opu/odata/IWPGW/TASKPROCESSING;mo;v=2/CommentCollection(SAP__Origin='LOCAL_TGW',InstanceID='000021313842',ID='t-FOL33000000000004RAW48000000985682')",
								uri: "https://vhpaaqvkci.sap.cap.cl:44300/sap/opu/odata/IWPGW/TASKPROCESSING;mo;v=2/CommentCollection(SAP__Origin='LOCAL_TGW',InstanceID='000021313842',ID='t-FOL33000000000004RAW48000000985682')",
								type: 'TASKPROCESSING.Comment'
							}
						}
						oItem.Comments.results.unshift(data);
						oItem.CommentsCount = oItem.Comments.results.length;
						this.oModel2.setData(oItem);
						this._setBusyIncdicatorOnDetailControls(oCommentsControl, false);

						break;
					}
				default:
					{
						//this.oDataManager.sendAction(sFunctionImportName, oDecision, sNote, sReasonOptionCode,
							MessageToast.show("Tarea procesada correctamente");
							// function(oData) {
							
							// 	setTimeout(function() {
							// 		var sMessage = that.i18nBundle.getText(sSuccessMessage);
							// 		MessageToast.show("Que paso che");
							// 		if (that._getStandaloneDetailDeep() && that.getView().getModel().bCheckPassed) {
							// 			that.getView().getModel().sDetailDeepEmptyMessage = sMessage + ". " + that.i18nBundle.getText("detailDeepEmptyView.closingTabMessage");
							// 			MessageToast.show(sMessage, {duration: 1000, onClose: that.oRouter.navTo.bind(that.oRouter, "detail_deep_empty", null, false)});
							// 		}
							// 		else {
                            //          MessageToast.show("Que paso che");
							// 			//MessageToast.show(sMessage);
							// 		}
							// 	}, 500);
							// }.bind(this, oDecision)
					//	);
					}
			}
		},

		refreshHeaderFooterOptions: function() {
			if (this.oHeaderFooterOptions && this.oHeaderFooterOptions.buttonList) {
				this.oHeaderFooterOptions.buttonList.sort(CommonFunctions.compareButtons);
			}
			this._oHeaderFooterOptions = jQuery.extend(this._oHeaderFooterOptions, this.oHeaderFooterOptions);
			this.setHeaderFooterOptions(this._oHeaderFooterOptions);
		},

		setHeaderFooterOptions : function(oOptions) {
			this.oAppImp.oDHFHelper.setHeaderFooter(this, oOptions);
		},

	    /*
		 * override this method if you have not used the standard way to include the page in the view
		 */
		getPage : function() {
			return CommonHeaderFooterHelper.getPageFromController(this);
		},

		// nav back button pressed from table view's detail view
		fnNavBackToTableVw: function() {
			this.getOwnerComponent().getEventBus().publish("cross.fnd.fiori.inbox", "refreshTask", {
					"contextPath": this.sCtxPath
				});
		//	this.oRouter.navTo("table_view", {}, true);
		if (window.history.length > 0) {
			window.history.back();
			}
		},

		//nav button pressed from split-view's detail view in mobile
		fnOnNavBackInMobile: function() {
			if (window.history.length > 0) {
				window.history.back();
			}
			else {
				Log.error("Navigation history does not exist. Ensure that navigation history is maintained or provide custom event handler for back navigation button through setShowNavButton API");
			}
		},

		checkStatusAndOpenTaskUI: function() {
			var oTaskData = this.oModel2.getData();
			this.oDataManager.checkStatusAndOpenTask(
				oTaskData.SAP__Origin, oTaskData.InstanceID, this.openTaskUI.bind(this));
		},

		/*
		 check if the task has an intent configured to open another app either in embed or external mode
		 if yes, then open it in the respective mode
		 if no, open task in the default way
		 */
		openTaskUI: function() {
			var oTaskData = this.oModel2.getData();
			var oActionHelper = this._getActionHelper();
			var sKey = oTaskData.SAP__Origin + "_" + oTaskData.InstanceID;
			var oIntentParams = this.oEmbedModeIntentParams ? this.oEmbedModeIntentParams[sKey] : null;
			if (oIntentParams) { //open app now
				this.fnNavigateToApp(oIntentParams, oIntentParams.OpenInEmbedMode);
			}
			else {
				var oDataManager = this.getOwnerComponent().getDataManager();
				oActionHelper.fnValidateOpenTaskURLAndRedirect(this.oModel2.getData().GUI_Link || this.oModel2.getData().UIExecutionLink.GUI_Link, oDataManager.isForwardUserSettings());
			}
		},

		fnEmbedApplicationInDetailView: function(oParsedParams) {
			var sNavigationIntent = "#" + oParsedParams.semanticObject + "-" + oParsedParams.action;
			var oIntentModel = new JSONModel({
				NavigationIntent: sNavigationIntent,
				params: oParsedParams.params
			});
			this.getOwnerComponent().setModel(oIntentModel, "intentModel");
			var oParameters = {
				SAP__Origin: this.oRoutingParameters.SAP__Origin,
				InstanceID: this.oRoutingParameters.InstanceID,
				contextPath: this.oRoutingParameters.contextPath
			};
			if (this.bIsTableViewActive) {
				this.oRouter.navTo("replace_detail_deep", oParameters, false);
			}
			else {
				this.oRouter.navTo("replace_detail", oParameters, true);
			}
		},

		//Toggle current breakpoint for Dynamic Side Content - required for mobile
		updateToggleButtonState: function(oEvent) {
			this.sCurrentBreakpoint = oEvent.getParameter("currentBreakpoint");
			this.setShowMainContent();
		},

		//Event handler for the log btn
		onLogBtnPress: function(oEvent) {
			var oShowLogBtn = this.byId("LogButtonID");
			var oShowDetailsBtn = this.byId("DetailsButtonID"); 
			var oTabBarLogs = this.byId("tabBarLogs");
			this.bShowLogs = false;
			if (oShowLogBtn) {
				if (oShowLogBtn.getText() === this.i18nBundle.getText("XBUT_SHOWLOG")) {
					//Show side content and logs, modify button tooltip, show/hide segmented button based on TaskSupports data
					oShowLogBtn.setText(this.i18nBundle.getText("XBUT_HIDELOG"));
					if (oShowDetailsBtn) {
						oShowDetailsBtn.setText(this.i18nBundle.getText("XBUT_SHOWDETAILS"));
					}
					this.oModel2.setProperty("/ShowLogPressed", true);
					this.bShowLogs = true;
					this.bShowDetails = false;
					this.createLogs();
					if (!this.sCurrentBreakpoint && Device.system.phone) {
						this.sCurrentBreakpoint = "S";
					}
					this.setShowSideContent(true);
					this.fnSetFocusOnSideContent();
				}
				else {
					//Hide side content and modify button tooltip
					oShowLogBtn.setText(this.i18nBundle.getText("XBUT_SHOWLOG"));
					this.setShowSideContent(false);
				}
			}
			this.setShowMainContent();
			this.updateButtonList();
		},

		//Event handler for the Details btn
		onDetailsBtnPress: function(oEvent) {
			var oShowLogBtn = this.byId("LogButtonID");
			var oShowDetailsBtn = this.byId("DetailsButtonID"); 
			this.bShowDetails = false;
			if (oShowDetailsBtn) {
				if (oShowDetailsBtn.getText() === this.i18nBundle.getText("XBUT_SHOWDETAILS")) {
					oShowDetailsBtn.setText(this.i18nBundle.getText("XBUT_HIDEDETAILS"));
					if (oShowLogBtn) {
						oShowLogBtn.setText(this.i18nBundle.getText("XBUT_SHOWLOG"));
					}
					this.oModel2.setProperty("/ShowLogPressed", false);
					this.bShowDetails = true;
					this.bShowLogs = false;
					this.fnCreateSelectedTab(this.byId("tabBarDetails").getSelectedKey());
					if (!this.sCurrentBreakpoint && Device.system.phone) {
						this.sCurrentBreakpoint = "S";
					}
					this.setShowSideContent(true);
					this.fnSetFocusOnSideContent();
				}
				else {
					//Hide side content and modify button tooltip
					oShowDetailsBtn.setText(this.i18nBundle.getText("XBUT_SHOWDETAILS"));
					this.setShowSideContent(false);
				}
			}
			this.setShowMainContent();
			this.updateButtonList();
		},

		hideDetails: function() {
			this.bShowDetails = false;
			this.setShowSideContent(false);
			this.setShowMainContent();
		},

		// Fixes a bug, where Show log button is not in correct state when we refresh custom ui.
		// Jira: CENTRALINBOX-2505
		// Customer Incident: 2130013447
		updateButtonList: function(){
			var logButton = this.byId("LogButtonID");
			if (logButton) {
				logButton.sI18nBtnTxt = this.bShowLogs ? "XBUT_HIDELOG" : "XBUT_SHOWLOG";
			}
			var detailsButton = this.byId("DetailsButtonID");
			if (detailsButton) {
				detailsButton.sI18nBtnTxt = this.bShowDetails ? "XBUT_HIDEDETAILS" : "XBUT_SHOWDETAILS";
			}
		},

		//  Set focus at beginning of Side Content
		fnSetFocusOnSideContent: function() {
				var sTaskSupports = this.oModel2.getData().TaskSupports;
				var that = this;
				if (sTaskSupports.WorkflowLog) {
					setTimeout(function () {
						that.getView().byId("WorkflowLogIconTabFilter").focus();
					}, 100);
				}
				else if (sTaskSupports.ProcessingLogs) {
					setTimeout(function () {
						that.getView().byId("TaskLogIconTabFilter").focus();
					}, 100);
				}
		},

		//Show or hide main content in case of phone
		setShowMainContent: function() {
			var oDynamicSideContent = this.byId("DynamicSideContent");
			if (oDynamicSideContent) {
				if (this.sCurrentBreakpoint === "S" && (this.bShowLogs || this.bShowDetails) && this.oModel2 && this.oModel2.getData()) {
					var sTaskSupports = this.oModel2.getData().TaskSupports;
					if (
							(this.bShowLogs && sTaskSupports 
									&& (sTaskSupports.WorkflowLog || sTaskSupports.ProcessingLogs))
								|| 
							(this.bShowDetails && sTaskSupports && this._getEmbedIntoDetailsNestedRouter() 
									&& (sTaskSupports.Attachments || sTaskSupports.TaskObject || sTaskSupports.Comments))
						) {
						oDynamicSideContent.setShowMainContent(false);
					}
					else {
						oDynamicSideContent.setShowMainContent(true);
					}
				}
				else {
					oDynamicSideContent.setShowMainContent(true);
				}
			}
		},

		//Show or hide side content
		setShowSideContent: function(sEnable) {
			var oDynamicSideContent = this.byId("DynamicSideContent");
			if (oDynamicSideContent) {
				oDynamicSideContent.setShowSideContent(sEnable);
			}
		},

		/**
		 * This function checks whether the side content, 
		 * where the logs appear, is currently open.
		 * 
		 * @returns {boolean} side content's current open state
		 */
		getShowSideContent: function() {
			var oDynamicSideContent = this.byId("DynamicSideContent");
			if (oDynamicSideContent) {
				return oDynamicSideContent.getShowSideContent();
			}

			return false;
		},

		//Create the task history / workflow log for the selected task
		createLogs: function(sKey) {
			var sLogKey = sKey;
			var oIconTabBar = this.byId("tabBarLogs");
			var oItem = this.oModel2.getData();

			//pass CustomCreatedBy value to fnFetchDataOnLogTabSelect()  functions
			this.sCustomCreatedByValue = null;
			if (oItem.CustomAttributeData instanceof Array && oItem.CustomAttributeData.length > 0) {
				for (var i=0; i<oItem.CustomAttributeData.length; i++) {
					var oCustomAttribute = this.oDataManager.oModel.getProperty("/" + oItem.CustomAttributeData[i]);
					if (oCustomAttribute && oCustomAttribute.Name.toLowerCase() === this.sCustomCreatedByAttribute.toLowerCase()) {
						this.sCustomCreatedByValue = oCustomAttribute.Value;
						break;
					}
				}
			}

			//If input parameter key is empty, get from tab selected key provided both tabs are supported, else get based on task supports
			if (!sLogKey && oItem.TaskSupports) {
				if (oItem.TaskSupports.ProcessingLogs && oItem.TaskSupports.WorkflowLog && oIconTabBar) {
					sLogKey = oIconTabBar.getSelectedKey();
				}
				else if (oItem.TaskSupports.WorkflowLog) {
					sLogKey = "WORKFLOWLOG";
				}
				else if (oItem.TaskSupports.ProcessingLogs) {
					sLogKey = "TASKLOG";
				}
				else if (oItem.TaskSupports.ProcessingLogs) {
					sLogKey = "HISTORIAL";
				}
			}
			switch (sLogKey) {
				case "TASKLOG":
					this.createTimeLine();
					this.fnHandleNoTextCreation("ProcessingLogs");
					this.fnFetchDataOnLogTabSelect("ProcessingLogs");
					this._getIconTabControl("ProcessingLogs").setGrowingThreshold(10);
					break;
				case "WORKFLOWLOG":
					this.createWorkflowLogTimeLine();
					this.fnHandleNoTextCreation("WorkflowLogs");
					this.fnFetchDataOnLogTabSelect("WorkflowLogs");
					this._getIconTabControl("WorkflowLogs").setGrowingThreshold(10);
					break;
				case "HISTORIAL":
					this.createWorkflowLogTimeLine();
					this.fnHandleNoTextCreation("WorkflowLogs");
					this.fnFetchDataOnLogTabSelect("WorkflowLogs");
					this._getIconTabControl("WorkflowLogs").setGrowingThreshold(10);
					break;
				default:
			}
		},

		//Create timeline entries for Workflow Log
		createWorkflowLogTimeLine: function() {
			var that = this;
			var oTimeline = that._getIconTabControl("WorkflowLogs");
			if (oTimeline) {
				var oTimelineItemTemplate = new TimelineItem({
					icon: {
						parts: [{
							path: "detail>Status"
						}, {
							path: "detail>ResultType"
						}],
						formatter: Conversions.formatterWorkflowLogStatusIcon
					},
					userName: {
						parts: [{
							path: "detail>PerformedByName"
						}, {
							path: "detail>Status"
						}, {
							path: "detail>CustomCreatedBy"
						}],
						formatter: Conversions.formatterWorkflowLogStatusUsername
					},
					userNameClickable: {
						parts: [{
							path: "detail>Status"
						}, {
							path: "detail>CustomCreatedBy"
						}],
						formatter: Conversions.formatterWorkflowLogUsernameClickable
					},
					userPicture: {
						parts: [{
							path: "detail>SAP__Origin"
						}, {
							path: "detail>PerformedByName"
						}, {
							path: "detail>Status"
						}, {
							path: "detail>CustomCreatedBy"
						}],
						formatter: Conversions.formatterWorkflowLogUserPicture
					},
					title: {
						parts: [{
							path: "detail>Status"
						}, {
							path: "detail>PerformedByName"
						}, {
							path: "detail>CustomCreatedBy"
						}],
						formatter: Conversions.formatterWorkflowLogStatusText
					},
					dateTime:"{detail>Timestamp}",
					embeddedControl: new VBox({
						items: [
							new ObjectAttribute({
								text: "{detail>Description}",
								active: "{detail>SupportsNavigation}",
								press: this.handleLogNavigation.bind(this)
							}),
							new ObjectStatus({
								text: "{detail>Result}",
								state: {
									path: "detail>ResultType",
									formatter: Conversions.formatterWorkflowLogResultState
								}
							})
						]
					})
				});
				oTimelineItemTemplate.attachUserNameClicked(function(oEvent) {
						var oBindingContext = oEvent.getSource().getBindingContext("detail");
						that.showEmployeeCard(oBindingContext.getProperty("SAP__Origin"), oBindingContext.getProperty("PerformedBy")
							, Conversions.getSelectedControl(oEvent));
				});
				oTimeline.bindAggregation("content", {
					path: "detail>/WorkflowLogs/results",
					template: oTimelineItemTemplate
				});
			}
		},

		onLogTabSelect: function(oControlEvent) {
			var sSelectedKey = oControlEvent.getParameters().selectedKey;
			this.createLogs(sSelectedKey);
		},

		fnFetchDataOnLogTabSelect: function(sNavProperty) {
			var oParameters = null;
			if (sNavProperty === "ProcessingLogs") {
				oParameters = {
					$orderby: "OrderID desc"
				};
			}
			var sPath = this.sCtxPath + "/" + sNavProperty;
			var oTabControl = this._getIconTabControl(sNavProperty);
			this._setBusyIncdicatorOnDetailControls(oTabControl, true);

			// success handler of read data request
			var fnSuccess = function(data) {
				var oModelData = this.oModel2.getData();
				var bDataPresent = (oModelData[sNavProperty] && oModelData[sNavProperty].results) ? true : false;

				//add the sCustomCreatedByValue to the LogResults data so it can be used in the formatters defined in the timeline controls
				if (this.sCustomCreatedByValue) {
					var aLogResults = data.results;
					if (aLogResults && Array.isArray(aLogResults)) {
						for (var i=0; i<aLogResults.length; i++) {
							aLogResults[i].CustomCreatedBy = this.sCustomCreatedByValue;
						}
					}
					data.results = aLogResults;
				}

				// if data is already present in the model, merge the new response with existing data
				this.fnUpdateDataAfterFetchComplete(oModelData, bDataPresent, sNavProperty, data);

				this._setBusyIncdicatorOnDetailControls(oTabControl, false);
				//Set proper text in case no log data exist
				if (data.results.length === 0) {
					var oTimeline = this._getIconTabControl(sNavProperty);
					var i18nTextKey;
					if (sNavProperty === "ProcessingLogs") {
						i18nTextKey = "view.ProcessLogs.noData";
					}
					else if (sNavProperty === "WorkflowLogs") {
						i18nTextKey = "view.WorkflowLogs.noData";
					}
					oTimeline.setNoDataText(this.i18nBundle.getText(i18nTextKey));
				}
			};

			// error handler for read request
			var fnError = function(oError) {
				this._setBusyIncdicatorOnDetailControls(oTabControl, false);
				this.oDataManager.oDataRequestFailed(oError);
			};

			// send the request to fetch data for selected tab
			this.oDataManager.oDataRead(sPath, oParameters, fnSuccess.bind(this), fnError.bind(this));

		},

		onTabSelect: function(oControlEvent) {
			var sSelectedTab = oControlEvent.getParameters().selectedKey;
			this.fnCreateSelectedTab(sSelectedTab);
		},

		fnCreateSelectedTab: function(sSelectedTab) {
			var taskSupports;
			if (this.oModel2 && this.oModel2.getData()) {
				taskSupports = this.oModel2.getData().TaskSupports;
			}

			// if taskSupports is falsy, no tabs should be created
			if (taskSupports) {
				switch (sSelectedTab) {
					case "NOTES":
						// if the current task does not support Comments, go to Attachments
						if (!taskSupports.Comments) {
							if (taskSupports.Attachments) {
								this.fnCreateSelectedTab("ATTACHMENTS");
								break;
							}
							// if not, go to OBJECTLINKS
							else if (taskSupports.TaskObject) {
								this.fnCreateSelectedTab("OBJECTLINKS");
								break;
							}
							// and if nothing is supported, hide the Details pane
							else {
								this.hideDetails();
								break;
							}
						}
						this.fnDelegateCommentsCreation();
						this.fnFetchDataOnTabSelect("Comments");
						this.fnSetIconForCommentsFeedInput();
						this.fnHandleNoTextCreation("Comments");
						break;
	
					case "ATTACHMENTS":
						// if the current task does not support Attachments, go to Comments
						if (!taskSupports.Attachments) {
							if (taskSupports.Comments) {
								this.fnCreateSelectedTab("NOTES");
								break;
							}
							// if not, go to OBJECTLINKS
							else if (taskSupports.TaskObject) {
								this.fnCreateSelectedTab("OBJECTLINKS");
								break;
							}
							// and if nothing is supported, hide the Details pane
							else {
								this.hideDetails();
								break;
							}
						}
						this.fnDelegateAttachmentsCreation();
						this.fnFetchDataOnTabSelect("Attachments");
						if (!this._getEmbedIntoDetailsNestedRouter()) {
							this.fnHandleAttachmentsCountText("Attachments");
						}
						this.fnHandleNoTextCreation("Attachments");
						break;
	
					case "OBJECTLINKS":
						if (taskSupports.TaskObject) {
							this.fnFetchObjectLinks();
						}
						// if the current task does not support TaskObject, go to Comments
						else {
							if (taskSupports.Comments) {
								this.fnCreateSelectedTab("NOTES");
								break;
							}
							// if not, go to Attachments
							else if (taskSupports.Attachments) {
								this.fnCreateSelectedTab("ATTACHMENTS");
								break;
							}
							// and if nothing is supported, hide the Details pane
							else {
								this.hideDetails();
								break;
							}
						}
						break;
					default:
				}
			}
			else {
				this.hideDetails();
			}
		},

		fnDelegateCommentsCreation: function() {
			if (!this._getEmbedIntoDetailsNestedRouter() && this.isGenericComponentRendered) {
				return;
			}
			var oItemData = this.oModel2.getData();
			var containerID = this._getEmbedIntoDetailsNestedRouter() ? "commentsContainerInDetails" : "commentsContainer";
			if (this.getView().byId(containerID) &&
				this.fnFormatterSupportsProperty(oItemData.TaskSupports.Comments, oItemData.SupportsComments)) {
				this.createGenericCommentsComponent(this.getView());
			}
		},

		fnDelegateAttachmentsCreation: function() {
			var oItemData = this.oModel2.getData();
			var oAttachmentContainer = this._getEmbedIntoDetailsNestedRouter() ? this.byId("attachmentComponentInDetails") : this.byId("attachmentComponent");
			if (oAttachmentContainer 
					&& this.fnFormatterSupportsProperty(oItemData.TaskSupports.Attachments, oItemData.SupportsAttachments)) {
				if (!jQuery.isEmptyObject(this.oGenericAttachmentComponent)) {
					this.oGenericAttachmentComponent.destroy();
					delete this.oGenericAttachmentComponent;
				}
				this.oGenericAttachmentComponent = sap.ui.getCore().createComponent({
					name: "cross.fnd.fiori.inbox.attachment",
					settings: {
						attachmentHandle: this.fnCreateAttachmentHandle(this.sCtxPath)
					}
				});
				this.oGenericAttachmentComponent.uploadURL(this.fnGetUploadUrl(this.sCtxPath));
				oAttachmentContainer.setPropagateModel(true);
				oAttachmentContainer.setComponent(this.oGenericAttachmentComponent);					
			}
		},

		createTimeLine: function() {
			/*jQuery.sap.require("sap.suite.ui.commons.Timeline");
			 jQuery.sap.require("sap.suite.ui.commons.TimelineItem");*/
			var oTimeline = this.byId("timeline");
			if (oTimeline) {
				oTimeline.setSort(false);
				var oTimelineItemTemplate = new TimelineItem({
					icon: {
						path: "detail>ActionName",
						formatter: Conversions.formatterActionIcon
					},
					userName: {
						parts: [{
							path: "detail>PerformedByName"
						}, {
							path: "detail>ActionName"
						}, {
							path: "detail>CustomCreatedBy"
						}],
						formatter: Conversions.formatterActionUsername
					},
					title: {
						path: "detail>ActionName",
						formatter: Conversions.formatterActionText
					},
					dateTime: "{detail>Timestamp}"
				});
				oTimeline.bindAggregation("content", {
					path: "detail>/ProcessingLogs/results",
					template: oTimelineItemTemplate
				});
			}
		},

		// TODO move this to the comments component
		fnSetIconForCommentsFeedInput: function() {
			if (this.oGenericCommentsComponent && this.oGenericCommentsComponent.fnIsFeedInputPresent() && !this.oGenericCommentsComponent.fnGetFeedInputIcon()) {
				if (sap.ushell.Container != undefined) {
					var sSapOrigin = this.oModel2.getData().SAP__Origin;
					var sUserId = sap.ushell.Container.getUser().getId();
					// TODO write all the code related to user pictures at one single place
					this.oDataManager.getCurrentUserImage(sSapOrigin, sUserId,
						this.oGenericCommentsComponent.fnSetFeedInputIcon.bind(this.oGenericCommentsComponent));
				}
			}

		},

		/* Updates the count in the model */
		fnCountUpdater: function(sKey, sSapOrigin, sInstanceID, sGroupName) {
			var that = this;
			var oItemData = this.oModel2.getData();
			switch (sKey) {
				case "Attachments":
					if (that.fnFormatterSupportsProperty(oItemData.TaskSupports.Attachments, oItemData.SupportsAttachments)) {
						this.oDataManager.fnGetCount(sSapOrigin, sInstanceID, function(sNumberOFAttachments) {
							that.oModel2.setProperty("/AttachmentsCount", sNumberOFAttachments);
						}, "Attachments", sGroupName);
					}
					break;
				case "Comments":
					if (that.fnFormatterSupportsProperty(oItemData.TaskSupports.Comments, oItemData.SupportsComments)) {
						this.oDataManager.fnGetCount(sSapOrigin, sInstanceID, function(sNumberOFComments) {
							that.oModel2.setProperty("/CommentsCount", sNumberOFComments);
						}, "Comments", sGroupName);
					}
					break;
				/*case "ProcessingLogs":
					if (oItemData.TaskSupports.ProcessingLogs && !that.isGenericComponentRendered) {
						this.oDataManager.fnGetCount(sSapOrigin, sInstanceID, function(sNumberOfLogs) {
							that.oModel2.setProperty("/ProcessingLogsCount", sNumberOfLogs);
							that.fnHandleNoTextCreation("ProcessingLogs");
						}, "ProcessingLogs");
					}
					break;*/
				case "ObjectLinks":
					if (oItemData.TaskSupports.TaskObject && that.oDataManager.bShowTaskObjects) {
						this.oDataManager.fnGetCount(sSapOrigin, sInstanceID, function(sNumberOfLinks) {
							that.oModel2.setProperty("/ObjectLinksCount", sNumberOfLinks);
							that.fnHandleNoTextCreation("ObjectLinks");
						}, "TaskObjects", sGroupName);
					}
					break;
				default:
					break;
			}
		},

		//Generate attachments message based on the attachments count
		fnHandleAttachmentsCountText: function(sEntity) {
			var oModelData = this.oModel2.getData();
			var oGenericUploadControl = this._getUploadCollectionControl();

			if (oGenericUploadControl && oModelData.hasOwnProperty("AttachmentsCount")) {
				var attachmentsCount = oModelData.AttachmentsCount;
				var attachmentsLimit = this.oModel2.iSizeLimit;

				var numberOfAttachmentsText = attachmentsCount >= attachmentsLimit ?
					this.i18nBundle.getText("attachmentsCount.message", [attachmentsLimit, attachmentsCount]) :
					this.i18nBundle.getText("attachments.tooltip");

				oGenericUploadControl.setNumberOfAttachmentsText(numberOfAttachmentsText);
			}
		},

		fnHandleNoTextCreation: function(sEntity) {
			var oModelData = this.oModel2.getData();

			switch (sEntity) {
				case "Comments":
					if (this.oGenericCommentsComponent) {
						if (oModelData.hasOwnProperty("CommentsCount") && oModelData.CommentsCount > 0) {
							this.oGenericCommentsComponent.setNoDataText(this.i18nBundle.getText("XMSG_LOADING"));
						}
						else if (oModelData.hasOwnProperty("CommentsCount") && oModelData.CommentsCount == 0) {
							this.oGenericCommentsComponent.setNoDataText(this.i18nBundle.getText("view.CreateComment.noComments"));
						}
					}
					break;
				case "Attachments":
					var oGenericUploadControl = this._getUploadCollectionControl();
					if (oGenericUploadControl) {
						if (oModelData.hasOwnProperty("AttachmentsCount") && oModelData.AttachmentsCount > 0) {
							oGenericUploadControl.setNoDataText(this.i18nBundle.getText("XMSG_LOADING"));
						}
						else if (oModelData.hasOwnProperty("AttachmentsCount") && oModelData.AttachmentsCount == 0) {
							oGenericUploadControl.setNoDataText(this.i18nBundle.getText("view.Attachments.noAttachments"));
						}
					}
					break;
				case "ProcessingLogs":
					var oTaskLogTab = this._getIconTabControl("ProcessingLogs");
					if (oTaskLogTab) {
						oTaskLogTab.setNoDataText(this.i18nBundle.getText("XMSG_LOADING"));
					}
					break;
				case "WorkflowLogs":
					var oWorkflowLogTab = this._getIconTabControl("WorkflowLogs");
					if (oWorkflowLogTab) {
						oWorkflowLogTab.setNoDataText(this.i18nBundle.getText("XMSG_LOADING"));
					}
					break;
				case "ObjectLinks":
					var oObjectLinksTab = this._getObjectLinksList();
					if (oObjectLinksTab) {
						if (oModelData.ObjectLinksCount && oModelData.ObjectLinksCount > 0) {
							oObjectLinksTab.setNoDataText(this.i18nBundle.getText("XMSG_LOADING"));
						}
						else if (oModelData.ObjectLinksCount && oModelData.ObjectLinksCount == 0) {
							oObjectLinksTab.setNoDataText(this.i18nBundle.getText("view.ObjectLinks.noObjectLink"));
						}
					}
					break;
				default:
					break;
			}
		},

		fnClearCachedData: function() {
			// adding a dash as a placeholder improves user experience, because the brackets do not disappera when switching between tasks
			var countResetValue = this._getEmbedIntoDetailsNestedRouter() ? "-" : "";
			this.oModel2.setProperty("/AttachmentsCount", countResetValue);
			this.oModel2.setProperty("/CommentsCount", countResetValue);
			// this.oModel2.setProperty("/ProcessingLogsCount", "");
			this.oModel2.setProperty("/ObjectLinksCount", countResetValue);
			this.oModel2.setProperty("/ProcessingLogs", ""); // to fetch new data on every refresh for processing logs
			this.oModel2.setProperty("/Attachments", ""); // to fetch new attachments on every refresh
			this.oModel2.setProperty("/Comments", ""); // to fetch new comments on every refresh
			this.oModel2.setProperty("/ObjectLinks", ""); // clear data from the model on every task selection
			this.oModel2.setProperty("/StatusText", "");
			this.oModel2.setProperty("/WorkflowLogs", ""); // to fetch new data on every refresh for workflow logs
			this.oModel2.setProperty("/Description", "");
		},

		// Fetch data on select of comments, attachments or history tab. On select of these tabs, update the data.
		fnFetchDataOnTabSelect: function(sNavProperty) {

			var sPath = this.sCtxPath + "/" + sNavProperty;
			var oParameters = null;
			if (sNavProperty === "Attachments" || sNavProperty === "Comments") {
				oParameters = {
					$orderby: "CreatedAt desc"
				};
			}
			var oModelData = this.oModel2.getData();
			var bDataPresent = (oModelData[sNavProperty] && oModelData[sNavProperty].results) ? true : false;
			var oTabControl = this._getIconTabControl(sNavProperty);

			// success handler of read data request
			var fnSuccess = function(data) {
				// if data is already present in the model, merge the new response with existing data
				this.fnUpdateDataAfterFetchComplete(oModelData, bDataPresent, sNavProperty, data);
				this._setBusyIncdicatorOnDetailControls(oTabControl, false);
			};

			// error handler for read request
			var fnError = function(oError) {
				this._setBusyIncdicatorOnDetailControls(oTabControl, false);
				this.oDataManager.oDataRequestFailed(oError);
			};

			// show busy loader only if loading for the first time and count on tab is not 0
			if (!bDataPresent && oModelData[this.oMapCountProperty[sNavProperty]] > 0) {
				this._setBusyIncdicatorOnDetailControls(oTabControl, true);
			}

			// send the request to fetch data for selected tab
			if (!bDataPresent) {
				this.oDataManager.oDataRead(sPath, oParameters, fnSuccess.bind(this), fnError.bind(this));
			}
		},

		fnUpdateDataAfterFetchComplete: function(oModelData, bDataPresent, sNavProperty, data) {
			var bAllGone = false;
			if (bDataPresent && data.results.length > 0) {
				jQuery.extend(true, oModelData[sNavProperty], data);
			}
			else {
				bAllGone = oModelData[sNavProperty].results != null && oModelData[sNavProperty].results.length > 0 && data.results != null && data.results.length === 0;
				oModelData[sNavProperty] = data;
			}
			// update the count on comments tab
			oModelData[this.oMapCountProperty[sNavProperty]] = data.results.length;
			if (bAllGone) {
				this.fnHandleNoTextCreation(sNavProperty);
			}
			this._updateDetailModel(oModelData);
			if (this._getEmbedIntoDetailsNestedRouter()) {
				this.fnHandleAttachmentsCountText("Attachments");
			}
		},

		_getIconTabControl: function(sNavProperty) {
			switch (sNavProperty) {
				case "Comments":
					if (this.oGenericCommentsComponent) {
						return this.oGenericCommentsComponent.getAggregation("rootControl").byId("MIBCommentList");
					}
					return null;
				case "Attachments":
					return this._getUploadCollectionControl();
				case "ProcessingLogs":
					return this.getView().byId("timeline");
				case "WorkflowLogs":
					return this.getView().byId("timelineWorkflowLog");
				case "TaskObjects":
					return this._getObjectLinksList();
				default:
			}
		},

		fnFetchObjectLinks: function() {
			var iObjectLinkNumber = 0;
			var oTaskObjectsControl = this._getIconTabControl("TaskObjects");
			this._setBusyIncdicatorOnDetailControls(oTaskObjectsControl, true);

			var fnSuccess = function(data) {
				for (var i = 0; i < data.results.length; i++) {
					if (!data.results[i].Label) {
						iObjectLinkNumber = iObjectLinkNumber + 1;
						data.results[i].Label = this.i18nBundle.getText("object.link.label") + " " + iObjectLinkNumber;
					}
				}
				this._setBusyIncdicatorOnDetailControls(oTaskObjectsControl, false);
				this.oModel2.setProperty("/ObjectLinks", data);
				this.oModel2.setProperty("/ObjectLinksCount", data.results.length);
			};

			var fnError = function(oError) {
				this._setBusyIncdicatorOnDetailControls(oTaskObjectsControl, false);
			};

			this.oDataManager.oDataRead(this.sCtxPath + "/" + "TaskObjects", null, fnSuccess.bind(this), fnError.bind(this));
		},
		onSupportInfoOpenEvent: function(sChannelId, sEventId, oSupportInfoOpenEvent) {
			if (oSupportInfoOpenEvent.source === "MAIN") {
				//To support info
				var oCustomAttributeDefinition = null;
				var oItem = jQuery.extend(true, [], this.oModel2.getData());

				if (this.aTaskDefinitionData) {
					for (var i = 0; i < this.aTaskDefinitionData.length; i++) {
						if (oItem && (oItem.TaskDefinitionID === this.aTaskDefinitionData[i].TaskDefinitionID)) {
							if (this.aTaskDefinitionData[i].CustomAttributeDefinitionData.results) {
								oCustomAttributeDefinition = this.aTaskDefinitionData[i].CustomAttributeDefinitionData.results;
							}
						}
					}
				}

				SupportInfo.setTask(oItem, oCustomAttributeDefinition, this.getView().getModel());
			}
		},

		/*
			mandatory parameters: oAction, fnFunction
			optional parameters:  oListener - A Context object to call event handler with.
			if there are only two parameters provided, then first is oAction and second is considered as fnFunction.
			if there are three parameters given, then oAction, fnFunction, oListener is considered in that order.
		*/
		addAction: function(oAction,fnFunction) {
			var oListener;

			if (arguments.length < 2) {
				throw "Should have two arguments, Action object and listener function";
			}

			if (arguments.length === 3) {
				if (typeof arguments[1] === "function") {
					fnFunction  = arguments[1];
				}
				else {
					throw "Second argument is not a listener function";
				}

				if (typeof arguments[2] === "object") {
					oListener = arguments[2];
				}
			}

			if (!oAction) {
				throw "Provide Action object with action name, label and optionally type (Accept/Reject)";
			}

			if (!fnFunction) {
				throw "Provide listener function for the Action";
			}

			var bSuccess = false;
			if (this.oHeaderFooterOptions) {
				var iDisplayOrderPriorityTemp = 50;
				var iDisplayOrderPriorityValue = 0;
				var id = oAction.action;
				var btnText = oAction.label;
				var btnObject = {
					actionId:id,
					sBtnTxt: btnText,
					onBtnPressed: oListener ? fnFunction.bind(oListener) : fnFunction
				};
				if (oAction.type && (oAction.type.toUpperCase() === "ACCEPT" || oAction.type.toUpperCase() === "POSITIVE")) {
					btnObject.nature = "POSITIVE";
					iDisplayOrderPriorityValue = iDisplayOrderPriorityTemp;
					iDisplayOrderPriorityTemp++;
					if (oAction.iDisplayOrderPriority) {
						iDisplayOrderPriorityValue = oAction.iDisplayOrderPriority;
					}
					btnObject.iDisplayOrderPriority = iDisplayOrderPriorityValue;
				}
				else if (oAction.type && (oAction.type.toUpperCase() === "REJECT" || oAction.type.toUpperCase() === "NEGATIVE")) {
					btnObject.nature = "NEGATIVE";
					iDisplayOrderPriorityValue = 200 + iDisplayOrderPriorityTemp;
					iDisplayOrderPriorityTemp++;
					if (oAction.iDisplayOrderPriority) {
						iDisplayOrderPriorityValue = oAction.iDisplayOrderPriority;
					}
					btnObject.iDisplayOrderPriority = iDisplayOrderPriorityValue;
				}
				else {
					iDisplayOrderPriorityValue = 500 + iDisplayOrderPriorityTemp;
					iDisplayOrderPriorityTemp++;
					if (oAction.iDisplayOrderPriority) {
						iDisplayOrderPriorityValue = oAction.iDisplayOrderPriority;
					}
					btnObject.iDisplayOrderPriority = iDisplayOrderPriorityValue;
				}
				this.oHeaderFooterOptions.buttonList.push(btnObject);
				this.refreshHeaderFooterOptions();
				bSuccess = true;
			}
			return bSuccess;
		},

		removeAction: function(sAction) {
			var bSuccess = false;
			var btnList = [];
			var btnListLength;

			if (!sAction) {
				throw "Provide Action string to be removed";
			}

			if (this.oHeaderFooterOptions) {
				if (this.oHeaderFooterOptions.oPositiveAction && this.oHeaderFooterOptions.oPositiveAction.actionId === sAction) {
					this.oHeaderFooterOptions.oPositiveAction = null;
					this.refreshHeaderFooterOptions();
					bSuccess = true;
				}
				else if (this.oHeaderFooterOptions.oNegativeAction && this.oHeaderFooterOptions.oNegativeAction.actionId === sAction) {
					this.oHeaderFooterOptions.oNegativeAction = null;
					this.refreshHeaderFooterOptions();
					bSuccess = true;
				}
				else {
					btnList = this.oHeaderFooterOptions.buttonList;
					btnListLength = btnList.length;
					for (var i=0; i<btnListLength; i++) {
						if (sAction === btnList[i].actionId) {
							btnList.splice(i,1);
							this.oHeaderFooterOptions.buttonList = btnList;
							this.refreshHeaderFooterOptions();
							bSuccess = true;
							break;
						}
					}
				}
			}

			return bSuccess;
		},

		/** The disableAction function is used by the inboxAPI to make a button related to an item action inactive
		 * params {action} The actions which button will be disabled
		*/
		disableAction: function(sAction) {
			var bSuccess = false;
			var btnList = [];

			if (this.oHeaderFooterOptions) {
				if (this.oHeaderFooterOptions.oPositiveAction && this.oHeaderFooterOptions.oPositiveAction.actionId === sAction) {
					this.oHeaderFooterOptions.oPositiveAction.bDisabled=true;
					this.refreshHeaderFooterOptions();
					bSuccess = true;
				}
				else if (this.oHeaderFooterOptions.oNegativeAction && this.oHeaderFooterOptions.oNegativeAction.actionId === sAction) {
					this.oHeaderFooterOptions.oNegativeAction.bDisabled=true;
					this.refreshHeaderFooterOptions();
					bSuccess = true;
				}
				else {
					btnList = this.oHeaderFooterOptions.buttonList;
					for (var i=0; i<btnList.length; i++) {
						if (sAction && sAction === btnList[i].actionId) {
							btnList[i].bDisabled=true;
							this.oHeaderFooterOptions.buttonList = btnList;
							this.refreshHeaderFooterOptions();
							bSuccess = true;
							break;
						}
					}
				}
			}
			return bSuccess;
		},

		/** The disableAllActions function is used by the inboxAPI to make all buttons related to the item actions inactive
		*/
		disableAllActions: function() {

			var bSuccess = false;
			var btnList = [];

			if (this.oHeaderFooterOptions) {
				bSuccess = true;
				if (this.oHeaderFooterOptions.oPositiveAction && this.oHeaderFooterOptions.oPositiveAction.actionId) {
					this.oHeaderFooterOptions.oPositiveAction.bDisabled=true;
				}
				if (this.oHeaderFooterOptions.oNegativeAction && this.oHeaderFooterOptions.oNegativeAction.actionId) {
					this.oHeaderFooterOptions.oNegativeAction.bDisabled=true;
				}
				btnList = this.oHeaderFooterOptions.buttonList;
				if (btnList) {
					for (var i=0; i<btnList.length; i++) {
						if (btnList[i].actionId) {
							btnList[i].bDisabled=true;
						}
					}
					this.oHeaderFooterOptions.buttonList = btnList;
				}
				this.refreshHeaderFooterOptions();
			}
			return bSuccess;
		},

		/** The enableAction function is used by the inboxAPI to make a button related to an item action active
		 * params {action} The actions which button will be enabled
		*/
		enableAction: function(sAction) {

			var bSuccess = false;
			var btnList = [];

			if (this.oHeaderFooterOptions) {
				if (this.oHeaderFooterOptions.oPositiveAction && this.oHeaderFooterOptions.oPositiveAction.actionId === sAction) {
					this.oHeaderFooterOptions.oPositiveAction.bDisabled=false;
					this.refreshHeaderFooterOptions();
					bSuccess = true;
				}
				else if (this.oHeaderFooterOptions.oNegativeAction && this.oHeaderFooterOptions.oNegativeAction.actionId === sAction) {
					this.oHeaderFooterOptions.oNegativeAction.bDisabled=false;
					this.refreshHeaderFooterOptions();
					bSuccess = true;
				}
				else {
						btnList = this.oHeaderFooterOptions.buttonList;
						for (var i=0; i<btnList.length; i++) {
							if (sAction && sAction === btnList[i].actionId) {
								btnList[i].bDisabled=false;
								this.oHeaderFooterOptions.buttonList = btnList;
								this.refreshHeaderFooterOptions();
								bSuccess = true;
								break;
							}
						}
				}
			}
			return bSuccess;
		},

		/** The enableAllActions function is used by the inboxAPI to make all buttons related to the item actions active
		*/
		enableAllActions: function() {

			var bSuccess = false;
			var btnList = [];

			if (this.oHeaderFooterOptions) {
				bSuccess = true;
				if (this.oHeaderFooterOptions.oPositiveAction && this.oHeaderFooterOptions.oPositiveAction.actionId) {
					this.oHeaderFooterOptions.oPositiveAction.bDisabled=false;
				}
				if (this.oHeaderFooterOptions.oNegativeAction && this.oHeaderFooterOptions.oNegativeAction.actionId) {
					this.oHeaderFooterOptions.oNegativeAction.bDisabled=false;
				}
				btnList = this.oHeaderFooterOptions.buttonList;
				if (btnList) {
					for (var i=0; i<btnList.length; i++) {
						if (btnList[i].actionId) {
							btnList[i].bDisabled=false;
						}
					}
					this.oHeaderFooterOptions.buttonList = btnList;
				}
				this.refreshHeaderFooterOptions();
			}
			return bSuccess;
		},

		_createCustomAttributesElements: function(oDetailData, oCustomAttributeDefinition) {
			//getting parent element for dynamic child element creation
			var oCustomAttributesContainer = this.getView().byId("customAttributesContainer");
			var aCustomAttributeElements = this.aCA;

			for (var i = 0; i < oCustomAttributeDefinition.length; i++) { // iterate each custom attribute

				var sAttributeName = oCustomAttributeDefinition[i].Name;
				var sLabelType = oCustomAttributeDefinition[i].Type;
				var sDefinitionLabelName = oCustomAttributeDefinition[i].Label;
				var oCustomAttributeData;
				var bShowAttribute = true;

				// do not show the additional attributes if they are already being displayed in the header
				if ((sAttributeName.toLowerCase() === this.sCustomTaskTitleAttribute.toLowerCase() ||
						sAttributeName.toLowerCase() === this.sCustomNumberValueAttribute.toLowerCase() ||
						sAttributeName.toLowerCase() === this.sCustomNumberUnitValueAttribute.toLowerCase() ||
						sAttributeName.toLowerCase() === this.sCustomObjectAttributeValue.toLowerCase() ||
						sAttributeName.toLowerCase() === this.sCustomCreatedByAttribute.toLowerCase())) {
					bShowAttribute = false;
				}

				if (bShowAttribute) {
					if (sAttributeName && sLabelType && sDefinitionLabelName) {
						for (var j = 0; j < oDetailData.CustomAttributeData.length; j++) {
							if (this._getShowAdditionalAttributes() === true) {
								oCustomAttributeData = this.getView().getModel().getProperty("/" + oDetailData.CustomAttributeData[j]);
							}
							else {
								oCustomAttributeData = oDetailData.CustomAttributeData[j];
							}
							if (oCustomAttributeData.Name === sAttributeName) {
								var oNewFormElement = new FormElement("", {});
								oNewFormElement.setLayoutData(new ResponsiveFlowLayoutData("", {
									linebreak: true,
									margin: false
								}));
								var oLabel = new Label("", {
									text: sDefinitionLabelName
								});
								oLabel.setLayoutData(new ResponsiveFlowLayoutData("", {
									weight: 3,
									minWidth: 192
								}));
								oNewFormElement.setLabel(oLabel);
								var sValue = Conversions.fnCustomAttributeTypeFormatter(oCustomAttributeData.Value, sLabelType);
								var oText = new Text("", {
									text: sValue
								});
								oText.setLayoutData(new ResponsiveFlowLayoutData("", {
									weight: 5
								}));
								oNewFormElement.addField(oText);
								oCustomAttributesContainer.addFormElement(oNewFormElement);
								aCustomAttributeElements.push(oNewFormElement);
								break;
							}
						}
					}
				}

			}
			this.byId("DescriptionContent").rerender();
		},

		// create custom attributes contect if Custom Attribiute's definition as well as data is available and not empty
		_createCustomAttributesOnDataLoaded: function(oCustomAttributeDefinition) {
			if (this.aCA.length === 0 &&
				this.oModel2.getData().CustomAttributeData &&
				this.oModel2.getData().CustomAttributeData.length > 0 &&
				oCustomAttributeDefinition &&
				oCustomAttributeDefinition.length > 0
			) {
				var fnCreateCustomAttributesElements = this._createCustomAttributesElements.bind(this);
				fnCreateCustomAttributesElements(this.oModel2.getData(), oCustomAttributeDefinition);
			}
		},

		_getUploadCollectionControl: function() {
			var oUploadControl;
			if (this.isGenericComponentRendered && this.oAttachmentComponentView) {
				oUploadControl = this.oAttachmentComponentView.byId("uploadCollection");
			}
			else if (this.oGenericAttachmentComponent && !this.isGenericComponentRendered) {
				oUploadControl = this.oGenericAttachmentComponent.view.byId("uploadCollection");
			}
			return oUploadControl;
		},

		_setBusyIncdicatorOnDetailControls: function(oControl, bShowBusy) {
			if (oControl) {
				if (bShowBusy) {
					oControl.setBusyIndicatorDelay(1000);
				}
				oControl.setBusy(bShowBusy);
			}
		},

		_processCustomAttributesData: function(oItem) {
			if (oItem.CustomAttributeData && oItem.CustomAttributeData.__list) {
				oItem.CustomAttributeData = oItem.CustomAttributeData.__list;
			}
			var oDefinitionData = this.oDataManager.getCustomAttributeDefinitions()[oItem.TaskDefinitionID];
			if (oDefinitionData && oDefinitionData instanceof Array) {
				oItem.CustomAttributeDefinitionData = oDefinitionData;
			}
			return oItem;
		},

		_getShowAdditionalAttributes: function() {
			if (this.bShowAdditionalAttributes == null) {
				this.bShowAdditionalAttributes = this.oDataManager.getShowAdditionalAttributes();
			}
			return this.bShowAdditionalAttributes;
		},

		_getTaskTitleInHeader: function() {
			if (this.bTaskTitleInHeader == null) {
				this.bTaskTitleInHeader = this.oDataManager.getTaskTitleInHeader();
			}
			return this.bTaskTitleInHeader;
		},

		_getStandaloneDetailDeep: function() {
			if (this.bStandaloneDetailDeep == null) {
				this.bStandaloneDetailDeep = this.oDataManager.getStandaloneDetailDeep();
			}
			return this.bStandaloneDetailDeep;
		},

		//Calendar integration
		createCalendarEvent: function() {
			var that = this;
			//get deadline
			var oData = this.oModel2.getData();
			var oDeadLine = oData.CompletionDeadLine;
			if (oDeadLine) {
				//we would like to warn the user the day before the deadline occurs
				oDeadLine.setDate(oDeadLine.getDate() - 1); //this takes care of the changing of the months and years when decreasing from first day of the month
				var nYear = oDeadLine.getFullYear();
				var nMonth = oDeadLine.getMonth();
				var nDay = oDeadLine.getDate();
				var nHours = oDeadLine.getHours();
				var nMinutes = oDeadLine.getMinutes();
				var nSeconds = oDeadLine.getSeconds();

				//startDate - the day before the given date
				var startDate = new Date(nYear, nMonth, nDay, nHours, nMinutes, nSeconds);

				//endDate - 60 minutes later
				var endDate = new Date(nYear, nMonth, nDay, nHours, nMinutes + 60, nSeconds);

				var title = oData.TaskTitle;

				//link that navigates back to the fiori application - uses default browser
				var notes = this.getMailBody();
				var createSuccess = function(message) {
					MessageToast.show(that.i18nBundle.getText("dialog.success.mq.calendarEventCreated")); //new i18n item in the _en version
				};
				var createError = function(message) {
					var sErrorText = that.i18nBundle.getText("dialog.error.mq.calendarPluginError");
					MessageBox.error(sErrorText,
						{ details: CommonFunctions.fnRemoveHtmlTags(message) });
				};

				//if there is already an event with this information, don't create another one.
				var findSuccess = function(message) {
					if (typeof (message) === "string" || message.length === 0) { // message = "No matching event exists" instead of an object when it did not find an event with the information provided on windows 8
						//create a new event with the obtained information
						window.plugins.calendar.createEvent(title, null, notes, startDate, endDate, createSuccess, createError);
					}
					else { //don't create an event because there is already an event with this info.
						MessageToast.show(that.i18nBundle.getText("dialog.error.mq.calendarThereIsAnEventAlready")); //new i18n item in the _en version
					}
				};
				var findError = function(message) { //on Android and iOS, this part will be invoked if there are no events by the information provided
					//create a new event with the obtained information
					window.plugins.calendar.createEvent(title, null, notes, startDate, endDate, createSuccess, createError);
				};

				//check if there is an event in the calendar with the provided information and create if not
				window.plugins.calendar.findEvent(title, null, null, startDate, endDate, findSuccess, findError);

				//set the day back to normal. Remember, that we decreased the date by one day, because this is a reminder of the event. now we have to inscrease the date back to normal, to fix it.
				oDeadLine.setDate(oDeadLine.getDate() + 1);
			}
		},

		_getActionHelper: function() {
			if (!this._oActionHelper) {
				this._oActionHelper = new ActionHelper(this, this.getView());
			}
			return this._oActionHelper;
		},

		/**
		 * Displays the empty detail view with header and info text.
		 *
		 * @param {string} sViewTitle key of the empty detail view's title.
		 * @param {string} sLanguageKey key for the empty page text.
		 * @param {string} [sInfoText=undefined] Instead of passing <code>sLanguageKey</code>, the text can directly be passed.
		 */
		showEmptyView : function (sViewTitle, sLanguageKey, sInfoText) {
			this.getOwnerComponent().oDataManager.oEventBus.publish("cross.fnd.fiori.inbox","clearSelection");

			XMLView.create({
				viewName: "cross.fnd.fiori.inbox.view.Empty"
			})
			.then(function(oEmptyView) {
				var oAppImp = cross.fnd.fiori.inbox.util.tools.Application.getImpl();

				if (!sViewTitle) {
					sViewTitle = oAppImp.oConfiguration.getDetailTitleKey();
				}
				if (!sInfoText && !sLanguageKey) {
					sLanguageKey = oAppImp.oConfiguration.getDefaultEmptyMessageKey();
				}

				oEmptyView.getController().setTitleAndMessage(sViewTitle, sLanguageKey, sInfoText);

				var oDataManager = this.oDataManager;
				if (!oDataManager) oDataManager = this.getOwnerComponent().getDataManager();

				if (oDataManager.tableView) {
					var navContainer = this.getView().getParent().getParent().byId("fioriContent");
					navContainer.addPage(oEmptyView);
					navContainer.to(oEmptyView.getId(), "show");
				}
				else {
					var splitContainer = this.getView().getParent().getParent();
					splitContainer.addDetailPage(oEmptyView);
					splitContainer.to(oEmptyView.getId(), "show");
				}
			}.bind(this))
			.catch(function() {
				Log.error("Empty view was not created successfully");
			});
		},
		
		_getEmbedIntoDetailsNestedRouter : function () {
			return this.embedFioriElements;
		},
		
		showHideSideContent : function () {
			//Show or hide log based on TaskSupports flags and whether task was navigated from Workflow Log
			var oItem = this.oModel2.getData();
			if (this.bNavToFullScreenFromLog) {
				//Hide side content
				this.setShowSideContent(false);
				this.bShowLogs = false;
				this.bShowDetails = false;
			}
			else if ((oItem.TaskSupports.ProcessingLogs || oItem.TaskSupports.WorkflowLog)
					&& this.oDataManager.getShowLogEnabled() && this.bShowLogs) {
				//Show side content and log data
				this.createLogs();
				this.setShowSideContent(true);
			}
			else if ((oItem.TaskSupports.Attachments || oItem.TaskSupports.TaskObject || oItem.TaskSupports.Comments)
					&& this.bShowDetails && this._getEmbedIntoDetailsNestedRouter()) {
				//Show side content and details data
				this.fnCreateSelectedTab(this.byId("tabBarDetails").getSelectedKey());
				this.setShowSideContent(true);
			}
			else {
				//Hide side content
				this.setShowSideContent(false);
			}
			this.setShowMainContent();
		},

		// the ObjectLinks List control from thew ObjectLinks.fragment used to have a static ID, 
		// but since it is reused in the Details pane, the ID is not hardcoded anymore and thus this function was added
		_getObjectLinksList : function () {
			var oObjectLinksTabFilter = this.byId("MIBObjectLinksTabFilter");
			if (oObjectLinksTabFilter
				&& oObjectLinksTabFilter.getVisible()
				&& oObjectLinksTabFilter.getContent()
				&& Array.isArray(oObjectLinksTabFilter.getContent())
				&& (oObjectLinksTabFilter.getContent().length > 0)) {
					var oObjectLinksList = oObjectLinksTabFilter.getContent()[0];
					if (oObjectLinksList
						&& oObjectLinksList.getMetadata()
						&& (oObjectLinksList.getMetadata().getName() === "sap.m.List")) {
						return oObjectLinksList;
					}
			}
			return undefined;
		},

		// check if the current task supports any of Comments, Attachments or TaskObject
		taskSupportsCommAttRelObj : function (oItem) {
			var taskSupports;
			if (oItem) {
				taskSupports = oItem.TaskSupports;
			}
			else if (this.oModel2 && this.oModel2.getData()) {
				taskSupports = this.oModel2.getData().TaskSupports;
			}
			else {
				return false;
			}
			return taskSupports.Comments || taskSupports.Attachments || taskSupports.TaskObject;
		}
	});
});
