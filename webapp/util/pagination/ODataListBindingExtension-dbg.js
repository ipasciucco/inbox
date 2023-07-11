/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/model/odata/CountMode",
	"sap/ui/model/odata/OperationMode",
	"sap/ui/model/odata/v2/ODataListBinding",
	"sap/ui/model/ChangeReason",
	"cross/fnd/fiori/inbox/util/pagination/CustomFilterProcessor",
	"cross/fnd/fiori/inbox/util/pagination/CustomSorterProcessor"
], function(CountMode, OperationMode, ODataListBinding, ChangeReason,
	CustomFilterProcessor, CustomSorterProcessor
) {
	"use strict";

	var oCustomODataListBinding = ODataListBinding.extend("cross.fnd.fiori.inbox.ODataListBindingExtension", {

		constructor: function(oModel, sPath, oContext, aSorters, aFilters, mParameters) {
			ODataListBinding.apply(this, arguments);
			this.sPaginationFilters = "";
			this.sFilterParamsOld = "";
			this.aPaginationFilters = [];
			if (mParameters && mParameters.doNotLoadNewTasksfterAction) {
				this.doNotLoadNewTasksfterAction = mParameters.doNotLoadNewTasksfterAction;
			}
		},

		// overridden this method to support, client side Sort and Filter
		_fireChange: function(mArguments) {
			if (mArguments.reason === "change") {
				if (this.sPath && this.sPath.indexOf("TaskCollection")>0) {
					this.applyClientSideFilterForStatus();
					this.applyClientSideSort();
				}
			}
			ODataListBinding.prototype._fireChange.call(this,mArguments);
		}
	});

	oCustomODataListBinding.prototype.createPaginationFilterParams = function(aFilterParams) {
		if (this.sFilterParams) {
			this.sFilterParams = ODataListBinding.createFilterParams(aFilterParams);
			//this.sFilterParams = ODataListBinding.createFilterParams(cross.fnd.fiori.inbox.PaginationFilterGenerator.fnCreatePaginationFilters(aFilterParams));
		}
	};

	oCustomODataListBinding.prototype.createPaginationSortParams = function(aSortParams) {
		if (this.sSortParams) {
			this.sSortParams = ODataListBinding.createSortParams(aSortParams);
			//this.sSortParams = ODataListBinding.createFilterParams(cross.fnd.fiori.inbox.PaginationSorterGenerator.fnCreatePaginationSorters(aSortParams));
		}
	};

	oCustomODataListBinding.prototype.loadData = function(iStartIndex, iLength, bPretend) {
		if (this.sOperationMode === OperationMode.Server && this.doNotLoadNewTasksfterAction && iStartIndex && iStartIndex > 0) {
			this.bGetContextsDataRequestedisSet = true;
			return;
		}
		if (this.sOperationMode === OperationMode.Client) {
			if (this.sFilterParams === null) {
				var aAllFilters = this.aFilters.concat(this.aApplicationFilters);

				if (aAllFilters || jQuery.isArray(aAllFilters) || !aAllFilters.length === 0) {
					this.createFilterParams(aAllFilters);
				}
			}
			ODataListBinding.prototype.loadData.apply(this, arguments);
		}
		else {
			ODataListBinding.prototype.loadData.apply(this, arguments);
		}

	};

	oCustomODataListBinding.prototype.getContexts = function(iStartIndex, iLength, iThreshold) {

		if (this.doNotLoadNewTasksfterAction && this.sOperationMode === OperationMode.Server) {
			var aGetContexts = ODataListBinding.prototype.getContexts.apply(this, arguments);
			if (this.doNotLoadNewTasksfterAction && this.bGetContextsDataRequestedisSet && aGetContexts && aGetContexts.dataRequested ) {
				this.bGetContextsDataRequestedisSet = false;
				aGetContexts.dataRequested = false;
			}
			return aGetContexts;
		}
		else {
			return ODataListBinding.prototype.getContexts.apply(this, arguments);
		}
	};


	oCustomODataListBinding.prototype.applyClientSideFilterForStatus = function(bForceUpdate, mChangedEntities) {
		var that = this,
			oContext,
			aFilters = this.aFilters.concat(this.aApplicationFilters),
			aConvertedFilters = [];

		jQuery.each(aFilters, function(i, oFilter) {
			if (typeof oFilter.convert === "function") {
				aConvertedFilters.push(oFilter.convert());
			}
			else {
				aConvertedFilters.push(oFilter);
			}
		});

		//aConvertedFilters = this.getFiltersForClientSide(aConvertedFilters);

		this.aKeys = CustomFilterProcessor.apply(this.aKeys, aConvertedFilters, function(vRef, sPath) {
			oContext = that.oModel.getContext("/" + vRef);
			return that.oModel.getProperty(sPath, oContext);
		});

		//Commented out the line below as next page is not fetched when data in list is grouped according to some criteria.
		//this.iLength = this.aKeys.length;
		//Corner case - when client filtering filters out all the items,
		//oDataListBinding goes into eternal loop reloading the full list
		if (this.aKeys.length === 0) {
			this.iLength = 0;
		}
	};

	oCustomODataListBinding.prototype.applyClientSideSort = function(bForceUpdate, mChangedEntities) {
		var that = this,
			oContext;

		this.aKeys = CustomSorterProcessor.apply(this.aKeys, this.aSorters, function(vRef, sPath) {
			oContext = that.oModel.getContext("/" + vRef);
			return that.oModel.getProperty(sPath, oContext);
		});
	};

	return oCustomODataListBinding;

}, true);