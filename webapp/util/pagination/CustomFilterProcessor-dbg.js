/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/model/FilterProcessor"
], function(FilterProcessor) {
	"use strict";

	var CustomFilterProcessor = jQuery.extend({}, FilterProcessor);

	CustomFilterProcessor._evaluateMultiFilter = function(oMultiFilter, vRef, fnGetValue) {
		var that = this,
			bMatched = false,
			aFilters = oMultiFilter.aFilters;

		if (aFilters) {
			jQuery.each(aFilters, function(i, oFilter) {
				var bLocalMatch = false;
				if (oFilter._bMultiFilter) {
					bLocalMatch = that._evaluateMultiFilter(oFilter, vRef, fnGetValue);
				}
				else if (oFilter.sPath !== undefined) {
					if (oFilter.sPath === "Status") {
						var oValue = fnGetValue(vRef, oFilter.sPath);
						oValue = that.normalizeFilterValue(oValue);
						var fnTest = that.getFilterFunction(oFilter);
						if (oValue !== undefined && fnTest(oValue)) {
							bLocalMatch = true;
						}
					}
					else {
						//skip client side filtering for all attributes other than Status
						bLocalMatch = true;
					}
				}
				if (bLocalMatch && oMultiFilter.bAnd) {
					bMatched = true;
				}
				else if (!bLocalMatch && oMultiFilter.bAnd) {
					bMatched = false;
					return false;
				}
				else if (bLocalMatch) {
					bMatched = true;
					return false;
				}
			});
		}

		return bMatched;
	};

	CustomFilterProcessor._resolveMultiFilter = function(oMultiFilter, vRef, fnGetValue) {
		var that = this,
			bMatched = false,
			aFilters = oMultiFilter.aFilters;

		if (aFilters) {
			jQuery.each(aFilters, function(i, oFilter) {
				var bLocalMatch = false;
				if (oFilter._bMultiFilter) {
					bLocalMatch = that._resolveMultiFilter(oFilter, vRef, fnGetValue);
				}
				else if (oFilter.sPath !== undefined) {
					if (oFilter.sPath === "Status") {
						var oValue = fnGetValue(vRef, oFilter.sPath);
						oValue = that.normalizeFilterValue(oValue);
						var fnTest = that.getFilterFunction(oFilter);
						if (oValue !== undefined && fnTest(oValue)) {
							bLocalMatch = true;
						}
					}
					else {
						//skip client side filtering for all attributes other than Status
						bLocalMatch = true;
					}
				}
				if (bLocalMatch && oMultiFilter.bAnd) {
					bMatched = true;
				}
				else if (!bLocalMatch && oMultiFilter.bAnd) {
					bMatched = false;
					return false;
				}
				else if (bLocalMatch) {
					bMatched = true;
					return false;
				}
			});
		}

		return bMatched;
	};

	return CustomFilterProcessor;

}, true);