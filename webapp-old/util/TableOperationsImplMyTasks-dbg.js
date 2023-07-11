/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/model/Sorter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"cross/fnd/fiori/inbox/model/models"
], function(UI5Object, Sorter, Filter, FilterOperator, models) {
	"use strict";

	return UI5Object.extend("cross.fnd.fiori.inbox.util.TableOperationsImplMyTasks", {
	/*	This class provides functions to facilitate Sorting, Filtering and Grouping of the table.
		It should contain all logic for setting, getting, combining and reseting Sorters, Groupers and Filters.
		It should not contain any logic that contain algorithm for creation of particular Sorter, Grouper or Filter.
		Please note that TableOperationsImpl is not meant to be consumed directly but through interface provided in TableOperations class.
		The following features are provided:
		1. Sorting and Gropuping
			It is ensured that setting a new sorter with "sort list" does not break a sorting
			that was previously set by "grouping". When the list is sorted or grouped the list of sorters that
			is applied to the binding is built by concatenating this.oGrouper and aSortList of this object
			into one array. Sorting and grouping is done with the following rules:
		    1.1  Selecting a sorter on the table adds the new sorter as the main sorter to all existing sorters
		    1.2. If grouping and sorting are both set for the same attribute then the direction (Ascending/Descending) is aligned to to the grouping direction.
		    After changes maximum 2 sorters are allowed. Sorting is server side, while grouping has two steps, Dirst server-side side sort and then client side
		    grouping.
		2. Filtering
			Filters are separated in two groups
			2.1 Filters created by View Settings Dialog are called User Filters. Do not reset these filters directly with resetUserFilters()
            	Instead use functions resetFilterDialog() or resetViewSettingsDialog() from TableOperatiosHelper.
			2.2 Filters created internally by application logic are called Application Filters. These include also default initial filters.

			First step in creation of filters  is creation of dictionary made inside addFilter() function. In dictionary Filters are grouped by key sFilterAttribute.
			For each value of sFilterAttribute there are two corresponding arrays with Including and Excluding filters.
            The current value used for sFilterAttribute is the name of the task property (attribute) as defined in Task Model. This can create
            problem if two different filters are created in different parts of the application with same sFilterAttribute value.
            Such filters will not be AND to one another but will be OR. If you expect these filters to be AND you need to use unique sFilterAttribute value for the
            newly created filter.
            e.g PropertyName___SomeFunctionalName.
        	2.3 Final list of filters created in the dictionaries are assembled by _updateFilters() function, which creates a single array of multi-filters.
        		For each value of sFilterAttribute there are two corresponding multi-filters, one Including (filters inside are OR) and one Excluding (Filters inside are AND)
        		These filters finally be AND in function aplyTableOperations().
        	2.4 Application Filter can be prepared separately and then set directly by function setAppFilters().
		3. All changes to the filtering and sorting of a table are collected and applied together in function applyTableOperations()
				// - searching is done using filters (one filter per searchable column) (Not implemented yet)

	*/

		constructor: function(oSettings) {
			// currently the following properties of oSettings are evaluated:
			// oTable	- this is the table on which the operations are performed
			// oDefaultSorter - The default sorter (type sap.ui.model.Sorter). That is used for the inital sorting of the table
			this.bGroupingChanged = false; //indicator grouping changed since the last binding update

			this.bAppFilterNotNULL = true;	// This is used in applyTableOperations() to decide if request for TaskCollection will be made
											//  or "taskModel" will be set directly to {}.

			this.oGrouper = null; // currently active grouper of type  "sap.ui.model.Sorter",
			this.oDefaultSorter = oSettings.oDefaultSorter;
			this.sDefaultSortItemKey = "CreatedOn";
			this.aSortList = this._getDefaultSortList();
			this.aSortGroupList = [];
			this.oTable = oSettings.oTable; // The table that is to be sorted, filtered, etc. taken from the import parameter

			this.SortersMAXDepth = 1; // Maximum number of sortings keys send to the server

			this.oURLParameters = {};

			// List of Total filters. Initially set to empty array it is  updated in updateTotalFilterList() which is invoked in applyTableOperations().
			// The idea here is give possibility of independent set and reset of AppFilters and UserFilters and then concatenate them  in updateTotalFilterList()
			this.aTotalFilterList = [];

			this.aAppFilterList = this._getDefaultFilterList(); // List of active Application filters.
			this.oAppFilterDict = {}; // Dictionary object containing one attribute for each Task property by which filter is applied

			this.aUserFilterList = []; // List of active User filters
			this.oUserFilterDict = {}; // Dictionary object containing one attribute for each column having at least one User filter.

			// Each Attribute consists of two lists. One for the exclding filters (NE) and one for the
			// Including filters (EQ, BT,...)this.aTotalFilterList = [];
		},


		getDefaultSortItemKey: function() {
			return 	this.sDefaultSortItemKey;
		},

		getURLParameters: function() {
			return this.oURLParameters;
		},

		getSorters: function() {
			// returns the list of currently active sorters (sorters for searches and for grouping are not part of this list)
			return this.aSortList;
		},

		getFilters: function() {
			// returns the list of currently active filters (Default + Application + View Settings Dialog Filter)
			return this.aTotalFilterList;
		},

		_getSortListIndexByPath: function(sPath) {
			// searches the list of active sorters for a sorter with the given path and returns the sorter's position
			// in the list (there can be only one) or -1 if no matching sorter was found
			var i;
			for (i = 0; i < this.aSortList.length; i++) {
				if (this.aSortList[i].sPath === sPath) {
					return i;
				}
			}
			return -1;
		},

		addSorter: function(oSorter) {
			// adds the new sorter as the new main sorter to the list of active sorters.
			// Delete any existing sorter for the path specified
			var i = this._getSortListIndexByPath(oSorter.sPath);
			if (i !== -1) {
				this.aSortList.splice(i, 1);
			}
			// The latest sorter is always the "main" sorter -> add it to the
			// beginning of the array. Reduce array to length this.SortersMAXDepth
			this.aSortList.unshift(oSorter);
			if (this.aSortList.length > this.SortersMAXDepth )	{
				this.aSortList.splice(this.SortersMAXDepth, 1);
			}
			// Copy the sort order of the new sorter to the grouper if they
			// refer to the same path
			if (this.oGrouper && this.oGrouper.sPath === oSorter.sPath) {
				this.oGrouper.bDescending = oSorter.bDescending;
			}
		},

		addUserFilter: function(oFilter, sFilterAttribute) {
			this.addFilter(oFilter, sFilterAttribute, this.oUserFilterDict);
		},

		// Please consider when using this function to provide unique value for sFilterAttribute.
		// If this fuction is invoked from two different part of the code with identical sFilterAttribute filters created in these
		// two parts will be OR.
		addAppFilter: function(oFilter, sFilterAttribute) {
			this.addFilter(oFilter, sFilterAttribute, this.oAppFilterDict);
		},

		addFilter: function(oFilter, sFilterAttribute, oFilterDict) {
			// This function creates dictionary containing the filters for all attributes. For each atribute (sFilterAttribute) two separate lists for Including
			// and Excluding filters are created. These filters are simple filters.
			if (oFilter && sFilterAttribute) {
				if (oFilterDict[sFilterAttribute]) {
					// there is already at least one filter for this attribute -> add the new filter to the
					// appropriate list depending on its filter operator
					// currently "not equal" is the only possible excluding filter operator
					if (oFilter.sOperator === FilterOperator.NE) {
						oFilterDict[sFilterAttribute].excludingFilters.push(oFilter);
					}
					else {
						oFilterDict[sFilterAttribute].includingFilters.push(oFilter);
					}
				}
				else {
					// there is no filter for this attribute yet -> add the new filter attribute to the dictionary
					oFilterDict[sFilterAttribute] = {
						includingFilters: [],
						excludingFilters: []
					};
					// currently "not equal" is the only possible excluding filter operator
					if (oFilter.sOperator === FilterOperator.NE) {
						oFilterDict[sFilterAttribute].excludingFilters = [oFilter];
					}
					else {
						oFilterDict[sFilterAttribute].includingFilters = [oFilter];
					}
				}
			}
		},

		// creates a Filter List with multi-filters from provided Filter Dictionary. The Including multi-filter for one attribute are connect by the "OR"
		// operator and the Exluding multi-filter are connect by the "AND" operator. Multi-filters are added to aFilterList and are then connected
		// with "AND" operator in updateTotalFilterList().
		_updateFilterList: function(aFilterList, oFilterDict) {
			for (var prop in oFilterDict) {
				if (oFilterDict.hasOwnProperty(prop)) {
					if (oFilterDict[prop].includingFilters.length > 0) {
						aFilterList.push(new Filter(oFilterDict[prop].includingFilters, false));
					}
					if (oFilterDict[prop].excludingFilters.length > 0) {
						aFilterList.push(new Filter(oFilterDict[prop].excludingFilters, true));
					}
					delete oFilterDict[prop]; // Once Filter is added it is removed from the dictionary
				}
			}
		},

		/**
		 * 1. Combines all filter lists: (1) current filter list (aTotalFilterList) (2) aAppFilterList (3) aUserFilterList
		 * 2. Combines Sort and Group lists
		 * 3. Send request to OData provider. Because now on every request we want to get TaskCollection, all other request a combined in one group
		 *	  and then requested from the server as one batch request. If at some point some other requests, that does not need update of TaskCollection emerge
		 *	  they should be managed separately.
		 *
		 * @param {string} sBatchGroupName -  If supplied this adds request to TaskCollection for the batch group sBatchGroupName with total filter.
		 *									  This is supposed to be the last request in the group.
		 * @public
		 */

		applyTableOperations: function(sBatchGroupName) {
			// Now this function serves to send request to OData provider. All request for TaskCollection goes through here
			this.updateTotalFilterList();
			this.createSortGroupList();
			// Check that we need to make request to the Odata Provider. For setting bAppFilterNotNULL details see setAppFilters(filter).
			if (this.bAppFilterNotNULL) {
				models.refreshTaskModel(this.getURLParameters(),
										this.aSortGroupList,
										this.getFilters(),
										sBatchGroupName);
			}
			else {
				/* This parts is for Tabs that have only offline systems. For them App filter is set to null.
				   In that case no request is need and TaskModel is just cleared. This resets automatically all table bindings
				   and firing "taskModelUpdated" event is not nessary for table clearing. However there are some other operation
				   which we might want to be executed as i.e. setting page busy state to false.
				*/
				models.updateTaskModel({results : {}});
				models.fireEvent("taskModelUpdated");
			}

			// Should we handle response in success and error functions. I prefer these to be handled by the individual success and error functions.
			if (sBatchGroupName) {
				models.getMainModel().submitChanges({
					groupId: sBatchGroupName,
					success: function(oData, oResponse) {
							//	var testSuccess = "dummy";
					}.bind(this),
					error: function(oError) {
							// var testError = "Error";
					}.bind(this)
				});
			}
		},

		_applySortingAngGroupingOperations: function(oTableBinding) {
		var aActiveSorters = [];
			if (this.bGroupingChanged) {
			// The grouping or sorting of the table has changed. The sorting on the binding needs to be updated.
			// Note that the sorter of the grouping has to be the first one in the list of sorters that is added
			// to the binding
				if (this.oGrouper) {
					aActiveSorters.push(this.oGrouper);
				}
				if (this.aSortList.length > 0) {
					aActiveSorters = aActiveSorters.concat(this.aSortList);
				}

				oTableBinding.sort(aActiveSorters);
			}
		},

		updateTotalFilterList: function() {
			this._updateFilterList(this.aUserFilterList, this.oUserFilterDict);
			this._updateFilterList(this.aAppFilterList, this.oAppFilterDict);
			this.aTotalFilterList = [].concat(this.aAppFilterList, this.aUserFilterList);
		},

        // This function combines real sorters with grouping, which is needed to send request to OData service
        // The result should returned itimes sorted by the grouping property first.
		createSortGroupList: function() {
			if (this.aSortList.length > 0) {
				this.aSortGroupList = [].concat(this.aSortList);
			}
			// If grouping has changed add grouper on the top of sort list to make it the main Sorter
			if (this.bGroupingChanged && this.oGrouper) {
			var i = this._getSortListIndexByPath(this.oGrouper.sPath);
				// In case grouping and sorting is by the same property remove Sorter so to not repeat ordering property in OData request
				// Sorter with grouping function is not manege by the OData read() fuction. Grouping is only client side.
				if (i !== -1) {
					this.aSortGroupList.splice(i, 1);
				}
				this.aSortGroupList.unshift(this.oGrouper);
			}
			// Reduce array to length this.SortersMAXDepth if needed
			if (this.aSortGroupList.length > this.SortersMAXDepth )	{
				this.aSortGroupList.splice(this.SortersMAXDepth, 1);
			}
		},

		createAppFilterList: function() {
			this._updateFilterList(this.aAppFilterList, this.oAppFilterDict);
		},

		/**
		 * Sets grouping with oprovided Groping Sorter
		 *
		 * @param {object} oNewGrouper -  Instance of sap.ui.model.Sorter
		 * @protected
		 */
		setGrouping: function(oNewGrouper) {
			// Do not apply client side sorting when grouping is not applied and new Grouper is null
			if (oNewGrouper === null && this.oGrouper === null) {
				this.bGroupingChanged = false;
			}
			else {
				this.oGrouper = oNewGrouper;
				this.bGroupingChanged = true;
			}
		},
        // Default filters moved from models.refreshTaskModel()
		_getDefaultFilterList: function() {
			var aFilterList = [];
			aFilterList.push(new Filter({path:"Status", operator:sap.ui.model.FilterOperator.EQ, value1:"READY"}));
			aFilterList.push(new Filter({path:"Status", operator:sap.ui.model.FilterOperator.EQ, value1:"RESERVED"}));
			aFilterList.push(new Filter({path:"Status", operator:sap.ui.model.FilterOperator.EQ, value1:"IN_PROGRESS"}));
			aFilterList.push(new Filter({path:"Status", operator:sap.ui.model.FilterOperator.EQ, value1:"EXECUTED"}));
			return [new Filter(aFilterList, false)];
		},

		_getDefaultSortList: function() {
			return [this.oDefaultSorter || new Sorter("CreatedOn", true)];
		},

		removeGrouping: function() {
			// If previous grouper is null do nothing
			if (this.oGrouper === null) {
				this.bGroupingChanged = false;
			}
			else {
				// In previous grouper is not null, set to null and need to make client grouping again
				this.oGrouper = null;
				this.bGroupingChanged = true;
			}
		},

		removeURLParameter: function(sURLParameter) {
				delete this.oURLParameters[sURLParameter];
		},

		_resetChangeIndicators: function() {
			// after all pending changes are executed the change indicators need to be reset.
			// this is done here
			this.bGroupingChanged = false;
		},

		resetAllFilters: function() {
			// removes all active filters
			this.aTotalFilterList = [];
			this.resetUserFilters();
			this.resetAppFilters();
		},

		resetUserFilters: function() {
			// removes all active User filters and empty dictionary
			this.aUserFilterList = [] ;
			this.oUserFilterDict = {};
		},

		resetAppFilters: function() {
			// Resets Application filters to default and empty AppFilter Dictionary
			this.aAppFilterList = this._getDefaultFilterList();
			this.oAppFilterDict = {};
			this.bAppFilterNotNULL = true;
		},

		/**
		 * Sets current application filter list (aAppFilterList). If invoked without parameter will set current App Filter to []. This is provided
		 * in case somebody needs to make unrestricted request to the OData priver.
		 * If you intend to use this function with applyTableOperations(), if do not reset User filters they will be added with AND to aAppFilterList.
		 *
		 * @param {object|array} filter - Instance of sap.ui.model.Filter, or array of instances of sap.ui.model.Filter.
		 *
		 * "filter" parameter values - outcomes:
		 * undefined, [] and {}	- aAppFilterList is set to [] and bAppFilterNotNULL is set to true. (In function applyTableOperations() TaskCollection request will be made with empty aAppFilterList filter.)
		 * all other types		- aAppFilterList is set to [] and bAppFilterNotNULL is set to false. (In function applyTableOperations() "taskModel" will be set directly to {}.)
		 *
		 * @public
		 */
		setAppFilters: function(filter) {
			var sType = jQuery.type(filter);
			this.aAppFilterList = [];
			this.oAppFilterDict = {};
			switch (sType) {
				case "object":
					if (filter instanceof Filter) {
						this.aAppFilterList.push(filter);
					}
					this.bAppFilterNotNULL = true;
				    break;
				case "array":
					this.aAppFilterList = [].concat(filter);
					this.bAppFilterNotNULL = true;
				    break;
				case "undefined":
					this.bAppFilterNotNULL = true;
					break;
				default:
					this.bAppFilterNotNULL = false;
			}
		},

		setURLParameter: function(sURLParameter, value) {
			this.oURLParameters[sURLParameter] = value;
		}
	});
});