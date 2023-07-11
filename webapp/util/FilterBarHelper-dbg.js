/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
		"sap/ui/base/Object",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator",
		"sap/ui/model/json/JSONModel",
		"sap/ui/model/odata/ODataUtils",
		"sap/ui/Device",
		"sap/ui/comp/library",
		"sap/m/Token",
		"cross/fnd/fiori/inbox/util/Utils",
		"cross/fnd/fiori/inbox/model/formatter",
		"cross/fnd/fiori/inbox/util/CustomAttributeComparator"
], function (UI5Object, Filter, FilterOperator, JSONModel, ODataUtils, Device, library, Token, Utils, formatter, CustomAttributeComparator) {
	"use strict";

	var ValueHelpRangeOperation = library.valuehelpdialog.ValueHelpRangeOperation;
	var ValueHelpDialog = library.valuehelpdialog.ValueHelpDialog;
 
	return UI5Object.extend("cross.fnd.fiori.inbox.util.FilterBarHelper", {

		/**
		 * Constructor function for class FilterBarHelper
		 * @public
		 * @constructor
		 * @alias cross.fnd.fiori.inbox.util.FilterBarHelper
		 * @extends sap.ui.base.Object
		 *
		 * @param {Object} oTableOperations - Interface class containing functions with table operations.
		 * @param {Object} oFilterBar - the FilterBar
		 * @param {Object} oWorklistView - the Worklist view - to get the models
		 * @param {Object} oTaskListCustomAttributeHelper - Custom attributes helper - to show and hide custom attributes columns
		 * @param {Object} oTableOperationsHelper - Table operation helper - to reset sort dialog
		 */
		constructor: function(oTableOperations, oFilterBar, oWorklistView, oTaskListCustomAttributeHelper, oTableOperationsHelper) {
			this._oTableOperations = oTableOperations;
			this._oFilterBar = oFilterBar;
			this._oWorklistView = oWorklistView;
			this._taskListCustomAttributeHelper = oTaskListCustomAttributeHelper;
			this._oTableOperationsHelper = oTableOperationsHelper;
			this._taskListCustomAttributeHelper.setFilterbar(this, this._oFilterBar);
		},

		/**
		 * Resets UserFilters, FilterTextValue and the values of all filter controls
		 */
		 resetFilterBar: function() {
			this._oTableOperations.resetUserFilters();
			this._setFilterText();

			var filterItems = this._oFilterBar.getAllFilterItems(true);
			if (filterItems) {
				var oControl;
				for (var i = 0; i < filterItems.length; i++) {
					oControl = this._oFilterBar.determineControlByFilterItem(filterItems[i]);
					switch(oControl.getMetadata().getName()) {
						case "sap.m.MultiComboBox":
							oControl.clearSelection();
							break;
						case "sap.m.SearchField":
							oControl.setValue();
							break;
						case "sap.m.DateRangeSelection":
							oControl.setValue();
							break;
						case "sap.m.DatePicker":
							oControl.setValue();
							break;
						case "sap.m.MultiInput":
							oControl.destroyTokens();
							break;
						default:
							oControl.setValue();
					}
				}
			}
		},

		/**
		 * @param {array} aTaskDefinitions
		 */
		manageTaskTypeFilters: function(aTaskDefinitions) {
			var worklistViewModel = this._oWorklistView.getController().getModel("worklistView");
			if (aTaskDefinitions && (aTaskDefinitions.length > 0)) {
				if (aTaskDefinitions.length === 1) {
					// hide message
					worklistViewModel.setProperty("/caFilteringInfoVisible", false);
					// show CA filters
					worklistViewModel.setProperty("/caShowCustomFilters", true);
				}
				else { // more than one
					// show message
					worklistViewModel.setProperty("/caFilteringInfoVisible", true);
					// hide filters
					worklistViewModel.setProperty("/caShowCustomFilters", false);
					this._taskListCustomAttributeHelper.destroyCustomFilters();
				}
				this._oTableOperations.setURLParameter("$expand", "CustomAttributeData");
				this._taskListCustomAttributeHelper.showCustomAttributeColumns(aTaskDefinitions); // CA filter controls are created here
			}
			else {
				// hide message
				worklistViewModel.setProperty("/caFilteringInfoVisible", false);
				// remove all columns, filters, etc.
				this._taskListCustomAttributeHelper.hideCustomAttributeColumns();
				// remove URL parameter
				this._oTableOperations.removeURLParameter("$expand");
			}
		},

		/**
		 * @param {array} aTaskDefinitions
		 */
		manageTaskTypeSorters: function(aTaskDefinitions) {
			var bResetSorter = false;
			var aSorters = this._oTableOperations.getSorters();
			// if there is selected none task types or more than 1 for filtering and you sort by custom attributes, sorters must be reset
			if (aTaskDefinitions && (aTaskDefinitions.length !== 1) && Utils.checkIfFirstSorterIsCustomAttribute(aSorters)) {
				bResetSorter = true;
			}
			// if filter is with one task type selected and replace it with another and sort by custom attribute and current sort can't be applied with the new task type, sorters must be reset
			else if (Utils.checkIfFirstSorterIsCustomAttribute(aSorters)) {
				var aCustomAttributeList = this._taskListCustomAttributeHelper.getCustomAttributeList();
				bResetSorter = true;
				for (var k = 0; k < aCustomAttributeList.length; k++) {
					if (aSorters[0].sPath === aCustomAttributeList[k].Name) {
						bResetSorter = false;
						break;
					}
				}
			}
			if (bResetSorter) {
				this._oTableOperationsHelper.resetSortDialog();
			}
		},

		/**
		 * @param {array} aTaskTypeFilterKeys - the selected values in the TaskType filter
		 */
		getTaskDefsFromFilterKeys: function(aTaskTypeFilterKeys) {
			var aTaskDefinitionIDs = [];
			for (var i = 0; i < aTaskTypeFilterKeys.length; i++) {
				var taskDefinitionID = aTaskTypeFilterKeys[i].split("___")[2];
				aTaskDefinitionIDs.push(taskDefinitionID);
			}
			return aTaskDefinitionIDs.length ? aTaskDefinitionIDs : null;
		},

		/**
		 * handles searching
		 *
		 * @param {sap.ui.base.Event} oEvent - event object
		 */
		prepareSearch: function(oControl) {
			var sQuery = oControl.getProperty("value");
			var oWorklistController = this._oWorklistView.getController();

			if (sQuery && sQuery.length > 0) {
				// changes the noDataText of the list in case there are no filter results
				var sCustomAttributes = "";
				if (oWorklistController._aCustomStringAttributes.length > 0) {
					sCustomAttributes = ", " + oWorklistController._aCustomStringAttributes.join(", ");
				}
				oWorklistController.getModel("worklistView").setProperty("/tableNoDataText",
					oWorklistController.getResourceBundle().getText("worklistNoDataWithSearchTextCustomAttributes") + sCustomAttributes);
				this._oTableOperations.setURLParameter("searchText", sQuery);
			}
			else {
				this._oTableOperations.removeURLParameter("searchText");
			}

			oWorklistController._bApplyingFilters = true;
		},

		/**
		 * handles pressing of the Go button of the FilterBar
		 *
		 * @param {sap.ui.base.Event} oEvent - event object
		 */
		applyFilters: function(oEvent) {
			// clear UserFilters so they are not multiplied.
			this._oTableOperations.resetUserFilters();
			
			// manage TaskType filtering first, because the number of filters depends on this(CustomAttribute filters)
			var oTaskTypeFilter = this._oFilterBar.determineControlByName("taskDefinition");
			var aTaskDefinitions = this.getTaskDefsFromFilterKeys(oTaskTypeFilter.getSelectedKeys());
			this.manageTaskTypeFilters(aTaskDefinitions);
			this.manageTaskTypeSorters(aTaskDefinitions);
			
			// then create filters for all controls in the FilterBar
			var aFilterText = [];
			var oControl;
			var filterItems = this._oFilterBar.getAllFilterItems(true);
			
			if (filterItems && (filterItems.length > 0)) {
				var sFilterText;
				for (var i = 0; i < filterItems.length; i++) {
					oControl = this._oFilterBar.determineControlByFilterItem(filterItems[i]); 
					// handle search separately
					if (oControl.getMetadata().getName() === "sap.m.SearchField") {
						this.prepareSearch(oControl);
					}
					else {
						// handle the rest of the FilterBar controls
						// create filters for all controls in the FilterBar
						sFilterText = this._addFilterFor(oControl, filterItems[i].getName());
						if (sFilterText) {
							aFilterText.push(filterItems[i].getLabel());
						}
					}
				}
			}

			this._oWorklistView.getController()._bApplyingFilters = true;

			this._oTableOperations.applyTableOperations();
			this._setFilterText(aFilterText);
		},

		/**
		 * Sets the value of the label in the DynamicPageTitle with all aplied filters
		 * 
		 * @param {array} aFilterText - array of filter values
		 */
		_setFilterText: function(aFilterText) {
			var filterText = "";
			if (aFilterText && (aFilterText.length > 0)) {
				 filterText = this._oWorklistView.getController().getResourceBundle().getText("filter.filteredBy.text" , [aFilterText.length])
					+ aFilterText.join(", ");
			}
			this._oFilterModel.setProperty("/filteredByText", filterText);	
		},

		/**
		 * Execute the function which prepares the filter for the provided control
		 * 
		 * @param {object} oControl - the control which provides the filter values
		 * @param {string} name - the control name
		 * 		 
		 * @return {string} the value of the filter name to show
		 */
		_addFilterFor: function(oControl, name) {
			// no filter should be added for the search field
			if (name === "search") {
				return;
			}
			var sFilterText = "";
			var oFilter;
			var sType = oControl.sCustomAttributeType ? CustomAttributeComparator.fnMapDataTypes(oControl.sCustomAttributeType) : "";
			if (name === "status" || name === "priority" || name === "taskDefinition") {
				sFilterText = this._prepareTableFilteringForTtPrSt(oControl);
			}
			else if (name === "duedate") {
				sFilterText = this._prepareTableFilteringForDueBy(oControl);
			}
			else if (name === "creationdate") {
				sFilterText = this._prepareTableFilteringForCreationDate(oControl);
			}
					  
			else if (sType === "Edm.DateTime") {
				var date1 = oControl.getDateValue();
				var date2 = oControl.getSecondDateValue();
				if (date1) {
					date2.setDate(date2.getDate());
					date2.setHours(23);
					date2.setMinutes(59);
					date2.setSeconds(59);
					date1 = ODataUtils.formatValue(date1, sType);
					date2 = ODataUtils.formatValue(date2, sType);

					oFilter = new Filter({
						path: oControl.getName(),
						operator: FilterOperator.BT,
						value1: date1,
						value2: date2,
						comparator: oControl.fnCustomAttributeComparator
					});

					this._oTableOperations.addUserFilter(oFilter, oControl.getName());
				}
			}
			else if (sType === "Edm.Time") {
				if (oControl.getDateValue() !== null) {
					var time = oControl.getDateValue().getTime()
							- (oControl.getDateValue().getTimezoneOffset()
							- (new Date()).getTimezoneOffset()) * 60000;

					oFilter = new Filter({
						path: oControl.getName(),
						operator: FilterOperator.EQ,
						value1: time,
						comparator: oControl.fnCustomAttributeComparator
					});

					this._oTableOperations.addUserFilter(oFilter, oControl.getName());
				}
			}
			else {
				var vOperator;
				if (oControl.getValue() !== "") {
					vOperator = FilterOperator.Contains;
					this._oTableOperations.addUserFilter(
						new Filter({path:oControl.getName(), operator:vOperator, value1:oControl.getValue()}), oControl.getName()
					);
				}
				var tokens = oControl.getTokens();
				for (var j = 0; j < tokens.length; j++) {
					if (tokens[j].data().range.exclude) {
						vOperator = FilterOperator.NE;
					}
					else {
						vOperator = tokens[j].data().range.operation;
					}
					if (oControl.fnCustomAttributeComparator !== null) {
						this._oTableOperations.addUserFilter(
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
						this._oTableOperations.addUserFilter(
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
			return sFilterText;
		},

		_prepareTableFilteringForCreationDate: function(oControl) {
			var firstDate = oControl.getDateValue();
			var secondDate = oControl.getSecondDateValue();
			var sValue = "";
			if (firstDate) {
				secondDate.setDate(secondDate.getDate());
				secondDate.setHours(23);
				secondDate.setMinutes(59);
				secondDate.setSeconds(59);
				this._oTableOperations.addUserFilter(new Filter({path:"CreatedOn", operator:FilterOperator.BT, value1:firstDate, value2:secondDate}), "CreatedOn");
				sValue = formatter.formatDate(firstDate) + "-" + formatter.formatDate(secondDate);
			}
			return sValue;
		},

		_prepareTableFilteringForDueBy: function(oControl) {
			var vDueDate = oControl.getDateValue();
			var sValue = "";
			if (vDueDate) {
				vDueDate.setDate(vDueDate.getDate());
				vDueDate.setHours(23);
				vDueDate.setMinutes(59);
				vDueDate.setSeconds(59);
				this._oTableOperations.addUserFilter(new Filter({path:"CompletionDeadLine", operator:FilterOperator.LT, value1:vDueDate}), "CompletionDeadLine");
				this._oTableOperations.addUserFilter(new Filter({path:"CompletionDeadLine", operator:FilterOperator.NE, test: function(oValue) {
					return (oValue != null && oValue.toString().trim() != null);
				} }), "CompletionDeadLine");
				sValue = formatter.formatDate(vDueDate);
			}
			return sValue;
		},

		//Prepare filters for TaskType, Priority and Status
		_prepareTableFilteringForTtPrSt: function(oControl) {
			var keys = oControl.getSelectedKeys();
			keys.forEach(function(key) {
				var aSplit = key.split("___"),
					sPath = aSplit[0],
					sOperator = aSplit[1],
					sValue1 = aSplit[2],
					sValue2 = aSplit[3],
					oFilter;
				if (sPath === "TaskDefinitionID" && sValue1 === "Others") {
						//Handle the case when TaskDefinitionName is empty. In that case entry named "Others" is introduced
						//All the tasks without TDN are grouped in "Others" entry
						var taskTypesModel = this._oWorklistView.getModel("taskTypesModel").getData();
						var othersEntryIndex = taskTypesModel.length - 1;
						var taskDefinitionsInOthers = taskTypesModel[othersEntryIndex].TaskDefinitionIds;
						//When handling "Others" entry,required ids are stored in TaskDefintionIDs
						//Iterate TaskDefinitionIDs in order to create filter for every task located in "Others"
						for (var i = 0; i < taskDefinitionsInOthers.length; i++) {
							sValue1 = taskDefinitionsInOthers[i];
							oFilter = new Filter(sPath, sOperator, sValue1, sValue2);
						}
				}
				else {
						oFilter = new Filter(sPath, sOperator, sValue1, sValue2);
				}
				this._oTableOperations.addUserFilter(oFilter, sPath);
			}.bind(this));

			var items = oControl.getSelectedItems();
			var aSelectedItemsTexts = [];
			for (var i = 0; i < items.length; i++) {
				aSelectedItemsTexts.push(items[i].getText());
			}
			return aSelectedItemsTexts.join();
		},

		getFilterModel: function () {
			if (!this._oFilterModel) {
				this._oFilterModel = new JSONModel({
					StatusCollection :[
						{statusKey:"Status___EQ___READY", 
							statusText:this._oWorklistView.getController().getResourceBundle().getText("FilterItem_StatusReadyAsOpen"), rank:"1"},
						{statusKey:"Status___EQ___IN_PROGRESS", 
							statusText:this._oWorklistView.getController().getResourceBundle().getText("FilterItem_StatusInProgress"), rank:"2"},
						{statusKey:"Status___EQ___RESERVED", 
							statusText:this._oWorklistView.getController().getResourceBundle().getText("FilterItem_StatusReserved"), rank:"3"}
					],
					PriorityCollection:[
						{priorityKey:"Priority___EQ___VERY_HIGH", 
							priorityText:this._oWorklistView.getController().getResourceBundle().getText("FilterItem_VeryHighPriority"), rank:"1"},
						{priorityKey:"Priority___EQ___HIGH", 
							priorityText:this._oWorklistView.getController().getResourceBundle().getText("FilterItem_HighPriority"), rank:"2"},
						{priorityKey:"Priority___EQ___MEDIUM", 
							priorityText:this._oWorklistView.getController().getResourceBundle().getText("FilterItem_MediumPriority"), rank:"3"},
						{priorityKey:"Priority___EQ___LOW", 
							priorityText:this._oWorklistView.getController().getResourceBundle().getText("FilterItem_LowPriority"), rank:"4"}
					],
					CreationDateDrs:{
						delimiter: "-"
					},
					filteredByText: "",
					filterTextLabelVisible: false
				});
				this._oFilterModel.setDefaultBindingMode("TwoWay");
			}
			return this._oFilterModel;
		},

		onValueHelpRequest: function(oEvent, oData) {
			var sourceInput = oEvent.getSource();
			var sDialogValue = oData;
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
					key: "range_" + tokens.length,
					selected:false,
					text: "*" + sourceInput.getValue() + "*"
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
			var type = sourceInput.data().type;
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
					// not supported by service
					// operations.push(ValueHelpRangeOperation.Contains);
					// operations.push(ValueHelpRangeOperation.StartsWith);
					// operations.push(ValueHelpRangeOperation.EndsWith);
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
		}
	});
});