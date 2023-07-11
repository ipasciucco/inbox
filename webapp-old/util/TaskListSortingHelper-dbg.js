/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/model/Sorter",
	"sap/ui/core/Fragment",
	"sap/m/ViewSettingsItem",
	"sap/base/Log",
	"cross/fnd/fiori/inbox/util/CustomAttributeComparator"
], function (
	UI5Object,
	Sorter,
	Fragment,
	ViewSettingsItem,
	BaseLog,
	CustomAttributeComparator
) {
	"use strict";

	return UI5Object.extend("cross.fnd.fiori.inbox.util.TaskListSortingHelper", {
		_oResourceBundle: null,
		_oTableOperations: null,
		_oView: null,
		_oSortDialogPromise: null,
		_oCustomSortItems:{},

		constructor: function(oTableOperations, oView) {
			this._oResourceBundle = oView.getController().getResourceBundle();
			this._oTableOperations = oTableOperations;
			this._oView = oView;
		},

		addCustomSortItem: function(id, sKey, sText) {
			var encodedKey = encodeURIComponent(sKey);
			var oSortItem = new ViewSettingsItem(id+"Sorter",{key:encodedKey,text:sText});
			this._getSortingDialog().then(function(oSortingDialog) {
				oSortingDialog.addSortItem(oSortItem);
			});
			this._oCustomSortItems[sKey] = oSortItem;
		},

		hideCustomSortItem: function(sKey) {
			var oSortItem = this._oCustomSortItems[sKey];
			if (oSortItem) {
				this._getSortingDialog().then(function(oSortingDialog) {
					oSortingDialog.removeSortItem(oSortItem);
				});
			}
		},

		showCustomSortItem: function(sKey) {
			var oSortItem = this._oCustomSortItems[sKey];
			if (oSortItem) {
				this._getSortingDialog().then(function(oSortingDialog) {
					oSortingDialog.addSortItem(oSortItem);
				});
			}
		},

		destroy: function() {
			for (var key in this._oCustomSortItems) {
				this._oCustomSortItems[key].destroy();
			}
		},

		openSortingDialog: function() {
		    this._getSortingDialog().then(function(oSortingDialog) {
				var listOfSorter = this._oTableOperations.getSorter();
				if (listOfSorter.length > 0) {
					//Set the default sorter. First sorter in the array is the main sorter
					var desc = listOfSorter[0].bDescending;
					if (listOfSorter[0].sPath === "PriorityNumber") {
						desc = !desc;
					}
					oSortingDialog.setSelectedSortItem(listOfSorter[0].sPath);
					oSortingDialog.setSortDescending(desc);
				}
				oSortingDialog.open();
			}.bind(this));
		},

		// Handler for the Confirm button of the sort dialog. Depending on the selections made on the sort
		// dialog, the respective sorters are created and stored in the _oTableOperations object.
		// The actual setting of the sorters on the binding is done by the callback method that is handed over to
		// the constructor of the _oTableOperations object.
		onSortDialogConfirmed: function(oEvent) {
			var mParams = oEvent.getParameters(),
				sSortPath = mParams.sortItem.getKey();
			var sSortPathDecoded = decodeURIComponent(sSortPath);
			var aSelectedTD = this._oTableOperations.getTDKeys();
			var aTDCollection = mParams.sortItem.getModel("taskDefinitions").getData().TaskDefinitionCollection;
			var sSortingType;

			// CA_Type_Search_Block BEGIN
			CA_Type_Search_Block: {
				for ( var i = 0; i < aSelectedTD.length; i++) { // Loop over TD keys selected in "Task type" filter
					for (var j = 0; j < aTDCollection.length; j++) { // Loop over all TD keys received in My inbox from back-ends
						if (aSelectedTD[i] === aTDCollection[j].TaskDefinitionID) { // Find a match inside TD collection for one of selected TD keys
							var aCADefinitionData = aTDCollection[j].CustomAttributeDefinitionData.results;
							for (var k=0; k <  aCADefinitionData.length; k++) {
								if (aCADefinitionData[k].Name === sSortPathDecoded) { // Search for a match of current sorting CA(sSortPathDecoded) and get its type
									sSortingType = aCADefinitionData[k].Type;
									break CA_Type_Search_Block; // Stop after first match.
								}
							}
						}
					}
				}
			} // CA_Type_Search_Block END

			var sortDescending = mParams.sortDescending;
			if (sSortPath === "PriorityNumber") {
				sortDescending = !sortDescending;
			}

			var fnComparator = CustomAttributeComparator.getCustomAttributeComparator(sSortingType);
			if (fnComparator != null) { // eslint-disable-line eqeqeq
				this._oTableOperations.addSorter(new Sorter(sSortPath, sortDescending, false, fnComparator));
			}
			else {
				this._oTableOperations.addSorter(new Sorter(sSortPath, sortDescending));
			}
			this._oTableOperations.applyTableOperations();
		},

		_getSortingDialog: function() {
			if (this._oSortDialogPromise !== null) {
				return this._oSortDialogPromise;
			}

			this._oSortDialogPromise = Fragment
			.load({
				name: "cross.fnd.fiori.inbox.frag.TaskSortingDialog",
				controller: this
			})
			.then(function(oSortingDialog) {
				this._oView.getController().attachControl(oSortingDialog);
				return oSortingDialog;
			}.bind(this))
			.catch(function() {
				BaseLog.error("Task Sorting Dialog was not created successfully");
			});

			return this._oSortDialogPromise;
		}
	});
});
