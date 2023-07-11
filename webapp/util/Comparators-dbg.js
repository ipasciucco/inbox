/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/base/Object"
], function (UI5Object) {
	"use strict";
	// Module to contain all data comparators
	return {

		/**
		 * Compares two PriorityNumber values. Changing this function also require changing "model/formatter/formatPriorityForGrouping()"
		 *
		 * This is the comparator function used for client side sorting and grouping by PriorityNumber.
		 * In ascending order, first are sort valid values for PriorityNumber followed by null and undefined values (presumably when no priority is set to the task)
		 * Using comparator results in Displaying order from "Very High" first to "Low" and "No Priority" last.
		 * The comparator method returns -1, 0 or 1, depending on the order of the two items.
    	 *
		 * Valid values for PriorityNumber are any JavaScript Number or a String that can be casted to a Number

		 * @param {number} a the first value to compare
		 * @param {number} b the second value to compare
		 * @returns {int} -1, 0 or 1 depending on the compare result
		 * @public
		 */
		fnPriorityComparator: function (a, b) {
			if (a == b) { // eslint-disable-line eqeqeq
				return 0;
			}
			if (b == null || isNaN(b)) { // eslint-disable-line eqeqeq
				return -1;
			}
			if (a == null || isNaN(a)) { // eslint-disable-line eqeqeq
				return 1;
			}
			if (a < b) {
				return -1;
			}
			if (a > b) {
				return 1;
			}
			return 0;
		},

		/**
		 * Compare two name values alphabetically (case insensitive)
		 * i.e: "b" comes after "A" and not after "Z"
		 * @param {string} a - the first value to compare
		 * @param {string} b - the second value to compare
		 * @returns {int} -1, 0 or 1 depending on the compare result
		 */

		fnNameComparator: function (a, b) {
				if (a.TaskDefinitionName.toUpperCase() < b.TaskDefinitionName.toUpperCase()) {
					return -1;
				}
				if (a.TaskDefinitionName.toUpperCase() > b.TaskDefinitionName.toUpperCase()) {
					return 1;
				}
				return 0;
		},

        /**
		 * Function is used to compare two buttons for display order pirority.
		 * High number means that button goes to the end of the list
		 * Low number means it goes to the front of the list
		 *
		 * @param {number} a the first value to compare
		 * @param {number} b the second value to compare
		 * @returns {int} negative (<0), 0 or positive (>0) depending on the compare result
		 * @public
		 */
		fnResponseOptionsComparator: function(a, b) {
			if (isNaN(a.iDisplayOrderPriority)) {
				a.iDisplayOrderPriority = 3500;
			}
			if (isNaN(b.iDisplayOrderPriority)) {
				b.iDisplayOrderPriority = 3500;
			}
			return a.iDisplayOrderPriority - b.iDisplayOrderPriority;
		}
	};
});