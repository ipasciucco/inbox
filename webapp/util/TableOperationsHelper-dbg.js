/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/model/Sorter",
	"sap/m/ViewSettingsItem",
	"cross/fnd/fiori/inbox/model/formatter",
	"cross/fnd/fiori/inbox/util/Comparators",
	"cross/fnd/fiori/inbox/util/Utils"
], function (UI5Object, Sorter, ViewSettingsItem, Formatter, Comparators, Utils) {
	"use strict";

	return UI5Object.extend("cross.fnd.fiori.inbox.util.TableOperationsHelper", {
		_oTableOperations: null,
		_oView: null,
		_oCustomSortItems: {},
		_sPreviousSingleTaskDefinitionFilter: null,

		/**
		 * Constructor function for class TableOperationHelper
		 * @public
		 * @constructor
		 * @alias cross.fnd.fiori.inbox.util.TableOperationsHelper
		 * @extends sap.ui.base.Object
		 *
		 * @param {Object} oTableOperations - Interface class containing functions with table operations.
		 * @param {Object} oView - View containing table.
		 * @param {Object} taskListCustomAttributeHelper - TaskListCustomAttributeHelper instance for controlling the table.
		 */
		constructor: function(oTableOperations, oView, taskListCustomAttributeHelper) {
			this._oResourceBundle = oView.getController().getResourceBundle();
			this._oTableOperations = oTableOperations;
			this._oView = oView;
			this._taskListCustomAttributeHelper = taskListCustomAttributeHelper;
		},

		/**
		 * Opens Table Operations Dialog and selects specified dialog tab.
		 * @param {string} sOperationType - Type of tab to be opened. Valid values are "sort" and "group".
		 * @public
		 * @return {sap.m.ViewSettingsDialog} dialog - generated dialog.
		 */
		openTableOperationsDialog: function(sOperationType) {
		    var dialog = this._getTableOperationsDialog();

			// if is selected only one task type in filter, than sorting by custom attributes is allowed
			if (this._oView.byId("taskDefinitionFilter").getSelectedItems().length === 1) {
				var sCurrentSingleTaskDefinitionFilter = this._oView.byId("taskDefinitionFilter").getSelectedItems()[0].getText();
				// first opening of sort dialog
				if (!this._sPreviousSingleTaskDefinitionFilter) {
					this._addCustomAtrributesSorters();
				}
				// if the current task type filter is other than previous, then remove custom sort filters and add the new ones
				else if (this._sPreviousSingleTaskDefinitionFilter !== sCurrentSingleTaskDefinitionFilter) {
					this._removeCustomAtrributesSorters();
					this._addCustomAtrributesSorters();
				}
				this._sPreviousSingleTaskDefinitionFilter = sCurrentSingleTaskDefinitionFilter;
			}
			else {
				this._removeCustomAtrributesSorters();
				this._sPreviousSingleTaskDefinitionFilter = null;
			}

			var listOfSorters = this._oTableOperations.getSorters();
			if (listOfSorters.length > 0) {
				//Set the default sorter. First sorter in the array is the main sorter
				var desc = listOfSorters[0].bDescending;
				if (listOfSorters[0].sPath === "PriorityNumber") {
					desc = !desc;
				}
				dialog.setSelectedSortItem(listOfSorters[0].sPath);
				dialog.setSortDescending(desc);
			}
			dialog.open(sOperationType);

			return dialog;
		},

		/**
		 * Create Table Operation Dialog as defined in cross.fnd.fiori.inbox.fragments.TableOperationsDialog
		 *
		 * @private
		 *
		 * @returns {cross.fnd.fiori.inbox.fragments.TableOperationsDialog} TableOperationsDialog control
		 */
		_getTableOperationsDialog : function () {
			if (!this._oTableOperationsDialog) {
				this._oTableOperationsDialog = sap.ui.xmlfragment("cross.fnd.fiori.inbox.fragments.TableOperationsDialog", this);
				this._oView.addDependent(this._oTableOperationsDialog);
			}
			return this._oTableOperationsDialog;
		},

		/**
		 * Handler for confirmation button of Table Operations Dialog (currenly "OK").
		 * Depending on the selections made in the sort tab, the respective sorters are created and stored in the _oTableOperations
		 * object (done in  prepareTableSortingOperation function). The actual setting of the sorters on the binding is done by the
		 * _oTableOperations object function applyTableOperations().
		 *
		 * @param {object} oEvent - Event object provided after dialog confirmation.
		 * @public
		 */
		onTableOperationsDialogConfirmed: function(oEvent) {
			var mParams = oEvent.getParameters();

			this.prepareTableSortingOperation(mParams);
			this.prepareTableGroupingOperation(mParams);

			this._oTableOperations.applyTableOperations("CustomAttrColumnGrp");
			var oPage = this._oView.byId("page");
			if (oPage) {
				oPage.getScrollDelegate().scrollTo(0, 0, 0);
			}
		},

		/**
		 * Sets sOrder sort indicator of specified column ID sColumnID.
		 * @param {string} sColumnID -  Column ID as specified in Worklist.view.xml file.
		 * @param {string} sOrder -  Sorting order of the Column. Valid values are "Descending", "Ascending" and "None".
		 * @protected
		 */
		setColumnSortIndicator: function(sColumnID, sOrder) {
			var aColumnsElements = this._oView.byId("table").getColumns(),
				iColumnsLength = aColumnsElements.length;

			for (var i = 0; i < iColumnsLength; i++) {
				if (aColumnsElements[i].getId().indexOf(sColumnID) > -1) {
					aColumnsElements[i].setSortIndicator(sOrder);
				}
				else {
					aColumnsElements[i].setSortIndicator("None");
				}
			}
		},

		/**
		 * Reset entire View Setting Dialog. For detailed operation list see the JSDoc of the functions invked here.
		 *
		 * To have effect on the table, applyTableOperations() (TableOperationImpl) should be invoked after this function.
		 * @public
		 */
		resetViewSettingsDialog: function() {
			this.resetSortDialog();
			this.resetGroupDialog();
		},

		/**
		 * Reset Sort Dialog from View Setting Dialog. This include
		 * 1. Sets default sorting key (sDefaultSortItemKey) in Sorting Dialog.
		 * 2. Sets default sorting order
		 * 2. Add new sap.ui.model.Sorter to aSorterList (TableOperationImpl) with key sDefaultSortItemKey (TableOperationImpl)
		 *
		 * To have effect on the table, applyTableOperations() (TableOperationImpl) should be invoked after this function.
		 * @public
		 */
		resetSortDialog: function() {
			var i,
				aSortItems = this._getTableOperationsDialog().getSortItems(),
				sDefaultSortItemKey = this._oTableOperations.getDefaultSortItemKey();
			for (i = 0; i < aSortItems.length; i++) {
				if (aSortItems[i].getKey() === sDefaultSortItemKey) break;
			}

			var mParams = {
				sortItem: aSortItems[i],
				sortDescending : true
			};
			this.prepareTableSortingOperation(mParams);
		},

		/**
		 * Reset Group Dialog from View Setting Dialog. This include
		 * 1. Sets default groping key to None
		 * 2. Sets oGrouper (TableOperationImpl) to null
		 *
		 * To have effect on the table, applyTableOperations() (TableOperationImpl) should be invoked after this function.
		 * @public
		 */
		resetGroupDialog: function() {
			// First reset settings in Group Dialog.
			this._getTableOperationsDialog().setSelectedGroupItem(); // Set Grouping to None
			this._getTableOperationsDialog().setGroupDescending(true);
			var mParams = {
				groupItem: new sap.m.ViewSettingsItem(),
				groupDescending: true
			};
			this.prepareTableGroupingOperation(mParams);
		},

		/**
		 * Gets user settings performed in Table Operations Dialog for sorting and ads new Sorter.
		 * Sets Column sort indicator.

		 * @param {object} mParams - part of Event object that is needed to get user settings in Table Operations Dialog
		 * @public
		 */
		prepareTableSortingOperation: function(mParams) {
			var sSortPath = mParams.sortItem.getKey(),
				sortDescending,
				sColumnID = mParams.sortItem.getId().replace(/Sort$/,"");

			// If already grouping is set for the same Column, grouping sorting order is used for the sorting
			if (mParams.groupItem && sSortPath === mParams.groupItem.getKey()) {
				sortDescending = mParams.groupDescending;
			}
			else {
				sortDescending = mParams.sortDescending;
			}

			// Set Column indicator
			if (sortDescending) {
				this.setColumnSortIndicator(sColumnID, "Descending");
			}
			else {
				this.setColumnSortIndicator(sColumnID, "Ascending");
			}

			// Here we pass  !sortDescending insteаd of  !sortDescending because we want "Very High" (PriorityNumber = 2) to be on the top
			// when sorting order is Descending
			if (sSortPath === "PriorityNumber") {
				this._oTableOperations.addSorter(new Sorter(sSortPath, !sortDescending, false, Comparators.fnPriorityComparator));
			}
			else {
				this._oTableOperations.addSorter(new Sorter(sSortPath, sortDescending));
			}
		},

		/*	---------------------- Functions related to Grouping ----------------------  */

		/**
		 * Gets user settings performed in Table Operations Dialog for grouping and ads new Sorter.

		 * @param {object} mParams - part of Event object that is needed to get user settings in Table Operations Dialog
		 * @public
		 */
		prepareTableGroupingOperation: function(mParams) {
			var sSortPath, sFunctionName, groupDescending;

			if (mParams.groupItem && mParams.groupItem.getKey() !== "") {
				sSortPath = mParams.groupItem.getKey();
				sFunctionName = "fn" + sSortPath; // sSortPath should be the task property name as defined in TCM model
				groupDescending = mParams.groupDescending;

				if (sSortPath === "PriorityNumber") {
					this._oTableOperations.setGrouping(new Sorter(sSortPath, !groupDescending, (this._oGroupFunctions[sFunctionName].bind(this)), Comparators.fnPriorityComparator));
				}
				else {
					this._oTableOperations.setGrouping(new Sorter(sSortPath, groupDescending, (this._oGroupFunctions[sFunctionName].bind(this))));
				}
			}
			else {
				this._oTableOperations.removeGrouping();
			}
		},

		// This is an Object with all grouping functions that are used to group by some task property
		// The grouping functions are called during grouping for each item in the list. They determine to which group
		// an item from the list belongs to. Items with the same key form a group. A new key
		// means a new group. The returned text is used as the label of the group item header.
		// Name of function is string ("fn" + "Name of the relevant property from TCM model")
		_oGroupFunctions: {
			// Grouping function for grouping by Task Definitions
			fnTaskDefinitionName: function(oListItemContext) {
				var key = oListItemContext.getProperty("TaskDefinitionName");
				var formattedValue = key;
				return this._getNameGrouper(this._oResourceBundle.getText("GroupTitle_TaskDefinitionName"),formattedValue, key);
			},

			// Grouping function for grouping by task Priority. Grouping is made by PriorityNumber by using custom formater.
			// Tasks with Invalid PriorityNumber form group "Invalid Priority" and task with no set PriorityNumber for group "No Priority"
			fnPriorityNumber: function(oListItemContext) {
				var key = oListItemContext.getProperty("PriorityNumber");
				var aFormattedObject = Formatter.formatPriorityForGrouping(key, this._oView);
				return this._getNameGrouper(this._oResourceBundle.getText("GroupTitle_PriorityColumnTitle"), aFormattedObject[0],  aFormattedObject[1]);
			},
			// Grouping function for grouping by Due date. If "Due" formatting is changed in the table then dateFormatter should be updated accordingly.
			fnCompletionDeadLine: function(oListItemContext) {
				var dueDate = oListItemContext.getProperty("CompletionDeadLine");
				var formattedValue = this._oResourceBundle.getText("GroupTitle_NoCompletionDeadLine.none");
				// Yes I want to check for undefined too
				if (dueDate != null) { // eslint-disable-line eqeqeq, no-eq-null
					var dateFormatter = sap.ui.core.format.DateFormat.getDateInstance({pattern:"dd/MM/yyyy", relative:true, relativeScale:"auto"}, sap.ui.getCore().getConfiguration().getLocale());
					formattedValue = dateFormatter.format(new Date(dueDate));
				}
				return this._getNameGrouper(this._oResourceBundle.getText("GroupTitle_DueColumnTitle"), formattedValue, formattedValue);
			},
			// Grouping function for grouping by Created On date. If "Created On" formatting is changed in the table then dateFormatter should be updated accordingly.
			fnCreatedOn: function(oListItemContext) {
				var createdOn = oListItemContext.getProperty("CreatedOn");
				var dateFormatter = sap.ui.core.format.DateFormat.getDateInstance({pattern:"dd/MM/yyyy", relative:true, relativeScale:"auto"}, sap.ui.getCore().getConfiguration().getLocale());
				var formattedValue = dateFormatter.format(new Date(createdOn));
				return this._getNameGrouper(this._oResourceBundle.getText("GroupTitle_CreatedOnColumnTitle"), formattedValue, formattedValue);
			},
			// Grouping function for grouping by Created By
			fnCreatedByName: function(oListItemContext) {
				var createdBy = oListItemContext.getProperty("CreatedByName");
				return this._getNameGrouper(this._oResourceBundle.getText("GroupTitle_CreatedByColumnTitle"), createdBy, createdBy);
			},
			// Grouping function for grouping by Status
			fnStatus: function(oListItemContext) {
				var status = oListItemContext.getProperty("Status");

				return this._getNameGrouper(this._oResourceBundle.getText("GroupTitle_StatusColumnTitle"), Formatter.formatStatusForGrouping(status,this._oView), Formatter.formatStatusForGrouping(status,this._oView));
			}
		},

		// This is a generic grouping function for columns that contain strings. For those columns, the property's value is
		// used as the grouping key and the group header text is built using the column's label and the property's value.
		_getNameGrouper: function(sLabel, sFormattedValue, sKey) {
			var sText = sLabel + ": " + sFormattedValue;
			return {
				key: sKey,
				text: sText
			};
		},

		/*	---------------------- Functions related to Sorting ----------------------  */

		/**
		 * Add custom attributes to sorting options in Table Operations Dialog.
		 *
		 * @private
		 */
		_addCustomAtrributesSorters: function() {
			var aCustomAttributeList = this._taskListCustomAttributeHelper.getCustomAttributeList();
			for (var i = 0; i < aCustomAttributeList.length; i++) {
				this._addCustomSortItem(aCustomAttributeList[i]);
			}
		},

		/**
		 * Remove custom attributes from sorting options in Table Operations Dialog.
		 *
		 * @private
		 */
		_removeCustomAtrributesSorters: function() {
			var _oCustomSortItemsKeys = Object.keys(this._oCustomSortItems);
			for (var i = 0; i < _oCustomSortItemsKeys.length; i++) {
				var sKey = _oCustomSortItemsKeys[i];
				this._removeCustomSortItem(sKey);
			}
		},

		/**
		 * Add custom sort item from sorting options in Table Operations Dialog.
		 *
		 * @param {object} oCustomAttribute - custom attribute object
		 * @private
		 */
		_addCustomSortItem: function(oCustomAttribute) {
			var oDialog = this._getTableOperationsDialog();
			var encodedKey = encodeURIComponent(oCustomAttribute.Name);
			var oSortItem = this._oCustomSortItems[oCustomAttribute.Name];

			if (oSortItem) {
				oDialog.addSortItem(oSortItem);
			}
			else {
				oSortItem = new ViewSettingsItem( Utils.genSafeId(oCustomAttribute, true) + "Sort", { key:encodedKey, text: oCustomAttribute.Label });
				oDialog.addSortItem(oSortItem);

				this._oCustomSortItems[oCustomAttribute.Name] = oSortItem;
			}
		},

		/**
		 * Remove custom sort item from sorting options in Table Operations Dialog.
		 *
		 * @param {String} sKey - key of sort item
		 * @private
		 */
		_removeCustomSortItem: function(sKey) {
			var oDialog = this._getTableOperationsDialog();
			var oSortItem = this._oCustomSortItems[sKey];
			if (oSortItem) {
				oDialog.removeSortItem(oSortItem);
				this._oCustomSortItems[sKey].destroy();
				delete this._oCustomSortItems[sKey];
			}
		}
	});
});