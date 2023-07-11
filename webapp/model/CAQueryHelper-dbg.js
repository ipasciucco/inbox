/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/model/Sorter",
	"sap/ui/model/FilterProcessor",
	"sap/base/Log"
] , function (Sorter, FilterProcessor, Log) {
	"use strict";

	return {

		/**
		 * Create URL parameters for sorting with custom attributes
		 *
		 * @param {array} aSorters an array of sap.ui.model.Sorter
		 *
		 * @return {string} the URL sorter parameters
		 */
		createSortParams: function(aSorters) {
			var sSortParam = "";

			for (var i = 0; i < aSorters.length; i++) {
				var oSorter = aSorters[i];
				if (oSorter instanceof Sorter) {
					sSortParam += oSorter.sPath;
					sSortParam += oSorter.bDescending ? " desc" : " asc";
					sSortParam += ",";
				}
				else {
					Log.error("Trying to use " + oSorter + " as a Sorter, but it is a " + typeof oSorter);
				}
			}
			//remove trailing comma
			sSortParam = sSortParam.slice(0, -1);
			return sSortParam;
		},

		/**
		 * Creates URL parameters strings for filtering with custom attributes,
		 * which will be used as URL query parameters for filtering.
		 * In case an array of filters is passed, they will be grouped in a way that filters on the
		 * same path are ORed and filters on different paths are ANDed with each other
		 *
		 * @param {sap.ui.model.Filter|sap.ui.model.Filter[]} vFilter the root filter or filter array
		 *
		 * @return {string} the URL filter parameters
		 */
		createFilterParams: function(vFilter) {
			var that = this,
				oFilter = Array.isArray(vFilter) ? FilterProcessor.groupFilters(vFilter) : vFilter;

			function create(oFilter, bOmitBrackets) {
				if (oFilter.aFilters) {
					return createMulti(oFilter, bOmitBrackets);
				}
				return that._createFilterSegment(oFilter.sPath, oFilter.sOperator, oFilter.oValue1, oFilter.oValue2);
			}

			function createMulti(oMultiFilter, bOmitBrackets) {
				var aFilters = oMultiFilter.aFilters,
					bAnd = !!oMultiFilter.bAnd,
					sFilter = "";

				if (aFilters.length === 0) {
					return bAnd ? "true" : "false";
				}

				if (aFilters.length === 1) {
					if (aFilters[0]._bMultiFilter) {
						return create(aFilters[0]);
					}
					return create(aFilters[0], true);
				}

				if (!bOmitBrackets) {
					sFilter += "(";
				}
				sFilter += create(aFilters[0]);
				for (var i = 1; i < aFilters.length; i++) {
					sFilter += bAnd ? " and " : " or ";
					sFilter += create(aFilters[i]);
				}
				if (!bOmitBrackets) {
					sFilter += ")";
				}
				return sFilter;
			}

			return create(oFilter, true);
		},

		/**
		 * Create a single filter segment of the OData filter parameters
		 *
		 * @param {string} sPath the path
		 * @param {string} sOperator the operator
		 * @param {object} oValue1 the first value for operator
		 * @param {object} oValue2 the second value for operator
		 *
		 * @return {string} the URL filter parameters
		 *
		 * @private
		 */
		_createFilterSegment: function(sPath, sOperator, oValue1, oValue2) {
			// when single quote already is a part of the value, do not add surrounding quotes
			// for example dates: datetime'2021-03-09T22:00:00'
			if (oValue1 && (oValue1.indexOf("'") === -1)) {
				oValue1 = "'" + String(oValue1) + "'";
			}
			if (oValue2 && (oValue2.indexOf("'") === -1)) {
				oValue2 = "'" + String(oValue2) + "'";
			}

			switch (sOperator) {
				case "EQ":
				case "NE":
				case "GT":
				case "GE":
				case "LT":
				case "LE":
					return sPath + " " + sOperator.toLowerCase() + " " + oValue1;
				case "BT":
					return "(" + sPath + " ge " + oValue1 + " and " + sPath + " le " + oValue2 + ")";
				case "NB":
					return "not (" + sPath + " ge " + oValue1 + " and " + sPath + " le " + oValue2 + ")";
				case "Contains":
					return "substringof(" + oValue1 + "," + sPath + ")";
				case "NotContains":
					return "not substringof(" + oValue1 + "," + sPath + ")";
				case "StartsWith":
					return "startswith(" + sPath + "," + oValue1 + ")";
				case "NotStartsWith":
					return "not startswith(" + sPath + "," + oValue1 + ")";
				case "EndsWith":
					return "endswith(" + sPath + "," + oValue1 + ")";
				case "NotEndsWith":
					return "not endswith(" + sPath + "," + oValue1 + ")";
				default:
					Log.error("ODataUtils :: Unknown filter operator " + sOperator);
					return "true";
			}
		}
	};
}
);
