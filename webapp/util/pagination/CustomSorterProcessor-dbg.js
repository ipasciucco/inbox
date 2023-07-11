/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/model/SorterProcessor"
], function (SorterProcessor) {
	"use strict";

	var CustomSorterProcessor = jQuery.extend({}, SorterProcessor);

	// over riding the following function to skip applying sorting on "CompletionDeadLine"
	CustomSorterProcessor.apply = function(aData, aSorters, fnGetValue, fnGetKey) {

		// remove sorter if the path is CompletionDeadLine
		aSorters = aSorters.filter(function(oSorterObject) {
		    return !(oSorterObject.sPath === "CompletionDeadLine");
		});

		var that = this,
			aSortValues = [],
			aCompareFunctions = [],
			oValue,
			oSorter;

		if (!aSorters || aSorters.length === 0) {
			return aData;
		}

		function fnCompare(a, b) {
			if (a == b) {
				return 0;
			}
			if (b == null) {
				return -1;
			}
			if (a == null) {
				return 1;
			}
			if (typeof a === "string" && typeof b === "string") {
				return a.localeCompare(b);
			}
			if (a < b) {
				return -1;
			}
			if (a > b) {
				return 1;
			}
			return 0;
		}

		for (var j = 0; j < aSorters.length; j++) {
			oSorter = aSorters[j];
			aCompareFunctions[j] = oSorter.fnCompare;

			if (!aCompareFunctions[j]) {
				aCompareFunctions[j] = fnCompare;
			}
			/*eslint-disable no-loop-func */
			jQuery.each(aData, function(i, vRef) {
				oValue = fnGetValue(vRef, oSorter.sPath);
				if (typeof oValue === "string") {
					oValue = oValue.toLocaleUpperCase();
				}
				if (!aSortValues[j]) {
					aSortValues[j] = [];
				}

				// When the data array might contain objects, e.g. in the ClientTreeBinding
				if (fnGetKey) {
					vRef = fnGetKey(vRef);
				}

				aSortValues[j][vRef] = oValue;
			});
			/*eslint-enable no-loop-func */
		}

		aData.sort(function(a, b) {
			if (fnGetKey) {
				a = fnGetKey(a);
				b = fnGetKey(b);
			}

			var valueA = aSortValues[0][a],
				valueB = aSortValues[0][b];

			return that._applySortCompare(aSorters, a, b, valueA, valueB, aSortValues, aCompareFunctions, 0);
		});

		return aData;
	};

	return CustomSorterProcessor;

}, true);