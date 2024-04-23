/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/thirdparty/jquery",
	"cross/fnd/fiori/inbox/util/Substitution",
	"cross/fnd/fiori/inbox/util/DataManager",
	"cross/fnd/fiori/inbox/controller/BaseController",
	"cross/fnd/fiori/inbox/util/MultiSelect",
	"cross/fnd/fiori/inbox/util/Forward",
	"cross/fnd/fiori/inbox/util/ForwardSimple",
	"cross/fnd/fiori/inbox/util/SupportInfo",
	"cross/fnd/fiori/inbox/util/Resubmit",
	"cross/fnd/fiori/inbox/util/TaskStatusFilterProvider",
	"cross/fnd/fiori/inbox/util/InboxFilterContributor",
	"cross/fnd/fiori/inbox/util/OutboxFilterContributor",
	"cross/fnd/fiori/inbox/util/ConfirmationDialogManager",
	"cross/fnd/fiori/inbox/util/ODataExtension",
	"cross/fnd/fiori/inbox/util/CommonFunctions",
	"cross/fnd/fiori/inbox/util/oDataReadExtension",
	"cross/fnd/fiori/inbox/util/Conversions",
	"cross/fnd/fiori/inbox/util/tools/Application",
	"cross/fnd/fiori/inbox/util/tools/CommonHeaderFooterHelper",
	"cross/fnd/fiori/inbox/util/Utils",
	"sap/base/Log",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Sorter",
	"sap/ui/model/Context",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/Device",
	"sap/ui/layout/VerticalLayout",
	"sap/ui/model/odata/OperationMode",
	"sap/ui/model/odata/CountMode",
	"sap/ui/core/CustomData",
	"sap/ui/core/Fragment",
	"sap/ui/core/format/DateFormat",
	"sap/m/ObjectListItem",
	"sap/m/ViewSettingsFilterItem",
	"sap/m/library",
	"sap/m/ViewSettingsItem",
	"sap/m/ViewSettingsCustomItem",
	"sap/m/List",
	"sap/m/StandardListItem",
	"sap/m/ViewSettingsDialog",
	"sap/m/Toolbar",
	"sap/m/Label",
	"sap/m/CheckBox",
	"sap/m/GroupHeaderListItem",
	"sap/m/MessageToast"
], function (jQuery, Substitution, DataManager, BaseController, MultiSelect, Forward, ForwardSimple, SupportInfo,
	Resubmit, TaskStatusFilterProvider, InboxFilterContributor,
	OutboxFilterContributor, ConfirmationDialogManager, ODataExtension,
	CommonFunctions, oDataReadExtension, Conversions, Application, CommonHeaderFooterHelper, Utils, Log, JSONModel, Sorter, Context, Filter, FilterOperator,
	Device, VerticalLayout, OperationMode, CountMode, CustomData, Fragment, DateFormat, ObjectListItem,
	ViewSettingsFilterItem, library, ViewSettingsItem, ViewSettingsCustomItem,
	List, StandardListItem, ViewSettingsDialog, Toolbar, Label, CheckBox,
	GroupHeaderListItem, MessageToast
) {
	"use strict";

	var ButtonType = library.ButtonType;
	var ListMode = library.ListMode;
	var ToolbarDesign = library.ToolbarDesign;

	return BaseController.extend("cross.fnd.fiori.inbox.view.S2", {

		//	Controller Hook method definitions

		//	This hook method can be used to modify the list of properties
		//	that are used for filtering of the S2 list items.
		//	It is called when the application starts and the S2 list screen is displayed.
		extHookChangeFilterItems: null,

		//  This hook method can be used to modify the list of properties
		//  that are used for sorting the S2 list items.
		//  It is called when the application starts and the S2 list screen is displayed.
		extHookChangeSortConfig: null,

		//  This hook method can be used to modify the list of properties
		//  that are used for grouping the S2 list items.
		//  It is called when the application starts and the S2 list screen is displayed.
		extHookChangeGroupConfig: null,

		//	This hook method can be used to replace the standard filter by a custom one based on the filterKey
		//	It is called when a filter option is selected on the UI.
		extHookGetCustomFilter: null,

		//	This hook method can be used to add and change buttons for the list view footer in mass approval mode
		//	It is called before the list of buttons are created in the footer
		extHookChangeMassApprovalButtons: null,

		//	This hook method can be used to add additional properties to the subset of the Properties of the workitem
		//	that the response from the OData service should return
		//	It is called before the bindAggrigation "Items" of the master list
		extHookGetPropertiesToSelect: null,

		//Filter constants
		_FILTER_CATEGORY_PRIORITY: "Priority",
		_FILTER_PRIORITY_VERY_HIGH: "VERY_HIGH",
		_FILTER_PRIORITY_HIGH: "HIGH",
		_FILTER_PRIORITY_MEDIUM: "MEDIUM",
		_FILTER_PRIORITY_LOW: "LOW",

		_FILTER_CATEGORY_COMPLETION_DEADLINE: "CompletionDeadLine",
		_FILTER_EXPIRY_DATE_OVERDUE: "Overdue",
		_FILTER_EXPIRY_DATE_DUE_IN_7_DAYS: "DueIn7days",
		_FILTER_EXPIRY_DATE_DUE_IN_30_DAYS: "DueIn30days",
		_FILTER_EXPIRY_DATE_ALL: "All",

		_FILTER_CATEGORY_STATUS: "Status",
		_FILTER_CATEGORY_CREATION_DATE: "CreatedOn",
		_FILTER_CATEGORY_COMPLETED: "Completed",
		_FILTER_CATEGORY_SNOOZED: "ResumeIn",

		_FILTER_CATEGORY_TASK_DEFINITION_ID: "TaskDefinitionID",
		_FILTER_CATEGORY_SUBSTITUTED_USER: "SubstitutedUser",

		_SORT_CREATEDON: "CreatedOn",
		_SORT_CREATEDONREVERSE: "CreatedOnReverse",
		_SORT_CREATEDBYNAME: "CreatedByName",
		_SORT_PRIORITY: "Priority",
		_SORT_PRIORITY_NUMBER: "PriorityNumber",
		_SORT_TASKTITLE: "TaskTitle",
		_SORT_COMPLETIONDEADLINE: "CompletionDeadLine",
		_SORT_COMPLETEDON: "CompletedOn",
		_SORT_SAPORIGIN: "SAP__Origin",
		_SORT_INSTANCEID: "InstanceID",
		_SORT_TASKDEFINITIONID: "TaskDefinitionID",
		_SORT_TASKDEFINITIONNAME: "TaskDefinitionName",
		_SORT_STATUS: "Status",
		_SORT_CREATEDBY: "CreatedBy",
		_SORT_PROCESSOR: "Processor",
		_SORT_STARTDEADLINE: "StartDeadLine",
		_SORT_EXPIRYDATE: "ExpiryDate",
		_SORT_ISESCALATED: "IsEscalated",
		_SORT_HASCOMMENTS: "HasComments",
		_SORT_HASATTACHMENTS: "HasAttachments",
		_SORT_HASPOTENTIALOWNERS: "HasPotentialOwners",
		_SORT_CONTEXTSERVICEURL: "ContextServiceURL",

		_CUSTOM_NUMBER_LABEL: "CustomNumberLabel",
		_CUSTOM_NUMBER_VALUE: "CustomNumberValue",
		_CUSTOM_NUMBER_UNIT_LABEL: "CustomNumberUnitLabel",
		_CUSTOM_NUMBER_UNIT_VALUE: "CustomNumberUnitValue",
		_CUSTOM_OBJECT_ATTRIBUTE_LABEL: "CustomObjectAttributeLabel",
		_CUSTOM_OBJECT_ATTRIBUTE_VALUE: "CustomObjectAttributeValue",

		_GUI_LINK_SELECT_PROPERTY: "GUI_Link",

		_FUNCTION_IMPORT_DECISION: "Decision",

		_GROUP_SUPPORTSRELEASE: "SupportsRelease",
		// Grouped by status ordering (ascending) and i18n keys for group headers: (FIXME)
		_GROUP_STATUS_ORDER: [{
			Status: "READY",
			TextKey: "group.status.ready"
		}, {
			Status: "IN_PROGRESS",
			TextKey: "group.status.in_progress"
		}, {
			Status: "RESERVED",
			TextKey: "group.status.reserved"
		}, {
			Status: "EXECUTED",
			TextKey: "group.status.executed"
		}, {
			Status: "FOR_RESUBMISSION",
			TextKey: "group.status.suspended"
		}, {
			Status: "COMPLETED",
			TextKey: "group.status.completed"
		}],

		//	_PRIO_MAPPING: {
		//		"VERY_HIGH": 0,
		//		"HIGH": 1,
		//		"MEDIUM": 2,
		//		"LOW": 3
		//	},
		//	_PRIO_UNKNOWN: 100,

		aItemContextPathsToSelect: [],

		complexFilter: {
			Priority: [],
			CompletionDeadLine: [],
			TaskDefinitionID: [],
			SubstitutedUser: [],
			Status: [],
			CreatedOn: [],
			CustomNumberValue: [],
			CustomNumberUnitValue: [],
			CustomObjectAttributeValue: []

		},
		sSearchPattern_Support: "",
		sFilterKey_Support: "",
		sSortKey_Support: "",
		sGroupkey_Support: "",
		oConfirmationDialogManager: ConfirmationDialogManager,
		oDataExtension: new ODataExtension(),

		bHideHeaderFooterOptions: null,
		bEnteringMultiSelectMode: null,

		aSelectProperties: ["SAP__Origin","InstanceID","TaskDefinitionID","TaskDefinitionName","TaskTitle","CreatedByName","CreatedBy",
								"CompletionDeadLine","SubstitutedUserName","Status","Priority","PriorityNumber","HasComments","HasAttachments","HasPotentialOwners",
									"CreatedOn","TaskSupports","SupportsClaim","SupportsRelease","SupportsForward","SupportsComments","SupportsAttachments"],

		aSelectPropertiesOutbox: ["CompletedOn","ResumeOn"],

		sCustomObjectAttributeValue: "CustomObjectAttributeValue",

		sCustomAttributeDataProperty: "CustomAttributeData",

		onInit: function() {

			//In S2.view, we have the ObjectListItem added as a template declaratively. This creates an item in the list already.
			//Due to changes in the UI5 binding framework, if the item is not removed, we do not see the first task in the list.
			//There is an extension point provided for the ObjectListItem. To keep that intact and get around the removeItem() call we could try the following
			// Check if we can only provide an extension point under the items node in the S2.view.xml, remove the ObjectListItem from the view,
			//handle the template binding completely in the controller. We need to check if this approach provides the desired behavior without breaking the extension.
			if (this.getList().getItems().length > 0) {
				this.getList().removeItem(0);
			}

			//Single time flag to avoid re-selecting the same task at initial load of the list
			//Reset the flag in fnFindAndSelectNextTaskAfterAction
			this.bInitList = true;
			//support parameter for oHeaderToolbar content
			this.bEnteringMultiSelectMode = false;
			// set the TaskDefinitionModel on owner component
			var oOwnerComponent = this.getOwnerComponent();
			oOwnerComponent.setModel(new JSONModel([]), "taskDefinitionsModel");

			var oEventBus = oOwnerComponent.getEventBus();

			oEventBus.subscribe("cross.fnd.fiori.inbox", "multiselect", this.onMultiSelectEvent, this);

			oEventBus.subscribe("cross.fnd.fiori.inbox", "open_supportinfo", this.onSupportInfoOpenEvent, this);

			oEventBus.subscribe("cross.fnd.fiori.inbox.dataManager", "multiSelectFilterCompleted", jQuery.proxy(this.onMultiSelectFilterCompleted,this));

			oEventBus.subscribe("cross.fnd.fiori.inbox.dataManager", "multiSelectFilterFailed", jQuery.proxy(this.onMultiSelectFilterFailed,this));

			oEventBus.subscribe("cross.fnd.fiori.inbox.dataManager", "taskCollectionFailed", jQuery.proxy(this.onTaskCollectionFailed,this));

			oEventBus.subscribe("cross.fnd.fiori.inbox.dataManager", "showReleaseLoader", jQuery.proxy(this.onShowReleaseLoader,this));

			oEventBus.subscribe("cross.fnd.fiori.inbox.dataManager", "refreshOnError", jQuery.proxy(this.onRefreshOnError,this));

			oEventBus.subscribe("cross.fnd.fiori.inbox", "refreshListInternal", jQuery.proxy(this.onRefreshListInternal,this));
			/*
			subscribe to event storeNextItemsToSelect.
			publish this event to store the next possible items that needs to be selected if the already selected item gets removed from the list
			*/
			oEventBus.subscribe("cross.fnd.fiori.inbox", "storeNextItemsToSelect", jQuery.proxy(this.findNextVisibleItem, this));

			this.iTotalFilteredItems = 0; // to keep track of number of filtered items
			// create the data manager reference
			this.sResubmitUniqueId = this.createId() + "DLG_RESUBMIT";
			this.oDataManager = oOwnerComponent.getDataManager();
			var oOriginalModel = this.getView().getModel();
			if (!this.oDataManager) {
				this.oDataManager = new DataManager(this);
				this.oDataManager.setModel(oOriginalModel);
				oOwnerComponent.setDataManager(this.oDataManager);
			}
			if (this.oDataManager.getShowAdditionalAttributes() === true) {
				oOwnerComponent.setModel(new JSONModel({}), "customAttributeDefinitionsModel");
			}
			//this.oDataManager.oListView = this.getView();
			var oDefaultModel = this.getOwnerComponent().getModel();
			oDataReadExtension.overrideRead(oDefaultModel);
			this.oDataExtension.overrideBindList(oDefaultModel).overrideProcessSuccess(oDefaultModel).overrideImportData(oDefaultModel);

			this.overrideMHFHelperSetMasterTitle();
			this.overrideMHFHelperFooterHandling();

			this.getView().setModel(oDefaultModel);
			this.getView().getModel().attachRequestFailed(jQuery.proxy(this.handleRequestFailed, this));
			this.getView().getModel().attachRequestCompleted(jQuery.proxy(this.handleRequestCompleted, this));
			this.getView().getModel().attachMetadataFailed(jQuery.proxy(this.handleMetadataFailed, this));

			this.getView().getModel().setSizeLimit(this.oDataManager.getListSize());

			// Create element with accessibility text and after read from Screen Reader destroy it
			this.getView().byId("list").addEventDelegate({
				onsapselect : function(oEvent) {
					if (!this.getView().getController().isMultiSelectActive() && oEvent.srcControl instanceof ObjectListItem) {
						var sText = this.getView().getModel("i18n").getResourceBundle().getText("XACT_INFO_on_TASK_SELECT");
						var oElement = document.createElement("span");
						var id = "__InvisibleText_Details_View" + Date.now();
						oElement.setAttribute("id", id);
						oElement.setAttribute("aria-live", "assertive");
						document.body.appendChild(oElement);

						window.setTimeout(function () {
						document.getElementById(id).innerHTML = sText;
						}, 50);

						window.setTimeout(function () {
							document.body.removeChild(document.getElementById(id));
						}, 500);
					}
				}
			}, this);

			//Pagination
			if (this.oDataManager.getPagingEnabled()) {
				this.getList().setGrowing(true).setGrowingScrollToLoad(true).setGrowingThreshold(this.oDataManager.getPageSize());
			}

			this.oRouter = this.getOwnerComponent().getRouter();

			this.oRouter.attachRouteMatched(function(oEvent) {
				if (oEvent.getParameter("name") === "master" ||
						((oEvent.getParameter("name") === "detail" ||
						oEvent.getParameter("name") === "empty") &&
						!this.bIsMasterInited)) {
					if (this.bIsMasterInited) {
						if (Device.system.phone) {
							//Remove the list selection in case of a phone
							var oList = this.getList();
							oList.removeSelections(true);
							this.sBindingContextPath = null;
						}
						return; //skip the rest because it is a back navigation
					}

					var that = this;

					this.oDataManager.attachItemRemoved(jQuery.proxy(this._handleItemRemoved, this));
					this.oDataManager.attachActionPerformed(jQuery.proxy(this.fnHandleActionPerformed, this));

					this.sInfoHeaderGroupString = null;
					this.sInfoHeaderFilterString = null;

					// S2 list sort is supported only in non-multiorigin mode.
					this.bDisplaySortOption = false;

					// S2 list default sort key (see handleSort).
					//For Outbox, CompletedOn is the default sort criteria
					this.sDefaultSortKey = this.oDataManager.bOutbox ? this._SORT_COMPLETEDON :  this._SORT_CREATEDON;

					// S2 list current sort key and visible sort options.
					this.sSortKey = null;
					this.aVisibleSortItems = [];

					var fnIsBackendDefaultSortKeyEqualsTo = function(sKey) {
						return (function() {
							return that.sBackendDefaultSortKey === sKey;
						});
					};

					// S2 list sorter configuration (list of available sort options).
					this.oSortConfig = {};

					this.oSortConfig[this._SORT_CREATEDONREVERSE] = {
						text: "{i18n>sort.createdOnReverse}",
						getVisible: fnIsBackendDefaultSortKeyEqualsTo(this._SORT_CREATEDONREVERSE)
					};

					this.oSortConfig[this._SORT_CREATEDBYNAME] = {
						text: "{i18n>sort.createdByName}"
					};
					this.oSortConfig[this._SORT_PRIORITY] = {
						text: "{i18n>sort.priority}",
						descending: true
					};
					this.oSortConfig[this._SORT_TASKTITLE] = {
						text: "{i18n>sort.taskTitle}"
					};

					this.oSortConfig[this._SORT_SAPORIGIN] = {
						text: "{i18n>sort.sapOrigin}",
						getVisible: fnIsBackendDefaultSortKeyEqualsTo(this._SORT_SAPORIGIN)
					};
					this.oSortConfig[this._SORT_INSTANCEID] = {
						text: "{i18n>sort.instanceID}",
						getVisible: fnIsBackendDefaultSortKeyEqualsTo(this._SORT_INSTANCEID)
					};
					this.oSortConfig[this._SORT_TASKDEFINITIONID] = {
						text: "{i18n>sort.taskDefinitionID}",
						getVisible: fnIsBackendDefaultSortKeyEqualsTo(this._SORT_TASKDEFINITIONID)
					};
					this.oSortConfig[this._SORT_TASKDEFINITIONNAME] = {
						text: "{i18n>sort.taskDefinitionName}",
						getVisible: fnIsBackendDefaultSortKeyEqualsTo(this._SORT_TASKDEFINITIONNAME)
					};
					this.oSortConfig[this._SORT_STATUS] = {
						text: "{i18n>sort.status}",
						getVisible: fnIsBackendDefaultSortKeyEqualsTo(this._SORT_STATUS)
					};
					this.oSortConfig[this._SORT_CREATEDBY] = {
						text: "{i18n>sort.createdBy}",
						getVisible: fnIsBackendDefaultSortKeyEqualsTo(this._SORT_CREATEDBY)
					};
					this.oSortConfig[this._SORT_PROCESSOR] = {
						text: "{i18n>sort.processor}",
						getVisible: fnIsBackendDefaultSortKeyEqualsTo(this._SORT_PROCESSOR)
					};
					this.oSortConfig[this._SORT_STARTDEADLINE] = {
						text: "{i18n>sort.startDeadLine}",
						getVisible: fnIsBackendDefaultSortKeyEqualsTo(this._SORT_STARTDEADLINE)
					};
					this.oSortConfig[this._SORT_EXPIRYDATE] = {
						text: "{i18n>sort.expiryDate}",
						getVisible: fnIsBackendDefaultSortKeyEqualsTo(this._SORT_EXPIRYDATE)
					};
					this.oSortConfig[this._SORT_ISESCALATED] = {
						text: "{i18n>sort.isEscalated}",
						descending: true,
						getVisible: fnIsBackendDefaultSortKeyEqualsTo(this._SORT_ISESCALATED)
					};
					this.oSortConfig[this._SORT_HASCOMMENTS] = {
						text: "{i18n>sort.hasComments}",
						descending: true,
						getVisible: fnIsBackendDefaultSortKeyEqualsTo(this._SORT_HASCOMMENTS)
					};
					this.oSortConfig[this._SORT_HASATTACHMENTS] = {
						text: "{i18n>sort.hasAttachments}",
						descending: true,
						getVisible: fnIsBackendDefaultSortKeyEqualsTo(this._SORT_HASATTACHMENTS)
					};
					this.oSortConfig[this._SORT_HASPOTENTIALOWNERS] = {
						text: "{i18n>sort.hasPotentialOwners}",
						getVisible: fnIsBackendDefaultSortKeyEqualsTo(this._SORT_HASPOTENTIALOWNERS)
					};
					this.oSortConfig[this._SORT_CONTEXTSERVICEURL] = {
						text: "{i18n>sort.contextServiceURL}",
						getVisible: fnIsBackendDefaultSortKeyEqualsTo(this._SORT_CONTEXTSERVICEURL)
					};


					// commenting out the code for custom attributes' sort

					/*this.oSortConfig[this._CUSTOM_NUMBER_VALUE] = {
						text: this._CUSTOM_NUMBER_LABEL,
						getVisible: function() {
							var aListItems = that.getList().getItems();
							var aCustomNumbers = that._populateAllUniqueCustomAttributes(that._CUSTOM_NUMBER_VALUE);
							return that._areItemsUniqueByTaskType() && aCustomNumbers.length != 0 && aCustomNumbers.length < aListItems.length / 2;
						}
					};

					this.oSortConfig[this._CUSTOM_NUMBER_UNIT_VALUE] = {
						text: this._CUSTOM_NUMBER_UNIT_LABEL,
						getVisible: function() {
							var aListItems = that.getList().getItems();
							var aCustomNumberUnits = that._populateAllUniqueCustomAttributes(that._CUSTOM_NUMBER_UNIT_VALUE);
							return that._areItemsUniqueByTaskType() && aCustomNumberUnits.length != 0 && aCustomNumberUnits.length < aListItems.length /
								2;
						}
					};

					this.oSortConfig[this._CUSTOM_OBJECT_ATTRIBUTE_VALUE] = {
						text: this._CUSTOM_OBJECT_ATTRIBUTE_LABEL,
						getVisible: function() {
							var aListItems = that.getList().getItems();
							var aCustomObjectAttributes = that._populateAllUniqueCustomAttributes(that._CUSTOM_OBJECT_ATTRIBUTE_VALUE);
							return that._areItemsUniqueByTaskType() && aCustomObjectAttributes.length != 0 && aCustomObjectAttributes.length < aListItems
								.length / 2;
						}
					};*/

					if (!this.oDataManager.bOutbox) {
						this.oSortConfig[this._SORT_CREATEDON] = {
								text: "{i18n>sort.createdOn}",
								descending: true,
								getVisible: fnIsBackendDefaultSortKeyEqualsTo(this._SORT_CREATEDON)
						};

						this.oSortConfig[this._SORT_COMPLETIONDEADLINE] = {
								text: "{i18n>sort.completionDeadLine}"
						};
					}
					else {
						this.oSortConfig[this._SORT_COMPLETEDON] = {
							text: "{i18n>sort.completedOn}",
							descending: true
						};
					}

					/**
					 * @ControllerHook Change sort configuration
					 * This hook method can be used to modify the list of properties
					 * that are used for sorting the S2 list items.
					 * It is called when the application starts and the S2 list screen is displayed.
					 * @callback cross.fnd.fiori.inbox.view.S2~extHookChangeSortConfig
					 * @param {object} oSortConfig
					 * @return {void}
					 */
					if (this.extHookChangeSortConfig) {
						this.extHookChangeSortConfig(this.oSortConfig);
					}

					// S2 list current group item and descending flag.

					this.oGroupConfigItem = null;
					this.bGroupDescending = false;

					// S2 list group configuration (list of available group options).

					this.aGroupConfig = [];
					this.aGroupConfig.push({
						key: this._SORT_PRIORITY,
						textKey: "group.priority",
						formatter: function(oContext) {
							var sOrigin = oContext.getProperty(that._SORT_SAPORIGIN);
							var sPrio = oContext.getProperty(that._SORT_PRIORITY);
							return Conversions.formatterPriority.call(that.getView(), sOrigin, sPrio);
						}
					});
					//grouping Task Types based on TaskDefintionName
					this.aGroupConfig.push({
						key: this._SORT_TASKDEFINITIONNAME,
						textKey: "group.taskType",
						formatter: function(oContext) {

							var sTaskTitle = oContext.getProperty(that._SORT_TASKDEFINITIONNAME);
							return sTaskTitle;
						}
					});
					this.aGroupConfig.push({
						key: this._SORT_STATUS,
						textKey: "group.status",
						formatter: function(oContext) {
							var i18nBundle = that.getView().getModel("i18n").getResourceBundle();
							var sStatus = oContext.getProperty(that._SORT_STATUS);
							var sTextKey;

							for (var i = 0; i < that._GROUP_STATUS_ORDER.length; i++) {
								var oGroupOrder = that._GROUP_STATUS_ORDER[i];

								if (oGroupOrder.Status == sStatus) {
									sTextKey = oGroupOrder.TextKey;
									break;
								}
							}

							return i18nBundle.getText(sTextKey);
						}
					});

					if (!this.oDataManager.bOutbox) {
						this.aGroupConfig.push({
							key: this._GROUP_SUPPORTSRELEASE,
							textKey: "group.reservation",
							formatter: function(oContext) {
								var i18nBundle = that.getView().getModel("i18n").getResourceBundle();
								var sKey = oContext.getProperty(that._GROUP_SUPPORTSRELEASE) ? "group.reservation.reserved" :
									"group.reservation.notReserved";
								return i18nBundle.getText(sKey);
							}
						});
					}

					/**
					 * @ControllerHook Change grouping configuration
					 * This hook method can be used to modify the list of properties
					 * that are used for grouping the S2 list items.
					 * It is called when the application starts and the S2 list screen is displayed.
					 * @callback cross.fnd.fiori.inbox.view.S2~extHookChangeGroupConfig
					 * @param {object} aGroupConfig
					 * @return {void}
					 */
					if (this.extHookChangeGroupConfig) {
						this.extHookChangeGroupConfig(this.aGroupConfig);
					}

					this.bDisplayMultiSelectButton = false;
					this.clearDecisionButtons();

					this.oSubHeader = this.getPage().getSubHeader();
					var oOriginalModel = this.getView().getModel();
					if (oOriginalModel) {
						if (!this.oDataManager.oModel.getServiceMetadata()) {
							//Execution can only continue - e.g.: metadata fetch success
							this.oDataManager.oModel.attachMetadataLoaded(jQuery.proxy(function() {
								this.loadInitialAppData();
							}, this));
						}
						else {
							this.loadInitialAppData();
						}
					}

					this.bIsMasterInited = true;
					if (oEvent.getParameter("name") === "detail") {
						//store the path for the deep link scenario
						this.sBindingContextPath = "/" + oEvent.getParameter("arguments").contextPath;
					}
				}
				else if (oEvent.getParameter("name") === "detail") {
					//store the path for the deep link scenario
					this.sBindingContextPath = "/" + oEvent.getParameter("arguments").contextPath;
				}

				if (oEvent.getParameter("name") === "detail" || oEvent.getParameter("name") === "empty") {
					if (this.oDataManager.bOutbox) {
						Conversions.setShellTitleToOutbox(this.getOwnerComponent(), "cross.fnd.fiori.inbox.view.S2");
					}
					else {
						Conversions.setShellTitleToInbox(this.getOwnerComponent(), "cross.fnd.fiori.inbox.view.S2");
					}
				}
			}, this);

			//FIXME: when SettingsButton error is fixed (ushell.resources is not undefined)
			this.iRequestCountStart++;

			this.aTaskTypeFilterItemsOrigins = [];
			this.bGUILinkSelectPropertySupported = false;

			this.getAppImp().oMHFHelper.defineMasterHeaderFooter(this);

			var fMyOnExit = jQuery.proxy(function () {
				if (this.emptyList()) {
					var oPage = this.getPage();
					if (oPage) {
						oPage.removeContent(this.emptyList());
					}
					this.emptyList().destroy();
					if (this._oControlStore && this._oControlStore.oMasterSearchField) {
						this._oControlStore.oMasterSearchField.destroy();
						delete this._oControlStore.oMasterSearchField;
					}
				}
			}, this);

			cross.fnd.fiori.inbox.util.tools.Application.getImpl().registerExitModule(fMyOnExit);
			oEventBus.subscribe("cross.fnd.fiori.inbox", "clearSelection", this._clearSelection, this);
		},

		/**
		 * Clear selection of master list, if needed.
		 * If the list is in MultiSelect mode and the function keepMultiSelection of the configuration
		 * returns true, then the selection is not cleared.
		 */
		_clearSelection : function () {
			var oList = this.getList(),
				bKeepSelection = this.getAppImp().oConfiguration.keepMultiSelection();
			if (oList && (oList.getMode() !== ListMode.MultiSelect || !bKeepSelection)) {
				oList.removeSelections(true);
			}
		},

		noItemFoundForContext:function() {
			if (Device.system.phone) {
				var oSplitContainer = this.getSplitContainer();
				oSplitContainer.to(this.getView(), "show");
			}
			else {
			  this.oRouter.navTo("empty", null, true);
			}
		},

		_areItemsUniqueByTaskType: function() {
			var aListItems = this.getList().getItems();
			if (!aListItems || aListItems.length === 0) {
				return false;
			}

			var index = 0;
			var oBindingContext = aListItems[index].getBindingContext();
			if (!oBindingContext) {
				if (aListItems.length === 1) {
					return false;
				}
				index += 1;
				oBindingContext = aListItems[index].getBindingContext();
			}
			var oBindingContext2;
			var i, imax;
			for (i = index + 1, imax = aListItems.length; i < imax; i++) {
				oBindingContext2 = aListItems[i].getBindingContext();
				// Shown if there is at least one due date.
				if (oBindingContext2 && oBindingContext2.getProperty("TaskDefinitionID") != oBindingContext.getProperty("TaskDefinitionID")) {
					return false;
				}
			}
			return true;
		},

		_handleItemRemoved: function(oEvent) {
			if (!Device.system.phone) {
				//To make the detail screen refreshed (action buttons, etc.)
				var oListItem = this.getList().getSelectedItem();
				var oParameters = this.getDetailNavigationParameters(oListItem);
				oParameters.InstanceID += ":";
				this.oRouter.navTo(this.getDetailRouteName(), oParameters, true);
			}
		},

		handleRequestFailed: function(oEvent) {
			var oList = this.getList();
			var sNoDataText = this.getView().getModel("i18n").getResourceBundle().getText("view.Workflow.noItemsAvailable");
			oList.setNoDataText(sNoDataText);
		},

		getTotalTaskCount: function(oEvent) {
			//getting the inline count value from taskCollection call in case paging is enabled
			if (this.oDataManager.getPagingEnabled()) {
				var sTaskCollectionCall = new RegExp("TaskCollection[?]");
				if (sTaskCollectionCall.test(oEvent.getParameter("url")) ) {
					var oTaskCollectionCallResponse = JSON.parse([oEvent.getParameter("response").responseText]);
					if (oTaskCollectionCallResponse && oTaskCollectionCallResponse.d) {
						this.iTaskCount = parseInt(oTaskCollectionCallResponse.d.__count, 10);
						this.bTaskCountFromTaskCollectionCall = true;
					}
				}
			}
		},

		handleRequestCompleted: function(oEvent) {
			this.getTotalTaskCount(oEvent);
		},

		// used to select a task after an action is performed which requires only the detail page to refresh
		//currently being used only after deleting an attachment
		fnHandleActionPerformed: function(oEvent) {
			this.isActionPerformed = true;
		},

		_handleItemPress : function (oEvent) {

			this.setListItem(oEvent.getSource());
		},

		getList : function () {
			return this.byId("list");
		},

		emptyList : function () {
			return this.byId("emptyList");
		},

		setListItem : function (oItem) {

			var oList = this.getList();
			oList.removeSelections();
			oItem.setSelected(true);
			oList.setSelectedItem(oItem, true);

			this.oRouter.navTo("detail", {
				SAP__Origin: oItem.getBindingContext().getProperty("SAP__Origin"), // eslint-disable-line camelcase
				InstanceID : oItem.getBindingContext().getProperty("InstanceID"),
				contextPath : oItem.getBindingContext().getPath().substr(1)
			}, !Device.system.phone);
		},

		//This method decides which task to select after an action like 'Approve', 'Suspend', etc has occurred.
		fnFindAndSelectNextTaskAfterAction: function(oEvent) {
			if (this.isMultiSelectActive() ) {
				this._handleMultiSelectProcessing();
				return;
			}
			this.iTotalFilteredItems = this.getList().getItems().length;
			if (this.iTotalFilteredItems === 0) {
				var sNoDataText = this.getView().getModel("i18n").getResourceBundle().getText("view.Workflow.noItemsAvailable");
				this.emptyList().setNoDataText(sNoDataText);
				var emptyListVisible = false;
				this.setListsVisibility(emptyListVisible);
				if (!Device.system.phone) {
					this.oRouter.navTo("empty", null, true);
					if (!Device.system.phone && this.oDataManager && this.oDataManager.bOutbox) {
						Conversions.setShellTitleToOutbox(this.getOwnerComponent(), "cross.fnd.fiori.inbox.view.S2");
					}
				}
				return;
			}
			var aListItems = this.getList().getItems();
			var oSelectedItem = this.getList().getSelectedItem();

			// if a task exists which is stored to be selected before the list finishes updating
			if (this.aItemContextPathsToSelect.length !== 0 && aListItems.length > 0 && !Device.system.phone) {
				// select a task after action
				var bItemFound = false;

				// Find in the list which task to select depending on the context paths stored
				// we store 2 context paths in aItemContextPathsToSelect in order to keep track of which task to select after an action like 'Approve', 'Suspend', etc

				for (var sCtxPathKey in this.aItemContextPathsToSelect) {
					var sCtxPath = this.aItemContextPathsToSelect[sCtxPathKey];

					// break if item has been found in the list
					if (bItemFound) {
						break;
					}

					// search for the item having context as sCtxPath in the updated data
					for (var iListKey in aListItems) {
						var sCurrentContext = aListItems[iListKey].getBindingContext();
						if (sCurrentContext && sCurrentContext == sCtxPath) {
							bItemFound = true;
							if (oSelectedItem !== null) {
								var sSelectedItemContext = oSelectedItem.getBindingContext();
								if (sCtxPath == sSelectedItemContext) { // reselect the same task
									//this.setListItem(aListItems[iListKey]);
									if (!this.bInitList) { //skip re-selecting the task in case the list is initializing
										var mArguments = {}, bIsTableViewActive;
										bIsTableViewActive = this.oDataManager.getTableView() && (!Device.system.phone || this.oDataManager.getTableViewOnPhone());
										mArguments.bIsTableViewActive = bIsTableViewActive;
										this.oDataManager.fireRefreshDetails(mArguments);
									}
								}
								else {
									this.setListItem(aListItems[iListKey]);
								}
							}
							else {
								this.setListItem(aListItems[iListKey]);
							}
							break;
						}
					}
				}

				if (!bItemFound) { // items stored to select not present in the list
					//In case of last item processing: select the new last item instead of the first one
					//if both the items are same in aItemContextPathsToSelect means the last task has been processed
					if (this.aItemContextPathsToSelect.length === 2
						&& this.aItemContextPathsToSelect[0] === this.aItemContextPathsToSelect[1]
					) {
						if (this.iTotalFilteredItems==0) {
							this.noItemFoundForContext();
						}
						else {
							//this.setListItem(aListItems[this.iTotalFilteredItems-1]);
							for (var iKey in aListItems) {
								if ((aListItems[iKey].getVisible())) {
									this.setListItem(aListItems[iKey]);
									break;
								}
							}
						}
					}
					//Deep link scenario handling (item to select not present in the list)
					else {
						this.selectIteminListforDeepLink();
					}
				}
			}
			else { // either there are no items stored to select, or the list is empty
				if (aListItems.length > 0) { // if no items stored to select, select by context path
					this.selectIteminListforDeepLink();
				}
				else {
					// if the list is empty, navigate to an empty view
					if (!this.oDataManager.getCallFromDeepLinkURL()) {
						this.oRouter.navTo("master", null, true);
						this.oRouter.navTo("empty", null, true);
						if (!Device.system.phone && this.oDataManager && this.oDataManager.bOutbox) {
							Conversions.setShellTitleToOutbox(this.getOwnerComponent(), "cross.fnd.fiori.inbox.view.S2");
						}
					}
					else {
						this.oDataManager.setCallFromDeepLinkURL(false);
					}
				}
			}
			//Set to true in S2.onInit - always false after this.
			this.bInitList = false;
		},

		selectIteminListforDeepLink: function() {
			if (this.getList().getItems().length > 0 ) {
				//Deep link scenario handling
				this._selectItemByCtxtPath();
				return true;
			}
			return false;
		},

		_handleMultiSelectProcessing: function() {
			if (this.isMultiSelectActive()) {
				var aListItems = this.getList().getItems();
				if (aListItems.length !== 0) {
					var oContext = undefined;
					var i=0;
					do {
						oContext = aListItems[i].getBindingContext();
						i++;
					}
					while (!oContext);

					if (this.oDataManager.getShowAdditionalAttributes() === true) {
						this.downloadCustomAttributeDefinition(oContext.getProperty("SAP__Origin"), oContext.getProperty("TaskDefinitionID"));
					}
					this.downloadDecisionOptions(oContext.getProperty("SAP__Origin"), oContext.getProperty("InstanceID"), oContext.getProperty("TaskDefinitionID"));
				}
				else { // if there are no items in multiselect mode
					this.setMultiSelectButtonActive(true);
					if (!Device.system.phone) {
						this.oRouter.navTo("multi_select_summary", {}, true);
					}
					if (this.oDataManager.getShowAdditionalAttributes() === true) {
						// reset Custom Attribute Definition model
						/* eslint-disable no-unused-vars */
						var customAttributeDefModel = this.getOwnerComponent().getModel("customAttributeDefinitionsModel");
						customAttributeDefModel = {};
						/* eslint-enable no-unused-vars */

						// set deffered object to initial state (not fulfilled);
						MultiSelect.customAttributeDefinitionsLoaded = new jQuery.Deferred();
					}
				}
				// In case of multiselect we stay on the multiselect summary screen
				return;
			}
		},

		_selectItemByCtxtPath: function() {
			if (this.sBindingContextPath) {
				var oItem = this.findItemByContextPath(this.sBindingContextPath);

				//refresh task issue fix
				var bItemExists = (this.getView().getModel().getProperty(this.sBindingContextPath)) ? true : false;
				if (oItem && jQuery.isEmptyObject(oItem.getBindingContext())) {
					var sContext = new Context(this.getView().getModel(), this.sBindingContextPath);
					oItem.setBindingContext(sContext);
				}

				if (oItem && bItemExists) {
					this.setListItem(oItem);
					this.oDataManager.setCallFromDeepLinkURL(false);
					return true;
				}
				// if the item in the URL is not present in the list, select the first item in the list
				else if (!this.oDataManager.getCallFromDeepLinkURL() && !Device.system.phone) {
					this.fnSelectFirstItem();
				}
			}
			else if (!Device.system.phone) {
				this.fnSelectFirstItem();
			}
			this.oDataManager.setCallFromDeepLinkURL(false);
		},

		fnSelectFirstItem: function() {
			var aListItems = this.getList().getItems();
			if (aListItems.length>0) {
				var oValidTask = undefined;
				var i = 0;
				do { // selects first valid item in the list ignoring the header if the list is grouped
					 // if the list is grouped, the first item in the list is the group heading like 'LOW' in case the list is grouped by priority
					oValidTask = aListItems[i];
					i++;
				}
				while (!oValidTask.getBindingContext());

				this.setListItem(oValidTask);
			}
		},

		findNextVisibleItem: function(sChannelId, sEventId, oItemData) {
				var oS2List = this.getList();
				var iItemIndex = -1;
				var iItemIndexToSelect = -1;
				this.aItemContextPathsToSelect = [];

				for (var iListKey in oS2List.getItems()) {
					var sCurrentContextPath = oS2List.getItems()[iListKey].getBindingContextPath();
					if (sCurrentContextPath) {
						var sSapOrigin = oS2List.getItems()[iListKey].getBindingContext().getProperty("SAP__Origin");
						var sInstanceID = oS2List.getItems()[iListKey].getBindingContext().getProperty("InstanceID");
						if (sSapOrigin === oItemData.sOrigin && sInstanceID === oItemData.sInstanceID ) {
							iItemIndex = iListKey;
							//add the actual/processed item ctx path to the array.
							this.aItemContextPathsToSelect.push(sCurrentContextPath);
						}
					}

					if ((oS2List.getItems()[iListKey].getVisible()) && ((iItemIndexToSelect <= iItemIndex) || (iItemIndex == -1))) {
						iItemIndexToSelect = iListKey;
						if (iItemIndex !== -1 && iItemIndexToSelect !== iItemIndex) {
							break;
						}
					}
				}
				if ((iItemIndexToSelect == -1) && (oS2List.getItems().length > 0)) {
					iItemIndexToSelect = 0;
				}
				if (iItemIndexToSelect >= 0) {
					//add the ctx path of the first item or the next one to the actual item to the array.
					this.aItemContextPathsToSelect.push(oS2List.getItems()[iItemIndexToSelect].getBindingContextPath());
				}
		},

		overrideMHFHelperSetMasterTitle: function() {
			// redefinition of setMasterTitle to be able to change the title of the screen dynamically
			var that = this;

			this.getAppImp().oMHFHelper.setMasterTitle = function(oController, iCount) {
				if (!oController._oControlStore.oMasterTitle) {
					return;
				}

				this.oDataManager = this.oApplicationImplementation.getComponent().getDataManager();

				if (!this.oDataManager) {
					return;
				}

				//determines the count based on the length of the model binding
				if (that._oControlStore.oMasterSearchField.getValue().length == 0) {
					//Local filter of the list is not triggered, if it is triggered, the list is still in before filter state.
					var oList = that.getList();
					//No data item must not be counted - check the first item based on its ID
					if (oList && oList.getItems()) {
						var oItemBinding = oList.getBinding("items");
						if (oItemBinding && oItemBinding.aKeys) {
							iCount = oItemBinding.aKeys.length;
						}
						if (that._oControlStore.oMasterSearchField.getValue() == "" && that.oDataManager.getPagingEnabled()) {
							that.bTaskCountFromTaskCollectionCall = true;
						}
						else if (!that.oDataManager.getPagingEnabled()) {
							that.bTaskCountFromTaskCollectionCall = false;
						}
					}
				}
				else {
					// for client side search set the count as per the result returned from client side search
					that.bTaskCountFromTaskCollectionCall = false;
				}
				var iTotalTaskCount = (that.iTaskCount && that.bTaskCountFromTaskCollectionCall) ? that.iTaskCount : iCount;
				that.iTotalFilteredItems=iTotalTaskCount;
				if (!this.oDataManager.getScenarioConfig() || !this.oDataManager.getScenarioConfig().DisplayName) {
					var oBundle = cross.fnd.fiori.inbox.util.tools.Application.getImpl().AppI18nModel.getResourceBundle();
					this.sTitle = oBundle.getText(oController._oHeaderFooterOptions.sI18NMasterTitle, [iTotalTaskCount]);
				}
				else {
					this.sTitle = this.oDataManager.getScenarioConfig().DisplayName + " (" + iTotalTaskCount + ")";
				}

				oController._oControlStore.oMasterTitle.setText(this.sTitle);
			};
		},

		overrideMHFHelperFooterHandling: function() {
			// FIXME: Override footer handling to provide positive/negative buttons on S2 footer.

			var oMHFHelper = this.getAppImp().oMHFHelper;
			var that = this;

			var fOriginalDefineFooterRight = oMHFHelper.defineFooterRight;

			oMHFHelper.defineFooterRight = function(oController) {
				var iFooterRightCount = this.getFooterRightCount(oController);

				if (oController._oHeaderFooterOptions.oPositiveAction) {
					var oBtnMeta = {};
					jQuery.extend(oBtnMeta, oController._oHeaderFooterOptions.oPositiveAction);
					oBtnMeta.style = ButtonType.Accept;
					oController._oControlStore.oButtonListHelper.ensureButton(oBtnMeta, "b", iFooterRightCount);
				}

				if (oController._oHeaderFooterOptions.oNegativeAction) {
					var oBtnMeta = {};
					jQuery.extend(oBtnMeta, oController._oHeaderFooterOptions.oNegativeAction);
					oBtnMeta.style = ButtonType.Reject;
					oController._oControlStore.oButtonListHelper.ensureButton(oBtnMeta, "b", iFooterRightCount);
				}

				fOriginalDefineFooterRight.call(this, oController);
			};

			var fOriginalGetFooterRightCount = oMHFHelper.getFooterRightCount;

			oMHFHelper.getFooterRightCount = function(oController) {
				var iCount;

				if (that.isMultiSelectActive()) {
					// In multi-select mode:
					// - A maximum of two buttons are displayed with text.
					// - If there are more than 2 actions, the rest of the actions are displayed behind the action button.
					iCount = 2;
				}
				else {
					iCount = fOriginalGetFooterRightCount.call(this, oController);
				}

				return iCount;
			};
		},

		onRefreshListInternal: function() {
			this.getAppImp().oMHFHelper.refreshList(this, true);
		},

		applySearchPatternToListItem: function(oItem, sFilterPattern) {
			// check UI elements(status, task tile)
			this.sSearchPattern_Support = sFilterPattern;
			//cross.fnd.fiori.inbox.util.SupportInfo.setSearchPattern(sFilterPattern);
			if ((oItem.getIntro() && oItem.getIntro().toLowerCase().indexOf(sFilterPattern) != -1) || (oItem.getTitle() && oItem.getTitle().toLowerCase()
				.indexOf(sFilterPattern) != -1) || (oItem.getNumber() && oItem.getNumber().toLowerCase().indexOf(sFilterPattern) != -1) || (oItem.getNumberUnit() &&
				oItem.getNumberUnit().toLowerCase().indexOf(sFilterPattern) != -1) || (oItem.getFirstStatus() && oItem.getFirstStatus().getText().toLowerCase()
				.indexOf(sFilterPattern) != -1) || (oItem.getSecondStatus() && oItem.getSecondStatus().getText().toLowerCase().indexOf(sFilterPattern) !=
				-1)) {
				if (this.searchListFlag === 0 || this.searchListFlag === undefined) { // Task List search FIX
					this.searchListFlag = 1;
					this.searchListFirstItem = this.getDetailNavigationParameters(oItem);
				}
				return true;
			}
			// last source is attribute array (creator user name)
			var aAttributes = oItem.getAttributes();
			for (var j = 0; j < aAttributes.length; j++) {
				if (aAttributes[j].getText().toLowerCase().indexOf(sFilterPattern) != -1) {
					if (this.searchListFlag === 0 || this.searchListFlag === undefined) {
						this.searchListFlag = 1;
						this.searchListFirstItem = this.getDetailNavigationParameters(oItem);
					}
					return true;
				}
			}
			return false;
		},
		createSubstitutesUserFilterOption: function() {
			if (this.oDataManager.getSubstitutionEnabled()) {
				var i18nBundle= this.getView().getModel("i18n").getResourceBundle();
				  var substitutedUserFilterCategory = this.createSubstitutedUserFilterCategory(i18nBundle);
				  this.getSubstitutedUsers(substitutedUserFilterCategory);
				  if (this.oSubstitutedUserFilterKeys) {
					  this.resetSubstitutedUserFilterCategoryCount(Object.keys(this.oSubstitutedUserFilterKeys).length);
				   }
				  this.aFilterItems.push(substitutedUserFilterCategory);
			}
		},

		getHeaderFooterOptions: function() {
			var that = this;
			var oHeaderFooterOptions = {
				sI18NMasterTitle: "MASTER_TITLE"
			};
			// do not display any header footer option if flag bHideHeaderFooterOptions is enabled
			if (this.bHideHeaderFooterOptions) {
				return {};
			}

			if (!this.isMultiSelectActive()) {
				oHeaderFooterOptions.oFilterOptions = {
					onFilterPressed: jQuery.proxy(function () {
						if (!that.oDataManager.bOutbox) {
							var i18nBundle= this.getView().getModel("i18n").getResourceBundle();
							this.aFilterItems = InboxFilterContributor.getAllFilters(i18nBundle,this.complexFilter);

							// Create this option only if the SubstitutedUsersCollection is present
							// a request to read (get) SubstitutedUsersCollection is not triggered as well
							// JIRA - CENTRALINBOX-1941
							var isSubstitutedUsersCollectionPresent = this.oDataManager.checkEntitySetExistsInMetadata("SubstitutedUsersCollection");
							if (isSubstitutedUsersCollectionPresent) {
								that.createSubstitutesUserFilterOption();
							}
						}
						that.onShowFilter();

					}, that)
				};

				if (this.bDisplaySortOption) {
					oHeaderFooterOptions.oSortOptions = {
						aSortItems: this.aVisibleSortItems,
						sSelectedItemKey: this.sSortKey,
						onSortSelected: jQuery.proxy(that.handleSort, that)
					};
					oHeaderFooterOptions.oGroupOptions = {
						onGroupPressed: jQuery.proxy(that.onShowGroup, that)
					};
				}
			}

			if (!this.oDataManager.bOutbox) {
				oHeaderFooterOptions.oEditBtn = {
						onBtnPressed: jQuery.proxy(function() {
							if (!this.isMultiSelectActive()) {
								// Turn on multi-select.

								this.prepareMultiSelect();
							}
							else {
								// Turn off multi-select.
								this.dismissMultiSelect();
							}
						}, that),
						bDisabled: !this.bDisplayMultiSelectButton
				};
			}

			if (this.oMultiSelectActions) {
				oHeaderFooterOptions.oPositiveAction = this.oMultiSelectActions.positiveAction;
				oHeaderFooterOptions.oNegativeAction = this.oMultiSelectActions.negativeAction;
				oHeaderFooterOptions.buttonList = this.oMultiSelectActions.additionalActions;
			}

			return oHeaderFooterOptions;
		},

		_findFilterKey: function(sFilterKey) {
			for (var firstLevelFilter in this.complexFilter) {
				var filterKeys = this.complexFilter[firstLevelFilter];
				for (var i = 0; i < filterKeys.length; i++) {
					if (filterKeys[i] === sFilterKey) {
						return true;
					}
				}
			}
			return false;
		},

		_resetFilterState: function() {
			this.complexFilterBackup = this.complexFilter;
			this.complexFilter = {
				Priority: [],
				CompletionDeadLine: [],
				TaskDefinitionID: [],
				Status: [],
				CreatedOn: [],
				CustomNumberValue: [],
				CustomNumberUnitValue: [],
				CustomObjectAttributeValue: [],
				SubstitutedUser: []
			};
		},

		_saveFilterState: function(oFilterKeys) {
			this._resetFilterState();
			for (var key in oFilterKeys) {
				var filterKeyParts = key.split(":");
				//if there is a custom filter property, make on with the same name
				if (!this.complexFilter[filterKeyParts[0]]) {
					this.complexFilter[filterKeyParts[0]] = [];
				}
				this.complexFilter[filterKeyParts[0]].push(key);
			}
		},

		/**
		 *
		 * @param sText - label text of the filter category
		 * @param bMultiSelect - optional, default: true
		 * @returns {ViewSettingsFilterItem}
		 */
		_createFilterCategory: function(sText, bMultiSelect) {
			var isMultiSelect = true;
			if (arguments.length == 2) {
				isMultiSelect = bMultiSelect;
			}
			return new ViewSettingsFilterItem({
				text: sText,
				multiSelect: isMultiSelect
			});
		},

		/**
		 *
		 * @param sKey
		 * @param sText
		 * @returns {ViewSettingsItem}
		 */
		_createFilterItem: function(sKey, sText) {
			var oFilterItem = new ViewSettingsItem({
				text: sText,
				key: sKey
			});

			if (this._findFilterKey(sKey)) {
				oFilterItem.setSelected(true);
			}
			return oFilterItem;
		},

		fnCreateSubstitutedUserFilterKeys: function(oEvent) {
			var that = this;
			var aSelectedSubstitutes =  oEvent.getSource().getSelectedItems();
			var oFilterKey = {};
			that.sSelectedSubstitutesNameForFilterString = ""; // required to display user names in the filter string shown in list
			var sKey = null;
			for (var i = 0; i < aSelectedSubstitutes.length; i++ ) {
				sKey = aSelectedSubstitutes[i].data("key");
				oFilterKey[sKey] = true;
				that.sSelectedSubstitutesNameForFilterString = (aSelectedSubstitutes.length === 1) ? aSelectedSubstitutes[i].getTitle() :
				that.sSelectedSubstitutesNameForFilterString + aSelectedSubstitutes[i].getTitle() +  ", " ;
			}
			that.oSubstitutedUserFilterKeys = oFilterKey;
			that.resetSubstitutedUserFilterCategoryCount(aSelectedSubstitutes.length);
		},

		// Creating filter item for Substituted User List
		createSubstitutedUserFilterCategory: function (i18nBundle) {
			var oSubstitutedUserFilterCategory = new ViewSettingsCustomItem({
					text: i18nBundle.getText("filter.substitutingUserList")
			});
			return oSubstitutedUserFilterCategory;
		},

		resetSubstitutesListSelection: function(oEvent) {
			var oFilterDialog = oEvent.getSource();
			var i18nBundle = this.getView().getModel("i18n").getResourceBundle();
			var oSubstitutedFilterCategory = null;
			jQuery.each(oFilterDialog.getAggregation("filterItems"), function(index, oFilterItem) {
				if (oFilterItem.getText() == i18nBundle.getText("filter.substitutingUserList")) {
					 oSubstitutedFilterCategory = oFilterItem;
					 return;

				}
			});
			if (oSubstitutedFilterCategory) {
				 var oSubtitutesList = oSubstitutedFilterCategory.getCustomControl();
				 oSubtitutesList.removeSelections(true);
			}
			//this.oSubstitutedUserList.removeSelections(true);
			this.oSubstitutedUserFilterKeys = null; // remove the SubstitutedFilterKeys
		},

		storeSubstitutedUserKeysInListItem: function(aSubstitutes, oSubstitutedUserModel) {
			if (aSubstitutes) {
				for (var i = 0; i <aSubstitutes.length; i++) {
					aSubstitutes[i].data("key", oSubstitutedUserModel.oData.oItems[i].key);
				}
			}

		},

		createDynamicSubstiutedUserList: function(substitutedUserFilterItem,oSubstitutedUserModel) {

			var oDynamicSubstitutedUserList = substitutedUserFilterItem;
			var that = this;
			var sNoSubstituteUserText = this.getView().getModel("i18n").getResourceBundle().getText("view.SubstitutedUserList.noRecipients");
			//create the list which will display all the users
			var oSubstituesList = sap.ui.getCore().byId("substituesUser");
			if (!oSubstituesList) {
				oSubstituesList = new List({
					id : "substituesUser",
					mode : "MultiSelect"
				});
			}

			var oUser = new StandardListItem({
				title : "{substitutedUserModel>text}"
			});

			oSubstituesList.attachSelectionChange(function(oEvent) {
				that.fnCreateSubstitutedUserFilterKeys(oEvent);
			});

			oDynamicSubstitutedUserList.setCustomControl(oSubstituesList);
			oDynamicSubstitutedUserList.setModel(oSubstitutedUserModel, "substitutedUserModel");
			oSubstituesList.setModel(oSubstitutedUserModel, "substitutedUserModel");
			oSubstituesList.bindAggregation("items", "substitutedUserModel>/oItems", oUser);
			that.storeSubstitutedUserKeysInListItem(oSubstituesList.getAggregation("items"), oSubstitutedUserModel);
			oSubstituesList.setNoDataText(sNoSubstituteUserText);

			if (that.oSubstitutedUserFilterKeys) {
				//if substitutes were selected earlier
				for (var i =0; i<that.aSubstitutedUserFilterItemList.length; i++) {
					//if keys are matching with the selected substitute, select the substtitute
					if (that.oSubstitutedUserFilterKeys[that.aSubstitutedUserFilterItemList[i].key]) {
						oSubstituesList.setSelectedItem(oSubstituesList.getItems()[i]);
					}
				}

			}
			return oDynamicSubstitutedUserList;
		},

		createSubstitutedUserFilterItems: function (sUserKey, sUserName) {
			var oSubstitutedUserEntry = {
					text : sUserName,
					key : sUserKey,
					selected : false
			};

			if (this._findFilterKey(sUserKey)) {
				oSubstitutedUserEntry.selected = true;
			}
			return oSubstitutedUserEntry;
		},

		getSubstitutedUsers: function(substitutedUserFilterItem) {

			// initially the model is empty
			var oSubstitutedUserCollectionModel = new JSONModel({});
			oSubstitutedUserCollectionModel.setData({oItems: []});
			this.createDynamicSubstiutedUserList(substitutedUserFilterItem, oSubstitutedUserCollectionModel);
			this.aSubstitutedUserFilterItemList = [];
			this.oSubstitutedUserDynamicFilter = substitutedUserFilterItem;

			var fnSuccessForSubstitutedUserList = function(oData) {
				var aUserList = oData.results, that = this;
				var aOriginalUserList = [];
				var bNewEntry;

				//Push the hardcoded "My Tasks" entry if there is at least one substituted user
				if (aUserList && aUserList.length && aUserList.length > 0) {
					var bundle = this.getView().getModel("i18n").getResourceBundle();
					var myTasksText = bundle.getText("filter.substitutingUserList.myTasks");
					var myTasksEntry = {UniqueName: "", DisplayName: myTasksText};
					aOriginalUserList.push(Substitution._processSubstitutedUsersCollection(myTasksEntry));
				}

				jQuery.each(aUserList, function(index, substitutedUser) {
					if (!jQuery.isEmptyObject(aUserList)) {
						bNewEntry = true;
						jQuery.each(aOriginalUserList, function (index, oProcessedUser) {
							if (oProcessedUser.UniqueName === substitutedUser.UniqueName) {
								bNewEntry = false;
								return false;
							}
						});
					}
					if (bNewEntry) {
						aOriginalUserList.push(Substitution._processSubstitutedUsersCollection(substitutedUser));
					}
				});

				for (var i = 0; i < aOriginalUserList.length ; i++) {
					var oSubstitutedUserFilterKey = that._FILTER_CATEGORY_SUBSTITUTED_USER + ":" + aOriginalUserList[i].UniqueName;
					var filterItem = this.createSubstitutedUserFilterItems(oSubstitutedUserFilterKey, aOriginalUserList[i].DisplayName);
					that.aSubstitutedUserFilterItemList.push(filterItem);
				}

				oSubstitutedUserCollectionModel.setData({oItems: that.aSubstitutedUserFilterItemList});
				oSubstitutedUserCollectionModel.checkUpdate(true);
				that.createDynamicSubstiutedUserList(substitutedUserFilterItem, oSubstitutedUserCollectionModel);
			};

			this.oDataManager.readSubstitutedUserList(jQuery.proxy(fnSuccessForSubstitutedUserList, this));
		},

		resetSubstitutedUserFilterCategoryCount: function(iCount) {
		if (this.oSubstitutedUserDynamicFilter!==undefined) {
			this.oSubstitutedUserDynamicFilter.setFilterCount(iCount);
			}
		},

		onShowFilter: function() {
			var that = this;
			that.aTaskTypeFilterItemsOrigins = [];
			var i18nBundle = that.getView().getModel("i18n").getResourceBundle();
			//Task type filter item
			var taskTypeFilterItem = this._createFilterCategory(i18nBundle.getText("filter.taskType"));

			this.aTaskTypeFilterItems = new Array();
			// Collect unique TaskDefinitionIDs.
			var fnSuccess = function(oResult) {

				//backup for substitutedUserFilter
				var substitutedUserDynamicFilterCountBackup = 0;
				var oSubstitutedUserFilterKeysBackUp = jQuery.extend(true, {}, this.oSubstitutedUserFilterKeys);
				if (this.oSubstitutedUserDynamicFilter) {
					substitutedUserDynamicFilterCountBackup = this.oSubstitutedUserDynamicFilter.getFilterCount();
				}

				if (!this.oDataManager.bAllItems) {
					var aScenarioServiceInfos = this.oDataManager.getScenarioConfig().ScenarioServiceInfos;
				}
				for (var i = 0; i < oResult.length; i++) {
					//display only those task types, which are part of the scenario
					var bPushIt = false;
					if (this.oDataManager.bAllItems) {
						bPushIt = true;
					}
					else {
						for (var j = 0; j < aScenarioServiceInfos.length; j++) {
							for (var k = 0; k < aScenarioServiceInfos[j].TaskDefinitionIDs.length; k++) {
								if (oResult[i].TaskDefinitionID.toUpperCase().indexOf(aScenarioServiceInfos[j].TaskDefinitionIDs[k].toUpperCase()) == 0 &&
									(aScenarioServiceInfos[j].Origin === oResult[i].SAP__Origin || this.oDataManager.sClientScenario)) {
									bPushIt = true;
									break;
								}
							}
						}
					}
					if (bPushIt) {
						var taskType = {
							taskTitle: oResult[i].TaskName,
							taskDefinitionID: oResult[i].TaskDefinitionID,
							SAP__Origin: oResult[i].SAP__Origin
						};
						this.aTaskTypeFilterItems.push(taskType);

					}
				}
				//sort task types A-Z
				this.aTaskTypeFilterItems.sort(function(taskType1, taskType2) {

					var str1 = Utils.isString(taskType1.taskTitle) ? taskType1.taskTitle : "";
					var str2 = Utils.isString(taskType2.taskTitle) ? taskType2.taskTitle : "";

					if (str1.toUpperCase() < str2.toUpperCase()) {
						return -1;
					}
					if (str1.toUpperCase() > str2.toUpperCase()) {
						return 1;
					}
					return 0;
				});
				for (var i = 0; i < this.aTaskTypeFilterItems.length; i++) {
					var ttFilterKey = this._FILTER_CATEGORY_TASK_DEFINITION_ID + ":" + this.aTaskTypeFilterItems[i].taskDefinitionID + ":" + this.aTaskTypeFilterItems[
						i].SAP__Origin;
					var filterItem = this._createFilterItem(ttFilterKey, this.aTaskTypeFilterItems[i].taskTitle);
					taskTypeFilterItem.addItem(filterItem);
				}

				if (this.oDataManager.bOutbox) {
					this.aFilterItems = OutboxFilterContributor.getAllFilters(i18nBundle,this.complexFilter);
					this.aFilterItems.push(taskTypeFilterItem);
				}
				else {
					this.aFilterItems.push(taskTypeFilterItem);
				}

				//Custom attributes
				if (this._areItemsUniqueByTaskType()) {

					var oContext = null;
					var aListItems = this.getList().getItems();
					if (aListItems && aListItems.length > 0) {
						oContext = aListItems[0].getBindingContext();
					}
					if (!oContext) {
						oContext = aListItems[1].getBindingContext();
					}

					// commenting out the code for custom attributes' sorting

					/*//CustomNumber filter
					var aCustomNumbers = this._populateAllUniqueCustomAttributes(this._CUSTOM_NUMBER_VALUE);
					aCustomNumbers.sort();

					if (aCustomNumbers.length > 0 && aCustomNumbers.length < aListItems.length / 2) {
						var customNumberFilterItem = this._createFilterCategory(oContext.getProperty(this._CUSTOM_NUMBER_LABEL), false);
						this.aFilterItems.push(customNumberFilterItem);

						for (var i = 0, iMax = aCustomNumbers.length; i < iMax; i++) {
							var CN_FILTER_KEY = this._CUSTOM_NUMBER_VALUE + ":" + aCustomNumbers[i];
							var cnFilter = this._createFilterItem(CN_FILTER_KEY, aCustomNumbers[i]);
							customNumberFilterItem.addItem(cnFilter);
						}
					}

					//CustomNumberUnit filter
					var aCustomNumberUnits = this._populateAllUniqueCustomAttributes(this._CUSTOM_NUMBER_UNIT_VALUE);
					aCustomNumberUnits.sort();
					if (aCustomNumberUnits.length > 0 && aCustomNumberUnits.length < aListItems.length / 2) {
						var customNumberUnitFilterItem = this._createFilterCategory(oContext.getProperty(this._CUSTOM_NUMBER_UNIT_LABEL), false);
						this.aFilterItems.push(customNumberUnitFilterItem);

						for (var i = 0, iMax = aCustomNumbers.length; i < iMax; i++) {
							var CNU_FILTER_KEY = this._CUSTOM_NUMBER_UNIT_VALUE + ":" + aCustomNumberUnits[i];
							var cnuFilter = this._createFilterItem(CNU_FILTER_KEY, aCustomNumberUnits[i]);
							customNumberUnitFilterItem.addItem(cnuFilter);
						}
					}

					//CustomObjectAtribute filter
					var aCustomObjectAttributes = this._populateAllUniqueCustomAttributes(this._CUSTOM_OBJECT_ATTRIBUTE_VALUE);
					aCustomObjectAttributes.sort();
					if (aCustomObjectAttributes.length > 0 && aCustomObjectAttributes.length < aListItems.length / 2) {
						var customObjectAttributeFilterItem = this._createFilterCategory(oContext.getProperty(this._CUSTOM_OBJECT_ATTRIBUTE_LABEL), false);
						this.aFilterItems.push(customObjectAttributeFilterItem);

						for (var i = 0, iMax = aCustomObjectAttributes.length; i < iMax; i++) {
							var COA_FILTER_KEY = this._CUSTOM_OBJECT_ATTRIBUTE_VALUE + ":" + aCustomObjectAttributes[i];
							var coaFilter = this._createFilterItem(COA_FILTER_KEY, aCustomObjectAttributes[i]);
							customObjectAttributeFilterItem.addItem(coaFilter);
						}
					}*/
				}

				/**
				 * @ControllerHook Change filter items
				 * This hook method can be used to modify the list of properties
				 * that are used for filtering of the S2 list items.
				 * It is called right before the filter dialog is displayed.
				 * @callback cross.fnd.fiori.inbox.view.S2~extHookChangeFilterItems
				 * @param {array} aFilterItems
				 * @return {void}
				 */
				if (this.extHookChangeFilterItems) {
					this.extHookChangeFilterItems(this.aFilterItems);
				}

			this.getFilterDialog(i18nBundle, substitutedUserDynamicFilterCountBackup, oSubstitutedUserFilterKeysBackUp).open();
		};
		// get TaskDefinitionIDs.
		if (this.getView().getModel("taskDefinitionsModel")) {
			var createFilterDialog = jQuery.proxy(fnSuccess, this);
			createFilterDialog((this.getView().getModel("taskDefinitionsModel").getData()));
		}
		else {
			this.oDataManager.readTaskDefinitionCollection(
				jQuery.proxy(fnSuccess, this), jQuery.proxy(fnSuccess, this)
			);
		}
	},

	getFilterDialog : function(i18nBundle, oSubstitutedUserDynamicFilterCountBackup, oSubstitutedUserFilterKeysBackUp) {
		var that = this;
		that.resetInitiated = false;
		if (!this.oFilterDialog) {
			this.oFilterDialog = new sap.m.ViewSettingsDialog({
					title: i18nBundle.getText("filter.dialog.title"),
					filterItems: this.aFilterItems,
					confirm: function(oEvent) {
						that.oFilterKeys = oEvent.getParameter("filterKeys");
						if (that.oSubstitutedUserFilterKeys) {
							jQuery.extend(that.oFilterKeys,that.oSubstitutedUserFilterKeys );
						}
						if (Object.keys(that.oFilterKeys).length === 0) {
							that.sInfoHeaderFilterString = null;
						}
						else {
							var i18nBundle = that.getView().getModel("i18n").getResourceBundle();
							var sSubstitutedUserFilterString= null;
							var sFilterString = oEvent.getParameter("filterString");
							//creating filter string if SubstitutedUser filter is also selected
							if (that.oSubstitutedUserFilterKeys) {
								 sSubstitutedUserFilterString = that.addFilterTextForSubstitutionFilter(sFilterString, i18nBundle);
							}
							that.sInfoHeaderFilterString = sSubstitutedUserFilterString ? sSubstitutedUserFilterString : sFilterString;
						}

						that.refreshInfoHeaderToolbar();

						// removing code related to custom attributes in list view

						/*if (that.aTaskTypeFilterItems.length > 1 && !that._doesFilterContainOneTaskDefinitionId(that.oFilterKeys)) {
							that._removeCustomAttributesFromFilter(that.oFilterKeys);

							if (that._isListSortedByCustomAttribute()) {
								//remove group by a custom attribute
								that.oGroupConfigItem = null;

								that._removeCustomAttributesSorter();
							}
						}*/

						that._saveFilterState(that.oFilterKeys);
						that.handleFilter(that.oFilterKeys);
					},

					cancel: function(oEvent) {
						if (that.resetInitiated) {
							that.complexFilter = that.complexFilterBackup;
							that.resetSubstitutedUserFilterCategoryCount(oSubstitutedUserDynamicFilterCountBackup);
							that.oSubstitutedUserFilterKeys = oSubstitutedUserFilterKeysBackUp;
							that.resetInitiated = false;
						}
					},

					resetFilters: function(oEvent) {
						if (!that.resetInitiated) {
							that.resetInitiated = true;
							that._resetFilterState();
						}
						// SubstitutedUser filter item is a ViewSettingsCustom item, hence we have to manually handle the count displayed
						that.resetSubstitutedUserFilterCategoryCount(0);
						that.resetSubstitutesListSelection(oEvent);
					}
				});
			}

			return this.oFilterDialog;
		},

		addFilterTextForSubstitutionFilter: function(sFilterText, i18nBundle) {
			var sSubsttitutedUserFilterString;
			if (sFilterText) {
				//if other filters are also applied, then append the SubstitutedUser Filter string
				sSubsttitutedUserFilterString = sFilterText + ", " + i18nBundle.getText("filter.substitutingUserList") + " (" + this.sSelectedSubstitutesNameForFilterString + ")";
			}
			else {
				sSubsttitutedUserFilterString = i18nBundle.getText("multi.header", i18nBundle.getText("filter.substitutingUserList") + " (" + this.sSelectedSubstitutesNameForFilterString + ")");
			}
			return sSubsttitutedUserFilterString;
		},

		// removing code related to custom attributes in list view
		/*_removeCustomAttributesFromFilter: function(oFilterKeys) {
			for (var key in oFilterKeys) {
				if (key.indexOf(this._CUSTOM_NUMBER_VALUE) > -1 || key.indexOf(this._CUSTOM_NUMBER_UNIT_VALUE) > -1 || key.indexOf(this._CUSTOM_OBJECT_ATTRIBUTE_VALUE) >
					-1) {
					delete oFilterKeys[key];
				}
			}
		},

		_removeCustomAttributesSorter: function() {
			var oConfig = this.oDataManager.getScenarioConfig();
			var sBackendDefaultSortKey = oConfig.SortBy;
			this.handleSort(sBackendDefaultSortKey);
			this.sSortKey = sBackendDefaultSortKey;
		},

		_isListSortedByCustomAttribute: function() {
			var sortParam = this.getList().getBinding("items").sSortParams;
			if (sortParam && (sortParam.indexOf(this._CUSTOM_NUMBER_VALUE) > -1 || sortParam.indexOf(this._CUSTOM_NUMBER_UNIT_VALUE) > -1 || sortParam.indexOf(
				this._CUSTOM_OBJECT_ATTRIBUTE_VALUE) > -1)) {
				return true;
			}
			return false;
		},

		_doesFilterContainOneTaskDefinitionId: function(oFilterKeys) {
			var taskDefIdNum = 0;
			for (var key in oFilterKeys) {
				if (key.indexOf(this._FILTER_CATEGORY_TASK_DEFINITION_ID) > -1) {
					taskDefIdNum++;
				}
			}
			if (taskDefIdNum === 1) {
				return true;
			}
			return false;
		},

		_populateAllUniqueCustomAttributes: function(propertyName) {
			var aListItems = this.getList().getItems();

			var afilterItems = [];
			var oMap = {};

			for (var i = 0; i < aListItems.length; i++) {
				var oListItem = aListItems[i];
				var oContext = oListItem.getBindingContext();
				if (!oContext) {
					continue;
				}

				var sValue = oContext.getProperty(propertyName);
				if (sValue && !oMap.hasOwnProperty(sValue)) {
					oMap[sValue] = true;
					afilterItems.push(sValue);
				}
			}
			return afilterItems;
		},*/

		_createGroupSettingItem: function(oGroupConfigItem, sText) {
			var i18nBundle = this.getView().getModel("i18n").getResourceBundle();

			if (!sText) {
				sText = i18nBundle.getText(oGroupConfigItem.textKey);
			}
			var oGroupSettingItem = new ViewSettingsItem({
				key: oGroupConfigItem.key,
				text: sText
			});

			return oGroupSettingItem;
		},

		onShowGroup: function() {
			var aGroupSettingItems = [];

			// Create ViewSettingsItems from group configuration.
			for (var i = 0; i < this.aGroupConfig.length; i++) {
				var oGroupSettingItem = this._createGroupSettingItem(this.aGroupConfig[i]);
				aGroupSettingItems.push(oGroupSettingItem);
			}

			// Display dialog.
			this.getGroupDialog(aGroupSettingItems).open();
		},

		getGroupDialog: function(oGroupSettingItems) {
			var that = this;
			if (!this.oGroupDialog) {
				this.oGroupDialog = new sap.m.ViewSettingsDialog({
					title: "{i18n>group.dialog.title}",
					groupItems: oGroupSettingItems,
					groupDescending: this.bGroupDescending,
					selectedGroupItem: this.oGroupConfigItem ? this.oGroupConfigItem.key : null,
					confirm: function(oEvent) {
						// Read out user selected setting.
						var oGroupSettingItem = oEvent.getParameter("groupItem");

						if (oGroupSettingItem && oGroupSettingItem.getKey()) {
							var sGroupSettingItemKey = oGroupSettingItem.getKey();
							for (var i = 0; i < that.aGroupConfig.length; i++) {
								var oGroupConfigItem = that.aGroupConfig[i];
								if (oGroupConfigItem.key == sGroupSettingItemKey) {
									that.oGroupConfigItem = oGroupConfigItem;
									break;
								}
							}
						}
						else {
							that.oGroupConfigItem = null;
						}
						that.bGroupDescending = oEvent.getParameter("groupDescending");
						// Do grouping.
						that.handleGroup();
					}
				});
			}
			return this.oGroupDialog;
		},

		_isListFilteredByTaskType: function(oBindingContext, aListItems) {
			var i, imax;
			for (i = 2, imax = aListItems.length; i < imax; i++) {
				var oBindingContext2 = aListItems[i].getBindingContext();
				// Shown if there is at least one due date.
				if (oBindingContext2 && oBindingContext2.getProperty("TaskDefinitionID") != oBindingContext.getProperty("TaskDefinitionID")) {
					return false;
				}
			}
			return true;
		},

		// removing code related to custom attributes in list view
		/*_addCustomAttributeGroupItems: function(aGroupSettingItems) {
			this.aCustomAttributesGroupConfig = [];
			var aListItems = this.getList().getItems();
			var oBindingContext = this._getBindingContextOfFirstItem();

			var taskTypeFiltered = this._isListFilteredByTaskType(oBindingContext, aListItems);
			if (taskTypeFiltered) {
				var aCustomNumbers = this._populateAllUniqueCustomAttributes(this._CUSTOM_NUMBER_VALUE);
				if (oBindingContext.getProperty(this._CUSTOM_NUMBER_VALUE) && aCustomNumbers.length < aListItems.length / 2) {
					var sCustomNumberLabel = oBindingContext.getProperty(this._CUSTOM_NUMBER_LABEL);
					var customNumberGroupItem = {
						key: this._CUSTOM_NUMBER_VALUE,
						textKey: null
					};
					this.aCustomAttributesGroupConfig.push(customNumberGroupItem);
					var oCustomNumberGroupSettingItem = this._createGroupSettingItem(customNumberGroupItem, sCustomNumberLabel);
					aGroupSettingItems.push(oCustomNumberGroupSettingItem);
				}

				var aCustomNumberUnits = this._populateAllUniqueCustomAttributes(this._CUSTOM_NUMBER_UNIT_VALUE);
				if (oBindingContext.getProperty(this._CUSTOM_NUMBER_UNIT_VALUE) && aCustomNumberUnits.length < aListItems.length / 2) {
					var sCustomNumberUnitLabel = oBindingContext.getProperty(this._CUSTOM_NUMBER_UNIT_LABEL);
					var customNumberUnitGroupItem = {
						key: this._CUSTOM_NUMBER_UNIT_VALUE,
						textKey: null
					};
					this.aCustomAttributesGroupConfig.push(customNumberUnitGroupItem);
					var oCustomNumberUnitGroupSettingItem = this._createGroupSettingItem(customNumberUnitGroupItem, sCustomNumberUnitLabel);
					aGroupSettingItems.push(oCustomNumberUnitGroupSettingItem);
				}

				var aCustomObjectAttributes = this._populateAllUniqueCustomAttributes(this._CUSTOM_OBJECT_ATTRIBUTE_VALUE);
				if (oBindingContext.getProperty(this._CUSTOM_OBJECT_ATTRIBUTE_VALUE) && aCustomObjectAttributes.length < aListItems.length / 2) {
					var sCustomObjectAttributeLabel = oBindingContext.getProperty(this._CUSTOM_OBJECT_ATTRIBUTE_LABEL);
					var customObjectAttributeGroupItem = {
						key: this._CUSTOM_OBJECT_ATTRIBUTE_VALUE,
						textKey: null
					};
					this.aCustomAttributesGroupConfig.push(customObjectAttributeGroupItem);
					var oCustomObjectAttributeGroupSettingItem = this._createGroupSettingItem(customObjectAttributeGroupItem, sCustomObjectAttributeLabel);
					aGroupSettingItems.push(oCustomObjectAttributeGroupSettingItem);
				}
			}
			return aGroupSettingItems;
		},*/

		prepareMultiSelect: function() {
			this.setMultiSelectButtonActive(false);

			var aListItems = this.getList().getItems();

			if (aListItems.length == 0) {
				// If list is empty, don't turn on multi-select.
				return;
			}

			var fnSuccess = function(oResult, merge) {
				var aFilterItems = [];
				if (merge && this.getView().getModel("taskDefinitionsModel")) {
					this.getView().getModel("taskDefinitionsModel").setData(oResult, false);
				}
				if (!this.oDataManager.bAllItems) {
					var aScenarioServiceInfos = this.oDataManager.getScenarioConfig().ScenarioServiceInfos;
				}
				var aFilters = [];
				for (var key in this.oFilterKeys) {
					if (this.oFilterKeys.hasOwnProperty(key) && key) {
						var aKeyParts = key.split(":");
						if (aKeyParts[0] === this._FILTER_CATEGORY_TASK_DEFINITION_ID) {
							aFilters.push(aKeyParts[1]);
						}
					}
				}
				for (var i = 0; i < oResult.length; i++) {
					// display only those task types, which are part
					// of the scenario
					var bPushIt = false;
					if (this.oDataManager.bAllItems) {
						bPushIt = true;
					}
					else {
						for (var j = 0; j < aScenarioServiceInfos.length; j++) {
							for (var k = 0; k < aScenarioServiceInfos[j].TaskDefinitionIDs.length; k++) {
								if (oResult[i].TaskDefinitionID.toUpperCase().indexOf(aScenarioServiceInfos[j].TaskDefinitionIDs[k].toUpperCase()) === 0 &&
									(aScenarioServiceInfos[j].Origin === oResult[i].SAP__Origin ||this.oDataManager.sClientScenario)
								) {
									bPushIt = true;
									break;
								}
							}
						}
					}
					if (bPushIt && (aFilters.length === 0 || aFilters.indexOf(oResult[i].TaskDefinitionID) !== -1)) {
						var oFilterItem = {
							title: oResult[i].TaskName,
							id: oResult[i].TaskDefinitionID,
							origin: oResult[i].SAP__Origin
						};
						aFilterItems.push(oFilterItem);
					}
				}

				if (aFilterItems.length > 1) {
					// If multiple TaskDefinitionIDs are present,
					// then show selection dialog.
					// Do nothing if the user cancels the dialog.

					aFilterItems.sort(function(a, b) {
						if (a.title.toUpperCase() < b.title.toUpperCase())
							return -1;
						if (a.title.toUpperCase() > b.title.toUpperCase())
							return 1;
						return 0;
					});

				MultiSelect.openFilterDialog(aFilterItems, jQuery.proxy(this.multiSelectFilterDialogOK, this), null, merge)

				return true;

			}
			else {
					// If we have only one TaskDefinitionID, then
					// selection dialog is not needed.

					var oFilterItem = aFilterItems[0];
					this.multiSelectFilterDialogOK(oFilterItem);
					return false;
				}
			};

			// get TaskDefinitionIDs.
			var iTaskDefCounter = 0;
			for (var key in this.oFilterKeys) {
				if (this.oFilterKeys.hasOwnProperty(key) && key) {
					var aKeyParts = key.split(":");
					if (aKeyParts[0] === this._FILTER_CATEGORY_TASK_DEFINITION_ID) {
						iTaskDefCounter++;
					}
				}
			}

			if (iTaskDefCounter !== 1) {
				if (this.getView().getModel("taskDefinitionsModel")) {
					var fnSuccessProxy = jQuery.proxy(fnSuccess, this);
					var filterDialogShown = fnSuccessProxy(this.getView().getModel("taskDefinitionsModel").getData());
					if (filterDialogShown) {
						this.oDataManager.readTaskDefinitionCollection(jQuery
							.proxy(fnSuccess, this), null, true);
					}
				}
				else {
					this.oDataManager.readTaskDefinitionCollection(jQuery
						.proxy(fnSuccess, this));
				}
			}
			else {
				var oList = this.getList();
				if (oList.getItems().length !== 0) {
					var oContext = {};
					for (var i = 0; i < oList.getItems().length; i++) {
						oContext = oList.getItems()[i].getBindingContext();
						if (oContext) {
							var oFilterItem = {
								title: oContext.getProperty("TaskDefinitionName"),
								id: oContext.getProperty("TaskDefinitionID"),
								origin: oContext.getProperty("SAP__Origin")
							};
							this.multiSelectFilterDialogOK(oFilterItem);
							break;
						}
					}
				}
			}
			this.bEnteringMultiSelectMode = true;
		},

		dismissMultiSelect: function() {
			this.isActionPerformed = true;
			// reset the state of the earlier selection
			this.sBindingContextPath = undefined;

			this.setMultiSelectButtonActive(false);

			this.bEnteringMultiSelectMode = false;

			var oList = this.getList();

			// Remove custom header and put back the original.

			oList.destroyHeaderToolbar();
			oList.destroyInfoToolbar();

			this.getPage().setSubHeader(this.oSubHeader);
			if (this._oControlStore.oMasterPullToRefresh)
				this._oControlStore.oMasterPullToRefresh.setVisible(true);

			this.refreshInfoHeaderToolbar();

			// Switch list to normal mode.

			oList.setMode(this.getView().getModel("device").getProperty("/listMode"));
			oList.removeSelections(true);

			// Show all items.
			this.filterItemsByTaskDefinitionID(null);

			// Clear decision buttons.
			this.clearDecisionButtons();

		},

		multiSelectFilterDialogOK: function(oFilterItem) {
			this.isActionPerformed = true;
			this.setProcessingMultiSelect({
				bProcessing: true,
				oFilterItem : oFilterItem
			});
			this.filterItemsByTaskDefinitionID(oFilterItem.id, oFilterItem.origin);
		},

		refreshInfoHeaderToolbar: function(sText) {
			// Construct header text.

			if (!sText) {
				sText = "";
			}

			if (this.sInfoHeaderGroupString) {
				if (sText)
					sText += "; ";
				sText += this.sInfoHeaderGroupString;
			}

			if (this.sInfoHeaderFilterString) {
				if (sText)
					sText += "; ";
				sText += this.sInfoHeaderFilterString;
			}

			// Refresh list headers.
			// - One for displaying an empty list in case the user fills searchbar
			// and no results are found (this._emptyList).
			// - Another one for displaying workitems (this.getList()).

			this.refreshInfoHeaderToolbarForList(this.getList(), sText);
			this.refreshInfoHeaderToolbarForList(this.emptyList(), sText);
		},

		refreshInfoHeaderToolbarForList: function(oList, sText) {
			var oHeaderToolbar = oList.getHeaderToolbar();

			if (sText) {
				// Header text is needed, create header toolbar if not visible.

				if (!oHeaderToolbar) {
					oHeaderToolbar = new Toolbar({
						design: ToolbarDesign.Info
					});

					oList.setHeaderToolbar(oHeaderToolbar);
					oList.addAriaLabelledBy(oHeaderToolbar.getIdForLabel());
				}

				oHeaderToolbar.destroyContent();
				oHeaderToolbar.setHeight(); //reset the height, because it shows older formating in mobile and tablet mode
				var oVerticalLayout = new VerticalLayout({width : "100%"});
				oVerticalLayout.addContent(new Label({
					text: sText
				}));
				if (this.sSearchPattern_Support && this.bEnteringMultiSelectMode) {
					var sSearchText = this.getView().getModel("i18n").getResourceBundle().getText("multi.header.search", this.sSearchPattern_Support);
					oVerticalLayout.addContent(new Label({
						text: sSearchText
					}));
					oHeaderToolbar.setTooltip(sText + "\n" + sSearchText);
					if (!Device.system.desktop) {
						oHeaderToolbar.setHeight("100%");
					}
				}
				else {
					oHeaderToolbar.setTooltip(sText);
				}
				oHeaderToolbar.addContent(oVerticalLayout);
			}
			else {
				// Header text is not needed, destroy header toolbar if visible.

				if (oHeaderToolbar)
					oList.destroyHeaderToolbar();
			}
		},

		downloadDecisionOptions: function(sSapOrigin, sInstanceID, sTaskTypeID) {
			// Initiate downloading of decision options for the selected TaskDefinitionID.
			// Decision options for workitems with a given TaskDefinitionID are the same,
			// therefore it is enough to download decision options for just one workitem.
			// If an error happens during downloading, then an error dialog will be
			// displayed by DataManager.

			this.oDataManager.readDecisionOptions(sSapOrigin, sInstanceID, sTaskTypeID,
				jQuery.proxy(this.downloadDecisionOptionsSuccess, this),
				null, true);
		},

		downloadCustomAttributeDefinition: function(sSapOrigin, sTaskTypeID) {
			// Initiate downloading of customAttributeData

			this.oDataManager.readCustomAttributeDefinitionData(
				sSapOrigin,
				sTaskTypeID,
				jQuery.proxy(this.downloadCustomAttributeDefinitionSuccess, this),
				null, true);
		},

		downloadCustomAttributeDefinitionSuccess: function (oData) {
			var CustomAttributeDefinitions = oData.CustomAttributeDefinitionData;

			if (CustomAttributeDefinitions) {
				var CADefsModel = this.getOwnerComponent().getModel("customAttributeDefinitionsModel");
				if (CADefsModel) {
					CADefsModel.setData(CustomAttributeDefinitions);
					cross.fnd.fiori.inbox.util.MultiSelect.customAttributeDefinitionsLoaded.resolve();
				}
			}
		},

		downloadDecisionOptionsSuccess: function(aDecisionOptions) {
			this.setMultiSelectButtonActive(true);

			if (!Device.system.phone)
				this.oRouter.navTo("multi_select_summary", {}, true);

			var oList = this.getList();

			this.oSelectAllCheckBox = new CheckBox({
				select: jQuery.proxy(this.handleSelectAllCheckBoxPress, this)
			});

			// FIXME: Checkbox positioning.
			var oInfoToolbar = new Toolbar({
				design: ToolbarDesign.Transparent,
				content: [
					this.oSelectAllCheckBox
				]
			});

			oInfoToolbar.addStyleClass("crossFndFioriInboxInfoToolbarPadding");

			oList.setInfoToolbar(oInfoToolbar);

			this.getPage().setSubHeader(null);
			if (this._oControlStore.oMasterPullToRefresh)
				this._oControlStore.oMasterPullToRefresh.setVisible(false);

			// Switch list to multi-select mode.

			oList.removeSelections(true);

			this.aMultiSelectDecisionOptions = aDecisionOptions;

			// Refresh footer (to hide filtering/sort/grouping buttons).

			this.getAppImp().oMHFHelper.defineMasterHeaderFooter(this);

			// Update Select All checkbox status (have to be done after filtering items).

			this.updateSelectAllCheckBox();
		},

		_handleSelect: function(oEvent) {
			if (!this.isMultiSelectActive()) {
				this.setListItem(oEvent.getParameter("listItem"));
				if (!Device.system.phone) {
					// note: this only applies when device is in
					// portrait mode
					this.getSplitContainer().hideMaster();
				}
			}
			else {
				var listItem = oEvent.getParameter("listItem");
				var itemContext = listItem.getBindingContext();

				// Handle manual item selection.
				this.updateMultiSelectState();

				var aWorkItem = [jQuery.extend(true, {}, itemContext.getProperty())];

				// needed for further in the chain to get custom attributes
				aWorkItem[0].listItem = listItem;

				//notify Multi Select Summary screen
				this.publishMultiSelectEvent(oEvent.getParameter("selected"), aWorkItem);
			}

			sap.ui.getCore().getEventBus().publish(
				"Channel2",
				"Event2",
				oEvent.mParameters.listItem.mProperties.title
			);
			
		},

		updateMultiSelectState: function() {
			var iSelectedListItemsCount = this.getList().getSelectedItems().length;

			switch (iSelectedListItemsCount) {
				case 0:
					// No selected items, hide decision options.

					this.hideDecisionButtons();
					break;

				default:
					// Once an item is selected, then display decision options.

					this.showDecisionButtons();
					break;
			}

			// Update Select All checkbox status.

			this.updateSelectAllCheckBox();
		},

		publishMultiSelectEvent: function(bSelected, aWorkItems, reInitialize, sSource) {
			var oMultiSelectEvent = {};
			oMultiSelectEvent.Source = sSource ? sSource : "S2";
			oMultiSelectEvent.Selected = bSelected;
			oMultiSelectEvent.WorkItems = aWorkItems;
			oMultiSelectEvent.reInitialize = reInitialize;
			cross.fnd.fiori.inbox.util.tools.Application.getImpl().getComponent().getEventBus().publish("cross.fnd.fiori.inbox", "multiselect", oMultiSelectEvent);
		},

		getActualListItems: function() {
			var aListItems = [];
			var aOriginListItems = this.getList().getItems();
			var i = 0;
			// This will only be entered when grouping is enabled:
			if (aOriginListItems[0] instanceof GroupHeaderListItem) {
				for (i = 1; i < aOriginListItems.length; i++) {
					if (!(aOriginListItems[i] instanceof GroupHeaderListItem)) {
						if (this.sSearchPattern_Support) {
							if (aOriginListItems[i].getVisible()) {
								aListItems.push(aOriginListItems[i]);
							}
						}
						else {
							aListItems.push(aOriginListItems[i]);
						}
					}
				}
			}
			else if (this.sSearchPattern_Support) {
				for (i = 0; i < aOriginListItems.length; i++) {
					if (aOriginListItems[i].getVisible()) {
						aListItems.push(aOriginListItems[i]);
					}
				}
			}
			else {
				aListItems = this.getList().getItems();
			}
			return aListItems;
		},

		updateSelectAllCheckBox: function() {
			var i18nBundle = this.getView().getModel("i18n").getResourceBundle();
			var bSelectAll = this.getList().getSelectedItems().length < this.getActualListItems().length;
			if (this.oSelectAllCheckBox) {
				this.oSelectAllCheckBox.setText(i18nBundle.getText(bSelectAll ? "multi.selectall" : "multi.deselectall"));
				this.oSelectAllCheckBox.setSelected(!bSelectAll);
			}
		},

		handleSelectAllCheckBoxPress: function() {
			var aListItems = this.getActualListItems();
			// Handle Select All / Deselect All.
			if (this.getList().getSelectedItems().length < aListItems.length) {
				var aActiveListItems = [];
				for (var i = 0; i < aListItems.length; i++) {
					var oListItem = aListItems[i];

					if (!oListItem.getBindingContext()) {
						continue;
					}
					if (oListItem.getVisible()) {
						oListItem.setSelected(true);
						var workListItem = jQuery.extend(true, {}, oListItem.getBindingContext().getProperty());
						// needed for further in the chain to get custom attributes
						workListItem.listItem = oListItem;
						aActiveListItems.push(workListItem);
					}
				}
				//notify Multi Select Summary screen
				//all items are selected
				this.publishMultiSelectEvent(true, aActiveListItems);
			}
			else {
				// Deselect all items.
				this.getList().removeSelections(true);
				//notify Multi Select Summary screen
				//all items are deselected
				this.publishMultiSelectEvent(false, []);
			}
			this.updateMultiSelectState();
		},

		onMultiSelectEvent: function(sChannelId, sEventId, oMultiSelectEvent) {
			if (oMultiSelectEvent.Source === "MultiSelectSummary" || oMultiSelectEvent.Source === "action") {
				var oList = this.getList();
				var aListItems = oList.getItems();

				for (var i = 0; i < oMultiSelectEvent.WorkItems.length; i++) {
					for (var j = 0; j < aListItems.length; j++) {
						var oListItem = aListItems[j];

						var oContext = oListItem.getBindingContext();
						if (!oContext)
							continue;

						if (oContext.getProperty("SAP__Origin") === oMultiSelectEvent.WorkItems[i].SAP__Origin &&
							oContext.getProperty("InstanceID") === oMultiSelectEvent.WorkItems[i].InstanceID)
							oListItem.setSelected(oMultiSelectEvent.Selected);
					}
				}

				this.updateMultiSelectState();
			}
		},

		onSupportInfoOpenEvent: function(sChannelId, sEventId, oSupportInfoOpenEvent) {
			if (oSupportInfoOpenEvent.source === "MAIN") {
				SupportInfo.setSearchPattern(this.sSearchPattern_Support);
				SupportInfo.setFilters(this.sFilterKey_Support);
				SupportInfo.setSorters(this.sSortKey_Support);
				SupportInfo.setGroup(this.sGroupkey_Support);
			}
		},

		filterItemsByTaskDefinitionID: function(sTaskDefinitionID, sOrigin) {
			if (sTaskDefinitionID) {
				// copy the filter keys object
				this.oFilterKeysBeforeMultiSelect = jQuery.extend(true, {}, this.oFilterKeys);
				var oFilterKeys = {};
				var sSapOrigin = sOrigin ? sOrigin : "";

				oFilterKeys["TaskDefinitionID:" + sTaskDefinitionID + ":" + sSapOrigin] = true;
				var bStatusFilter = false;

				for (var key in this.oFilterKeys) {
					if (this.oFilterKeys.hasOwnProperty(key) && key) {
						var aKeyParts = key.split(":");
						if (aKeyParts[0] !== this._FILTER_CATEGORY_TASK_DEFINITION_ID) {
							if (aKeyParts[0] === this._FILTER_CATEGORY_STATUS &&
								aKeyParts[1] !== InboxFilterContributor._FILTER_STATUS_AWAITING_CONFIRMATION) {
								oFilterKeys[key] = true;
								bStatusFilter = true;
							}
							else if (aKeyParts[0] !== this._FILTER_CATEGORY_STATUS) {
								oFilterKeys[key] = true;
							}
						}
					}
				}
				if (!bStatusFilter) {
					oFilterKeys[this._FILTER_CATEGORY_STATUS + ":" + InboxFilterContributor._FILTER_STATUS_NEW] = true;
					oFilterKeys[this._FILTER_CATEGORY_STATUS + ":" + InboxFilterContributor._FILTER_STATUS_IN_PROGRESS] = true;
					oFilterKeys[this._FILTER_CATEGORY_STATUS + ":" + InboxFilterContributor._FILTER_STATUS_RESERVED] = true;
				}
				this.oFilterKeys = oFilterKeys;
				return this.handleFilter(this.oFilterKeys);
			}
			else if (this.oFilterKeysBeforeMultiSelect) {
				this.oFilterKeys = jQuery.extend(true, {}, this.oFilterKeysBeforeMultiSelect);
				return this.handleFilter(this.oFilterKeys);
			}
		},

		clearDecisionButtons: function() {
			this.oMultiSelectActions = {
				positiveAction: null,
				negativeAction: null,
				additionalActions: []
			};
		},

		hideDecisionButtons: function() {
			// Clear decision buttons.

			this.clearDecisionButtons();

			// Refresh footer (to remove decision buttons).

			this.getAppImp().oMHFHelper.defineMasterHeaderFooter(this);
		},

		checkDecisionSupport: function(aSelectedItems) {
			var oContext;
			var oDecisions = {
				Claim: true,
				Release: true,
				Forward: true,
				Resubmit: true
			};
			for (var i = 0; i < aSelectedItems.length; i++) {
				oContext = aSelectedItems[i].getBindingContext();
				// If one of the selected tasks doesn't support a multi-action then all won't:
				oDecisions.Claim = oDecisions.Claim && Conversions.formatterSupportsProperty(oContext.getProperty("TaskSupports").Claim, oContext.getProperty("SupportsClaim"));
				oDecisions.Release = oDecisions.Release && Conversions.formatterSupportsProperty(oContext.getProperty("TaskSupports").Release, oContext.getProperty("SupportsRelease"));
				oDecisions.Forward = oDecisions.Forward && Conversions.formatterSupportsProperty(oContext.getProperty("TaskSupports").Forward, oContext.getProperty("SupportsForward"));
				oDecisions.Resubmit = oDecisions.Resubmit && Conversions.formatterSupportsProperty(oContext.getProperty("TaskSupports").Resubmit, false);
				if (!oDecisions.Claim && !oDecisions.Release && !oDecisions.Forward && !oDecisions.Resubmit) {
					break;
				}
			}
			return oDecisions;
		},

		showDecisionButtons: function() {
			// Clear decision buttons.
			this.clearDecisionButtons();

			// Create buttons.
			var that = this,
				iTotalDecisionOptions = this.aMultiSelectDecisionOptions ? this.aMultiSelectDecisionOptions.length : 0;

			var iDisplayOrderPriorityTemp = 1;
			var iDisplayOrderPriorityValue = 0;

			if (iTotalDecisionOptions > 0) {
				var sSapOrigin = null;
				var aSelectedItems = this.getList().getSelectedItems();
				if (aSelectedItems.length > 0) {
					sSapOrigin = aSelectedItems[0].getBindingContext().getProperty("SAP__Origin");
				}

				for (var i = 0; i < iTotalDecisionOptions; i++) {
					var oDecisionOption = this.aMultiSelectDecisionOptions[i];
					var sDecisionText = oDecisionOption.DecisionText;
					oDecisionOption.SAP__Origin = sSapOrigin;

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

					var oButton = {
						iDisplayOrderPriority: iDisplayOrderPriorityValue,
						nature: oDecisionOption.Nature,
						sBtnTxt: sDecisionText,
						onBtnPressed: (function(oDecisionOption) {
							return function() {
								that.showDecisionDialog(oDecisionOption);
							};
						})(oDecisionOption)
					};
					this.oMultiSelectActions.additionalActions.push(oButton);
				}
			}

			var aSelectedListItems = this.getList().getSelectedItems();
			var oDecisionsSupported = this.checkDecisionSupport(aSelectedListItems);

			if (oDecisionsSupported.Claim === true) {
				iDisplayOrderPriorityValue = 1500 + iDisplayOrderPriorityTemp;
				iDisplayOrderPriorityTemp++;
				var oClaimButton = {
					iDisplayOrderPriority: iDisplayOrderPriorityValue,
					sI18nBtnTxt: "XBUT_CLAIM",
					onBtnPressed: jQuery.proxy(this.sendMultiClaimRelease, this, aSelectedListItems, this.oDataManager.sClaimAction)
				};
				this.oMultiSelectActions.additionalActions.push(oClaimButton);
			}

			if (oDecisionsSupported.Release === true) {
				iDisplayOrderPriorityValue = 1500 + iDisplayOrderPriorityTemp;
				iDisplayOrderPriorityTemp++;
				var oReleaseButton = {
					iDisplayOrderPriority: iDisplayOrderPriorityValue,
					sI18nBtnTxt: "XBUT_RELEASE",
					onBtnPressed: jQuery.proxy(this.sendMultiClaimRelease, this, aSelectedListItems, this.oDataManager.sReleaseAction)
				};
				this.oMultiSelectActions.additionalActions.push(oReleaseButton);
			}

			if (oDecisionsSupported.Forward === true) {
				iDisplayOrderPriorityValue = 1500 + iDisplayOrderPriorityTemp;
				iDisplayOrderPriorityTemp++;
				var oForwardButton = {
					iDisplayOrderPriority: iDisplayOrderPriorityValue,
					sI18nBtnTxt: "XBUT_FORWARD",
					onBtnPressed: jQuery.proxy(this.onForwardPopUp, this)
				};
				this.oMultiSelectActions.additionalActions.push(oForwardButton);
			}

			if (oDecisionsSupported.Resubmit === true) {
				iDisplayOrderPriorityValue = 1500 + iDisplayOrderPriorityTemp;
				iDisplayOrderPriorityTemp++;
				var oResubmitButton = {
					iDisplayOrderPriority: iDisplayOrderPriorityValue,
					sI18nBtnTxt: "XBUT_RESUBMIT",
					onBtnPressed: jQuery.proxy(this.showResubmitPopUp, this)
				};
				this.oMultiSelectActions.additionalActions.push(oResubmitButton);
			}

			var oButtonList = {};
			oButtonList.oPositiveAction = this.oMultiSelectActions.positiveAction;
			oButtonList.oNegativeAction = this.oMultiSelectActions.negativeAction;
			oButtonList.aButtonList = this.oMultiSelectActions.additionalActions;

			/**
			 * @ControllerHook Modify the footer buttons
			 * This hook method can be used to add and change buttons for the list view footer in mass approval mode
			 * It is called before the list of buttons are created in the footer
			 * @callback cross.fnd.fiori.inbox.view.S2~extHookChangeMassApprovalButtons
			 * @param {object} oButtonList - contains the positive, negative buttons and the additional button list.
			 * @return {void}
			 */
			if (this.extHookChangeMassApprovalButtons) {

				this.extHookChangeMassApprovalButtons(oButtonList);

				this.oMultiSelectActions.positiveAction = oButtonList.oPositiveAction;
				this.oMultiSelectActions.negativeAction = oButtonList.oNegativeAction;
				this.oMultiSelectActions.additionalActions = oButtonList.aButtonList;

			}

			if (this.oMultiSelectActions && this.oMultiSelectActions.additionalActions) {
				this.oMultiSelectActions.additionalActions.sort(CommonFunctions.compareButtons);
			}

			// Refresh footer (to display decision buttons).

			this.getAppImp().oMHFHelper.defineMasterHeaderFooter(this);
		},

		showDecisionDialog: function(oDecisionOption) {
			// Display confirmation dialog.
			var aSelectedListItems = this.getList().getSelectedItems();
			var i18nBundle = this.getView().getModel("i18n").getResourceBundle();

			// Could easily be scaled to downloading multiple things using Promise.all
			var reasonOptionsLoadedPromise = oDecisionOption && (oDecisionOption.ReasonRequired === "REQUIRED" || oDecisionOption.ReasonRequired === "OPTIONAL") ?
				this.oConfirmationDialogManager.loadReasonOptions(oDecisionOption, this.oDataManager) :	null;

			var decisionDialogSettings = {
				question: i18nBundle.getText(aSelectedListItems.length > 1 ? "XMSG_MULTI_DECISION_QUESTION_PLURAL" : "XMSG_MULTI_DECISION_QUESTION", [
					oDecisionOption.DecisionText, aSelectedListItems.length
				]),
				textAreaLabel : i18nBundle.getText("XFLD_TextArea_Decision"),
				showNote: true,
				title: i18nBundle.getText("XTIT_SUBMIT_DECISION"),
				confirmButtonLabel: i18nBundle.getText("XBUT_SUBMIT"),
				noteMandatory: oDecisionOption.CommentMandatory,
				confirmActionHandler: jQuery.proxy(
					function(oDeciOption, sNote, sReasonOptionKey) {
						this.sendMultiSelectAction(oDeciOption, sNote, sReasonOptionKey);
					}, this, oDecisionOption)
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
					Log.error("Could not load the reason options properly");
				});
			}
		},

		sendMultiClaimRelease: function(aItems, sAction) {
			var iTotalItems = this.getList().getBinding("items").getLength();
			var bAllItemsSelected = (aItems.length === iTotalItems) ? true : false;
			this.oDataManager.doMassClaimRelease(aItems, sAction, jQuery.proxy(this.sendMultiClaimReleaseSuccess, this, bAllItemsSelected, sAction), null);
		},

		sendMultiClaimReleaseSuccess: function(bAllItemsSelected, sAction, aSuccessList, aErrorList) {
			if (aErrorList.length === 0) {
				var singularText, pluralText;
				var i18nBundle = this.getView().getModel("i18n").getResourceBundle();
				if (sAction === this.oDataManager.sClaimAction) {
					singularText = "dialog.success.multi_reserve";
					pluralText = "dialog.success.multi_reserve_plural";
				}
				else {
					singularText = "dialog.success.multi_release";
					pluralText = "dialog.success.multi_release_plural";
				}

				setTimeout(function() {
					MessageToast.show(i18nBundle.getText(aSuccessList.length > 1 ? pluralText :
						singularText, [aSuccessList.length]));
				}.bind(this), 500);

				this.getList().removeSelections(true);
				this.sendMultiSelectActionEnd(bAllItemsSelected);
			}
			else {
				MultiSelect.openMessageDialog(aSuccessList, aErrorList,
					jQuery.proxy(this.sendMultiSelectActionEnd, this, bAllItemsSelected, aErrorList));
			}
		},

		sendMultiSelectAction: function(oDecisionOption, sNote, sReasonOptionCode) {
			var aSelectedListItems = this.getList().getSelectedItems();
			var aItems = [];

			for (var i = 0; i < aSelectedListItems.length; i++) {
				var oItem = aSelectedListItems[i].getBindingContext().getObject();
				aItems.push(oItem);
			}

			var iTotalItems = this.getList().getBinding("items").getLength();
			var bAllItemsSelected = aItems.length === iTotalItems ? true : false;

			// If an error happens during batch send, then an error dialog will be
			// displayed by DataManager.

			this.oDataManager.sendMultiAction(this._FUNCTION_IMPORT_DECISION, aItems, oDecisionOption, sNote, sReasonOptionCode,
				jQuery.proxy(this.sendMultiSelectActionSuccess, this, bAllItemsSelected),
				null, true);
		},

		sendMultiSelectActionSuccess: function(bAllItemsSelected, aSuccessList, aErrorList) {
			// Display success or error messages.

			if (aErrorList.length === 0) {
				var i18nBundle = this.getView().getModel("i18n").getResourceBundle();

				setTimeout(function() {
						MessageToast.show(i18nBundle.getText(aSuccessList.length > 1 ? "dialog.success.multi_complete_plural" :
							"dialog.success.multi_complete", aSuccessList.length));
				}.bind(this), 500);

				this.sendMultiSelectActionEnd(bAllItemsSelected);
			}
			else {
				MultiSelect.openMessageDialog(aSuccessList, aErrorList,
					jQuery.proxy(this.sendMultiSelectActionEnd, this, bAllItemsSelected, aErrorList));
			}
		},

		sendMultiSelectActionEnd: function(bAllItemsSelected, aErrorList) {
			// If paging is enabled the model has to be refreshed when a task action is performed, because otherwise the list doesn't get updated:
			if (this.oDataManager.getPagingEnabled()) {
				this.oDataManager.oModel.refresh();
			}
			//Some Selected items have been successfuly approved and some erroneous and there are no more items of the selected Task Type
			//Some Selected items have been successfuly approved and some erroneous and there are more items of the selected Task Type
			if (aErrorList) {
				this.publishMultiSelectEvent(true, aErrorList, true, "action");
			}
			else if (bAllItemsSelected) {
				//Selected items have been successfuly approved and there are no more items of the selected Task Type
				//Turn off multi-select if all the items have been approved.
				this.dismissMultiSelect();

				// Refresh workitems.
				this.getView().getModel().bFullRefreshNeeded = true;
				this.getView().getModel().refresh();
			}
			else {
				//Selected items have been successfuly approved and there are still more items of the selected Task Type
				//Keep Multi-select and update the MultiSelectSummary
				this.publishMultiSelectEvent(false, [], true, "action");
			}
		},

		sendMultiSelectForwardSuccess: function(bAllItemsSelected, aSuccessList, aErrorList, oAgent) {
			// Display success or error messages.

			if (aErrorList.length === 0) {
				var i18nBundle = this.getView().getModel("i18n").getResourceBundle();

				setTimeout(function() {
					MessageToast.show(i18nBundle.getText(aSuccessList.length > 1 ? "dialog.success.multi_forward_complete_plural" :
						"dialog.success.multi_forward_complete", [aSuccessList.length, oAgent.DisplayName]));
				}.bind(this), 500);

				this.sendMultiSelectActionEnd(bAllItemsSelected);
			}
			else {
				MultiSelect.openMessageDialog(aSuccessList, aErrorList,
					jQuery.proxy(this.sendMultiSelectActionEnd, this, bAllItemsSelected, aErrorList));
			}
		},

		isMultiSelectActive: function() {
			return (this.getList().getMode() == ListMode.MultiSelect);
		},

		setProcessingMultiSelect: function(oMultiSelectProcessingData) {
			this.getView().getModel().oProcessingMultiSelect = jQuery.isEmptyObject(oMultiSelectProcessingData) ? undefined : oMultiSelectProcessingData;
		},

		setMultiSelectButtonActive: function(bActive) {
			this._oControlStore.bEditState = bActive;
			this._oControlStore.oEditBtn.setIcon(bActive ? "sap-icon://sys-cancel" : "sap-icon://multi-select");
			this._oControlStore.oEditBtn.setTooltip(this.getView().getModel("i18n").getResourceBundle().getText(bActive ? "XBUT_CANCEL" : "XBUT_MULTI_SELECT"));
		},

		loadInitialAppData: function() {
			this.oDataManager.fetchTaskDefinitionsandCustomAttributeDefinitions(jQuery.proxy(this.oDataManager.initTaskDefnandCustomAttrDefnnModel, this));
			if (this.oDataManager.sScenarioId || this.oDataManager.sClientScenario) {
				this.oDataManager.loadInitialAppData(jQuery.proxy(function(oScenario) {
					if (!oScenario) {
						return;
					}
					this.getView().getModel().ScenarioServiceInfos = oScenario.ScenarioServiceInfos;

					// get the config with the possible url parameter overrides
					var oConfig = this.oDataManager.getScenarioConfig();

					if ((oScenario.ScenarioServiceInfos.length === 1) || (oConfig.AllItems == true))
						this.bDisplaySortOption = true;

					this.bDisplayMultiSelectButton = oConfig.IsMassActionEnabled;

					// Get default sort key from backend.

					this.sBackendDefaultSortKey = oConfig.SortBy;

					this.fnAddAditionalSelectPropertiesAndInitBinding();

					// set the sort options
					if (this.bDisplaySortOption) {
						this.setSortItemsToDisplay();
					}
				}, this));
			}
			else {
				var oConfig = this.oDataManager.getScenarioConfig();
				if (oConfig.AllItems === true) {
					this.bDisplayMultiSelectButton = oConfig.IsMassActionEnabled ? true : false;
					this.bDisplaySortOption = true;
					this.sBackendDefaultSortKey = oConfig.SortBy;
					this.fnAddAditionalSelectPropertiesAndInitBinding();
					// set the sort options
					if (this.bDisplaySortOption) {
						this.setSortItemsToDisplay();
					}
				}
			}

		},

		// Used to add those select properties in TaskCollection call that needs to be checked in metadata first
		// currently adding GUI_Link
		// takes around 30ms before initializing list binding
		fnAddAditionalSelectPropertiesAndInitBinding: function() {
			var that = this;
			that.oDataManager.oModel.getMetaModel().loaded().then(function(oMetaModel) {
				that.oDataManager.oServiceMetaModel = that.oDataManager.oModel.getMetaModel();
				if (that.oDataManager.checkPropertyExistsInMetadata("GUI_Link")) {
					that.bGUILinkSelectPropertySupported = true;
				}
				that.initListBinding(that.configureSorters(that.sBackendDefaultSortKey), that.getAllFilters());
			});

		},

		//This function takes care of binding the List on initial load of the application. The sorters and the filters could be different in All Items and Scenario
		//definition cases, hence these are parameterized.
		initListBinding: function(aSorters, aFilters) {
			var aPropertiesToSelect = this.aSelectProperties.concat(); //creating a copy of aSelectProperties

			/**
			 * @ControllerHook Add additional properties related to the work item to the $Select system query option
			 * This hook method can be used to add additional properties to the $select list of the master data request
			 * It is called when the master view is displayed and the before the master list binding is initialized
			 * @callback cross.fnd.fiori.inbox.view.S2~extHookGetPropertiesToSelect
			 * @return {array} aProperties - contains the names of the related properties
			 */
			if (this.extHookGetPropertiesToSelect) {
				var aProperties = this.extHookGetPropertiesToSelect();
				// append custom entity sets to the default list
				aPropertiesToSelect = aPropertiesToSelect.concat(aProperties);
			}

			if (this.oDataManager.bOutbox) {
				aPropertiesToSelect = aPropertiesToSelect.concat(this.aSelectPropertiesOutbox);
			}

			// if loading custom attribute data for list, add CustomAttributeData property in the select
			if (this.oDataManager.getShowAdditionalAttributes() === true) {
				aPropertiesToSelect.push(this.sCustomAttributeDataProperty);
			}

			if (this.bGUILinkSelectPropertySupported) { //if GUI_Link is supported, add it to select properties
				aPropertiesToSelect.push(this._GUI_LINK_SELECT_PROPERTY);
			}

			var sOppMode = "";
			var bDoNotLoadNewTasksfterAction;
			if (this.oDataManager.getOperationMode() === OperationMode.Client) {
				sOppMode = OperationMode.Client;
			}
			else {
				sOppMode = OperationMode.Server;
				if (this.oDataManager.getPagingEnabled() === false) {
					bDoNotLoadNewTasksfterAction = true;
				}
			}

			var oParameters = {
				countMode: CountMode.InlineRepeat,
				faultTolerant: true,
				operationMode: sOppMode,
				doNotLoadNewTasksfterAction: bDoNotLoadNewTasksfterAction,
				//threshold: 2000,
				select: aPropertiesToSelect.join(",")
			};

			if (this.oDataManager.getShowAdditionalAttributes() === true) {
				oParameters.expand = "CustomAttributeData";
			}

			this.getList().bindAggregation("items",{
				path:"/TaskCollection",
				template: this.getView().byId("MAIN_LIST_ITEM"),
				sorter: aSorters,
				filters: aFilters,
				templateShareable: true,
				parameters: oParameters
			});

			// bind master list
			this.registerMasterListBind();
		},

		getAllFilters: function(oAdditionalFilter) {
			var aFilters = [];
			var oScenarioConfig = this.oDataManager.getScenarioConfig();
			var bAllItems = oScenarioConfig.AllItems;
			var oModel = this.getView().getModel();
			if (bAllItems)
				aFilters = this.getFiltersWithoutScenario(oModel);
			else
				aFilters = this.getFiltersWithScenario(oModel);

			if (oAdditionalFilter)
				aFilters.push(oAdditionalFilter);

			//add status filter
			var aStatusFilterKeys = oModel.aStatusFilterKeys;
			var statusFilters = TaskStatusFilterProvider.getAllFilters(this.oDataManager.bOutbox, aStatusFilterKeys,aFilters);
			aFilters.push(new Filter(statusFilters, false));

			return [new Filter(aFilters, true)];
		},

		getFiltersWithoutScenario: function(oModel) {
			var that = this;
			var aFilters = [];
			var aTaskDefinitionIDFilterKeys = oModel.aTaskDefinitionIDFilterKeys || [];
			var aSubstitutedUserFilterKeys = oModel.aSubstitutedUserFilterKeys || [];
			var aStatusFilterKeys = oModel.aStatusFilterKeys;

			if (!aTaskDefinitionIDFilterKeys)
				aTaskDefinitionIDFilterKeys = [];
			if (!aSubstitutedUserFilterKeys)
				aSubstitutedUserFilterKeys = [];
			if (!aStatusFilterKeys)
				aStatusFilterKeys = [];

			var aTaskDefinitionIDFilters = [];
			var aSubstitutedUserFilters = [];
			var aSapOriginsFilters = [];
			var aOriginsApplied = [];

			for (var j = 0; j < aTaskDefinitionIDFilterKeys.length; j++) {
				var oTaskDefinitionIDFilter = new Filter({
					path: "TaskDefinitionID",
					operator: FilterOperator.EQ,
					value1: aTaskDefinitionIDFilterKeys[j]
				});
				aTaskDefinitionIDFilters.push(oTaskDefinitionIDFilter);
				if (aOriginsApplied.indexOf(that.aTaskTypeFilterItemsOrigins[j]) !== -1) {
					continue;
				}

				var oSapOriginFilter = new Filter({
					path: "SAP__Origin",
					operator: FilterOperator.EQ,
					value1: that.aTaskTypeFilterItemsOrigins[j]
				});
				aSapOriginsFilters.push(oSapOriginFilter);
				aOriginsApplied.push(that.aTaskTypeFilterItemsOrigins[j]);
			}

			aSubstitutedUserFilters = Substitution._getSubstitutedUserFilters(aSubstitutedUserFilterKeys);

			if (aSapOriginsFilters.length > 0)
				aFilters.push(new Filter(aSapOriginsFilters, false));

			if (aTaskDefinitionIDFilters.length > 0) {
				aFilters.push(new Filter(aTaskDefinitionIDFilters, false));
			}

			if (aSubstitutedUserFilters.length > 0) {
				aFilters.push(new Filter(aSubstitutedUserFilters, false));
			}

			return aFilters;
		},

		getFiltersWithScenario: function(oModel) {
			var aFilters = [];
			var aTaskDefinitionIDFilterKeys = oModel.aTaskDefinitionIDFilterKeys;
			var aSubstitutedUserFilterKeys = oModel.aSubstitutedUserFilterKeys;
			var aStatusFilterKeys = oModel.aStatusFilterKeys;
			var oScenarioConfig = this.oDataManager.getScenarioConfig();
			var that = this;

			if (!aTaskDefinitionIDFilterKeys)
				aTaskDefinitionIDFilterKeys = [];
			if (!aSubstitutedUserFilterKeys)
				aSubstitutedUserFilterKeys = [];
			if (!aStatusFilterKeys)
				aStatusFilterKeys = [];

			var aSapOriginsFilters = [];
			var aOriginsApplied = [];
			var oSapOriginFilter = {};
			var bIsTaskTypeFilterApplied = aTaskDefinitionIDFilterKeys.length > 0 ? true : false;
			var aTaskDefinitionIDsToApply = [];
			var aTaskDefinitionIDFilters = [];
			var aSubstitutedUserFilters = [];

			//List binding data fetch - TaskCollection in batch
			for (var i = 0; i < oScenarioConfig.ScenarioServiceInfos.length; i++) {
				var oScenarioServiceInfo = oScenarioConfig.ScenarioServiceInfos[i];

				// Step 1: TaskDefinitionID
				var bTaskExistsInScenario = false;
				var sTaskDefIDForFilter = "";

				for (var j = 0; j < oScenarioServiceInfo.TaskDefinitionIDs.length; j++) {
					bTaskExistsInScenario = false;
					sTaskDefIDForFilter = "";
					// Check aTaskDefinitionIDFilterKeys if we are filtering for task definition IDs.

					for (var k = 0; k < aTaskDefinitionIDFilterKeys.length; k++) {
						// if the tasks filtered are present in the scenario
						if (aTaskDefinitionIDFilterKeys[k].toUpperCase().indexOf(oScenarioServiceInfo.TaskDefinitionIDs[j].toUpperCase()) == 0) {
							bTaskExistsInScenario = true;
							sTaskDefIDForFilter = aTaskDefinitionIDFilterKeys[k];

							// Get Unique SAP__Origin, if this is not a client scenario
							if (!this.oDataManager.sClientScenario) {
								if (aOriginsApplied.indexOf(that.aTaskTypeFilterItemsOrigins[k]) == -1) {
									oSapOriginFilter = new Filter({
										path: "SAP__Origin",
										operator: FilterOperator.EQ,
										value1: that.aTaskTypeFilterItemsOrigins[k]
									});
									aSapOriginsFilters.push(oSapOriginFilter);
									aOriginsApplied.push(that.aTaskTypeFilterItemsOrigins[k]);
								}
							}
							break;
						}
					}

					// skip creating filter if filtered by task type but the task does not exist in the scenario
					if (aTaskDefinitionIDFilterKeys.length > 0 && !bTaskExistsInScenario)
						continue;

					//Creating filters for task definition ID, only if (not filtered by task type) or (filtered by task type and task exists in scenario)
					if (!bTaskExistsInScenario) { // if task type filter not applied, fetch task definition id from the scenario
						sTaskDefIDForFilter = oScenarioServiceInfo.TaskDefinitionIDs[j];
					}
					if (aTaskDefinitionIDsToApply.indexOf(sTaskDefIDForFilter) == -1) {
						var oTaskDefinitionIDFilter = new Filter({
							path: "TaskDefinitionID",
							operator: FilterOperator.EQ,
							value1: sTaskDefIDForFilter
						});
						aTaskDefinitionIDFilters.push(oTaskDefinitionIDFilter);
					}

				}

				//Skip SAP__Origin filter in case of client scenario
				if (!this.oDataManager.sClientScenario) {
					// Donot send SAP Origin from Scenarios if Task Type filter is applied
					if (!bIsTaskTypeFilterApplied && aOriginsApplied.indexOf(oScenarioServiceInfo.Origin) == -1) {
						oSapOriginFilter = new Filter({
							path: "SAP__Origin",
							operator: FilterOperator.EQ,
							value1: oScenarioServiceInfo.Origin
						});
						aOriginsApplied.push(oScenarioServiceInfo.Origin);
						aSapOriginsFilters.push(oSapOriginFilter);
					}
				}
			}

			aSubstitutedUserFilters = Substitution._getSubstitutedUserFilters(aSubstitutedUserFilterKeys);

			if (aTaskDefinitionIDFilters.length > 0) {
				aFilters.push(new Filter(aTaskDefinitionIDFilters, false));
			}

			// add sap origins filters for individual tasks when filtered on task type
			if (aSapOriginsFilters.length > 0) {
				aFilters.push(new Filter(aSapOriginsFilters, false));
			}

			if (aSubstitutedUserFilters.length > 0) {
				aFilters.push(new Filter(aSubstitutedUserFilters, false));
			}

			return aFilters;
		},

		onForwardPopUp: function() {
			var oFirstSelectedItemContext = this.getList().getSelectedItems()[0].getBindingContext();
			var sOrigin = oFirstSelectedItemContext.getProperty("SAP__Origin");
			var sInstanceID = oFirstSelectedItemContext.getProperty("InstanceID");
			var iNumberOfSelectedItems = this.getList().getSelectedItems().length;

			if (this.oDataManager.userSearch) {
				Forward.open(
					jQuery.proxy(this.startForwardFilter, this),
					jQuery.proxy(this.closeForwardPopUp, this),
					iNumberOfSelectedItems
				);

				this.oDataManager.readPotentialOwners(sOrigin, sInstanceID,
					jQuery.proxy(this._PotentialOwnersSuccess, this));
			}
			else {
				ForwardSimple.open(
					jQuery.proxy(this.closeForwardPopUp, this),
					iNumberOfSelectedItems
				);
			}
		},

		showResubmitPopUp: function() {
			Resubmit.open(
				this.sResubmitUniqueId,
				this,
				this.getView()
			);
		},
		sendMultiSelectResubmitSuccess: function(bAllItemsSelected, aSuccessList, aErrorList) {
			if (aErrorList.length == 0) {
				var i18nBundle = this.getView().getModel("i18n").getResourceBundle();

				setTimeout(function() {
					MessageToast.show(i18nBundle.getText(aSuccessList.length > 1 ? "dialog.success.multi_resubmit_multiple_tasks" :
						"dialog.success.multi_resubmit_single_task", [aSuccessList.length]));
				}.bind(this), 500);

				this.sendMultiSelectActionEnd(bAllItemsSelected);
			}
			else {
				MultiSelect.openMessageDialog(aSuccessList, aErrorList,
					jQuery.proxy(this.sendMultiSelectActionEnd, this, bAllItemsSelected, aErrorList));
			}
		},

		handleResubmitPopOverOk: function(oResult) {
			var aSelectedListItems = this.getList().getSelectedItems();
			var aItems = [];

			for (var i = 0; i < aSelectedListItems.length; i++) {
				var oItem = aSelectedListItems[i].getBindingContext().getObject();
				aItems.push(oItem);
			}

			var iTotalItems = this.getList().getBinding("items").getLength();
			var bAllItemsSelected = aItems.length === iTotalItems ? true : false;

			var oCalendar = Fragment.byId(this.sResubmitUniqueId, "DATE_RESUBMIT");
			var aSelectedDates = oCalendar.getSelectedDates();
			if (aSelectedDates.length > 0) {
				var oDate = aSelectedDates[0].getStartDate();
				var oFormat = DateFormat.getDateInstance({
					pattern: "yyyy-MM-ddTHH:mm:ss"
				});
				this.oDataManager.doMassResubmit(aItems,
					"datetime'" + oFormat.format(oDate) + "'",
					jQuery.proxy(this.sendMultiSelectResubmitSuccess, this, bAllItemsSelected),
					null);
				Resubmit.close();
			}
			else {
				this.sendMultiSelectActionEnd();
			}
		},

		_PotentialOwnersSuccess: function(oResult) {
			Forward.setAgents(oResult.results);
			Forward.setOrigin(this.getList().getSelectedItems()[0].getBindingContext().getProperty("SAP__Origin"));
		},

		startForwardFilter: function(oListItem, sQuery) {
			sQuery = sQuery.toLowerCase();
			var sFullName = oListItem.getBindingContext().getProperty("DisplayName").toLowerCase();
			var sDepartment = oListItem.getBindingContext().getProperty("Department").toLowerCase();

			return (sFullName.indexOf(sQuery) != -1) ||
				(sDepartment.indexOf(sQuery) != -1);
		},

		closeForwardPopUp: function(oResult) {
			if (oResult && oResult.bConfirmed) {
				var aSelectedListItems = this.getList().getSelectedItems();
				var aItems = [];

				for (var i = 0; i < aSelectedListItems.length; i++) {
					var oItem = jQuery.extend(true, {}, aSelectedListItems[i].getBindingContext().getObject());
					// needed for further in the chain to get custom attributes
					oItem.listItem = aSelectedListItems[i];
					aItems.push(oItem);
				}
				var iTotalItems = this.getList().getBinding("items").getLength();
				var bAllItemsSelected = aItems.length === iTotalItems ? true : false;
				this.oDataManager.doMassForward(aItems,
					oResult.oAgentToBeForwarded,
					oResult.sNote,
					jQuery.proxy(this.sendMultiSelectForwardSuccess, this, bAllItemsSelected),
					null);
			}
			else {
				this.sendMultiSelectActionEnd(bAllItemsSelected);
			}
		},

		_handleListSwipe: function(oEvent) {
			if (this.isMultiSelectActive()) {
				// If we are in multi-select mode, then disable quick approval.
				oEvent.bPreventDefault = true;
				return;
			}

			if (!this.oDataManager.getScenarioConfig().IsQuickActionEnabled) {
				//quick action is not enabled
				oEvent.bPreventDefault = true;
				//no feedback to end user, but at least log entry
				Log.error("Quick Action is not enabled in Scenario Customizing");
			}
			else {
				var oSwipeListItem = oEvent.getParameter("listItem");
				var oContext = oSwipeListItem.getBindingContext();
				var sOrigin = oContext.getProperty("SAP__Origin");
				var sInstanceID = oContext.getProperty("InstanceID");
				var aDecisionOptions = null;

				//check EXECUTED status
				if (oContext.getProperty("Status") === "EXECUTED") {
					var oDecision = {};
					oDecision.selectedListItem = oSwipeListItem;
					//oDecision.DecisionKey = aActions[i].decisionKey;
					oDecision.isMandatoryComment = false;
					oDecision.text = this.getView().getModel("i18n").getResourceBundle().getText("XBUT_CONFIRM");

					//-- add swipe button dynamically
					var oSwipeContent = oEvent.getParameter("swipeContent"); // get swiped content from event, this will be a button
					oSwipeContent.setText(oDecision.text);

					var oApproveDecisionCustomData = new CustomData({
						key: "APPROVE_DECISION",
						value: oDecision
					});
					//remove all custom attribute
					oSwipeContent.removeAllCustomData();
					oSwipeContent.addCustomData(oApproveDecisionCustomData);
				}
				else {
					//-- read decision options
					this.oDataManager.readDecisionOptions(sOrigin, sInstanceID, oContext.getProperty("TaskDefinitionID"),
					function(aResult) {
						aDecisionOptions = aResult;
					}, null, true);

					var aActions = [];
					if (aDecisionOptions) {
						for (var h = 0; h < aDecisionOptions.length; h++) {
							var oActionData = {};
							oActionData.decisionKey = aDecisionOptions[h].DecisionKey;
							oActionData.buttonText = aDecisionOptions[h].DecisionText;
							oActionData.isApprove = aDecisionOptions[h].Nature === "POSITIVE" ? true : false;
							oActionData.isReject = aDecisionOptions[h].Nature === "NEGATIVE" ? true : false;
							oActionData.isNonNature = aDecisionOptions[h].Nature === "" ? true : false;
							oActionData.isMandatoryComment = aDecisionOptions[h].CommentMandatory;
							aActions.push(oActionData);
						}
					}
					//-- get the positive action name and decision
					for (var i = 0; i < aActions.length; i++) {
						if (aActions[i].isApprove) {
							var oDecision = {};
							oDecision.selectedListItem = oSwipeListItem;
							oDecision.DecisionKey = aActions[i].decisionKey;
							oDecision.isMandatoryComment = aActions[i].isMandatoryComment;
							oDecision.text = aActions[i].buttonText;

							//-- add swipe button dynamically
							var oSwipeContent = oEvent.getParameter("swipeContent"); // get swiped content from event, this will be a button
							oSwipeContent.setText(oDecision.text);

							var oApproveDecisionCustomData = new CustomData({
								key: "APPROVE_DECISION",
								value: oDecision
							});
							//remove all custom attribute
							oSwipeContent.removeAllCustomData();
							oSwipeContent.addCustomData(oApproveDecisionCustomData);
							//-- pick first approve option and leave
							return;
						}
					}
					//no positive decision, no swipe
					oEvent.bPreventDefault = true;
					//no feedback to end user, but at least log entry
					Log.error("No decision option with nature POSITVE found, no swipe possible.");
				}
			}
		},

		_handleSwipeApproved: function(oEvent) {

			var oList = this.getList();
			var oSwipedItem = oList.getSwipedItem();
			//-- generic approve needs an object, usual approve is always boolean
			oList.swipeOut();

			var oDecision = oEvent.getSource().getCustomData()[0].getValue();
			oDecision.InstanceID = oSwipedItem.getBindingContext().getProperty("InstanceID");
			oDecision.SAP__Origin = oSwipedItem.getBindingContext().getProperty("SAP__Origin");
			if (oDecision.isMandatoryComment) {
				this.showDecisionDialogForQuickAction(this.oDataManager.FUNCTION_IMPORT_DECISION, oDecision, true);
			}
			else {
				if (oSwipedItem.getBindingContext().getProperty("Status") === "EXECUTED") {
					var sFunctionImportName = this.oDataManager.FUNCTION_IMPORT_CONFIRM;
				}
				else {
					var sFunctionImportName = this.oDataManager.FUNCTION_IMPORT_DECISION;
				}
				this.oDataManager.sendAction(sFunctionImportName, oDecision, "", jQuery.proxy(function(oData) {
					setTimeout(function() {
						MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("dialog.success.complete"));
					}.bind(this), 500);
				}, this));
			}
		},

		showDecisionDialogForQuickAction: function(sFunctionImportName, oDecision, bShowNote) {
			var i18nBundle = this.getView().getModel("i18n").getResourceBundle();
			this.oConfirmationDialogManager.showDecisionDialog({
				question: i18nBundle.getText("XMSG_DECISION_QUESTION", oDecision.text),
				textAreaLabel : this.i18nBundle.getText("XFLD_TextArea_Decision"),
				showNote: bShowNote,
				title: i18nBundle.getText("XTIT_SUBMIT_DECISION"),
				confirmButtonLabel: i18nBundle.getText("XBUT_SUBMIT"),
				noteMandatory: oDecision.isMandatoryComment,
				confirmActionHandler : jQuery.proxy(function(oDecision, sNote) {
						this.oDataManager.sendAction(sFunctionImportName, oDecision, sNote);
				},this, oDecision)
			});
		},

		onUpdateStarted: function(oEvent) {
			var oList = oEvent.getSource();
			var sNoDataText = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("XMSG_LOADING");
			oList.setNoDataText(sNoDataText);
			var oModel = this.getView().getModel();
			var sReason = oEvent.getParameter("reason");
			this._clearSelection();
			this.getList().removeSelections(true);

			// Refresh the selected task also if the task model is getting refreshed
			if (sReason == "Refresh" && oList.getSelectedItem()) {
				if (oModel.bFullRefreshNeeded) {
					oModel.bFullRefreshNeeded = false;
				}
				else if (!Device.system.phone) {
					this.oDataManager.fireItemRemoved();
				}
			}

			// let the list handle busy loader display in case user requests for the next page
			if (sReason !== "Growing") {
				this._setListBusyIndicator(true);
			}
		},

		// This function gets called after list has been updated
		onUpdateFinished: function(oEvent) {
			this._setListBusyIndicator(false);
			// selects a task after the list is refreshed, only if the list is not growing
			// Or if an action has been performed after which new task selection has to happen or same task requires re-selection
			// or if its a deep linking URL and the list has been loaded
			if (!(this.isMultiSelectActive() && oEvent.getParameter("reason") == "Growing") &&
				(this.isActionPerformed || (this.oDataManager.getCallFromDeepLinkURL() && oEvent.getSource().getItems().length>0) || oEvent.getParameter("reason") == "Refresh" ) ) {
					//this.fnFindAndSelectNextTaskAfterAction(oEvent);
					this.isActionPerformed = false;
					
			}

			// If Multiselect is enabled and the list is growing the "Select All" button must be updated:
			if (this.isMultiSelectActive() && oEvent.getParameter("reason") === "Growing") {
				this.updateMultiSelectState();
			}

			if (oEvent.getParameter("actual") === oEvent.getParameter("total")) {
				//we are on the last page, use the list items count to display on the header
				this.bTaskCountFromTaskCollectionCall = false;
			}

			var oList = oEvent.getSource();
			if (!Device.system.phone && this.isMultiSelectActive() == false && oEvent.getParameter("reason") !== "Growing") {
				// adjust the scrollbar of the S2 page so that the selected item is visible in the list
				if (oList.getSelectedItem() && oList.getSelectedItem().$().offset() && oList.getItems()[0].$().offset()) {
					oList.getParent().scrollTo(oList.getSelectedItem().$().offset().top - oList.getItems()[0].$().offset().top, 0);
				}
			}

			var sNoDataText = this.getView().getModel("i18n").getResourceBundle().getText("view.Workflow.noItemsAvailable");
			oList.setNoDataText(sNoDataText);

			// Workaround for bug in grouping where grouped items have no counts.
			var oItems = oEvent.getSource().getItems();
			if (oItems && oItems[0] && oItems[0] instanceof GroupHeaderListItem && this._oControlStore.oMasterSearchField.getValue() === "") {
				this.applySearchPatternBase("");
			}
			// End of workaround.	
			this.fnSelectFirstItem();
		},

		/*
		 * override BaseMasterController method, called when data is downloaded
		 */
		onDataLoaded: function() {

		},

		getDetailNavigationParameters: function(oListItem) {
			var oEntry = this.getView().getModel().getProperty(oListItem.getBindingContext().getPath());
			return {
				SAP__Origin: encodeURIComponent(oEntry.SAP__Origin),
				InstanceID: encodeURIComponent(oEntry.InstanceID),
				contextPath: oListItem.getBindingContext().getPath().substr(1)
			};
		},

		applySearchPattern: function(sFilterPattern) {
			var iCount = this.applySearchPatternBase(sFilterPattern);
			var sKey = (iCount > 0 || sFilterPattern == "") ? "view.Workflow.noItemsAvailable" : "view.Workflow.noMatchingItems";
			var sNoDataText = this.getView().getModel("i18n").getResourceBundle().getText(sKey);
			this.getList().setNoDataText(sNoDataText);
			this.searchListFlag = 0;
			if (this.isMultiSelectActive()) {
				return iCount;
			}
			if (!Device.system.phone) {
				if (iCount === 0) { 	// Task list Search FIX
					this.oRouter.navTo("empty", null, true);
					this.getList().removeSelections(true);
					if (this.oDataManager && this.oDataManager.bOutbox) {
						Conversions.setShellTitleToOutbox(this.getOwnerComponent(), "cross.fnd.fiori.inbox.view.S2");
					}
				}
				else {
					this.oRouter.navTo("detail", this.searchListFirstItem, true);
					var oItem = this.findItemByContextPath("/" + this.searchListFirstItem.contextPath);
					if (oItem) {
						this._clearSelection();
						oItem.setSelected(true);
					}
				}
			}

			return iCount;
		},

		_getBindingContextOfFirstItem: function() {
			var aListItems = this.getList().getItems();
			var oBindingContext = null;
			if (aListItems.length == 1) {
				oBindingContext = aListItems[0].getBindingContext();
			}
			if (!oBindingContext) {
				oBindingContext = aListItems[1].getBindingContext();
			}
			return oBindingContext;
		},

		// set the sort items to display. This is set just once on start of the application.
		// These sort items are static and going to be the same throughout the session.
		setSortItemsToDisplay: function() {
			var oConfigItem;
			var bVisible;

			this.aVisibleSortItems = [];
			// Sort item is visible, if
			for (var sSortKey in this.oSortConfig) {
				oConfigItem = this.oSortConfig[sSortKey];
				// - it doesn't have getVisible method, or
				// - has getVisible method and it returns true, or
				bVisible = oConfigItem.getVisible ? oConfigItem.getVisible() : true;
				// - it is the current sort item (this.sSortKey).
				if (bVisible /*|| sSortKey === this.sSortKey*/ ) {
					/*var sText;
					if (oConfigItem.text === this._CUSTOM_NUMBER_LABEL) {
						var oBindingContext = this._getBindingContextOfFirstItem();
						sText = oBindingContext.getProperty(this._CUSTOM_NUMBER_LABEL);
					} else if (oConfigItem.text === this._CUSTOM_NUMBER_UNIT_LABEL) {
						var oBindingContext = this._getBindingContextOfFirstItem();
						sText = oBindingContext.getProperty(this._CUSTOM_NUMBER_UNIT_LABEL);
					} else if (oConfigItem.text === this._CUSTOM_OBJECT_ATTRIBUTE_LABEL) {
						var oBindingContext = this._getBindingContextOfFirstItem();
						sText = oBindingContext.getProperty(this._CUSTOM_OBJECT_ATTRIBUTE_LABEL);
					} else {
						sText = oConfigItem.text;
					}*/

					this.aVisibleSortItems.push({
						key: sSortKey,
						text: oConfigItem.text
					});
				}
			}
		},

		handleFilter: function(sFilterKey) {
			this.aItemContextPathsToSelect = [];
			this.aTaskTypeFilterItemsOrigins = [];
			var oFilter = this.getFilter(sFilterKey);
			this.sFilterKey_Support = sFilterKey;
			var aAllFilters = this.getAllFilters(oFilter);
			var oListBinding = this.getList().getBinding("items");
			oListBinding.aApplicationFilters = [];
			this.iTotalFilteredItems = oListBinding.filter(aAllFilters).iLastEndIndex; // to fetch number of filtered items
			this.isActionPerformed = true;
		},

		onMultiSelectFilterCompleted: function(sChannelId, sEventId, oProcessingMultiSelectData) {
			var oList = this.getList();
			oList.removeSelections(true);
			var i18nBundle = this.getView().getModel("i18n").getResourceBundle();
			this.refreshInfoHeaderToolbar(i18nBundle.getText("multi.header", i18nBundle.getText("group.taskType") + " (" + oProcessingMultiSelectData.oFilterItem.title + ")"));
			oList.setMode(ListMode.MultiSelect);
			this.setProcessingMultiSelect({});
		},

		onMultiSelectFilterFailed: function() {
			this.setProcessingMultiSelect({});
		},

		onTaskCollectionFailed: function() {
			this.removeHeaderFooterOptions();
		},

		onShowReleaseLoader: function(sChannelId, sEventId, oValue) {
			var oList = this.getList();
			if (oList) {
				oList.setEnableBusyIndicator(oValue.bValue);
			}
			this.getView().setBusyIndicatorDelay(1000);
			this.getView().setBusy(oValue.bValue);
		},

		onRefreshOnError: function() {
			this.sBindingContextPath = undefined;
			this.oRouter.navTo("master", {}, true);
		},

		handleSort: function(sSortKey) {
			this.aItemContextPathsToSelect = [];
			this.sSortKey_Support = sSortKey;
			//cross.fnd.fiori.inbox.util.SupportInfo.setSorters(sSortKey);
			var aSorters = this.configureSorters(sSortKey);
			this.getList().getBinding("items").sort(aSorters);
		},

		handleGroup: function() {
			this.aItemContextPathsToSelect = [];
			var aSorters = this.configureSorters(this.sSortKey);
			//cross.fnd.fiori.inbox.util.SupportInfo.setGroup(this.sSortKey);
			this.getList().getBinding("items").sort(aSorters);
			this.isActionPerformed = true;
		},

		configureSorters: function(sSortKey) {
			var oSorter;
			var aSorters = [];
			var fnCustomSorter = null;
			var fnCustomGrouper = null;
			var sRealGroupKey = null;
			var i18nBundle = this.getView().getModel("i18n").getResourceBundle();

			// Configure grouping.

			if (this.oGroupConfigItem) {
				sRealGroupKey = this.oGroupConfigItem.key;
				var bRealGroupDescending = this.bGroupDescending;
				var fnGroup = this.oGroupConfigItem.formatter || true;

				// Handle special cases.

				switch (this.oGroupConfigItem.key) {
					case this._SORT_PRIORITY:
						sRealGroupKey = this._SORT_PRIORITY_NUMBER;
						bRealGroupDescending = !bRealGroupDescending;
						break;
		/*  Comment this case operator to group Statuses in alphabetical order. This is alignment to Expert Mode behavior.
			Previous grouping order can be seen in array _GROUP_STATUS_ORDER.					*/
	/*				case this._SORT_STATUS:
						fnCustomGrouper = function(oGroup1, oGroup2) {
							return this.statusGrouper(oGroup1, oGroup2, bRealGroupDescending);
						};
						break;*/
				}

				oSorter = new Sorter(sRealGroupKey, bRealGroupDescending, fnGroup);
				aSorters.push(oSorter);

				this.sInfoHeaderGroupString = i18nBundle.getText("group.header", i18nBundle.getText(this.oGroupConfigItem.textKey));
			}
			else {
				this.sInfoHeaderGroupString = null;
			}

			this.refreshInfoHeaderToolbar();

			// Configure sorting.

			// Default sort key if not configured on back-end (see loadInitialAppData).
			if (!sSortKey)
				sSortKey = this.sDefaultSortKey;
			// If unknown sort key received from back-end, then we revert to default (see loadInitialAppData)
			if (!this.oSortConfig[sSortKey]) {
				sSortKey = this.sDefaultSortKey;
			}

			var sRealSortKey = sSortKey;
			var bRealSortDescending = this.oSortConfig[sSortKey].descending;

			// Handle special cases.

			switch (sSortKey) {
				case this._SORT_PRIORITY:
					sRealSortKey = this._SORT_PRIORITY_NUMBER;
					bRealSortDescending = !bRealSortDescending;
					break;

				/*
				commenting this code as we do not want to apply custom sorting beacuse of the backend limitation.
				limitiation is, tasks with due date vale null are returned on top if due date filtering is applied.
				*/

				/*case this._SORT_COMPLETIONDEADLINE:
					fnCustomSorter = this.completionDeadLineSorter;
					break;*/

				case this._SORT_CREATEDONREVERSE:
					sRealSortKey = this._SORT_CREATEDON;
					break;
			}

			// If the grouping and sorting keys are the same (SORT_PRIORITY(_NUMBER),
			// SORT_TASKDEFINITIONID, SORT_STATUS), then don't create an additional sorter for sorting key.

			if (sRealGroupKey != sRealSortKey) {
				oSorter = new Sorter(sRealSortKey, bRealSortDescending);
				aSorters.push(oSorter);
			}

			var oModel = this.getView().getModel();

			oModel.extFnCustomGrouper = fnCustomGrouper ? jQuery.proxy(fnCustomGrouper, this) : null;
			oModel.extFnCustomSorter = fnCustomSorter ? jQuery.proxy(fnCustomSorter, this) : null;
			oModel.extSGroupingProperty = sRealGroupKey;
			this.sSortKey = sSortKey;
			this.sGroupkey_Support = sRealGroupKey;
			//cross.fnd.fiori.inbox.util.SupportInfo.setGroup(sRealGroupKey);

			return aSorters;
		},

		isBackendDefaultSortKeyEqualsTo: function(sSortKey) {
			return (this.sBackendDefaultSortKey === sSortKey);
		},

		completionDeadLineSorter: function(oItem1, oItem2) {
			if (!oItem1[this._SORT_COMPLETIONDEADLINE]) {
				return 1;
			}
			if (!oItem2[this._SORT_COMPLETIONDEADLINE]) {
				return -1;
			}
			return (oItem1[this._SORT_COMPLETIONDEADLINE] - oItem2[this._SORT_COMPLETIONDEADLINE]);
		},

		statusGrouper: function(oGroup1, oGroup2, bDescending) {
			var iGroup1StatusIndex;
			var iGroup2StatusIndex;
			var iMult = bDescending ? -1 : 1;

			for (var i = 0; i < this._GROUP_STATUS_ORDER.length; i++) {
				var oGroupOrder = this._GROUP_STATUS_ORDER[i];

				if (oGroupOrder.Status == oGroup1.GroupingValue)
					iGroup1StatusIndex = i;
				if (oGroupOrder.Status == oGroup2.GroupingValue)
					iGroup2StatusIndex = i;
			}

			return (iGroup1StatusIndex - iGroup2StatusIndex) * iMult;
		},

		getFilter: function(oFilterKeys) {
			var aFilters = [];
			var aPriorityFilters = [];
			var oDueDateFilter = null;
			var aTaskTypeFilters = [];
			var aTaskDefinitionIDFilterKeys = [];
			var aSubstitutedUserFilterKeys = [];
			var aStatusFilterKeys = [];
			var aAdditionalFilters = [];
			var oCreationDateFilter = null;
			var oCompletedOnFilters = null;
			var oResumeOnFilters = null;

			for (var key in oFilterKeys) {
				if (oFilterKeys.hasOwnProperty(key) && key) {
					var aKeyParts = key.split(":");
					switch (aKeyParts[0]) {
						case this._FILTER_CATEGORY_PRIORITY:
							var resultPriorityFilters = InboxFilterContributor.getFilterForPriorityBykey(aKeyParts);
							if (resultPriorityFilters != null) {
								aPriorityFilters.push(resultPriorityFilters);
							}
							break;
						case this._FILTER_CATEGORY_COMPLETION_DEADLINE:
							oDueDateFilter = InboxFilterContributor.getFilterForDueDateByKey(aKeyParts);
							break;
						case this._FILTER_CATEGORY_STATUS:
							var resultStatusFilters = InboxFilterContributor.getFilterForStatusByKey(aKeyParts);
							if (resultStatusFilters != null) {
								aStatusFilterKeys.push(resultStatusFilters);
							}
							break;
						case this._FILTER_CATEGORY_CREATION_DATE:
							oCreationDateFilter = InboxFilterContributor.getFilterForCreationDateByKey(aKeyParts);
							break;
						case this._FILTER_CATEGORY_COMPLETED:
							oCompletedOnFilters = OutboxFilterContributor.getCompletedFilterByKey(aKeyParts);
							break;
						case this._FILTER_CATEGORY_SNOOZED:
							oResumeOnFilters = OutboxFilterContributor.getResumeOnFilterByKey(aKeyParts);
							break;
						case this._FILTER_CATEGORY_TASK_DEFINITION_ID:
							aTaskTypeFilters.push(new Filter(aKeyParts[0], FilterOperator.EQ, aKeyParts[1]));
							//Workaround due to ODataModelExtension
							aTaskDefinitionIDFilterKeys.push(aKeyParts[1]);
							this.aTaskTypeFilterItemsOrigins.push(aKeyParts[2]);
							break;
						case this._FILTER_CATEGORY_SUBSTITUTED_USER:
							aSubstitutedUserFilterKeys.push(aKeyParts[1]);
							break;
						default:
							if (aKeyParts[0] && aKeyParts[1] && aKeyParts[0] !== "undefined" && aKeyParts[1] !== "undefined") {
								aAdditionalFilters.push(new Filter(aKeyParts[0], FilterOperator.EQ, aKeyParts[1]));
							}
					}
				}
			}

			var oFilterOptions = {
				selectedFilterOptions: oFilterKeys,
				taskDefinitionFilter: aTaskDefinitionIDFilterKeys,
				substitutedUserFilter: aSubstitutedUserFilterKeys,
				statusFilter: aStatusFilterKeys,
				priorityFilter: aPriorityFilters,
				dueDateFilter: oDueDateFilter,
				creationDateFilter: oCreationDateFilter,
				completedDateFilter: oCompletedOnFilters,
				resumeDateFilter: oResumeOnFilters,
				 additionalFilters: aAdditionalFilters //custom filters
			};

			/**
			 * @ControllerHook Implement a custom filter
			 * This hook method can be used to replace the standard filter by a custom
			 * one based on the filterKey and add addtional custom filters
			 * It is called when a filter option is selected on the UI.
			 * @callback cross.fnd.fiori.inbox.view.S2~extHookGetCustomFilter
			 * @param {object} filterOptions
			 * @return {void}
			 */
			if (this.extHookGetCustomFilter) {
				this.extHookGetCustomFilter(oFilterOptions);
			}

			this.getView().getModel().aTaskDefinitionIDFilterKeys = oFilterOptions.taskDefinitionFilter;
			this.getView().getModel().aSubstitutedUserFilterKeys = oFilterOptions.substitutedUserFilter;
			this.getView().getModel().aStatusFilterKeys = oFilterOptions.statusFilter;

			if (oFilterOptions.priorityFilter.length > 1) {
				aFilters.push(new Filter(oFilterOptions.priorityFilter, false));
			}
			else if (oFilterOptions.priorityFilter.length === 1) {
				aFilters.push(oFilterOptions.priorityFilter[0]);
			}

			if (oFilterOptions.dueDateFilter) {
				aFilters.push(oFilterOptions.dueDateFilter);
			}

			if (oFilterOptions.creationDateFilter) {
				aFilters.push(oFilterOptions.creationDateFilter);
			}

			if (oFilterOptions.completedDateFilter) {
				aFilters.push(oFilterOptions.completedDateFilter);
			}

			if (oFilterOptions.resumeDateFilter) {
				aFilters.push(oFilterOptions.resumeDateFilter);
			}

			if (oFilterOptions.additionalFilters.length > 1) {
				aFilters.push(new Filter(oFilterOptions.additionalFilters, true));
			}
			else if (oFilterOptions.additionalFilters.length === 1) {
				aFilters.push(oFilterOptions.additionalFilters[0]);
			}

			if (aFilters.length > 1) {
				return new Filter(aFilters, true);
			}
			else if (aFilters.length === 1) {
				return aFilters[0];
			}

			return null;
		},

		handleMetadataFailed: function(oEvent) {
			this.removeHeaderFooterOptions();
			this.oDataManager.handleMetadataFailed(oEvent);
		},

		removeHeaderFooterOptions: function() {
			this.bHideHeaderFooterOptions = true;
			this.getAppImp().oMHFHelper.defineMasterHeaderFooter(this);
		},

		_setListBusyIndicator: function(bValue) {
			if (bValue) {
				this.getList().setBusyIndicatorDelay(1000);
				this.getList().setBusy(true);
			}
			else {
				this.getList().setBusy(false);
			}
		},

		getNextItemsToSelect: function() {
			return this.aItemContextPathsToSelect;
		},

		applySearchPatternBase : function (sFilterPattern) {
			sFilterPattern = sFilterPattern.toLowerCase();
			var aListItems = this.getList().getItems();
			var bVisibility;

			var iCount = 0;
			var oGroupItem = null;
			var iCountInGroup = 0;
			for (var i = 0; i < aListItems.length; i++) {
				if (aListItems[i] instanceof GroupHeaderListItem) {
					if (oGroupItem) {
						if (iCountInGroup == 0) {
							oGroupItem.setVisible(false);
						}
						else {
							oGroupItem.setVisible(true);
							oGroupItem.setCount(iCountInGroup);
							oGroupItem.setTooltip(oGroupItem.getTitle()+' ('+iCountInGroup+')');
						}
					}
					oGroupItem = aListItems[i];
					iCountInGroup = 0;
				}
				else {
					bVisibility = this.applySearchPatternToListItem(aListItems[i], sFilterPattern); 
					aListItems[i].setVisible(bVisibility);
					if (bVisibility) {
						iCount++;
						iCountInGroup++;
					}
				}
			}
			//last group check, fix for CSS 0120061532 0003589854 2013
			if (oGroupItem) {
				if (iCountInGroup == 0) {
					oGroupItem.setVisible(false);
				}
				else {
					oGroupItem.setVisible(true);
					oGroupItem.setCount(iCountInGroup);
					oGroupItem.setTooltip(oGroupItem.getTitle()+' ('+iCountInGroup+')'); 
				}
			}
			//if search term is set to empty, take the binding length instead of the current visible items due to paging case.
			if (!sFilterPattern) {
				if (this._oMasterListBinding) {
					iCount = this._oMasterListBinding.getLength();
				}
			}
			return iCount;
		},

		/**
		 * Gets the sap.m.Pagec instance for the master-detail scenario. Override this
		 * function if you have not used the standard way to include the page in the view.
		 * @returns {sap.m.Page}
		 *    The page instance.
		 */
		getPage : function () {
			return CommonHeaderFooterHelper.getPageFromController(this);
		},

		/**
		 * Finds an item by the given context path.
		 * @param {string} sContextPath
		 *    The binding context path.
		 * @returns {sap.m.ListItemBase}
		 *    A list item or null if for given path no item was found.
		 */
		findItemByContextPath : function (sContextPath) {
			var oBindingContext;
			var oList = this.getList();
			var aItems = oList.getItems();

			var result = jQuery.grep(aItems, function (oItem) {
				oBindingContext = oItem.getBindingContext();

				if (oItem instanceof GroupHeaderListItem) {
					return false;
				}

				if (oBindingContext && (oBindingContext.getPath() !== sContextPath)) {
					return false;
				}

				return true;
			});

			return result[0] || null;
		},

		setListsVisibility : function (bEmptyListVisible) {
			this.emptyList().setVisible(bEmptyListVisible);
			this.getList().setVisible(!bEmptyListVisible);
		},

		getAppImp : function () {
			return cross.fnd.fiori.inbox.util.tools.Application.getImpl();
		},

		_applyClientSideSearch : function () {
			var sFilterPattern = this._oControlStore.oMasterSearchField.getValue();
			var iCount = this.applySearchPattern(sFilterPattern);
			this.getAppImp().oMHFHelper.setMasterTitle(this, iCount);
			this.evaluateClientSearchResult(iCount, this.getList(), this.emptyList());
		},

		/**
		 * This function is called when a client side search was done. If the search returns 0 hits
		 * an empty list is shown on the master page displaying the "noDataText" of the master List.
		 * If the search returns one or more hits the function makes sure that the master list is
		 * visible and the empty list is hidden.
		 * @param {int} iSearchHitCount
		 *     The number of elements found by the search.
		 * @param {object} oMasterList
		 *     The master list.
		 * @param {object} oEmptyList
		 *     The empty list to be displayed instead of the master list if the search returns no
		 *     results.
		 * @param {string} sNoDataText
		 *     If this parameter is provided it will be used as the "noDataText" during the search.
		 */
		evaluateClientSearchResult: function (iSearchHitCount, oMasterList, oEmptyList, sNoDataText) {
			var noHitsTxt = sNoDataText;
			var emptyListVisible;
			if (iSearchHitCount === 0) {
				if (noHitsTxt === null || noHitsTxt === undefined) {
					noHitsTxt = oMasterList.getNoDataText();
				}
				oEmptyList.setNoDataText(noHitsTxt);

				emptyListVisible = true;
				this.setListsVisibility(emptyListVisible);
			}
			else {
				emptyListVisible = false;
				this.setListsVisibility(emptyListVisible);
			}
		},

		/**
		 * Whenever you bind a master list dynamically you have to call this function.
		 */
		registerMasterListBind : function () {
			var oList = this.getList();
			var oBinding = oList.getBinding("items");
			var oConnectionManager = this.getAppImp().getConnectionManager();
			var iRequestCount = oConnectionManager.iRequestCount;
			this.getAppImp().setMasterListBinding(this, oBinding);
			// when no request was sent, header and footer will be displayed immediately
			if (iRequestCount === oConnectionManager.iRequestCount) {
				this.getAppImp().oMHFHelper.defineMasterHeaderFooter(this);
			}
		},

		/**
		 * Gets the name of the detail route.
		 * Needs to be overwritten if the name of the route leading to the detail view differs from the
		 * default which is "detail".
		 * @returns {string}
		 *     The name of the detail route.
		 */
		getDetailRouteName : function () {
			return "detail";
		},

		_onMasterListLoaded : function (oEvent) {
			this.onDataLoaded();
			this.getAppImp().onMasterRefreshed(this);
			oEvent.oSource.detachChange(this._onMasterListLoaded, this);
			this._bListLoaded = true;
			this.fireEvent("_onMasterListLoaded");
		},

		_onMasterListChanged : function (oEvent) {
			this.getAppImp().onMasterChanged(this);
			this.selectItemMatchingTheLastNavigation();
			var oList = this.getList();
			if (oList && oList.getMode() === "MultiSelect" && this.getAppImp().bManualMasterRefresh === true) {
				oList.removeSelections(true);
			}
			//when filtering and search are used together it can happen that the search activated the emptyList. If subsequently
			//the filtering is removed the emptyList needs to be replaced by the original master list. The search can't do that because
			//commenHeaderFooter handler is not involved in filtering
		if (oList.getBinding("items").getLength() > 0) {
				var emptyListVisible = false;
				this.setListsVisibility(emptyListVisible);
			}
		},

		/**
		 * Selects the last item that was hit by the detail route.
		 */
		selectItemMatchingTheLastNavigation : function () {
			var oList = this.getList();
			if (oList.getMode() === "MultiSelect") {
				return;
			}

			if (this._sDetailContextPath === undefined) {
				return;
			}

			var oItem = oList.getSelectedItem();
			var oContext = oItem && oItem.getBindingContext();

			//If this item is already selected, don't iterate over the whole list again
			if (oContext && oContext.getPath() === this._sDetailContextPath) {
				return;
			}

			oItem = this.findItemByContextPath(this._sDetailContextPath);
			this._clearSelection();
			if (oItem) {
				oItem.setSelected(true);
			}
		},

		/**
		 * Returns the split container, that contains the master view.
		 */
		getSplitContainer : function () {
			return this.getView().getParent().getParent();
		}
	});
});
