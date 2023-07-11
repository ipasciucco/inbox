/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
/**
	The whole file is copied from My Inbox.
	It contains large commented sections because not all functionalities
	are implemented here, but may be implemented in the future, so
	they can be uncommented when there is a use for them.
*/
sap.ui.define([
	"sap/ui/base/Object",
	"sap/m/Column",
	"cross/fnd/fiori/inbox/util/CustomAttributeComparator",
	"sap/ui/Device",
	"sap/m/Label",
	"sap/m/TimePicker",
	"sap/m/library",
	"sap/m/Text",
	"sap/m/DateRangeSelection",
	"sap/ui/comp/filterbar/FilterGroupItem",
	"sap/m/MultiInput",
	"cross/fnd/fiori/inbox/model/models",
	"cross/fnd/fiori/inbox/model/formatter",
	"cross/fnd/fiori/inbox/util/Utils"
], function (UI5Object, Column, CustomAttributeComparator, Device, Label,
	TimePicker,	library, Text, DateRangeSelection, FilterGroupItem, MultiInput, models, Formatter, Utils
) {
	"use strict";

	var PopinDisplay = library.PopinDisplay;

	return UI5Object.extend("cross.fnd.fiori.inbox.util.TaskListCustomAttributeHelper", {
		_aCustomAttributeList: [],

		constructor: function(oController, oView, oTable,
			// oGrouping,
			oTableOperations) {
			this._oView = oView;
			this._oController = oController;
			this._oTable = oTable;
			// this._oGrouping = oGrouping;
			this._oTableOperations = oTableOperations;
			this._customColumns = {};
			this._customFilters = {};
			this._visibleCustomFilters = [];
		},

		showCustomAttributeColumns: function(taskDefinitions) {

			// Clear custom Attributtes in search
			this._oController._aCustomStringAttributes = [];

			this._aCustomAttributeList = this._getCustomAttributes(taskDefinitions);
			var bColumnsOverflow = this._aCustomAttributeList.length > 10;

			// hide redundant columns
			for (var columnKey in this._customColumns) {
				var bExists = false;
				for (var j = 0; j < this._aCustomAttributeList.length; j++) {
					if (columnKey === this._aCustomAttributeList[j].Name) {
						bExists = true;
						break;
					}
				}

				if (!bExists) {
					this.destroy(columnKey);
				}
			}

			var column;
			var customAttributeFormat;
			var customFilter;

			for (var k = 0; k < this._aCustomAttributeList.length; k++) {
				customAttributeFormat = this._aCustomAttributeList[k].Format ? this._aCustomAttributeList[k].Format : null;
				column = this._addColumn(this._aCustomAttributeList[k], !bColumnsOverflow);
				if (column === null) {
					continue;
				}

				if ((customAttributeFormat === null) && (this._aCustomAttributeList[k].Type.toLowerCase() === "string" || this._aCustomAttributeList[k].Type.toLowerCase() === "edm.string")) {
					this._oController._aCustomStringAttributes.push(this._aCustomAttributeList[k].Label);
				}
				if (this._oView.getModel("worklistView").getProperty("/caShowCustomFilters")) {
					customFilter = this._addCustomFilterItem(this._aCustomAttributeList[k]);
				}
			}
			if (sap.ushell.Container) {
				this._oController._oTablePersoController.refresh();
			}
			this._oTable.bindItems(this._oTable.getBindingInfo("items"));
			this._oTable.getBinding("items").refresh();

			//add custom attributes in search placeholder and tooltip
			this._oController._initPlaceholderAndTooltip();


			this._oView.getModel("worklistView").setProperty("/caLimitInfoVisible", bColumnsOverflow);

            /* There is a bug preventing the table from updating properly
			when new columns are added. This is a temporary workaround.
			https://support.wdf.sap.corp/sap/support/message/2180086877 */
			this._oTable.setProperty("autoPopinMode", false);
			var that = this;
			setTimeout(function() {
				that._oTable.setProperty("autoPopinMode", true);
			}, 0);
		},

		hideCustomAttributeColumns: function(refresh) {
			var columnKeys = Object.keys(this._customColumns);
			for (var i = 0; i < columnKeys.length; i++) {
				var columnKey = columnKeys[i];
				this.destroy(columnKey);
			}

			//Clear custom attributes in search placeholder and tooltip
			this._oController._aCustomStringAttributes = [];
			this._oController._initPlaceholderAndTooltip();

			this._oView.getModel("worklistView").setProperty("/caLimitInfoVisible", false);

			if (refresh) {
				if (sap.ushell.Container) {
					this._oController._oTablePersoController.refresh();
				}
				this._oTable.bindItems(this._oTable.getBindingInfo("items"));
				this._oTableOperations.setSortChanged(true);
				this._oTableOperations.setFilterChanged(true);
				this._oTableOperations.applyTableOperations();
				this._oTable.getBinding("items").refresh();
			}
		},

		destroyCustomFilters: function() {
			var customFilters = Object.keys(this._customFilters);
			for (var i = 0; i < customFilters.length; i++) {
				this._destroyCustomFilterItem (customFilters[i]);
			}
		},

		setFilterbar: function(filterbarController, filterbar) {
			this._filterbarController = filterbarController;
			this._oFilterBar = 	filterbar;
		},

		destroy: function(columnKey) {
			var columnObj = this._customColumns[columnKey];
			if (columnObj) {
				columnObj.column.destroy();
				columnObj.cell.destroy();
			}
			delete this._customColumns[columnKey];

			this._destroyCustomFilterItem (columnKey);

			// this._oGrouping.destroy();
		},

		getVisibleCustomFilters: function() {
		    return this._visibleCustomFilters;
		},

		//Look up custom attribute columns for each task definiton
		_getCustomAttributes: function(taskDefinitions) {
			var taskDefs = models.getTaskDefinitionModel().getData();
			var aColumns = [];

			for (var taskDefKey in taskDefs) {
				var taskDef = taskDefs[taskDefKey];
				if(taskDefinitions.includes(taskDef.TaskDefinitionID)) {
					for (var customAttributeDefDataKey in taskDef.CustomAttributeDefinitionData) {
						aColumns.push(taskDef.CustomAttributeDefinitionData[customAttributeDefDataKey]);
					}
				}
			}
			return aColumns;
		},

		//add cached column if available, else create a new column
		_addColumn: function(customAttribute, bVisible) {
			bVisible = bVisible != null ? bVisible : true;
			var ignoreAttributes = ["CustomNumberValue", "CustomNumberUnitValue", "CustomObjectAttributeValue", "CustomCreatedBy", 
				"CA_CustomNumberValue", "CA_CustomNumberUnitValue", "CA_CustomObjectAttributeValue", "CA_CustomCreatedBy"];
			if (ignoreAttributes.indexOf(customAttribute.Name) === -1) {
				var columnObj = this._customColumns[customAttribute.Name];
				if (!columnObj) {
					columnObj = this._addCustomAttributeColumn(customAttribute, bVisible);
					this._customColumns[customAttribute.Name] = columnObj;
				}
				this._oTable.addColumn(columnObj.column);
				var oTemplate = this._oTable.getBindingInfo("items").template;
				oTemplate.addCell(columnObj.cell);
				return columnObj;
			}
			else {
				return null;
			}
		},

		//add cached filter if available, else create a new filter
		_addCustomFilterItem: function(customAttribute) {
			var customFilterItem = this._customFilters[customAttribute.Name];
			if (!customFilterItem) {
				customFilterItem = this._addCustomFilter(customAttribute);
				this._customFilters[customAttribute.Name] = customFilterItem;
			}
			return customFilterItem;
		},

		_destroyCustomFilterItem : function(customAttributeKey) {
			var filterObj = this._customFilters[customAttributeKey];
			if (filterObj) {
				filterObj.destroy();
			}
			delete this._customFilters[customAttributeKey];
		},

		//Add custom attribute column to the task list table. Returns added ui columns objects
		_addCustomAttributeColumn: function(customAttribute, bVisible) {
			bVisible = bVisible != null ? bVisible : true;
			//old way - escaping of some chars:
			//var id = (decodeURIComponent(customAttribute.TaskDefinitionID) + customAttribute.Name).replace(/\//g, "");
			//now using genSafeId
			var id = Utils.genSafeId(customAttribute, true);
			var oColumn = new Column(id + "Column",{
					header : new Label(id + "Lbl", {
						text : customAttribute.Label,
						tooltip: customAttribute.Label
					}),
					popinDisplay: PopinDisplay.Inline,
					minScreenWidth: "Tablet",
					demandPopin: true,
					visible: bVisible
				});
			var oCell = new Text(id + "Txt", {
				maxLines: 1,
				tooltip: {
					path:"taskModel>" + encodeURIComponent(customAttribute.Name),
					formatter: Formatter.getCustomAttributeTypeWorklistFormatter(customAttribute.Type, this._oView, customAttribute.Format)
				},
				text: {
					path:"taskModel>" + encodeURIComponent(customAttribute.Name),
					formatter: Formatter.getCustomAttributeTypeWorklistFormatter(customAttribute.Type, this._oView, customAttribute.Format)
				}
			});
			oCell.data({
				Type : customAttribute.Type
			});
			//Add columns to grouping dialog
			// this._oGrouping.addCustomGroupItem(id, customAttribute.Name, customAttribute.Label);

			return {cell:oCell,column:oColumn};
		},

		//Add custom filters to the filter bar
		_addCustomFilter: function(customAttribute) {
			var id = Utils.genSafeId(customAttribute, true);
			var sType = customAttribute.Type ? CustomAttributeComparator.fnMapDataTypes(customAttribute.Type) : "";
			var customFilterItem, oControl;
			if (sType === "Edm.DateTime") {
				oControl = new DateRangeSelection(id + "Filter", {
					name:encodeURIComponent(customAttribute.Name),
					delimiter: "-"
				});
				oControl.sCustomAttributeType = sType;
				oControl.fnCustomAttributeComparator = CustomAttributeComparator.getCustomAttributeComparator(sType);
				customFilterItem = new FilterGroupItem(id + "FI", {
					groupName:"basic",
					visibleInFilterBar:true,
					label:customAttribute.Label,
					name:encodeURIComponent(customAttribute.Name),
					partOfCurrentVariant:true,
					control: oControl
				});
			}
			else if (sType === "Edm.Time") {
				oControl = new TimePicker(id + "Filter", {
					name:encodeURIComponent(customAttribute.Name)
				});
				oControl.sCustomAttributeType = sType;
				oControl.fnCustomAttributeComparator = CustomAttributeComparator.getCustomAttributeComparator(sType);
				customFilterItem = new FilterGroupItem(id + "FI", {
					groupName:"basic",
					visibleInFilterBar:true,
					label:customAttribute.Label,
					name:encodeURIComponent(customAttribute.Name),
					partOfCurrentVariant:true,
					control: oControl
				});
			}
			else {
				oControl = new MultiInput(id + "Filter", {
					name:encodeURIComponent(customAttribute.Name),
					valueHelpRequest:[customAttribute.Label,this._filterbarController.onValueHelpRequest],
					valueHelpOnly:true
				})
				.data({type:sType});
				oControl.sCustomAttributeType = sType;
				oControl.fnCustomAttributeComparator = CustomAttributeComparator.getCustomAttributeComparator(sType);
				customFilterItem = new FilterGroupItem(id + "FI",{
					groupName:"basic",
					visibleInFilterBar:true,
					label:customAttribute.Label,
					name:encodeURIComponent(customAttribute.Name),
					partOfCurrentVariant:true,
					control: oControl
				});
			}
			if (customFilterItem) {
				this._oFilterBar.addFilterGroupItem(customFilterItem);
			}
			return customFilterItem;
		},

		/**
		 * Getter for custom attributes.
		 *
		 * @return {Array} this._aCustomAttributeList array with custom attributes
		 */
		getCustomAttributeList: function() {
			return this._aCustomAttributeList;
		}
	});
});