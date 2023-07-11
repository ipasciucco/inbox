/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/base/DataType",
	"sap/m/Column",
	"sap/m/Text"
], function(
	BaseObject,
	DataType,
	Column,
	Text
) {
	"use strict";

	return BaseObject.extend("cross.fnd.fiori.inbox.util.MultiSelectCustomAttributeHelper", {

		constructor: function(oController, oView, oTable, oSortingHelper) {
			this._oController = oController;
			this._oView = oView;
			this._oTable = oTable;
			this._customColumns = {};
			this._oSorting = oSortingHelper;
		},

		//add cached column if available, else create a new column
		addColumn: function (customAttributeDefinition) {
			var ignoreAttributes = ["customcreatedbyname", "customtasktitle"];
			if (ignoreAttributes.indexOf(customAttributeDefinition.Name.toLowerCase()) === -1) {
				var columnObj = this._customColumns[customAttributeDefinition.Name];
				if (!columnObj) {
					columnObj = this._getCustomAttributeColumn(customAttributeDefinition);
					this._customColumns[customAttributeDefinition.Name] = columnObj;
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

		hideCustomAttributeColumns: function() {
			var oTemplate = this._oTable.getBindingInfo("items").template;

			for (var key in this._customColumns) {
				var columnObj = this._customColumns[key];

				this._oTable.removeColumn(columnObj.column);
				oTemplate.removeCell(columnObj.cell);
				columnObj.column.destroy();
				columnObj.cell.destroy();
			}

			this._customColumns = {};
		},

		//Add custom attribute column to the task list table. Returns added ui columns objects
		_getCustomAttributeColumn: function(customAttributeDefinition) {
			//old way - escaping of some chars:
			//var id = (decodeURIComponent(customAttribute.TaskDefinitionID) + customAttribute.Name).replace(/\//g, "");
			//now using _genSafeId
			var id = this._genSafeId(customAttributeDefinition, true);
			var oColumn = new Column(id+"Column",{
					header : new Text(id+"Lbl",{text : customAttributeDefinition.Label}),
				});
			var oCell = new Text(id+"Txt",
				{
					text:"{parts:[{path:'multiSelectSummaryModel>"+  encodeURIComponent(customAttributeDefinition.Name) + "'}], formatter:'cross.fnd.fiori.inbox.Conversions.fnCustomAttributeFormatter'}"
				});
			oCell.data({
				Type : customAttributeDefinition.Type
			});
			//Add columns to grouping dialog
			// this._oGrouping.addCustomGroupItem(id, customAttribute.Name, customAttribute.Label);
			//Add columns to sorting dialog
			this._oSorting.addCustomSortItem(id, customAttributeDefinition.Name, customAttributeDefinition.Label);
			return {cell:oCell,column:oColumn};
		},

		_genSafeId: function(customAttributeDefinition, bCheckFirstChar, sAllowedChars, sAllowedFirstSymbols) {
			var allAllowedChars = sAllowedChars ? sAllowedChars : "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz0123456789_-.:";
			//old way - escaping of some chars - leaving it as it is because tests are set this way
			var id = (decodeURIComponent(customAttributeDefinition.TaskDefinitionID) + customAttributeDefinition.Name).replace(/\//g, "");
			var oType = DataType.getType("sap.ui.core.ID");
			if (!oType.isValid(id)) {
				//replacing all others with ascii code in order to avoid the case when two IDs differ only by escaped symbols
				for (var i = 0; i < id.length; i++) {
					if (allAllowedChars.indexOf(id[i]) < 0) {
						id = id.replace(new RegExp(id[i], "g"), id[i].charCodeAt(0));
					}
				}
				if ((id.length > 0) && bCheckFirstChar) {
					var alphabetLettersAndUnderscore = sAllowedFirstSymbols ? sAllowedFirstSymbols : "_AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz";
					if (alphabetLettersAndUnderscore.indexOf(id[0]) < 0) {
						id = "a" + id;
					}
				}
			}
			return id;
		},
	});
});
