/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/model/Sorter",
	"sap/m/ViewSettingsItem",
	"cross/fnd/fiori/inbox/util/CustomAttributeComparator"
], function (UI5Object, Sorter, ViewSettingsItem) {
	"use strict";

	return UI5Object.extend("cross.fnd.fiori.inbox.util.MultiSelectSortingHelper", {
		_oResourceBundle: null,
		_oTableOperations: null,
		_oView: null,
		_oSortDialog: null,
		_oCustomSortItems:{},
		_currentSorting: new Sorter("CreatedOn", true),

		constructor: function(oTableOperations, oView) {
			this._oResourceBundle = oView.getController().getOwnerComponent().getModel("i18n").getResourceBundle();
			this._oTableOperations = oTableOperations;
			this._oView = oView;
		},

		addCustomSortItem: function(id, sKey, sText) {
			var encodedKey = encodeURIComponent(sKey);
			var oSortItem = new ViewSettingsItem(id+"Sorter",{key:encodedKey,text:sText});
			this._getSortingDialog().addSortItem(oSortItem);
			this._oCustomSortItems[sKey] = oSortItem;
		},

		hideCustomSortItem: function(sKey) {
			var oSortItem = this._oCustomSortItems[sKey];
			if (oSortItem) {
				this._getSortingDialog().removeSortItem(oSortItem);
			}
		},

		showCustomSortItem: function(sKey) {
			var oSortItem = this._oCustomSortItems[sKey];
			if (oSortItem) {
				this._getSortingDialog().addSortItem(oSortItem);
			}
		},

		destroy: function() {
			for (var key in this._oCustomSortItems) {
				this._oCustomSortItems[key].destroy();
			}
		},

		openSortingDialog: function() {
		    var dialog = this._getSortingDialog();
			var listOfSorter = this._oTableOperations.getSorter();
			if (listOfSorter.length > 0) {
				//Set the default sorter. First sorter in the array is the main sorter
				var desc = listOfSorter[0].bDescending;
				if (listOfSorter[0].sPath === "PriorityNumber") {
					desc = !desc;
				}
				dialog.setSelectedSortItem(listOfSorter[0].sPath);
				dialog.setSortDescending(desc);
			}
			dialog.open();
		},

		// Handler for the Confirm button of the sort dialog. Depending on the selections made on the sort
		// dialog, the respective sorters are created and stored in the _oTableOperations object.
		// The actual setting of the sorters on the binding is done by the callback method that is handed over to
		// the constructor of the _oTableOperations object.
		onSortDialogConfirmed: function(oEvent) {
			var mParams = oEvent.getParameters(),
				sSortPath = mParams.sortItem.getKey();
			var sSortPathDecoded = decodeURIComponent(sSortPath);
			var sSortingType = null;

			if (mParams.sortItem.getModel("customAttributeDefinitionsModel")) {
				var aTDCollection = mParams.sortItem.getModel("customAttributeDefinitionsModel").getData().results;

				for (var i = 0; i < aTDCollection.length; i++) {
					if (aTDCollection[i].Name === sSortPathDecoded) { // Search for a match of current sorting CA(sSortPathDecoded) and get its type
						sSortingType = aTDCollection[i].Type;
						break;
					}
				}
			}

			var sortDescending = mParams.sortDescending;
			if (sSortPath === "PriorityNumber") {
				sortDescending = !sortDescending;
			}

			var fnComparator = cross.fnd.fiori.inbox.util.CustomAttributeComparator.getCustomAttributeComparator(sSortingType);

			var sorter = fnComparator !== null ?
				new Sorter(sSortPath, sortDescending, false, fnComparator) :
				new Sorter(sSortPath, sortDescending);

			this._oTableOperations.addSorter(sorter);
			this._currentSorting = sorter;

			this.setColumnSortIndicator(sSortPath, sortDescending ? "Descending" : "Ascending");

			this._oTableOperations.applyTableOperations();
		},

		applySorting: function() {
			this._oTableOperations.addSorter(this._currentSorting);
			this._oTableOperations.applyTableOperations();
		},

		resetSorting: function() {
			// Set default sorting
			this._currentSorting = new Sorter("CreatedOn", true);
			this._oTableOperations.addSorter(this._currentSorting);
			this._oTableOperations.applyTableOperations();

			// if sort dialog was created reset sorting dialog
			if (this._oSortDialog !== null) {
				this._oSortDialog.setSelectedSortItem("CreatedOn");
				this._oSortDialog.setSortDescending(true);
			}

			// Set default sorting indicator
			this.setColumnSortIndicator("CreatedOn", "Descending");
			if (this._oSortDialog) {
				this._oSortDialog.destroy();
			}
			this._oSortDialog = null;
		},

		/**
		 * Sets sOrder sort indicator of specified column ID sColumnID.
		 * Sets this indicator only if the version of sapui5 is higher than 1.61
		 * as this functionality is not present in lower versions
		 * @param {string} sColumnID -  Column ID as specified in Worklist.view.xml file.
		 * @param {string} sOrder -  Sorting order of the Column. Valid values are "Descending", "Ascending" and "None".
		 * @protected
		 */
		setColumnSortIndicator: function(sColumnID, sOrder) {
			if (parseFloat(sap.ui.version) >= 1.61) {
				var aColumnsElements = this._oView.byId("idMultiSelectTable").getColumns();

				for (var i = 0; i < aColumnsElements.length; i++) {
					var indicator = aColumnsElements[i].getId().indexOf(sColumnID) > -1 ? sOrder : "None";
					aColumnsElements[i].setSortIndicator(indicator);
				}
			}
		},

		_getSortingDialog: function() {
			if (!this._oSortDialog) {
				this._oSortDialog = sap.ui.xmlfragment("cross.fnd.fiori.inbox.frag.MultiSelectSortingDialog", this);
				this._oView.getController().attachControl(this._oSortDialog);
			}
			return this._oSortDialog;
		}
	});
});
