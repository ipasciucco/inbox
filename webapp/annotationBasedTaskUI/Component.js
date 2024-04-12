/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.require("cross.fnd.fiori.inbox.annotationBasedTaskUI.util.sapUshellUtil");

sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/core/BusyIndicator",
	"sap/ui/core/mvc/ViewType",
	"sap/m/MessageBox",
	"sap/ui/model/odata/v2/ODataModel",
	"sap/ui/model/odata/CountMode",
	"sap/ui/model/BindingMode",
	"cross/fnd/fiori/inbox/annotationBasedTaskUI/util/util",
	"cross/fnd/fiori/inbox/annotationBasedTaskUI/util/GUILinkParser",
	"cross/fnd/fiori/inbox/annotationBasedTaskUI/view/DecisionDialogManager",
	"cross/fnd/fiori/inbox/annotationBasedTaskUI/util/i18n"
], function(
	UIComponent,
	BusyIndicator,
	ViewType,
	MessageBox,
	ODataModel,
	CountMode,
	BindingMode,
	TaskUIUtil,
	GUILinkParser,
	DecisionDialogManager,
	i18n
) {
	"use strict";

	return UIComponent.extend("cross.fnd.fiori.inbox.annotationBasedTaskUI.Component", {

		metadata: {
			manifest: "json",
			properties: {
				"oParameters": "any",
				"isCacheable": {
					"name": "isCacheable",
					"type": "boolean",
					"defaultValue": false
				}
			},
			publicMethods: ["updateBinding"]
		},

		init: function() {
			this.setIsCacheable(true);
			this.oCachedTemplateView = null;
			this.bCreatingOrUpdatingContent = false;
			this.oPendingUpdateBinding = null;

			// Note: createContent() is called at some point during UIComponent.prototype.init()
			UIComponent.prototype.init.apply(this, arguments);
		},

		exit: function() {
			// Nothing to do here
		},

		// Called every time a task with a new taskDefinitionId is opened.
		// If the same or another task with the same taskDefinitionId was already opened,
		// then updateBinding is called instead
		createContent: function() {
			jQuery.sap.log.debug("[AnnotationBasedTaskUI] createContent for " + this.getId() + " started");
			BusyIndicator.show();
			this.bCreatingOrUpdatingContent = true;

			var oServiceInfo = this._parseComponentData(this.getComponentData());

			// The view container is returned to the caller and will be cached. It contains our created view.
			this.oViewContainer = sap.ui.view(this.createId("appView"), {
				type: ViewType.XML,
				viewName: "cross.fnd.fiori.inbox.annotationBasedTaskUI.view.App"
			});

			// Create model returns a promise in order to wait until the corresponding meta model is loaded.
			// The oModels parameter then contains the businessModel and businessMetaModel
			this._createModel(oServiceInfo).then(function(oModels) {

				// Creation of the template view only requires the meta model
				var sBindingPath = oServiceInfo.getBindingPath();
				var oTemplateView = sap.ui.view(this.createId("templateView"), {
					preprocessors: {
						xml: {
							bindingContexts: {
								meta: this._decodeJSON(oModels,sBindingPath)
							},
							models: {
								meta: oModels.businessMetaModel
							}
						}
					},
					type: ViewType.XML,
					viewName: "cross.fnd.fiori.inbox.annotationBasedTaskUI.view.TaskUI_S3",
					viewData: {
						component: this
					}
				});

				// Bind the model and tcm model to the view
				oTemplateView.setModel(oModels.businessModel);
				oTemplateView.setModel(oServiceInfo.getTcmModel(), "detail");

				var i18nModel = i18n.getResourceModel();
				oTemplateView.setModel(i18nModel, "annoI18n");
				// sBindingPath = "/C_PurRequisitionItemFs(PurchaseRequisition='1010998084',PurchaseRequisitionItem='00010')";
				oTemplateView.bindElement(sBindingPath, oServiceInfo.getBindingParameters());

				// Attach the created view to the view container and cache both view and service url
				// The service url might be different in the next updateBinding call due to different matrix parameters
				this.oViewContainer.byId("rootControl").addPage(oTemplateView);
				this.oCachedTemplateView = oTemplateView;
				this.sCachedServiceUrl = oServiceInfo.getServiceUrl();

				// Create DecisionDialog manager that replaces the footer buttons with custom actions
				this.oDecisionDialogManager = new DecisionDialogManager(oTemplateView);
				this.oDecisionDialogManager.setModels(oModels, oServiceInfo.getErrorSuppressionInfo());
				this._updateDecisionDialog(oServiceInfo);

				// Apply a pending updateBinding call if there is one. This will then also clear the busy indicator
				jQuery.sap.log.debug("[AnnotationBasedTaskUI] createContent for " + this.getId() + " finished");
				this.bCreatingOrUpdatingContent = false;
				if (this.oPendingUpdateBinding) {
					var oPendingComponentData = this.oPendingUpdateBinding;
					this.oPendingUpdateBinding = null;
					this.updateBinding(oPendingComponentData);
				} else {
					BusyIndicator.hide();
				}
				//Only for demo purpose
				if(sap.ui.getCore().byId("__text46") && sap.ui.getCore().byId("__text46").getText() === "DistribuciÃ³n")
					sap.ui.getCore().byId("__text46").setText("Distribución");
			}.bind(this));

			return this.oViewContainer;
		},

		// This is called whenever a task is opened that has a taskDefinitionId that was already seen before
		// In this case we expect to be able to re-use the existing template view and just update the data binding
		updateBinding: function(oUpdatedComponentData) {
			// In some cases updateBinding might be called before createContent has completed (due to the async
			// wait until the metadata is loaded). In this case we keep the update binding call pending and it will
			// be resolved when the template creation finishes
			if (this.bCreatingOrUpdatingContent) {
				jQuery.sap.log.debug("[AnnotationBasedTaskUI] updateBinding for " + this.getId() +
					" is pending because another createContent/updateBinding is still in progress");
				this.oPendingUpdateBinding = oUpdatedComponentData;
				return;
			}

			jQuery.sap.log.debug("[AnnotationBasedTaskUI] updateBinding for " + this.getId() + " started");
			BusyIndicator.show();
			this.bCreatingOrUpdatingContent = true;

			// Since SAPUI5 offers no setComponentData method we need to clear and then update it the hard way
			var oComponentData = this.getComponentData();
			TaskUIUtil.cleanObject(oComponentData);
			jQuery.extend(oComponentData, oUpdatedComponentData);

			var oServiceInfo = this._parseComponentData(jQuery.extend({}, oComponentData));

			// Retrieve the cached view and update the tcm model
			var oTemplateView = this.oCachedTemplateView;
			oTemplateView.setModel(oServiceInfo.getTcmModel(), "detail");

			var fnUpdateBinding = function() {
				var bUnchangedBinding = oTemplateView.getElementBinding().getPath() === oServiceInfo.getBindingPath();
				oTemplateView.bindElement(oServiceInfo.getBindingPath(), oServiceInfo.getBindingParameters());
				if (bUnchangedBinding) {
					// If the binding path is unchanged it seems that the model does not automatically refresh
					// even if we call bindElement again, so we force a refresh here
					oTemplateView.getModel().refresh();
				}

				// In case the cached view is still on a sub page, go back to the main page without moving around on screen
				var oRootControl = this.oViewContainer.byId("rootControl");
				oRootControl.to(oTemplateView, "show");
				oRootControl.setInitialPage(oTemplateView);

				// Reset InfoTabs to the first one in case a different one was selected
				var oTabBar = oTemplateView.byId("tabBar");
				var oContentInfoTab = oTabBar ? oTabBar.getItems()[0] : null;
				if (oContentInfoTab) {
					oTabBar.setSelectedItem(oContentInfoTab);
				}

				this._updateDecisionDialog(oServiceInfo);

				// Apply a pending updateBinding if there is one. This will then also hide the busy indicator
				jQuery.sap.log.debug("[AnnotationBasedTaskUI] updateBinding for " + this.getId() + " finished");
				this.bCreatingOrUpdatingContent = false;
				if (this.oPendingUpdateBinding) {
					var oPendingComponentData = this.oPendingUpdateBinding;
					this.oPendingUpdateBinding = null;
					this.updateBinding(oPendingComponentData);
				} else {
					BusyIndicator.hide();
				}
			}.bind(this);

			// If the service url is different than it was for the cached view (supposedly due to different matrix parameters)
			// then we need to create a new model with the updated url. SAPUI5 currently does not allow us to change
			// the service url of an already created ODataModel via documented(!) functions
			var sNewServiceUrl = oServiceInfo.getServiceUrl();
			if (sNewServiceUrl !== this.sCachedServiceUrl) {
				this._createModel(oServiceInfo).then(function(oModels) {

					this.sCachedServiceUrl = sNewServiceUrl;
					oTemplateView.setModel(oModels.businessModel);
					this.oDecisionDialogManager.setModels(oModels, oServiceInfo.getErrorSuppressionInfo());
					fnUpdateBinding();

				}.bind(this));
			} else {
				fnUpdateBinding();
			}
		},

		// Parses the component data and returns an object that offers access to the parsed data.
		// See return value for details of the available functions
		_parseComponentData: function(oComponentData) {
			var oParameters = oComponentData.startupParameters.oParameters,
				sServiceUrlWithBindingPath = oParameters.sServiceUrl,
				sAnnotationUrl = oParameters.sAnnoFileURI || undefined,
				sErrorMessageNoData = oParameters.sErrorMessageNoData,
				oQueryParameters = oParameters.oQueryParameters,
				oTcmModel = oComponentData.inboxHandle.attachmentHandle.detailModel,
				sBindingPath = "",
				sServiceUrl = "",
				sBindingParameters = {};

			if (sServiceUrlWithBindingPath) {
				// Extract relevant OData paths
				sBindingPath = TaskUIUtil.getBindingPath(sServiceUrlWithBindingPath);
				sServiceUrl = TaskUIUtil.getServiceUrl(sServiceUrlWithBindingPath);
			} else {
				// If sServiceUrlWithBindingPath (= data parameter) contains nothing, try the service+entity parameters instead
				if (oQueryParameters && oQueryParameters.entity && oQueryParameters.service) {
					// Note: sBindingPath needs to start with a slash but we don't enforce this here
					sBindingPath = oQueryParameters.entity[0];
					sServiceUrl = oQueryParameters.service[0];
					var sExpand = oQueryParameters.expand && oQueryParameters.expand[0];
					if (sExpand) {
						sBindingParameters = { expand: sExpand };
					}
				} else {
					jQuery.sap.log.error("OData service URL was not specified in GUI Link");
				}
			}

			// Replacement of task instance id placeholder
			var sTaskInstanceId = oTcmModel.getProperty("/InstanceID");
			sBindingPath = sBindingPath.replace("[[taskInstanceId]]", sTaskInstanceId);
			sServiceUrl = sServiceUrl.replace("[[taskInstanceId]]", sTaskInstanceId);

			// The error suppression info object is supposed to be passed to parties that handle OData errors
			// and want to suppress the default error handler. Currently this is only the Decision Dialog
			var oErrorSuppressionInfo = {
				bHandleErrors: true
			};
			var fnODataErrorHandler = function(sErrorMessage /*, oError*/ ) {
				if (oErrorSuppressionInfo.bHandleErrors) {
					BusyIndicator.hide();
					MessageBox.error(sErrorMessage);
				}
			};

			// Get GUI link from task entity with fallback to UIExecutionLink entity (via navigation property).
			// The latter should have been loaded by MyInbox if the former does not exist
			var sGUILink = oTcmModel.getProperty("/GUI_Link");
			if (!sGUILink) {
				sGUILink = oTcmModel.getProperty("/UIExecutionLink/GUI_Link");
			}

			// Instantiate GUI link parser here to avoid creating multiple instances
			var oGUILinkParser = new GUILinkParser(sGUILink);

			return {
				getBindingPath: function() {
					return sBindingPath;
				},
				getBindingParameters: function() {
					return sBindingParameters;
				},
				getServiceUrl: function() {
					return sServiceUrl;
				},
				getAnnotationUrl: function() {
					return sAnnotationUrl;
				},
				getTcmModel: function() {
					return oTcmModel;
				},
				getODataErrorHandler: function() {
					return fnODataErrorHandler.bind(undefined, sErrorMessageNoData);
				},
				getErrorSuppressionInfo: function() {
					return oErrorSuppressionInfo;
				},
				getGUILinkParser: function() {
					return oGUILinkParser;
				},
				getInboxHandle: function() {
					return oComponentData.inboxHandle;
				}
			};
		},

		// Creates a new ODataModel based on the service and annotations urls from the specified service info.
		// Returns a promise that is fulfilled when the corresponding metadata has been loaded
		_createModel: function(oServiceInfo) {
			// Add language parameter to service and annotation url
			var sLanguageCode = sap.ui.getCore().getConfiguration().getSAPLogonLanguage();
			var sAnnoUrl = TaskUIUtil.appendUrlParameter(oServiceInfo.getAnnotationUrl(), "sap-language", sLanguageCode);
			sAnnoUrl = sap.ui.getCore().getModel("controllerModel").getProperty("/controller").getOwnerComponent().getManifestObject().resolveUri(sAnnoUrl.substr(1, sAnnoUrl.length));
			var oServiceURL = oServiceInfo.getServiceUrl();
			oServiceURL = sap.ui.getCore().getModel("controllerModel").getProperty("/controller").getOwnerComponent().getManifestObject().resolveUri("") + oServiceURL.substr(1, oServiceURL.length);

			// var oModel = new ODataModel(oServiceInfo.getServiceUrl(), {
			var oModel = new ODataModel(oServiceURL, {
				annotationURI: sAnnoUrl,
				json: true,
				defaultCountMode: CountMode.Inline,
				useBatch: true,
				loadAnnotationsJoined: true,
				metadataUrlParams: {
					"sap-language": sLanguageCode
				}
			});
			// Two-Way-binding is required for the DecisionDialog
			oModel.setDefaultBindingMode(BindingMode.TwoWay);

			// Immediately register the default error handler, before attempting to load the metadata
			var fnErrorHandler = oServiceInfo.getODataErrorHandler();
			oModel.attachMetadataFailed(fnErrorHandler);
			oModel.attachBatchRequestFailed(fnErrorHandler);
			oModel.attachAnnotationsFailed(fnErrorHandler);

			// Wrap the ODataMetaModel.loaded() promise into a new promise that passes on both model and meta model
			var oMetaModel = oModel.getMetaModel();
			return new Promise(function(resolve /*, reject*/ ) {
				oMetaModel.loaded().then(function() {
					resolve({
						businessModel: oModel,
						businessMetaModel: oMetaModel
					});
				});
			});
		},

		// Updates the decision dialog manager either after createContent or updateBinding.
		// Then replaces the footer bar with buttons generated by the decision dialog manager.
		_updateDecisionDialog: function(oServiceInfo) {
			var inboxDetailView = oServiceInfo.getInboxHandle().inboxDetailView;
			var oTcmModel = oServiceInfo.getTcmModel();

			// The decision dialog needs access to the GUI link to parse the decision actions
			// and to the task instance id in order to pass it to the function import on submission
			var oGUILinkParser = oServiceInfo.getGUILinkParser();
			var sTaskInstanceId = oTcmModel.getProperty("/InstanceID");
			this.oDecisionDialogManager.setTaskInstanceId(sTaskInstanceId);
			this.oDecisionDialogManager.setSubmissionCallback(this._refreshTaskList.bind(this, oServiceInfo));

			// The primary key(s) of the S3's main entity is used to locate the button entity
			// e.g. /DecisionEntity('keyvalue')/xyz => 'keyvalue'
			var sEntityKey = oServiceInfo.getBindingPath().match(/\(([^)]+)\)/)[1];

			// Modify the footer buttons provided by myInbox based on the decision actions annotations from the GUI link
			var oOptions = this.oDecisionDialogManager.modifyFooterButtons(
				inboxDetailView.oHeaderFooterOptions,
				oGUILinkParser,
				sEntityKey
			);

			// TODO Prototype: code below copied from detail S4 view handling, could be refactored into a common place, or use MyInbox API when available
			// Since setHeaderFooterOptions method does not update oHeaderFooterOptions and
			// getHeaderFooterOptions method always returns null, we need manually set and get oHeaderFooterOptions
			inboxDetailView.oHeaderFooterOptions = oOptions;
			// Actually set the header/footer for displaying, but does not update oHeaderFooterOptions object
			inboxDetailView.setHeaderFooterOptions(oOptions);
			inboxDetailView.refreshHeaderFooterOptions();
		},

		// Registered as a submission callback in the decision dialog manager.
		// It refreshes the task list under the assumption that the successful submission changed the task status.
		_refreshTaskList: function(oServiceInfo) {
			var oTcmModel = oServiceInfo.getTcmModel();
			var oDataManager = oServiceInfo.getInboxHandle().inboxDetailView.oDataManager;
			var sSapOrigin = oTcmModel.getProperty("/SAP__Origin");
			var sTaskInstanceID = oTcmModel.getProperty("/InstanceID");
			oDataManager.fnUpdateSingleTask(sSapOrigin, sTaskInstanceID);
		},

		//Only for demo purpose.
		_decodeJSON: function(oModels, sBindingPath) {
			const metadata = oModels.businessMetaModel.getMetaContext(sBindingPath);
			const namespace = metadata.oModel.oModel.oData.dataServices.schema[0].namespace;
		
			if (namespace === "C_PURREQUISITIONITEM_FS_SRV") {
				this._decodeEntity(metadata.oModel.oModel.oData.dataServices.schema[0].entityType[4]);
				this._decodeEntity(metadata.oModel.oModel.oData.dataServices.schema[0].entityType[2]);
			}
		
			if (namespace === "C_PURCHASEORDER_FS_SRV") {
				this._decodeEntity(metadata.oModel.oModel.oData.dataServices.schema[0].entityType[7]);
				this._decodeEntity(metadata.oModel.oModel.oData.dataServices.schema[0].entityType[11]);
				this._decodeEntity(metadata.oModel.oModel.oData.dataServices.schema[0].entityType[14]);
			}
		
			return metadata;
		},
		
		_decodeEntity: function(entity) {
			entity["com.sap.vocabularies.UI.v1.Facets"].forEach(field => {
				if ("Label" in field) field.Label.String = this._decodeString(field.Label.String);
				if ("Facets" in field) field.Facets.forEach(facet => {
					if (facet.Label) facet.Label.String = this._decodeString(facet.Label.String);
				});
			});
		
			entity.property.forEach(property => {
				if (property["com.sap.vocabularies.Common.v1.Label"])
					property["com.sap.vocabularies.Common.v1.Label"].String = this._decodeString(property["com.sap.vocabularies.Common.v1.Label"].String);
				if (property["com.sap.vocabularies.Common.v1.QuickInfo"])
					property["com.sap.vocabularies.Common.v1.QuickInfo"].String = this._decodeString(property["com.sap.vocabularies.Common.v1.QuickInfo"].String);
			});
		},
		
		_decodeString: function(str) {
			return decodeURIComponent(escape(decodeURIComponent(str)));
		}
	});

}, true);