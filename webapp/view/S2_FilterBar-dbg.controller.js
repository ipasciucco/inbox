/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Sorter",
	"sap/m/Token",
	"sap/base/Log",
	"cross/fnd/fiori/inbox/util/EmployeeCard",
	"sap/ui/core/Item",
	"sap/m/SearchField",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/Fragment",
	"sap/ui/Device",
	"sap/ui/comp/library",
	"sap/ui/comp/valuehelpdialog/ValueHelpDialog",
	"sap/ui/thirdparty/jquery"
], function(Filter, FilterOperator, Sorter, Token, BaseLog, EmployeeCard, Item, SearchField, JSONModel, Fragment, Device,
	UICompLibrary, ValueHelpDialog, jQuery) {
	"use strict";

	var ValueHelpRangeOperation = UICompLibrary.valuehelpdialog.ValueHelpRangeOperation;

	sap.ui.controller("cross.fnd.fiori.inbox.view.S2_FilterBar", {
		_oDialogPromise: null,

		onInit: function() {
			this.getView().setModel(cross.fnd.fiori.inbox.util.tools.Application.getImpl().AppI18nModel, "i18n");
			this._oTaskListController = this.getView().getViewData().parentController;
			this._oTableOperations = this.getView().getViewData().oTableOperations;
			this._tableHelper = this.getView().getViewData().oTableHelper;
			this._oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
			this._oFilterBar = this.byId("filterBar");
			this._tableHelper.setFilterbar(this, this._oFilterBar);
			this._oTaskListController.setFilterBar(this._oFilterBar);
			this._addSearchField();
			this._initializeFilterModel();
			this._oFilterBar.registerFetchData(this._fetchData);
			this._oFilterBar.registerApplyData(this._applyData);
			this._oFilterBar.registerGetFiltersWithValues(this._getFiltersWithValues);
			this._oFilterBar.fireInitialise();
			this.sCreatedByUniqueId = this.createId() + "DLG_CREATED_BY";
			this.oDataManager = cross.fnd.fiori.inbox.util.tools.Application.getImpl().getComponent().getDataManager();
			this._MAX_CREATED_BY = 100;

			this.oDataManager.oModel.getMetaModel().loaded().then(function() {
				var namespace = this.oDataManager.getServiceMetadataNamespace();
				if (namespace === "com.sap.bpm.wfs.tcm.metadata") {
					this.getView().getModel("filter").setProperty("/showValueHelpForCreatedByFilter", false);
				}
			}.bind(this));

			jQuery.when(this._oTaskListController._loadCustomAttributesDeferredForTasks, this._oTaskListController._loadCustomAttributesDeferredForTaskDefs).then(jQuery.proxy(function() {
				var oMultiCombo = this.byId("taskdefinitionFilter");
				var taskDefArray = this._oTaskListController._getTaskDefinitionFiltersForFilterBar();
				if (taskDefArray) {
					taskDefArray = [taskDefArray];
				}

				var taskDefSorter = new Sorter("TaskName");

				oMultiCombo.bindItems({
					path:"taskDefinitions>/TaskDefinitionCollection",
					sorter:taskDefSorter,
					filters:taskDefArray,
					factory:this._taskDefinitionListFactory
				});

				//Set Scenario Name and task definiton filters on the UI if any
				this._oFilterBar.setStandardItemText(this._oTaskListController._getScenrio());
				this._oFilterBar.setPersistencyKey(this._oTaskListController._getScenrioId());
				this._oFilterBar._initPersonalizationService();

				// Set the tooltip of the variant management button
				var oVariantPopoverButton = this._oFilterBar._oVariantManagement.oVariantPopoverTrigger;
				var oVariantPopoverButtonText = this._oResourceBundle.getText("filter.variantManagement.trigger");
				oVariantPopoverButton.setTooltip(oVariantPopoverButtonText);

				this._applyData.call(this._oFilterBar, {filter:[{name:"taskdefinition",selectedKeys: this._oTaskListController._getTaskDefinitionsForFilterBar()}]});
				this._oFilterBar.fireSearch();
			}, this));
		},

		_taskDefinitionListFactory : function(sId,oContext) {
			var element = new Item({
				key:"{taskDefinitions>TaskDefinitionID}",
				text:"{taskDefinitions>TaskName}"
			});
			return element;
		},

		onExit: function() {
			this._customColumns = {previousVariantId:undefined};
			this._customFilters = {};
		},

		_addSearchField: function() {
			var oSearchField = this._oFilterBar.getBasicSearch();
			if (!oSearchField) {
				this._oBasicSearch = new SearchField({
					showSearchButton: true,
					search:[this.onSearchPressed, this]
				});
				this._oFilterBar.setBasicSearch(this._oBasicSearch);
			}
		},

		_initializeFilterModel: function() {
			var oViewModel = new JSONModel({
				StatusCollection :[
					{statusKey:"READY", statusText:this._oResourceBundle.getText("filter.status.new"), rank:"1"},
					{statusKey:"IN_PROGRESS", statusText:this._oResourceBundle.getText("filter.status.inProgress"), rank:"2"},
					{statusKey:"RESERVED", statusText:this._oResourceBundle.getText("filter.status.reserved"), rank:"3"},
					{statusKey:"EXECUTED", statusText:this._oResourceBundle.getText("filter.status.awaitingConfirmation"), rank:"4"}
				],
				PriorityCollection:[
					{priorityKey:"VERY_HIGH", priorityText:this._oResourceBundle.getText("view.Workflow.priorityVeryHigh"), rank:"1"},
					{priorityKey:"HIGH", priorityText:this._oResourceBundle.getText("view.Workflow.priorityHigh"), rank:"2"},
					{priorityKey:"MEDIUM", priorityText:this._oResourceBundle.getText("view.Workflow.priorityMedium"), rank:"3"},
					{priorityKey:"LOW", priorityText:this._oResourceBundle.getText("view.Workflow.priorityLow"), rank:"4"}
				],
				DueDateDateDp:{
					valueFormat:"yyyy/MM/dd"
				},
				CreationDateDrs:{
					delimiter: "-",
					valueFormat:"yyyy/MM/dd"
				},
				showValueHelpForCreatedByFilter: true
			});
			oViewModel.setDefaultBindingMode("TwoWay");
			this.getView().setModel(oViewModel, "filter");
		},

		_setinitialStatusFilters:function() {
			this._oTableOperations.addFilter(new Filter({path:"Status", operator:FilterOperator.EQ, value1:"READY"}), "Status");
			this._oTableOperations.addFilter(new Filter({path:"Status", operator:FilterOperator.EQ, value1:"RESERVED"}), "Status");
			this._oTableOperations.addFilter(new Filter({path:"Status", operator:FilterOperator.EQ, value1:"IN_PROGRESS"}), "Status");
			this._oTableOperations.addFilter(new Filter({path:"Status", operator:FilterOperator.EQ, value1:"EXECUTED"}), "Status");
		},

		//on change of each filter item in the filter bar
		//fire change event for filter bar
		onChange:function(oEvent) {
			if (this._oTaskListController._loadCustomAttributesDeferredForTasks.state() === "resolved" && this._oTaskListController._loadCustomAttributesDeferredForTaskDefs.state() === "resolved") {
				this._onChangeInternal(oEvent);
			}
			else {
				jQuery.when(this._oTaskListController._loadCustomAttributesDeferredForTasks, this._oTaskListController._loadCustomAttributesDeferredForTaskDefs).then(jQuery.proxy(function() {
					this._onChangeInternal(oEvent);
				}, this));
			}
		},

		_onChangeInternal:function(oEvent) {
			var filterName = oEvent.getSource().getName();
			if (filterName === "taskdefinition") {
				this._tableHelper.hideCustomAttributeColumns(false);
				var oControl = this._oFilterBar.determineControlByName(filterName);
				this._tableHelper.showCustomAttributeColumns(oControl.getSelectedKeys());
			}
			this._oFilterBar.fireFilterChange(oEvent);
		},

		// Execute a search with the selected filter values and refresh the product list.
		// Filter values of a standard control configuration are handled by the control, only filter values of custom
		// controls have to be handled inside this method and passed to $filter of the OData call.
		onFBFilterChange: function() {
			this._oTableOperations.resetFilters();
			var filterItems = this._oFilterBar.getAllFilterItems(true);
			var oControl;
			if (filterItems) {
				for (var i=0; i<filterItems.length; i++) {
					oControl = this._oFilterBar.determineControlByFilterItem(filterItems[i]);
					this._addFilterFor(oControl, filterItems[i].getName());
				}
			}
			this._oTableOperations.applyTableOperations();
			this._oFilterBar._updateToolbarText();
		},

		_addFilterFor: function(oControl, name) {
			if (name === "status" || name === "priority" || name === "taskdefinition") {
				var keys = oControl.getSelectedKeys();
				if (keys.length > 0) {
					var vPath = "Status";
					if (name === "priority") {
						vPath = "Priority";
					}
					else if (name === "taskdefinition") {
						vPath = "TaskDefinitionID";
					}
					for (var i=0; i<keys.length; i++) {
						this._oTableOperations.addFilter(new Filter({path:vPath, operator:FilterOperator.EQ, value1:keys[i]}),vPath);
						this._oTableOperations.addTDKey(keys[i]); // Add TD key to an Array. Used for Custom Attributes sorting.
					}
				}
				else if (name === "status") {
						this._setinitialStatusFilters();
					}
			}
			else if (name === "duedate") {
				var vDueDate = oControl.getDateValue();
				if (vDueDate) {
					vDueDate.setDate(vDueDate.getDate());
					vDueDate.setHours(23);
					vDueDate.setMinutes(59);
					vDueDate.setSeconds(59);
					this._oTableOperations.addFilter(new Filter({path:"CompletionDeadLine", operator:FilterOperator.LT, value1:vDueDate}), "CompletionDeadLine");
					this._oTableOperations.addFilter(new Filter({path:"CompletionDeadLine", operator:FilterOperator.NE, test: function(oValue) {
						return (oValue!=null && oValue.toString().trim()!=null);
					} }), "CompletionDeadLine");

				}
			}
			else if (name === "tasktitle") {
				var vOperator;
				if (oControl.getValue() !== "") {
					vOperator = FilterOperator.Contains;
					this._oTableOperations.addFilter(
						new Filter({
							path:"TaskTitle",
							operator:vOperator,
							value1:oControl.getValue()
						}), "TaskTitle");
				}
				var aTokens = oControl.getTokens();
				for (var j =0; j<aTokens.length; j++) {
					if (aTokens[j].data().range.exclude) {
						vOperator = FilterOperator.NE;
					}
					else {
						vOperator = aTokens[j].data().range.operation;
					}
					this._oTableOperations.addFilter(
						new Filter({
							path:"TaskTitle",
							operator:vOperator,
							value1:aTokens[j].data().range.value1,
							value2:aTokens[j].data().range.value2}),
						"TaskTitle");
				}
			}
			else if (name === "creationdate") {
				var firstDate = oControl.getDateValue();
				var secondDate = oControl.getSecondDateValue();
				if (firstDate) {
					secondDate.setDate(secondDate.getDate());
					secondDate.setHours(23);
					secondDate.setMinutes(59);
					secondDate.setSeconds(59);
					this._oTableOperations.addFilter(new Filter({path:"CreatedOn", operator:FilterOperator.BT, value1:firstDate, value2:secondDate}), "CreatedOn");
				}
			}
			else if (name === "createdby") {
				var sValue = oControl.getValue();
				if (sValue) {
					var aCreatedByFilter = new Filter({path:"CreatedBy", operator:FilterOperator.Contains, value1:sValue});
					var aCreatedByNameFilter = new Filter({path:"CreatedByName", operator:FilterOperator.Contains, value1:sValue});
					this._oTableOperations.addFilter(aCreatedByFilter, "CreatedBy");
					this._oTableOperations.addFilter(aCreatedByNameFilter, "CreatedBy");
				}
				var aTokens = oControl.getTokens();
				for (var j =0; j<aTokens.length; j++) {
					sValue = aTokens[j].data().range.value1;
					var aCreatedByFilterUniqueName = new Filter({path:"CreatedBy", operator:FilterOperator.EQ, value1:sValue});
					this._oTableOperations.addFilter(aCreatedByFilterUniqueName, "CreatedBy");
				}
			}
			else if (oControl.sCustomAttributeType === "Edm.DateTime" ) {
				var date1 = oControl.getDateValue();
				var date2 = oControl.getSecondDateValue();
				if (date1) {
					date2.setDate(date2.getDate());
					date2.setHours(23);
					date2.setMinutes(59);
					date2.setSeconds(59);
					date1 = date1.getTime();
					date2 = date2.getTime();

					var oFilter = new Filter({
						path: oControl.getName(),
						operator: FilterOperator.BT,
						value1: date1,
						value2: date2,
						comparator: oControl.fnCustomAttributeComparator
					});

					this._oTableOperations.addFilter(oFilter, oControl.getName());
				}
			}
			else if (oControl.sCustomAttributeType === "Edm.Time") {
				if (oControl.getDateValue() != null) {
					var time = oControl.getDateValue().getTime()
							- (oControl.getDateValue().getTimezoneOffset()
							- (new Date()).getTimezoneOffset()) * 60000;

					var oFilter = new Filter({
						path: oControl.getName(),
						operator: FilterOperator.EQ,
						value1: time,
						comparator: oControl.fnCustomAttributeComparator
					});

					this._oTableOperations.addFilter(oFilter, oControl.getName());
				}
			}
			else {
				var vOperator;
				if (oControl.getValue() !== "") {
					vOperator = FilterOperator.Contains;
					this._oTableOperations.addFilter(
						new Filter({path:oControl.getName(), operator:vOperator, value1:oControl.getValue()}), oControl.getName()
					);
				}
				var tokens = oControl.getTokens();
				for (var j=0; j<tokens.length; j++) {
					if (tokens[j].data().range.exclude) {
						vOperator = FilterOperator.NE;
					}
					else {
						vOperator = tokens[j].data().range.operation;
					}
					if (oControl.fnCustomAttributeComparator != null) {
						this._oTableOperations.addFilter(
							new Filter({
								path : tokens[j].data().range.keyField,
								operator : vOperator,
								value1 : tokens[j].data().range.value1,
								value2 : tokens[j].data().range.value2,
								comparator : oControl.fnCustomAttributeComparator
							}),
							tokens[j].data().range.keyField);
					}
					else {
						this._oTableOperations.addFilter(
							new Filter({
								path:tokens[j].data().range.keyField,
								operator:vOperator,
								value1:tokens[j].data().range.value1,
								value2:tokens[j].data().range.value2
							}),
							tokens[j].data().range.keyField);
					}
				}
			}
		},

		// Handler method for the table search. The actual coding doing the search is outsourced to the reuse library
		// class TableOperations. The search string and the currently active filters and sorters are used to
		// rebind the product list items there. Why rebind instead of update the binding? -> see comments in the helper
		// class
		onSearchPressed: function(oEvent) {
			this._oTaskListController._oTable.removeSelections();
			var sSearchTerm = this._oBasicSearch.getValue();
			this._oTableOperations.setSearchTerm(sSearchTerm.trim());
			this.onFBFilterChange();
			this._oTaskListController.byId("taskListPage").setShowFooter(false);
		},

		//Method for fetching the data that must be stored as the content of the variant
		_fetchData: function() {
			var sGroupName;
			var oJsonParam;
			var oJsonData = [];
			//TODO both these methods seem buggy. Check with UI5 and after resolution use correct API.
			//var oItems = this.getAllFilterItems(true);
			var oItems = this.getFilterGroupItems();
			for (var i=0; i < oItems.length; i++) {
				oJsonParam = {};
				sGroupName = null;
				if (oItems[i].getGroupName) {
					sGroupName = oItems[i].getGroupName();
					oJsonParam.group_name = sGroupName;
				}
				oJsonParam.name = oItems[i].getName();
				var oControl = this.determineControlByFilterItem(oItems[i]);
				if (oControl) {
					if (oJsonParam.name === "status" || oJsonParam.name === "priority" || oJsonParam.name === "taskdefinition") {
						oJsonParam.selectedKeys = oControl.getSelectedKeys();
					}
					else if (oJsonParam.name === "duedate") {
						oJsonParam.dueDate = oControl.getDateValue();
					}
					else if (oJsonParam.name === "creationdate") {
						oJsonParam.firstDate = oControl.getDateValue();
						oJsonParam.secondDate = oControl.getSecondDateValue();
					}
					else if (oControl.sCustomAttributeType === "Edm.DateTime") {
							oJsonParam.date1 = oControl.getDateValue();
							oJsonParam.date2 = oControl.getSecondDateValue();
					}
					else if (oControl.sCustomAttributeType === "Edm.Time") {
						oJsonParam.date = oControl.getDateValue();
					}
					else {
						var tokens = oControl.getTokens();
						var tokenData = [];
						for (var j=0; j<tokens.length; j++) {
							tokenData[j] = {
								selected:tokens[j].getSelected(),
								key:tokens[j].getKey(),
								text:tokens[j].getText(),
								data:tokens[j].data()
							};
						}
						oJsonParam.tokens = tokenData;
						oJsonParam.value = oControl.getValue();
					}
				}
				oJsonData.push(oJsonParam);
			}
			//Get Sorter information
			var sorters = this.getParent().getController()._oTableOperations.getSorter();
			var sortData;
			if (sorters.length > 0) {
				sortData = {
					path:sorters[0].sPath,
					desc:sorters[0].bDescending
				};
			}
			return {filter:oJsonData, sort:sortData};
		},

		//Method or applying this data, if the variant is set
		_applyData : function(data) {
			var oJsonData;
			if (data instanceof Array) {
				oJsonData = data;
			}
			else if (data.filter) {
				oJsonData = data.filter;
			}
			else {
				oJsonData = data;
			}
			var sGroupName;
			var oJsonParam;
			for (var i=0; i < oJsonData.length; i++) {
				sGroupName = null;
				oJsonParam = oJsonData[i];
				if (oJsonParam.group_name) {
					sGroupName = oJsonParam.group_name;
				}
				var oControl = this.determineControlByName(oJsonParam.name, sGroupName);
				if (oControl) {
					if (oJsonParam.name === "status" || oJsonParam.name === "priority" || oJsonParam.name === "taskdefinition") {
						oControl.setSelectedKeys(oJsonParam.selectedKeys);
						oControl.fireSelectionFinish();
					}
					else if (oJsonParam.name === "duedate") {
						if (oJsonParam.dueDate) {
							oControl.setDateValue(new Date(oJsonParam.dueDate));
						}
						else {
							oControl.setDateValue(null);
						}
					}
					else if (oJsonParam.name === "creationdate") {
						if (oJsonParam.firstDate && oJsonParam.secondDate) {
							oControl.setDateValue(new Date(oJsonParam.firstDate));
							oControl.setSecondDateValue(new Date(oJsonParam.secondDate));
						}
						else {
							oControl.setDateValue(null);
							oControl.setSecondDateValue(null);
						}
					}
					else if (oControl.sCustomAttributeType === "Edm.DateTime") {
						if (oJsonParam.date1 && oJsonParam.date2) {
							oControl.setDateValue(new Date(oJsonParam.date1));
							oControl.setSecondDateValue(new Date(oJsonParam.date2));
						}
						else {
							oControl.setDateValue(null);
							oControl.setSecondDateValue(null);
						}
					}
					else if (oControl.sCustomAttributeType === "Edm.Time") {
						if (oJsonParam.date) {
							oControl.setDateValue(new Date(oJsonParam.date));
						}
						else {
							oControl.setDateValue(null);
						}
					}
					else {
						var tokens = [];
						for (var j=0; j<oJsonParam.tokens.length; j++) {
							tokens[j] = new Token({
								selected:oJsonParam.tokens[j].selected,
								key:oJsonParam.tokens[j].key,
								text:oJsonParam.tokens[j].text
							})
							.data(oJsonParam.tokens[j].data);
						}
						oControl.setTokens(tokens);
						oControl.setValue(oJsonParam.value);
					}
				}
			}
			//Set sorter
			if (!(data instanceof Array) && data.sort) {
				this.getParent().getController()._oTableOperations.addSorter(new Sorter(data.sort.path, data.sort.desc));
			}
		},

		//Method to get Filters with values.
		_getFiltersWithValues : function() {
			var i;
			var oControl;
			var aFilters = this.getFilterGroupItems();
			var aFiltersWithValue = [];
			var name;
			for (i=0; i < aFilters.length; i++) {
				name = aFilters[i].getName();
				oControl = this.determineControlByFilterItem(aFilters[i]);
				if (oControl) {
					if ((name === "status" || name === "priority" || name === "taskdefinition")) {
						if (oControl.getSelectedKeys().length > 0) {
							aFiltersWithValue.push(aFilters[i]);
						}
					}
					else if (name === "duedate") {
						if (oControl.getDateValue()) {
							aFiltersWithValue.push(aFilters[i]);
						}
					}
					else if (name === "creationdate") {
						if (oControl.getDateValue() && oControl.getSecondDateValue()) {
							aFiltersWithValue.push(aFilters[i]);
						}
					}
					else if (name === "tasktitle") {
						if ((oControl.getTokens() && oControl.getTokens().length > 0) || oControl.getValue()) {
							aFiltersWithValue.push(aFilters[i]);
						}
					}
					else if (oControl.sCustomAttributeType === "Edm.DateTime") {
						if (oControl.getDateValue() && oControl.getSecondDateValue()) {
							aFiltersWithValue.push(aFilters[i]);
						}
					}
					else if (oControl.sCustomAttributeType === "Edm.Time") {
						if (oControl.getDateValue()) {
							aFiltersWithValue.push(aFilters[i]);
						}
					}
					else if ((oControl.getTokens() && oControl.getTokens().length > 0) || oControl.getValue()) {
						aFiltersWithValue.push(aFilters[i]);
					}
				}
			}
			return aFiltersWithValue;
		},

		//Add custom attribute columns on a new variant load
		onFBVariantLoaded: function(oEvent) {
			//Add new columns if not already added
			var currentVariantId = oEvent.getSource().getCurrentVariantId();
			if (currentVariantId === "") {
				oEvent.getSource().fireSearch(oEvent);
				return;
			}
		},

		onValueHelpRequest:function(oEvent, oData) {
			var sourceInput = oEvent.getSource();
			var sDialogValue = (sourceInput.getName() === "tasktitle") ? this._oResourceBundle.getText("filter.taskTitle") : oData;
			var oValueHelpDialog = new ValueHelpDialog({
				title: sDialogValue,
				supportRanges: true,
				supportRangesOnly: true,
				key: sourceInput.getName(),
				descriptionKey: sDialogValue,
				stretch: Device.system.phone,

				ok: function(oControlEvent) {
					var aTokens = oControlEvent.getParameter("tokens");
					sourceInput.setTokens(aTokens);
					sourceInput.setValue("");
					oValueHelpDialog.close();
				},

				cancel: function(oControlEvent) {
					oValueHelpDialog.close();
				},

				afterClose: function() {
					oValueHelpDialog.destroy();
				}
			});

			oValueHelpDialog.setRangeKeyFields([{label: sDialogValue, key: sourceInput.getName()}]);
			var tokens = sourceInput.getTokens();
			if (sourceInput.getValue() !== "") {
				var token = new Token({
					key:"range_"+tokens.length,
					selected:false,
					text:"*"+sourceInput.getValue()+"*"
				});
				token.data({range:{
					exclude:false,
					keyField:sourceInput.getName(),
					operation:FilterOperator.Contains,
					value1:sourceInput.getValue()
				}});
				tokens.push(token);
			}
			oValueHelpDialog.setTokens(tokens);
			var operations = [];
			var type = sourceInput.getName() === "tasktitle"? "Edm.String" : sourceInput.data().type;
			switch (type) {
				case "Edm.Boolean":
					operations.push(ValueHelpRangeOperation.EQ);
					break;
				case "Edm.DateTime":
				case "Edm.Time":
				case "Edm.DateTimeOffset":
				case "Edm.Decimal":
				case "Edm.Double":
				case "Edm.Int16":
				case "Edm.Int32":
				case "Edm.Int64":
				case "Edm.Single":
					operations.push(ValueHelpRangeOperation.BT);
					operations.push(ValueHelpRangeOperation.EQ);
					operations.push(ValueHelpRangeOperation.GE);
					operations.push(ValueHelpRangeOperation.GT);
					operations.push(ValueHelpRangeOperation.LE);
					operations.push(ValueHelpRangeOperation.LT);
					break;
				case "Edm.String":
					operations.push(ValueHelpRangeOperation.Contains);
					operations.push(ValueHelpRangeOperation.StartsWith);
					operations.push(ValueHelpRangeOperation.EndsWith);
					operations.push(ValueHelpRangeOperation.EQ);
					break;
				default:
					operations.push(ValueHelpRangeOperation.BT);
					operations.push(ValueHelpRangeOperation.Contains);
					operations.push(ValueHelpRangeOperation.StartsWith);
					operations.push(ValueHelpRangeOperation.EndsWith);
					operations.push(ValueHelpRangeOperation.EQ);
					operations.push(ValueHelpRangeOperation.GE);
					operations.push(ValueHelpRangeOperation.GT);
					operations.push(ValueHelpRangeOperation.LE);
					operations.push(ValueHelpRangeOperation.LT);
					break;
			}
			oValueHelpDialog.setIncludeRangeOperations(operations, "text");
			if (sourceInput.$().closest(".sapUiSizeCompact").length > 0) { // check if the Token field runs in Compact mode
				oValueHelpDialog.addStyleClass("sapUiSizeCompact");
			}
			else {
				oValueHelpDialog.addStyleClass("sapUiSizeCozy");
			}
			oValueHelpDialog.open();
		},

		onValueHelpCreatedBy: function(oEvent, oData) {
			if (this._oDialogPromise === null) {
				this._oDialogPromise = this._createDialog();
				this._oDialogPromise.then(function(oDialog) {
					this.getView().addDependent(oDialog);
					this._setUpAndOpenDialog.call(this);
					return oDialog;
				}.bind(this));
			}
			else {
				this._setUpAndOpenDialog();
			}
		},

		onSearchOfCreatedBy: function(oEvent) {
			var sSearchTerm = oEvent.getSource().getValue();
			this.searchUsers(sSearchTerm);
		},

		searchUsers: function(sSearchTerm) {
			var oCreatedByUsersList = Fragment.byId(this.sCreatedByUniqueId, "LST_SEARCH_USERS");
			if (sSearchTerm == undefined || sSearchTerm.trim().length === 0 ) {
				if (oCreatedByUsersList.getModel("userModel")) {
					oCreatedByUsersList.getModel("userModel").setProperty("/users", []);
				}
				return;
			}
			var oSearchUserList = Fragment.byId(this.sCreatedByUniqueId, "LST_SEARCH_USERS");
			var oUserModel = oSearchUserList.getModel("userModel");
			if (!oUserModel) {
				oSearchUserList.setModel(new JSONModel(), "userModel");
			}
			var sOrigin;
			var that = this;
			var fnSuccess = function(oResults) {
				sOrigin = oResults[0].SAP__Origin;
				if (sOrigin) {
					that._oTaskListController._oTable.setBusyIndicatorDelay(50000);
					oSearchUserList.setBusyIndicatorDelay(0);
					oSearchUserList.setBusy(true);
					oSearchUserList.removeSelections();
					this.oDataManager.searchUsers(sOrigin, sSearchTerm, this._MAX_CREATED_BY, jQuery.proxy(function(oResults) {
						oCreatedByUsersList.getModel("userModel").setProperty("/users", oResults);
						oSearchUserList.setBusy(false);
						that._oTaskListController._oTable.setBusyIndicatorDelay(0);
					}, this));
				}
			};

			var fnFailure = function(oError) {
				this.oDataManager.oDataRequestFailed(oError);
			};

			this.oDataManager.readSystemInfoCollection(jQuery.proxy(fnSuccess,this), jQuery.proxy(fnFailure, this));
		},

		putUserTokenIntoCreatedByFilter: function(userListItem) {
			if (userListItem) {
				var oContext = userListItem.getBindingContext("userModel");
				var sDisplayName = oContext.getProperty("DisplayName");
				var sUniqueName = oContext.getProperty("UniqueName");
				var createdbyFilter = this.byId("createdbyFilter");
				var tokens = createdbyFilter.getTokens();
				for (var i=0; i<tokens.length; i++) {
					if (tokens[i].userUniqueName === sUniqueName) {
						return;
					}
				}
				var token= new Token({
					key:"range_"+tokens.length,
					selected:false,
					text:sDisplayName
				});
				token.data({
					range: {
						exclude:false,
						keyField:"CreatedBy",
						operation:FilterOperator.EQ,
						value1:sUniqueName
					}
				});
				tokens.push(token);
				createdbyFilter.setTokens(tokens);
			}
		},

		resetCreatedByValueHelp: function() {
			var oSearchField = Fragment.byId(this.sCreatedByUniqueId, "search_createdby_field");
			oSearchField.setValue("");
			var oSearchUserList = Fragment.byId(this.sCreatedByUniqueId, "LST_SEARCH_USERS");
			if (oSearchUserList.getModel("userModel")) {
				oSearchUserList.getModel("userModel").setProperty("/users", {});
			}
		},

		handleCreatedByPopOverOk:function(oEvent) {
			var oSearchUserList = Fragment.byId(this.sCreatedByUniqueId, "LST_SEARCH_USERS");
			var selectedUsers = oSearchUserList.getSelectedItems();
			for (var i=0; i<selectedUsers.length; i++) {
				this.putUserTokenIntoCreatedByFilter(selectedUsers[i]);
			}
			this.handleCreatedByPopOverCancel(oEvent);
		},

		handleCreatedByPopOverCancel: function(oEvent) {
			var dialog = oEvent.getSource().getParent();
			this.resetCreatedByValueHelp();
			if (dialog) {
				dialog.close();
			}
		},

		handleLiveChange: function(oEvent) {
			//clear the list of users if no value is entered
			if (oEvent.getSource().getValue() === "") {
				var oSearchUserList = Fragment.byId(this.sCreatedByUniqueId, "LST_SEARCH_USERS");
				oSearchUserList.removeSelections();
				if (oSearchUserList.getModel("userModel")) {
						oSearchUserList.getModel("userModel").setProperty("/users", {});
				}
			}
		},

		handleUserDetailPress: function (oEvent) {
			var oSelectedItem = oEvent.getSource();
			var path = oSelectedItem.getBindingContextPath();
			var createdByUserIndex = path.substring(7, path.length);
			var createdByUser = oSelectedItem.getParent().getModel("userModel").getData().users[createdByUserIndex];

			if (Device.system.tablet && Device.orientation.portrait) {
				// use special handling for tablets in portrait mode, this case the employee business card does not fit
				// next to the list item
				EmployeeCard.displayEmployeeCard(oEvent.getSource()._detailIcon, createdByUser);
			}
			else {
				EmployeeCard.displayEmployeeCard(oEvent.getSource(), createdByUser);
			}

		},

			// Clear all the filter values
		onClearPressed: function(oEvent) {
			this._oFilterBar.setCurrentVariantId(oEvent.getSource().getCurrentVariantId());
			this._oTaskListController.byId("taskListPage").setShowFooter(false);
		},

		_createDialog: function() {
			return Fragment.load({
				id: this.sCreatedByUniqueId,
				type: "XML",
				name: "cross.fnd.fiori.inbox.frag.UserPickerDialog",
				controller: this
			})
			.catch(function() {
				BaseLog.error("User Picker Dialog was not created successfully")
			});
		},

		_setUpAndOpenDialog: function() {
			var oSearchUserList = Fragment.byId(this.sCreatedByUniqueId, "LST_SEARCH_USERS");
			if (oSearchUserList) {
				oSearchUserList.setMode("MultiSelect");
				oSearchUserList.setIncludeItemInSelection(true);
				oSearchUserList.setRememberSelections(false);
			}
			this._oDialogPromise.then(function(oDialog) {
				oDialog.open();
			}.bind(this))
		}
	});
});
