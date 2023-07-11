/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
		"cross/fnd/fiori/inbox/controller/BaseController",
		"sap/ui/model/json/JSONModel",
		"sap/ui/core/routing/History",
		"cross/fnd/fiori/inbox/model/formatter",
		"cross/fnd/fiori/inbox/model/models",
		"cross/fnd/fiori/inbox/model/ModelsHelper",
		"cross/fnd/fiori/inbox/util/TaskHelper",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator",
		"sap/m/TablePersoController",
		"sap/m/MessageToast",
		"cross/fnd/fiori/inbox/util/TableOperationsMyTasks",
		"cross/fnd/fiori/inbox/util/TableOperationsHelper",
        "cross/fnd/fiori/inbox/util/IconTabBarHelper",
		"sap/base/Log",
		"cross/fnd/fiori/inbox/util/StartupParameters",
		"sap/ui/Device",
		"cross/fnd/fiori/inbox/util/Utils",
		"sap/ui/core/ResizeHandler",
		"cross/fnd/fiori/inbox/util/TaskListCustomAttributeHelperMyTasks",
		"cross/fnd/fiori/inbox/util/Constants",
		"cross/fnd/fiori/inbox/util/FilterBarHelper",
		"cross/fnd/fiori/inbox/util/ResponseOptionsHelper"
	],
	function (BaseController, JSONModel, History, formatter, models, ModelsHelper, TaskHelper, Filter, FilterOperator, TablePersoController,
		MessageToast, TableOperations, TableOperationsHelper, IconTabBarHelper, Log, StartupParameters, Device, Utils, ResizeHandler,
		TaskListCustomAttributeHelper, Constants, FilterBarHelper, ResponseOptionsHelper
	) {
		"use strict";

		return BaseController.extend("cross.fnd.fiori.inbox.controller.Worklist", {

			formatter: formatter,
			oSelectedTasksDetails: null,
			oMultiSelectMessageDialogView: null,
			OriginsToDisplayNameDictionary: {},

			/**
			 * Called when the worklist controller is instantiated.
			 * @public
			 */
			onInit : function () {
				var oViewModel,
					iOriginalBusyDelay,
					oTable = this.byId("table");
				this._oPage = this.byId("page");
				this._oTable = oTable; // Need refactoring with previous line. Table controller is used on several places
				this.oRouter = this.getOwnerComponent().getRouter();
				this._oFilterBar = this.byId("filterBar");
				this._aCustomStringAttributes = [];
				this._bApplyingFilters = false; // Denotes whether filter/search is currently being applied
					
				// initialize Startup Parameters
				this.oStartupParameters = StartupParameters.getInstance();

				// Put down worklist table's original value for busy indicator delay,
				// so it can be restored later on. Busy handling on the table is
				// taken care of by the table itself.
				iOriginalBusyDelay = oTable.getBusyIndicatorDelay();
				// keeps the search state
				this._aTableSearchState = [];

				//keeps SAP_Origin from systems that are offline.
				this._offlineSystems = [];

				// Model used to manipulate control states
				oViewModel = new JSONModel({
					worklistTableTitle : this.getResourceBundle().getText("worklistTableTitle"),
					shareOnJamTitle: this.getResourceBundle().getText("worklistTitle"),
					tableNoDataText : this.getResourceBundle().getText("tableLoading"),
					tableCustomAttributeLimitInfoMessage : this.getResourceBundle().getText("tableCustomAttributeLimitInfo"),
					personalizationActive : false,  // Table personalization button not active initially
					tableBusyDelay : 0,
					refreshButtonEnabled : false,
					refreshButtonPressed : false,
					iconTabBarVisible: false,
					tableVisible: false,
					actionsColumnBusy: false,
					connectionErrorMessageVisible: false,
					caLimitInfoVisible: false,
					connectionErrorMessage: "",
					columnListItemType: "Active",
					caFilteringByOnlyForOneTaskTypeMessage: this.getResourceBundle().getText("caFilteringOnlyForOneTaskType"),
					caFilteringInfoVisible: false,
					caShowCustomFilters: false
				});
				this.setModel(oViewModel, "worklistView");
				this.setModel(models.getFilterTabsModel(), "filterTabsModel");
			    this.setModel(models.getTaskTypesModel(), "taskTypesModel");
				models.setMainModel(this.getOwnerComponent().getModel());
				
				this._oPage.setBusyIndicatorDelay(0);
				this._oPage.setBusy(true);
				// flags to manage tab loading and counters in case TaskModel is updated before SystemInfoModel
				this._bSystemInfoExists = false;

				// Create instance of all objects needed for Table operations.
				this._oTableOperations = new TableOperations(this._oTable);
				this._taskListCustomAttributeHelper = new TaskListCustomAttributeHelper(this, this.getView(), this.byId("table"), this._oTableOperations);
				this._oTableOperationsHelper = new TableOperationsHelper(this._oTableOperations, this.getView(), this._taskListCustomAttributeHelper);
				this._oTableOperationsHelper.setColumnSortIndicator("createdOnColumn", "Descending");
				this._oFilterBarHelper = new FilterBarHelper(this._oTableOperations, this._oFilterBar, this.getView(), this._taskListCustomAttributeHelper, this._oTableOperationsHelper);
				this._initializeFilterModel();

				// This object creates all TabsData, updates filterTabsModel, prepares request for all tabs counts and data,
				// prepares list of task types for each tab and updates taskTypesModel when tab is selected.
				// It should be instantiated before calling "SystemInfoCollection" and "TaskDefinitionCollection"
				this._oIconTabBarHelper = new IconTabBarHelper(this._oTableOperations, this.getView());

				var that = this;
				models.getMainModel().getMetaModel().loaded().then(function() {
					// CustomAttributeDefinitionData is requested as part of TaskDefinitionData
					models.refreshTaskDefinitionModel();
					if (models.checkPropertyExistsInMetadata("SystemInfoCollection", null)) {
						that._bSystemInfoExists = true;
						models.refreshSystemInfoModel();
					}
					else {
						that._oIconTabBarHelper.createTabsAndFilters();
						// prepare request for Tab count and filter for TaskCollection (Filter is for "All" Tab only)
						that._oIconTabBarHelper.prepareRequestsforTabCounts();
						that._oTableOperations.setAppFilters(that._oIconTabBarHelper.getTabFilterForKey("All"));
						//that._oTableOperations.setAppFilters(that._oIconTabBarHelper.getTabFilterForKey(that.byId("idIconTabBar").getSelectedKey()));
						that._oTableOperations.applyTableOperations("TabCountsBatchGrp");
					}
				});

				models.attachEvent("taskModelUpdated", null, function () {
					// #MD-743 Why this needs to be set every time. One time should be enough.
					this.setModel(models.getTaskModel(), "taskModel");
					// Apply client side sort in case when table grouping is set in ViewSettingsDialog
					if (this._oTableOperations.isGroupingChanged()) {
						this._oTable.getBinding("items").sort(this._oTableOperations.getSortGroupList());
					}
					else {
						// Apply client side sort with empty sorter to update table bindings.
						// Otherwise although tasks in the model are sorted this will not be reflected in the table
						this._oTable.getBinding("items").sort();
					}

					if (this._oTableOperations.getUserFilters().length === 0 && !this._oTableOperations.getURLParameters().hasOwnProperty("searchText")) {
						// Set this text only in case no User filters exist and there is no active search. Otherwise text should be set with one of the i18n keys:
						// "tableNoDataTextAfterFiltering" for non existent User Filters
						// "worklistNoDataWithSearchText"  when active Search exist
						this.getModel("worklistView").setProperty("/tableNoDataText", this.getResourceBundle().getText("tableNoDataText"));
					}

					this._oPage.setBusy(false);
					if (this.getModel("worklistView").getProperty("/refreshButtonPressed")) {
						this.getModel("worklistView").setProperty("/refreshButtonPressed", false);
						//do not display message toast in case there are offline systems
						if (this._offlineSystems.length <= 0) {
							MessageToast.show(this.getResourceBundle().getText("refreshTaskListSuccess"));
						}
					}
					this.getModel("worklistView").setProperty("/refreshButtonEnabled", true);
					this.getModel("worklistView").setProperty("/actionsColumnBusy", false);
					this.getModel("worklistView").setProperty("/iconTabBarVisible", true);
					this.getModel("worklistView").setProperty("/tableVisible", true);

					//models.fireEvent("updateCustomActions");

					if (this._bApplyingFilters) {
						// A filter has been applied; "_bApplyingFilters" is set to true in FilterBarHelper.js
						this._bApplyingFilters = false;
						this._selectFirstFilteredTask();
					}
				}, this);

				models.attachEvent("taskModelUpdateError", null, function () {
					this.getModel("worklistView").setProperty("/tableNoDataText", this.getResourceBundle().getText("tableNoDataText"));
					this._oPage.setBusy(false);
					this.getModel("worklistView").setProperty("/refreshButtonEnabled", true);
					this.getModel("worklistView").setProperty("/iconTabBarVisible", true);
					this.getModel("worklistView").setProperty("/tableVisible", true);

				}, this);

				models.attachEvent("systemInfoModelUpdated", null, function () {
					var aSystemInfoData = models.getSystemInfoModel().getData().results;

					//next function also populates offlineSystems property in SystemInfoModel
					this._oIconTabBarHelper.createTabsAndFilters(aSystemInfoData);
					this.createOriginsToDisplayNameDictionary(aSystemInfoData);

					this._offlineSystems = models.getSystemInfoModel().getProperty("/offlineSystems");

					if (this._oIconTabBarHelper.selectedTabKey === "All") {
						// Case for initial loading and on Refresh when selected Tab gets missing after SystemInfoCollection is updated
						this._oIconTabBarHelper.prepareRequestsforTabCounts();
					}
					else {
						this._oIconTabBarHelper.prepareRequestforSingleTabCounts(this._oIconTabBarHelper.selectedTabKey);
					}
					//this._oTableOperations.setAppFilters(this._oIconTabBarHelper.getTabFilterForKey(this.byId("idIconTabBar").getSelectedKey()));
					this._oTableOperations.setAppFilters(this._oIconTabBarHelper.getTabFilterForKey(this._oIconTabBarHelper.selectedTabKey));
					this._oTableOperations.applyTableOperations("TabCountsBatchGrp");

					//if there are offline systems, then display an error message
					if (this._offlineSystems.length > 0) {
						var param = this._offlineSystems.join(", ");
						var message = this.getResourceBundle().getText("systemConnectionError", [param]);
						this.getModel("worklistView").setProperty("/connectionErrorMessage", message);
						this.getModel("worklistView").setProperty("/connectionErrorMessageVisible", true);
					}
					else {
						//there are no offlineSystems, then hide the error message
						this.getModel("worklistView").setProperty("/connectionErrorMessageVisible", false);
					}
				}, this);

				models.attachEvent("systemInfoModelUpdateError", null, function () {
					this._oPage.setBusy(false);
				}, this);

				models.attachEvent("updateCustomActions", null, function () {
					//don't show generic error because we have handlers.
					this.getOwnerComponent().getErrorHandler().preventErrorMessageBoxToOpen(true);
					models.updateTaskModelWithCustomActions();
				}, this);

				models.attachEvent("customActionsUpdated", null, function () {
					//reset generic error handler to display generic error messages.
					this.getOwnerComponent().getErrorHandler().preventErrorMessageBoxToOpen(false);
					this.getModel("worklistView").setProperty("/actionsColumnBusy", false);
				}, this);

				models.attachEvent("customActionsUpdateError", null, function () {
					//reset generic error handler to display generic error messages.
					this.getOwnerComponent().getErrorHandler().preventErrorMessageBoxToOpen(false);
					this.getModel("worklistView").setProperty("/actionsColumnBusy", false);
				}, this);

				models.attachEvent("customActionSuccess", null, function(oEvent) {
					if (oEvent.getParameter("taskStatus") === "COMPLETED") {
						/*
							Update selected and related Tabs count. This is done for consistency, so the sum of all Tabs counts
							equals count of tab "All". This calculation is prognostic and it is based on the tasks available 
							at time of TC initial loading or Refresh. To see current count for a Tab, Refresh for that Tab should be made. 
							To see real count for all Tabs Refresh from Tab "All" should be made.
						*/
						var taskToRemove = oEvent.getParameter("taskToRemove");
						var selectedIconTabKey = this._oIconTabBarHelper.selectedTabKey;
						var selectedKeyCount = this._oIconTabBarHelper.getIconTabProperty(selectedIconTabKey, "count");
						var relatedIconTabKey;
						var relatedKeyCount;
						if (selectedIconTabKey === "All") {
							relatedIconTabKey = this._oIconTabBarHelper.mSAP__OriginToIconTabID[taskToRemove.SAP__Origin];
							relatedKeyCount = this._oIconTabBarHelper.getIconTabProperty(relatedIconTabKey, "count");
							this._oIconTabBarHelper.setIconTabProperty("All", "count", selectedKeyCount - 1);
							this._oIconTabBarHelper.setIconTabProperty(relatedIconTabKey, "count", relatedKeyCount - 1);
						}
						else {
							this._oIconTabBarHelper.setIconTabProperty(selectedIconTabKey, "count", selectedKeyCount - 1);
							relatedKeyCount = this._oIconTabBarHelper.getIconTabProperty("All", "count");
							this._oIconTabBarHelper.setIconTabProperty("All", "count", relatedKeyCount - 1);
						}
						models.getFilterTabsModel().updateBindings();

						// Firing "taskModelUpdated" does not seem to be necessary, but may add robustness
						// models.fireEvent("taskModelUpdated");

						if (this.getOwnerComponent().getFCLHelper().getCurrentUIState().layout === "OneColumn"
							|| ResponseOptionsHelper._bCompletedTaskIsDifferentFromDetail) {
							// Do nothing if Detail view is not visible
							// or if an unselected task is updated via the table
							// (the latter may not even be possible in a future release)
							return;
						}

						var aTableItems = this._oTable.getItems();

						if (aTableItems.length > 0) {
							var oNextItem = aTableItems[this._iPressedIndex];

							if (oNextItem) {
								// When a task is completed, navigate to next item, if present
								oNextItem.firePress();
							}
							else {
								// if not, navigate to previous item
								aTableItems[this._iPressedIndex - 1].firePress();
							}
						}
						else {
							// if there are no items left, close Detail view
							this.oRouter.navTo("myTasksMaster", null, this.bReplaceHistory);
						}
					}

					MessageToast.show(this.getResourceBundle().getText("actionSuccessfullyExecuted"));
				}, this);

				models.attachEvent("customActionError", null, function(oEvent) {
					this.openMessageDialog(
						oEvent.getParameter("sCurrentAction"),
						oEvent.getParameter("aSuccessList"),
						oEvent.getParameter("aErrorList"),
						null,
						oEvent.getParameter("aSelectedTasks")
					);
				}, this);

				// Make sure, busy indication is showing immediately so there is no
				// break after the busy indication for loading the view's meta data is
				// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
				oTable.attachEventOnce("updateFinished", function() {
					// Restore original busy indicator delay for worklist's table
					oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);

				});
				// Add the worklist page to the flp routing history
				this.addHistoryEntry({
					title: this.getResourceBundle().getText("worklistViewTitle"),
					icon: "sap-icon://table-view",
					intent: "#taskcenter-display"
				}, true);

				// Initialize Table columns personalization
				this._initPersonalization();
				
				// Initialize Placeholder and Tooltip
				this._initPlaceholderAndTooltip();
				
				// set navigation arrows to be displayed on rows
				if (this.oStartupParameters.isFlexibleColumnLayout()) {
					this.getModel("worklistView").setProperty("/columnListItemType", "Navigation");
				}
				this.getRouter().getRoute("myTasksMaster").attachPatternMatched(this._onMasterMatched, this);

				this.getRouter().attachRouteMatched(this._onRouteMatched, this);

				// register function for on resize event for table popin configuration
				ResizeHandler.register(oTable, this.onResize.bind(this));

				// the metadata loaded state is set up in App controller
				var bIsMetadataFailed = this.getOwnerComponent().getErrorHandler().getIsMetadataLoadedFailed();
				if (bIsMetadataFailed) {
					that._oPage.setBusy(false);
				}
			},

			onExit : function () {
				// Destroy StartupParameters instance
				this.oStartupParameters.destroy();
				this.getRouter().detachRoutePatternMatched(this._onMasterMatched, this);
				//Destroy Perso controller on exit
				this._oTablePersoController.destroy();
				this._oTableOperationsHelper.destroy();
				this._oTableOperations.destroy();
				models.destroy();
			},
			/* =========================================================== */
			/* event handlers                                              */
			/* =========================================================== */

			/**
			 * Triggered by the table's 'updateStarted' event
			 * @param {sap.ui.base.Event} oEvent the update finished event
			 * @public
			 */
			onUpdateStarted : function (oEvent) {
				Log.debug("Started: " + JSON.stringify(oEvent.getParameters()), "Worklist.controller.js", "MyTasks");
				Log.debug("Started: " + JSON.stringify(this._oTable.getGrowingInfo()), "Worklist.controller.js", "MyTasks");
				var eventReason = oEvent.getParameter("reason").toLowerCase();
				if (eventReason === "growing") {
					models.loadNextPageInTaskModel();
				}

			},

			/**
			 * Triggered by the table's 'updateFinished' event: after new table
			 * data is available, this handler method updates the table counter.
			 * This should only happen if the update was successful, which is
			 * why this handler is attached to 'updateFinished' and not to the
			 * table's list binding's 'dataReceived' method.
			 * @param {sap.ui.base.Event} oEvent the update finished event
			 * @public
			 */
			onUpdateFinished : function (oEvent) {
				Log.debug("Finished: "+ JSON.stringify(oEvent.getParameters()), "Worklist.controller.js", "MyTasks");
				Log.debug("Finished: "+ JSON.stringify(this._oTable.getGrowingInfo()), "Worklist.controller.js", "MyTasks");

				var oIconTabBar = this.byId("idIconTabBar");
				var eventReason = oEvent.getParameter("reason").toLowerCase();
				if ((eventReason === "change") || (eventReason === "filter") || (eventReason === "sort")) {
					// current items count in the tab(i.e. - after filtering they are less then the tab counter value)
					var iItemsCount = 0;
					var iAllPagesCount = models.getTaskModel().getData().__count;
					if (iAllPagesCount >= 0) {
						iItemsCount = iAllPagesCount;
					}
					var iTabCounter;
					if (oIconTabBar.oSelectedTab) {
						iTabCounter = this.getCustomDataValues(oIconTabBar.oSelectedTab).count;
					}
					else {
						iTabCounter = iItemsCount;
					}
					// set the Table Header to Tasks (iCurrentItemsCount / iTabCounter), i.e. - Tasks (7/15)
					this.setTableHeaderCounter(iItemsCount, iTabCounter);
				}
			},

			/**
			 * Event handler when a table item gets pressed
			 * @param {sap.ui.base.Event} oEvent the table selectionChange event
			 * @public
			 */
			onPress : function (oEvent) {
				// The source is the list item that got pressed
				var oItem = oEvent.getSource();
				var oTaskModel;
				var sURL;

				if (oItem) {
					oTaskModel = oItem.getBindingContext("taskModel");
					if(!jQuery.isEmptyObject(oItem.getParent())
						&& typeof oItem.getParent().indexOfItem(oItem) !== "undefined") {
						this.iIndex = oItem.getParent().indexOfItem(oItem);	
					}

					// Make sure the following flags are set even if in the future navigating to Detail view directly is possible
					// (by going to a URL corresponding to a specific task)
					this._iPressedIndex = this._oTable.getItems().indexOf(oItem);
					ResponseOptionsHelper._sPressedItemContextPath = oItem.getBindingContextPath();
				}
				if (oTaskModel) {
					if (this.oStartupParameters.isFlexibleColumnLayout()) {
						// eslint-disable-next-line camelcase
						var SAP__Origin = oTaskModel.getProperty("SAP__Origin");
						var InstanceID = oTaskModel.getProperty("InstanceID");

						// remove the navigation line from the previous item, which was pressed on previous click
						if (this.oLastNavigatedItem) {
							this.oLastNavigatedItem.setNavigated(false);
						}

						this.oLastNavigatedItem = oItem.setNavigated(true);

						var oNextUIState = this.getOwnerComponent().getFCLHelper().getNextUIState(1);
						var sLayout = oNextUIState.layout;
						// eslint-disable-next-line camelcase
						this.oRouter.navTo("myTasksDetail", {SAP__Origin: encodeURIComponent(SAP__Origin),
							InstanceID: encodeURIComponent(InstanceID), layout: sLayout}, this.bReplaceHistory);
					}
					else {
						sURL = oTaskModel.getProperty("GUI_Link");
					}
				}
				if (sURL) {
					sap.m.URLHelper.redirect(sURL, true);
				}
				// unpress show log button on task selection
				this.getModel("parametersModel").setProperty("/showLogButtonPressed", false);
				models.resetWorkflowLogModel();
				
				// unpress show details button on task selection
				this.getModel("parametersModel").setProperty("/showDetailsButtonPressed", false);
				
				// if there is no URL - then do nothing.
			},

			onSearch : function (oEvent) {
				this.clearTaskListSelection();
				if (oEvent.getParameters().refreshButtonPressed) {
					// Search field's 'refresh' button has been pressed.
					// This is visible if you select any master list item.
					// In this case no new search is triggered, we only
					// refresh the list binding.
					this.onRefresh();
				}
				else {
					this._oFilterBarHelper.prepareSearch(oEvent.getSource(), this._aCustomStringAttributes);
					var sQuery = oEvent.getParameter("query");
					if (sQuery && sQuery.length > 0) {
						// changes the noDataText of the list in case there are no filter results
						var sCustomAttributes = "";
						if (this._aCustomStringAttributes.length > 0) {
							sCustomAttributes =  ", " + this._aCustomStringAttributes.join(", ");
						}
						this.getModel("worklistView").setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchTextCustomAttributes") + sCustomAttributes);
						this._oTableOperations.setURLParameter("searchText",sQuery);
					}
					else {
						this._oTableOperations.removeURLParameter("searchText");
					}
					this._oTableOperations.applyTableOperations();
					this._oPage.getScrollDelegate().scrollTo(0, 0, 0);
				}
			},

			/**
			 * Event handler for refresh event. Keeps filter, sort
			 * and group settings and refreshes the list binding.
			 * @public
			 */
			onRefresh : function () {
				var oTable = this.byId("table");
				oTable.getBinding("items").refresh();
			},
			
			_initPlaceholderAndTooltip: function () {
				if(this._aCustomStringAttributes.length > 0) {
					var sCustomAttributesText = this.getResourceBundle().getText("searchFieldPlaceholder") + ", " + this._aCustomStringAttributes.join(', ');
					this.getModel("worklistView").setProperty("/searchFieldPlaceholder", sCustomAttributesText);
					this.getModel("worklistView").setProperty("/worklistSearchTooltip", sCustomAttributesText);
				} 
				else {
					this.getModel("worklistView").setProperty("/searchFieldPlaceholder", this.getResourceBundle().getText("searchFieldPlaceholder"));
					this.getModel("worklistView").setProperty("/worklistSearchTooltip", this.getResourceBundle().getText("worklistSearchTooltip"));
				}
			},	
			/**
			 * Event handler for resize event. Here changes properties depending of screeen size.
			 *
			 * @param {sap.ui.base.Event} oEvent Event from resize of the screen.
			 */
			onResize : function (oEvent) {
				if (oEvent.size.width <= 640
					|| (oEvent.size.width > 640 && Device.system.phone) // for phone in horizontal position
					|| (oEvent.size.width > 640 && oEvent.size.width < 900 && oEvent.oldSize.width !== 0 && oEvent.oldSize.width < 900
							&& Device.system.tablet)) { // for tablet with first colum in 66% of whole screen
					this.getModel("parametersModel").setProperty("/showCreatedByAvatar", false);
					this.getModel("parametersModel").setProperty("/widthNameColumn", "");
					this.getModel("parametersModel").setProperty("/widthPriorityColumn", "6rem");
				}
				else {
					this.getModel("parametersModel").setProperty("/showCreatedByAvatar", true);
					this.getModel("parametersModel").setProperty("/widthNameColumn", "35%");
					this.getModel("parametersModel").setProperty("/widthPriorityColumn", "");
				}
			},

			handleIconTabBarSelect: function(oEvent) {
				var oIconTabBar = this.byId("idIconTabBar"),
					selectedTabKey = oEvent.getParameter("key");
				// if tab selection has changed
				if ((selectedTabKey)
						&& (oIconTabBar.oSelectedTab)
						&& (oIconTabBar.oSelectedTab.getProperty("key") !== selectedTabKey)) {
					this._oPage.setBusy(true);
					// store last selected tab and tab key
					oIconTabBar.oSelectedTab = oEvent.getParameter("selectedItem");
					this._oIconTabBarHelper.selectedTabKey = selectedTabKey;

					this.clearTaskListSelection();	// Clear selected tasks so no action buttons are enabled
					// Reset View Settings Dialog also resets UserFilters in TableOperationImpl. If you like to keep the UserFilters when switching Tabs
					// remove following line and reset AppFilters only.
					this._oTableOperationsHelper.resetViewSettingsDialog();
					
					this._oFilterBarHelper.resetFilterBar();

					// Set current Tab filter in AppFilters
					this._oTableOperations.setAppFilters(this._oIconTabBarHelper.getTabFilterForKey(selectedTabKey));
					this._bApplyingFilters = true;

					if (selectedTabKey === "All") {
						this._oIconTabBarHelper.prepareRequestsforTabCounts();
					}
					else {
						this._oIconTabBarHelper.prepareRequestforSingleTabCounts(selectedTabKey);
					}

					this._taskListCustomAttributeHelper.hideCustomAttributeColumns();

					this._oTableOperations.removeURLParameter("searchText");	// Remove search string
					this._oTableOperations.applyTableOperations("TabCountsBatchGrp");	// Trigger BATCH request for tab counts and TaskCollection with current filters
					this._oIconTabBarHelper.updateTaskTypesListForTab(selectedTabKey);
				}
			},

			/**
			 * Event handler for clearing the filters in the filter bar.
			 *
			 * @param {sap.ui.base.Event} oEvent Event from clear button.
			 */
			onClearFilters: function (oEvent) {
				this._oFilterBarHelper.resetFilterBar();
				this._oTableOperations.setURLParameter("searchText", "");
				this._oFilterBarHelper.applyFilters(oEvent);
			},

			/* =========================================================== */
			/* internal methods                                            */
			/* =========================================================== */

			/**
			 * Initialize personalization of Table columns
			 * @private
			 */
			_initPersonalization: function() {
				var oPersonalizationService = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService && sap.ushell.Container.getService("Personalization");
				if (oPersonalizationService) {
					var oPersonalizer = oPersonalizationService.getPersonalizer({
						container: "cross.fnd.fiori.inbox.Table", // This key must be globally unique (use a key to
																// identify the app) Note that only 40 characters are allowed
						item: "worklistTable" // Maximum of 40 characters applies to this key as well !! Not found reference for this restriction
					});
					this._oTablePersoController = new sap.m.TablePersoController("PersoID",{
						table: this._oTable,
						componentName: "table",
						persoService: oPersonalizer,
						// Temporarily hidden due to CENTRALINBOX-2379
						showResetAll: false
					}).activate();
				}
				this.getView().getModel("worklistView").setProperty("/personalizationActive", !!oPersonalizationService);
			},

			/**
			 * Open Table columns personalization dialog
			 * @private
			 */
			_onPersoButtonPressed: function() {
				this._oTablePersoController.openDialog();
			},

			/**
			 * The method handles what to happen, when select multi select checkbox of a task.
			 *
			 * @param {sap.ui.base.Event} oEvent Event from selecting multi select checkbox from the table.
			 */
			handleSelectionChange : function(oEvent) {
				this.resetActionButtons();
				var aSelectedTasksCount = this._oTable.getSelectedContexts().length;
				if (aSelectedTasksCount === 0) {
					this.oSelectedTasksDetails = null;
					return;
				}
				var oEventParameters = oEvent.getParameters();
				// Prepare needed information for selected tasks in the table.
				this.oSelectedTasksDetails = TaskHelper.getSelectedTasksDetails(oEventParameters, this.oSelectedTasksDetails);
				this.setActionButtons();
			},

			/**
			 * Clear all selected items in the list
			 */
			clearTaskListSelection : function() {
				this._oTable.removeSelections();
				this.resetActionButtons();
				this.oSelectedTasksDetails = null;
			},

			/**
			 * Reset action buttons states.
			 */
			resetActionButtons : function() {
				// DO NOT DELETE THIS COMMENTED SECTION because of JIRA: CENTRALINBOX-1828
				// var claimButton = this.byId("claimButton");
				// claimButton.setVisible(false);
				// var releaseButton = this.byId("releaseButton");
				// releaseButton.setVisible(false);
			},

			/**
			 * Enable action buttons, if it is needed.
			 */
			setActionButtons : function() {
				// Claim button.
				if (this.oSelectedTasksDetails.bIsClaimActive) {
					var claimButton = this.byId("claimButton");
					claimButton.setVisible(true);
				}
				// Release button.
				if (this.oSelectedTasksDetails.bIsReleaseActive) {
					var releaseButton = this.byId("releaseButton");
					releaseButton.setVisible(true);
				}
			},

			onSortButtonPressed: function() {
				this._handleTableOperationsDialog("sort");
			},

			/* Not used at the moment, but reserved for grouping functionality - do not delete
			onGroup2ButtonPressed: function() {
				this._handleTableOperationsDialog("group");
			}, */

			/**
			 * Handles Table Operations Dialog and selects specified dialog tab.
			 * @private
			 * @param {string} sOperationType - Type of tab to be opened. Valid values are "sort", "filter" and "group".
			 */
			_handleTableOperationsDialog: function(sOperationType) {
				this._oTableOperationsHelper
					.openTableOperationsDialog(sOperationType)
					.attachConfirm(null, this.clearTaskListSelection.bind(this));
			},

			/**
			 * The method handles what to happen, when Claim button is pressed.
			 *
			 * @param {sap.ui.base.Event} oEvent Event from pressing the Claim button.
			 */
			onClaimButtonPressed : function (oEvent) {
				this.performAction("Claim");
			},

			/**
			 * Perform action.
			 *
			 * @param {string} sCurrentAction String with current action name.
			 */
			performAction : function (sCurrentAction) {
				this.getOwnerComponent().getErrorHandler().preventErrorMessageBoxToOpen(true); // Turn off ErrorHandler error message
				var aSelectedTasks = [];
				models.performTaskAction(
										sCurrentAction,
										this.oSelectedTasksDetails.oMapWithSelectedTasks,
										aSelectedTasks,
										this.fnActionSuccess.bind(this, sCurrentAction, aSelectedTasks),
										this.fnActionError.bind(this)
										);
			},

			/**
			 * Success method, which handles the response.
			 *
			 * @param {string} sCurrentAction String with current action name.
			 * @param {array} aSelectedTasks List with tasks, which are selected.
			 * @param {object} oData Data from the response.
			 */
			fnActionSuccess : function (sCurrentAction, aSelectedTasks, oData) {
				var aBatchResponses = oData.__batchResponses;
				var aSuccessList = [];
				var aErrorList = [];
				var aChangedTasks = [];

				for (var i = 0; i < aBatchResponses.length; i++) {
					var oBatchResponse = aBatchResponses[i];
					var bSuccess = false;

					if (oBatchResponse.hasOwnProperty("__changeResponses")) {
						var oChangeResponse = oBatchResponse.__changeResponses[0];
						if (oChangeResponse.statusCode >= "200" && oChangeResponse.statusCode < "300") {
							bSuccess = true;
							aChangedTasks.push({index: i, oData: oChangeResponse.data});
						}
					}
					var oTask = aSelectedTasks[i];
					if (bSuccess) {
						if (sCurrentAction === "Claim") {
							oTask.sMessage = this.getResourceBundle().getText("taskClaimedSuccesfully");
						}
						if (sCurrentAction === "Release") {
							oTask.sMessage = this.getResourceBundle().getText("taskReleasedSuccesfully");
						}
						aSuccessList.push(oTask);
					}
					else if (oBatchResponse.response) {
						var oResponseBody = JSON.parse(oBatchResponse.response.body);
						oTask.sMessage = oResponseBody.error.message.value;
						if (oResponseBody.error.innererror) {
							oTask.sErrorCode = oResponseBody.error.innererror.errordetails[0].code;
						}
						else {
							oTask.sErrorCode = oBatchResponse.response.statusCode;
						}

						// remove html tags from Response Body
						var oRemovedHtmlBody = Utils.fnRemoveHtmlTags(oResponseBody);

						// prepare response to be in good readable json format
						oTask.sErrorBody = "<pre>" + JSON.stringify(oRemovedHtmlBody, null , 2) + "</pre>";

						aErrorList.push(oTask);
					}
				}

				this.handleActionPerformed(sCurrentAction, aSuccessList, aErrorList, aChangedTasks, aSelectedTasks);
			},

			/**
			 * Error method, which handles the response.
			 *
			 * @param {object} oError - error from the response.
			 */
			fnActionError : function (oError) {
				this.getOwnerComponent().getErrorHandler().preventErrorMessageBoxToOpen(false);
				this.getOwnerComponent().getErrorHandler()._showServiceError(oError.message);
			},

			/**
			 * If there are no errors, it opens message toast. If there are errors, it opens a message dialog.
			 *
			 * @param {string} sCurrentAction String with current action name.
			 * @param {array} aSuccessList List with tasks, where action is successful.
			 * @param {array} aErrorList List with tasks, where action is with error.
			 * @param {array} aChangedTasks List with tasks, which must be updated.
			 * @param {array} aSelectedTasks List with tasks, which are selected.
			 */
			handleActionPerformed: function(sCurrentAction, aSuccessList, aErrorList, aChangedTasks, aSelectedTasks) {
				if (aErrorList.length === 0) {
					if (sCurrentAction === "Claim") {
						MessageToast.show(this.getResourceBundle().getText(aSuccessList.length > 1 ? "tasksClaimed"
							: "taskClaimed", [aSuccessList.length]));
					}
					if (sCurrentAction === "Release") {
						MessageToast.show(this.getResourceBundle().getText(aSuccessList.length > 1 ? "tasksReleased"
							: "taskReleased", [aSuccessList.length]));
					}
					this.updateTableOnActionComplete(aChangedTasks, aSelectedTasks);
				}
				else {
					this.openMessageDialog(sCurrentAction, aSuccessList, aErrorList, aChangedTasks, aSelectedTasks);
				}
			},

			/**
			 * Update tasks after action complete.
			 *
			 * @param {array} aChangedTasks List with tasks, which must be updated.
			 * @param {array} aSelectedTasks List with tasks, which are selected.
			 */
			updateTableOnActionComplete: function(aChangedTasks, aSelectedTasks) {
				// update the table model
				models.updateTaskModelForCertainTasks(aChangedTasks, aSelectedTasks);

				// remove all selections and reset selected task data
				// TODO removing selections as of now, but for the tasks which are not processed, keep the selection
				this._oTable.removeSelections(true);
				this.resetActionButtons();
				this.oSelectedTasksDetails = null;
				this.getOwnerComponent().getErrorHandler().preventErrorMessageBoxToOpen(false); // Turn on ErrorHandler error message
			},

			/**
			 * Create multi select message dialog view and open it.
			 *
			 * @param {string} sCurrentAction String with current action name.
			 * @param {array} aSuccessList List with tasks, where action is successful.
			 * @param {array} aErrorList List with tasks, where action is with error.
			 * @param {array} aChangedTasks List with tasks, which must be updated.
			 * @param {array} aSelectedTasks List with tasks, which are selected.
			 */
			openMessageDialog: function(sCurrentAction, aSuccessList, aErrorList, aChangedTasks, aSelectedTasks) {
				if (!this.oMultiSelectMessageDialogView) {
					this.oMultiSelectMessageDialogView = sap.ui.view({
						viewName: "cross.fnd.fiori.inbox.view.MultiSelectMessageDialog",
						type: sap.ui.core.mvc.ViewType.XML
					});
				}
				this.getView().addDependent(this.oMultiSelectMessageDialogView);
				this.oMultiSelectMessageDialogView.getController()
					.openDialog(sCurrentAction, aSuccessList, aErrorList, aChangedTasks, this.updateTableOnActionComplete.bind(this, aChangedTasks, aSelectedTasks));
			},

			/**
			 * The method handles what to happen, when Release button is pressed.
			 *
			 * @param {sap.ui.base.Event} oEvent Event from pressing the Release button.
			 */
			onReleaseButtonPressed : function (oEvent) {
				this.performAction("Release");
			},

            /**
			 * The method handles what to happen, when Refresh button is pressed.
			 *
			 * @param {sap.ui.base.Event} oEvent Event from pressing the Refresh button.
			 */
			onRefreshButtonPressed: function (oEvent) {
				this._oPage.setBusyIndicatorDelay(0);
				this._oPage.setBusy(true);
				// #MD-743 Do we need following two lines. The full page is busy after Refresh is pressed?
				this.getModel("worklistView").setProperty("/refreshButtonEnabled", false);
				this.getModel("worklistView").setProperty("/refreshButtonPressed", true);

				this.clearTaskListSelection();

				models.refreshTaskDefinitionModel();
				if (this._bSystemInfoExists) {
					models.refreshSystemInfoModel();
				}
				else {
					this._oIconTabBarHelper.createTabsAndFilters();
					// prepare request for Tab count and filter for TaskCollection (Filter is for "All" tab only)
					this._oIconTabBarHelper.prepareRequestsforTabCounts();
					//this._oTableOperations.setAppFilters(this._oIconTabBarHelper.getTabFilterForKey(this.byId("idIconTabBar").getSelectedKey()));
					//this._oTableOperations.setAppFilters(this._oIconTabBarHelper.getTabFilterForKey(this._oIconTabBarHelper.selectedTabKey));
                    this._oTableOperations.setAppFilters(this._oIconTabBarHelper.getTabFilterForKey("All"));
					this ._oTableOperations.applyTableOperations("TabCountsBatchGrp");
				}

				//this will make sure that we scroll to top on refresh and the growing is not blocked.
				//Method  scrollTo is still missing in UI5 documentation and will be added later
				this._oPage.getScrollDelegate().scrollTo(0, 0, 0);
			},

			/**
			 * set the Table Header to Tasks (iCurrentItemsCount / iTabCounter), i.e. - Tasks (7/15)
			 * @param {integer} iCurrentItemsCount - count of items for the tab after filtering
			 * @param {integer} iTabCounter - count of all items for the tab before filtering
			 */
			setTableHeaderCounter: function (iCurrentItemsCount, iTabCounter) {
				var title = this.getResourceBundle().getText("worklistTableTitle");
				if (iCurrentItemsCount < iTabCounter) {
					this.getModel("worklistView").setProperty("/worklistTableTitle", title
						+ " (" + iCurrentItemsCount + " / "
						+ iTabCounter + ")");
				}
				else {
					this.getModel("worklistView").setProperty("/worklistTableTitle", title
						+ " (" + iTabCounter + ")");
				}
			},

			/**
			 * @returns {array} containing SAP__Origin values for the currently selected tab
			 * used for filtering by TaskDefinition
			 */
			getSapOriginsForSelectedTab: function () {
				var oIconTabBar = this.byId("idIconTabBar");
				var aSapOrigins = [];
				if (oIconTabBar.oSelectedTab) {
					aSapOrigins = this.getCustomDataValues(oIconTabBar.oSelectedTab).aSAP__OriginList;
				}
				return aSapOrigins;
			},

			getCustomDataValues: function(oTab) {
				var oValues = {};
				if ((oTab)
						&& (oTab.getCustomData())
						&& (oTab.getCustomData()[0])
						&& (oTab.getCustomData()[0].getValue())) {
					oValues = oTab.getCustomData()[0].getValue();
				}
				return oValues;
			},

			createOriginsToDisplayNameDictionary : function(aSystemInfoData) {
				this.OriginsToDisplayNameDictionary = {};
				for (var i = 0; i < aSystemInfoData.length; i++) {
					var sapOrigin = aSystemInfoData[i].SAP__Origin;
					var displayName = aSystemInfoData[i].DisplayName;
					this.OriginsToDisplayNameDictionary[sapOrigin] = displayName;
				}
			},

			/**
			 * Default action for the MenuButton of the Actions column
			 *
			 * @param {Object} oEvent - contains event data
			 */
			onDefaultActionApprove: function(oEvent) {
				var oTask = oEvent.getSource().getCustomData()[0].getValue();
				var sDecisionKey = oTask.DefaultAction.DecisionKey;
				var sButtonText = oEvent.getSource().getText();

				//get context path to identify current index in the task model
				var sContextPath = oEvent.getSource().getParent().getBindingContextPath();

				ResponseOptionsHelper.processCustomAction(sDecisionKey, sButtonText, oTask, sContextPath, this);
			},

			/**
 			 * Menu action called from MenuItem buttons of the Actions column
 			 *
 			 * @param {Object} oEvent - contains event data
 			 */
			onMenuAction: function(oEvent) {
				var oItem = oEvent.getParameter("item");
				var oTask = oEvent.getSource().getParent().getCustomData()[0].getValue();
				var sDecisionKey = oItem.getKey();
				var sButtonText = oItem.getText();

				//get context path to identify current index in the task model
				var sContextPath = oEvent.getSource().getParent().getParent().getBindingContextPath();

				ResponseOptionsHelper.processCustomAction(sDecisionKey, sButtonText, oTask, sContextPath, this);
			},			

			/**
			 * When navigate to master route, deselect the row from previous selection
			 *
			 * @private
			 */
			_onMasterMatched: function() {
				this.bReplaceHistory = !Device.system.phone;

				if (this.oLastNavigatedItem) {
					this.oLastNavigatedItem.setNavigated(false);
				}
			},

			/**
			 * When the route name matches the My Tasks routes, sets the shell title
			 *
			 * @param {Object} oEvent - contains event data
			 * @private
			 */
			_onRouteMatched: function(oEvent) {
				if (oEvent.getParameter("name") === "myTasksMaster"
					|| oEvent.getParameter("name") === "myTasksDetail"
					|| oEvent.getParameter("name") === "myTasksDetailDetail"
					|| oEvent.getParameter("name") === "additionalTaskDetails") {

					var that = this;
					this.getOwnerComponent().getService("ShellUIService").then(
						function (oService) {
							oService.setTitle(that.getResourceBundle().getText("worklistViewTitle"));
						},
						function (oError) {
							Log.error("Cannot get ShellUIService", oError);
						}
					);
				}
			},
			
			/**
			 * 
			 *
			 * @param {sap.ui.base.Event} oEvent Event from pressing the Go button of the FilterBar
			 */
			onFiltersGoPressed: function (oEvent) {			
				this._oFilterBarHelper.applyFilters(oEvent);
				// changes the noDataText of the list in case there are no filter results
				this.getModel("worklistView").setProperty("/tableNoDataText", this.getResourceBundle().getText("tableNoDataTextAfterFiltering"));
				this._oPage.getScrollDelegate().scrollTo(0, 0, 0);
			},

			/**
			 * Callback function called on selectionChange of the filter MultiComboBoxes; used to ensure that an actual change to the filter has occurred.
			 */
			onFilterActualChange: function () {
				this._bActualFilterChange = true;
			},

			_initializeFilterModel: function() {
				this.getView().setModel(this._oFilterBarHelper.getFilterModel(), "filter");
			},

			onDPTStateChange: function() {
				// setTimeout needed because getHeaderExpanded does not return the actual state yet
				setTimeout(function(){
					this.getModel("filter").setProperty("/filterTextLabelVisible", !this._oPage.getHeaderExpanded());	
				}.bind(this));				
			},

			/**
			 * If the Detail view is open and filters have been applied, selects the first of the newly filtered tasks (if any)
			 */
			_selectFirstFilteredTask: function() {
				var sLayout = this.getOwnerComponent().getFCLHelper().getCurrentUIState().layout;

				if (sLayout === "OneColumn") {
					// Only proceed if Detail view is open
					return;
				}

				var aTableItems = this._oTable.getItems();

				if (aTableItems.length > 0) {
					aTableItems[0].firePress();
				}
				else {
					// If there are no filtered items, show empty Detail view
					if (sLayout.indexOf("TwoColumns") === -1) {
						// In case there are three columns visible
						sLayout = "TwoColumnsMidExpanded";
					}

					this.oRouter.navTo("myTasksDetailEmpty", { layout: sLayout }, this.bReplaceHistory);
				}
			}
		});
	}
);
