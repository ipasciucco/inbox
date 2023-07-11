/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/base/Object",
	"cross/fnd/fiori/inbox/util/TableOperationsImplMyTasks"
], function(UI5Object, TableOpImp) {
	"use strict";

	return UI5Object.extend("cross.fnd.fiori.inbox.util.TableOperationsMyTasks", {

		/*	This class provides functions to faciliate Sorting, Filtering and Grouping.
			The implementation of functions is delegated to class TableOperationsImpl. The documentation of these
			functions can be found in TableOperationsImpl.
			TableOperationsImpl is not meant to be consumed directly. Instead interface classes like TableOperations are provided for consumption.
		*/
		constructor: function(oTable, oDefaultSorter) {
			// Storage of the active grouping and sorting is private because
			// of their interdependency
			var oTableOpImp = new TableOpImp({
				oTable: oTable,
				oDefaultSorter: oDefaultSorter
			});

			this.isGroupingChanged = function() {
				return oTableOpImp.bGroupingChanged;
			};

			this.getSortGroupList = function() {
				return oTableOpImp.aSortGroupList;
			};

			this.createAppFilterList = function() {
				oTableOpImp.createAppFilterList();
			};

			this.getDefaultSortItemKey = function() {
				return oTableOpImp.getDefaultSortItemKey();
			};

			this.getURLParameters = function() {
				return oTableOpImp.getURLParameters();
			};

			this.getSorters = function() {
				return oTableOpImp.aSortList;
			};

			this.getFilters = function() {
				return oTableOpImp.aTotalFilterList;
			};

			this.getAppFilters = function() {
				return oTableOpImp.aAppFilterList;
			};

			this.getUserFilters = function() {
				return oTableOpImp.aUserFilterList;
			};

			this.resetAllFilters = function() {
				oTableOpImp.resetAllFilters();
			};

			this.resetUserFilters = function() {
				oTableOpImp.resetUserFilters();
			};

			this.resetAppFilters = function() {
				oTableOpImp.resetAppFilters();
			};

			this.addSorter = function(oSorter) {
				oTableOpImp.addSorter(oSorter);
			};

			this.getSorters = function() {
				return oTableOpImp.getSorters();
			};

/*			this.addFilter = function(oFilter, sFilterAttribute) {
				oTableOpImp.addFilter(oFilter, sFilterAttribute);
			};*/

			this.addAppFilter = function(oFilter, sFilterAttribute) {
				oTableOpImp.addAppFilter(oFilter, sFilterAttribute);
			};

			this.addUserFilter = function(oFilter, sFilterAttribute) {
				oTableOpImp.addUserFilter(oFilter, sFilterAttribute);
			};

			this.applyTableOperations = function(sBatchGroupName) {
				oTableOpImp.applyTableOperations(sBatchGroupName);
			};

			this.setGrouping = function(oNewGrouper) {
				oTableOpImp.setGrouping(oNewGrouper);
			};

			this.removeGrouping = function() {
				oTableOpImp.removeGrouping();
			};

			this.setAppFilters = function(oFilter) {
				oTableOpImp.setAppFilters(oFilter);
			};

			this.setURLParameter = function(sURLParameter, value) {
				oTableOpImp.setURLParameter(sURLParameter, value);
			};

			this.removeURLParameter = function(sURLParameter) {
				oTableOpImp.removeURLParameter(sURLParameter);
			};
		}
	});
});