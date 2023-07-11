/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/model/Sorter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"cross/fnd/fiori/inbox/model/CAQueryHelper",
	"sap/ui/thirdparty/jquery",
	"cross/fnd/fiori/inbox/util/Utils",
	"sap/ui/model/odata/ODataUtils"
], function(UI5Object, Sorter, Filter, FilterOperator, CAQueryHelper, jQuery, Utils, ODataUtils) {
	"use strict";
	/**
	 * This helper is used for paging.
	 * Each page/table refresh should create a new instance of PagingHelper
	 * This helper is used in the models and it keeps track of the current paging information.
	 *
	 */
	return UI5Object.extend("cross.fnd.fiori.inbox.model.PagingHelper", {

		_oURLParameters: null,
		_aSorters: null,
		_aFilters: null,
		_iPageSize: 40,
		_iTotal: 0,	// this will keep the total number of items requested within one paging helper instance
		_oLastItem: null,	//this will keep the last item (Task entity from TCM)
		_bLastPageLoaded: false,	//flag, indicating if the last page is 
		_bNeedCAQuery: false, //switch for change filter, sorter and url parameters

		/**
		 * Creates a new instance of PagingHelper and reset the paging state.
		 *
		 * @param {object} oURLParameters - A map containing the parameters that will be passed as query strings to OData.read
		 * @param {sap.ui.model.Sorter[]} aSorters - An array of sorters to be included in the request URL
		 * @param {sap.ui.model.Filter[]} aFilters - An array of filters to be included in the request URL
		 * @param {number} iPageSize - optional number to configure the page size - default is 40.
		 */
		constructor: function(oURLParameters, aSorters, aFilters, iPageSize) {
			this._oURLParameters = jQuery.extend(true, {}, oURLParameters);
			this._aSorters = aSorters;
			this._aFilters = aFilters;
			if (iPageSize >= 0) {
				this._iPageSize = iPageSize;
			}
			this._oLastItem = null;
			this._bLastPageLoaded = false;
			this._iTotal = 0;
			this._bNeedCAQuery = false;
			if (Utils.checkIfFirstSorterIsCustomAttribute(this._aSorters) || Utils.checkIfFilteredByCustomAttribute(this._aFilters)) {
				this._bNeedCAQuery = true;
			}
		},

		/**
		 *
		 * This function also manipulates the total number and it should be called only once for each page.
		 *
		 * @returns {object} - initial url parameteres extended with "$top" parameter according to the page size,
		 * 						and "$inlinecount" parameter for requesting the count in the first request
		 */
		getURLParameters: function() {
			// add the curent page size to the total numbers requested.
			this._iTotal += this._iPageSize;

			// we have to check if total number is divisible by 20.
			// this is done to avoid issue in SAPUI5
			// described in Internal Incident ID: 2080245119 from 2020
			// https://support.wdf.sap.corp/sap/support/message/2080245119
			// if this is true we increment the pageSize and the total number with 1
			// and this will avoid the issue in the incident.

			// We will request new funcitonality to SAPUI5 which will be available in 1-2 years
			// Until then we should use this approach to avoid growing issue with fast scroll.

			var bPageSizeModified = false; // flag to indicate if page size is modified internally

			if (this._iTotal % 20 === 0) {
				this._iPageSize++;
				this._iTotal++;
				bPageSizeModified = true;
			}
			this._oURLParameters["$top"] = "" + this._iPageSize;

			/*
			We need to request the total number of items during initial load.
			The total number correspond to the applied filters.
			This number is used to show an indicator on top of the table like (45/100)
			Which means that after filtering 45 items are shown out of 100.
			*/
			if (this._iTotal === this._iPageSize) { //this is the initial request, therefore request the inlinecount
				this._oURLParameters["$inlinecount"] = "allpages";
			}
			else { //this is not the initial request - don't request the count for better performance.
				this._oURLParameters["$inlinecount"] = "none";
			}

			// after we add the page size to the URL parameters, we set the page size to previous value
			if (bPageSizeModified) {
				this._iPageSize--;
				bPageSizeModified = false; // this is not needed but added just in case
			}

			if (this._bNeedCAQuery) {
				var sSorters = CAQueryHelper.createSortParams(this._getSortersInternal());
				var sFilters = CAQueryHelper.createFilterParams(this._getFiltersInternal());
				this._oURLParameters.caOrderBy = sSorters;
				this._oURLParameters.caFilter = sFilters;
			}
			return this._oURLParameters;
		},

		/**
		 * @returns {sap.ui.model.Sorter[]} - initial sorters extended with last sort attribute "InstanceID"
		 */
		getSorters: function() {
			if (this._bNeedCAQuery) {
				return null;
			}
			else {
				return this._getSortersInternal();
			}
		},

		/**
		 * @returns {sap.ui.model.Sorter[]} - initial sorters extended with last sort attribute "InstanceID"
		 * @private
		 */
		_getSortersInternal: function() {
			var pagingLastSorter = new Sorter("InstanceID");
			var sorters = [];
			sorters = sorters.concat(this._aSorters);
			sorters.push(pagingLastSorter);
			return sorters;
		},

		/**
		 * This method use data from the last item from each page,
		 * in order to generate a specific filter for the next page.
		 *
		 * @returns {sap.ui.model.Filter[]} - initial filters extended with the filters needed for paging
		 */
		getFilters: function() {
			if (this._bNeedCAQuery) {
				return null;
			}
			else {
				return this._getFiltersInternal();
			}
		},

		/**
		 * This method use data from the last item from each page,
		 * in order to generate a specific filter for the next page.
		 *
		 * @returns {sap.ui.model.Filter[]} - initial filters extended with the filters needed for paging
		 * @private
		 */
		_getFiltersInternal: function() {
			var filter = this._aFilters;
			if (this._oLastItem !== null) {
				var lastInstanceID = this._oLastItem.InstanceID;

				var lastSortAttrName = this._aSorters[0].sPath;
				var lastSortAttrDesc = this._aSorters[0].bDescending;
				var lastSortAttrValue = this._oLastItem[lastSortAttrName];

				// Date values must be formatted as expected by the service only if CustomAttributes are involved
				if (this._bNeedCAQuery && lastSortAttrValue && (lastSortAttrValue instanceof Date)) {
					lastSortAttrValue = ODataUtils.formatValue(lastSortAttrValue, "Edm.DateTime");
			    }

				/*
				* OData services does not work properly when filtering by NULL values. 
				* Expressions like VALUE > NULL or VALUE < NULL always return false no matter what is the VALUE. 
				* This breaks the Paging concept with filtering since correct filter returns wrong result. 
				* In order to fix it we have to consider NULL values. So there are 4 different use cases/conditions:
				* 
				* 1. Sort order is acs and lastSortAttrValue is NOT NULL:
				* 	( sortAttribte == lastSortAttrValue && InstanceID > lastInstanceID )
				* 	OR
				* 	( sortAttribte > lastSortAttrValue )
				* 
				* 2. Sort order is acs and lastSortAttrValue is NULL:
				* 	( sortAttribte == lastSortAttrValue && InstanceID > lastInstanceID)
				* 	OR
				* 	( sortAttribte != null )
				* 
				* 3. Sort order is desc and lastSortAttrValue is NOT NULL:
				* 	( sortAttribte  == lastSortAttrValue && InstanceID > lastInstanceID   )
				* 	OR
				* 	( sortAttribte < lastSortAttrValue  )
				* 	OR
				* 	( sortAttribte == null )
				* 
				* 4. Sort order is desc and lastSortAttrValue is NULL
				* 	( sortAttribte == lastSortAttrValue && InstanceID > lastInstanceID )
				* 			
				*/

				/*
				* First filter condition is always the same for all cases.
				* (sortATR == lastSortAttrValue && InstanceID > lastInstanceID)
				*/
				var firstFilterCondition = new Filter(
						[
							new Filter(lastSortAttrName, FilterOperator.EQ, lastSortAttrValue),
							new Filter("InstanceID", FilterOperator.GT, lastInstanceID)
						],
						true
					);
				
				/*
				* Array for the next page filter. Initialize it with first filter,
				* because first filter condition is always the same for all cases.
				* Other conditions will be pushed to this array when needed.
				*/
				var aNextPageFiter = [firstFilterCondition];
				
				/*
				* 1. Sort order is acs and lastSortAttrValue is NOT NULL:
				* 	( sortAttribte == lastSortAttrValue && InstanceID > lastInstanceID )
				* 	OR
				* 	( sortAttribte > lastSortAttrValue )
				*/
				if (!lastSortAttrDesc && lastSortAttrValue !== null) {
					//first filter condition is always pushed
					aNextPageFiter.push(
						new Filter(lastSortAttrName, FilterOperator.GT, lastSortAttrValue)
					);
				}
				/*
				* 2. Sort order is acs and lastSortAttrValue is NULL:
				* 	( sortAttribte == lastSortAttrValue && InstanceID > lastInstanceID)
				* 	OR
				* 	( sortAttribte != null )
				*/
				else if (!lastSortAttrDesc && lastSortAttrValue === null) {
					//first filter condition is always pushed
					aNextPageFiter.push(
						new Filter(lastSortAttrName, FilterOperator.NE, null)
					);
				}
				/*
				* 3. Sort order is desc and lastSortAttrValue is NOT NULL:
				* 	( sortAttribte  == lastSortAttrValue && InstanceID > lastInstanceID   )
				* 	OR
				* 	( sortAttribte < lastSortAttrValue  )
				* 	OR
				* 	( sortAttribte == null )
				*/
				else if (lastSortAttrValue !== null) {
					//first filter condition is always pushed
					aNextPageFiter.push(
						new Filter(lastSortAttrName, FilterOperator.LT, lastSortAttrValue)
					);
					aNextPageFiter.push(
						new Filter(lastSortAttrName, FilterOperator.EQ, null)
					);
				}
				/*
				* 4. Sort order is desc and lastSortAttrValue is NULL
				* 	( sortAttribte == lastSortAttrValue && InstanceID > lastInstanceID )
				*/
				else {
					//Do nothing in this case. First filter condition is always pushed in aNextPageFiter.
				}

				// Create the next page filter
				var nextPageFilter = [new Filter(
											aNextPageFiter,	
											false
										)];
				
				var aFinalFilters = this._aFilters.concat(nextPageFilter);

				filter = [new Filter(
					aFinalFilters,
					true
				)];
			}
			return filter;
		},

		/**
		 * @returns {number} - current page size
		 */
		getPageSize: function() {
			return this._iPageSize;
		},

		/**
		 * @returns {object} - the object represent a Task according to TCM
		 */
		getLastItem: function() {
			return this._oLastItem;
		},

		/**
		 * @returns {boolean} - true if the last page is already loaded, false otherwise
		 */
		getLastPageLoaded: function() {
			return this._bLastPageLoaded;
		},

		/**
		 * Set the URL paramters.
		 * The original URL parameters will be overwritten with the given object
		 * @param {object} oURLParameters - A map containing the parameters that will be passed as query strings to OData.read
		 */
		setURLParameters: function(oURLParameters) {
			this._oURLParameters = jQuery.extend(true, {}, oURLParameters);
		},

		/**
		 * Set the sorters
		 * The original sorters will be overwritten with the given object
		 * @param {sap.ui.model.Sorter[]} aSorters - An array of sorters to be included in the request URL
		 */
		setSorters: function(aSorters) {
			this._aSorters = aSorters;
		},

		/**
		 * Set the filters
		 * The original filters will be overwritten with the given object
		 * @param {sap.ui.model.Filter[]} aFilters - An array of filters to be included in the request URL
		 */
		setFilters: function(aFilters) {
			this._aFilters = aFilters;
		},

		/**
		 * Set the page size.
		 * The original page size will be overwritten.
		 * @param {number} iPageSize - number used for a page size
		 */
		setPageSize: function(iPageSize) {
			this._iPageSize = iPageSize;
		},

		/**
		 * The last item should be set after each new page request.
		 * This will overwrite previously set item.
		 * @param {object} oLastItem - object representing a Task from TCM
		 */
		setLastItem: function(oLastItem) {
			this._oLastItem = oLastItem;
		},

		/**
		 * Set to true if the last page has been loaded or false otherwise.
		 * @param {boolean} bLoaded - true or false indicating if the last page is loaded
		 */
		setLastPageLoaded: function(bLoaded) {
			this._bLastPageLoaded = bLoaded;
		}
	});
});