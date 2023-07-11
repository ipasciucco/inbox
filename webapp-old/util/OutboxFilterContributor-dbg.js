/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/base/Object",
	"cross/fnd/fiori/inbox/util/FilterItemsCreator",
	"cross/fnd/fiori/inbox/util/Forward",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function(
	BaseObject,
	FilterItemsCreator,
	Forward,
	Filter,
	FilterOperator
) {
	"use strict";

	// Ensure cross.fnd.fiori.inbox.util.OutboxFilterContributor object structure exists
	BaseObject.extend("cross.fnd.fiori.inbox.util.OutboxFilterContributor", {});

	cross.fnd.fiori.inbox.util.OutboxFilterContributor = {
		//filter Category for completed
		_FILTER_CATEGORY_COMPLETED: "Completed",
		_FILTER_CATEGORY_COMPLETED_IN_7_DAYS: "last7days",
		_FILTER_CATEGORY_COMPLETED_IN_2_WEEKS: "last2weeks",
		_FILTER_CATEGORY_COMPLETED_IN_1_MONTH: "last1month",
		_FILTER_CATEGORY_COMPLETED_IN_3_MONTHS: "last3months",
		_FILTER_CATEGORY_COMPLETED_FILTER_BY_DATE: "ByDate",

		//filter Category for snoozed
		_FILTER_CATEGORY_SNOOZED: "ResumeIn",
		_FILTER_CATEGORY_SNOOZED_IN_7_DAYS: "last7days",
		_FILTER_CATEGORY_SNOOZED_IN_2_WEEKS: "last2weeks",
		_FILTER_CATEGORY_SNOOZED_IN_1_MONTH: "last1month",
		_FILTER_CATEGORY_SNOOZED_IN_3_MONTHS: "last3months",
		_FILTER_CATEGORY_SNOOZED_FILTER_BY_DATE: "ByDate",
		_complexFilter:null,
		_i18nBundle:null,

		/**
		 *
		 *
		 * @returns Array of filters that must be shown once filter option is selected
		 */
		getAllFilters: function(i18nBundle,complexFilter) {
			var filterItems = [];
			this._complexFilter=complexFilter;
			this._i18nBundle=i18nBundle;
			// Define filter Items for outbox
			filterItems.push(this._getCompletedFilterItems());
			filterItems.push(this._getSnoozedFilterItems());
			return filterItems;
		},

		/**
		 *
		 * @param filterkey - filter key to find filter pattern used
		 * @returns Completed Filter Item
		 */
		getCompletedFilterByKey: function(aKeyParts) {
			var FilterWithkey = null;
			if (aKeyParts[0] === this._FILTER_CATEGORY_COMPLETED) {
				var today = new Date();
				if (aKeyParts[1] === this._FILTER_CATEGORY_COMPLETED_IN_7_DAYS) {
					var sevenDaysAgo = new Date();
					sevenDaysAgo.setDate(today.getDate() - 7);
					sevenDaysAgo.setHours(0, 0, 0, 0);
					FilterWithkey = new Filter("CompletedOn", FilterOperator.GE, sevenDaysAgo);
				}
				else if (aKeyParts[1] === this._FILTER_CATEGORY_COMPLETED_IN_2_WEEKS) {
					var fourteenDaysAgo = new Date();
					fourteenDaysAgo.setDate(today.getDate() - 14);
					fourteenDaysAgo.setHours(0, 0, 0, 0);
					FilterWithkey = new Filter("CompletedOn", FilterOperator.GE, fourteenDaysAgo);
				}
				else if (aKeyParts[1] === this._FILTER_CATEGORY_COMPLETED_IN_1_MONTH) {
					var oneMonthAgo = new Date();
					oneMonthAgo.setDate(today.getDate() - 30);
					oneMonthAgo.setHours(0, 0, 0, 0);
					FilterWithkey = new Filter("CompletedOn", FilterOperator.GE, oneMonthAgo);
				}
				else if (aKeyParts[1] === this._FILTER_CATEGORY_COMPLETED_IN_3_MONTHS) {
					var threeMonthsAgo = new Date();
					threeMonthsAgo.setDate(today.getDate() - 90);
					threeMonthsAgo.setHours(0, 0, 0, 0);
					FilterWithkey = new Filter("CompletedOn", FilterOperator.GE, threeMonthsAgo);
				}
			}

			return FilterWithkey;
		},

		getResumeOnFilterByKey: function(aKeyParts) {
			var FilterWithkey = null;
			if (aKeyParts[0] === this._FILTER_CATEGORY_SNOOZED) {
				var today = new Date();
				if (aKeyParts[1] === this._FILTER_CATEGORY_SNOOZED_IN_7_DAYS) {
					var nextSevenDays = new Date();
					nextSevenDays.setDate(today.getDate() + 7);
					nextSevenDays.setHours(0, 0, 0, 0);
					FilterWithkey = new Filter("ResumeOn", FilterOperator.BT, new Date(0), nextSevenDays);

				}
				if (aKeyParts[1] === this._FILTER_CATEGORY_SNOOZED_IN_2_WEEKS) {
					var nextfifteenDays = new Date();
					nextfifteenDays.setDate(today.getDate() + 14);
					nextfifteenDays.setHours(0, 0, 0, 0);
					FilterWithkey = new Filter("ResumeOn", FilterOperator.BT, new Date(0), nextfifteenDays);

				}
				if (aKeyParts[1] === this._FILTER_CATEGORY_SNOOZED_IN_1_MONTH) {
					var nextOneMonth = new Date();
					nextOneMonth.setDate(today.getDate() + 30);
					nextOneMonth.setHours(0, 0, 0, 0);
					FilterWithkey = new Filter("ResumeOn", FilterOperator.BT, new Date(0), nextOneMonth);

				}
				if (aKeyParts[1] === this._FILTER_CATEGORY_SNOOZED_IN_3_MONTHS) {
					var nextThreeMonth = new Date();
					nextThreeMonth.setDate(today.getDate() + 90);
					nextThreeMonth.setHours(0, 0, 0, 0);
					FilterWithkey = new Filter("ResumeOn", FilterOperator.BT, new Date(0), nextThreeMonth);
				}
			}

			return FilterWithkey;
		},

		/**
		 *
		 * @returns Filter Items for Completed task
		 * @private
		 */
		_getCompletedFilterItems: function() {
			//completed filter item
			var completedFilterItem = FilterItemsCreator.createFilterCategory(this._i18nBundle.getText("filter.completed"), false);

			var COM_FILTER_KEY = this._FILTER_CATEGORY_COMPLETED + ":" + this._FILTER_CATEGORY_COMPLETED_IN_7_DAYS;
			var c7Filter = FilterItemsCreator.createFilterItem(COM_FILTER_KEY, this._i18nBundle.getText("filter.completed.completedin7Days"),this._complexFilter);
			completedFilterItem.addItem(c7Filter);

			var C2_FILTER_KEY = this._FILTER_CATEGORY_COMPLETED + ":" + this._FILTER_CATEGORY_COMPLETED_IN_2_WEEKS;
			var c2Filter = FilterItemsCreator.createFilterItem(C2_FILTER_KEY,this._i18nBundle.getText("filter.completed.completedin2Weeks"),this._complexFilter);
			completedFilterItem.addItem(c2Filter);

			var C1_FILTER_KEY = this._FILTER_CATEGORY_COMPLETED + ":" + this._FILTER_CATEGORY_COMPLETED_IN_1_MONTH;
			var c1Filter = FilterItemsCreator.createFilterItem(C1_FILTER_KEY, this._i18nBundle.getText("filter.completed.completedin1month"),this._complexFilter);
			completedFilterItem.addItem(c1Filter);

			var C3_FILTER_KEY = this._FILTER_CATEGORY_COMPLETED + ":" + this._FILTER_CATEGORY_COMPLETED_IN_3_MONTHS;
			var c3Filter = FilterItemsCreator.createFilterItem(C3_FILTER_KEY, this._i18nBundle.getText("filter.completed.completedin3month"),this._complexFilter);
			completedFilterItem.addItem(c3Filter);

			/*	var CDATE_FILTER_KEY = this._FILTER_CATEGORY_COMPLETED + ":" + this._FILTER_CATEGORY_COMPLETED_FILTER_BY_DATE;
			var cDFilter = FilterItemsCreator.createFilterItem(CDATE_FILTER_KEY,"Filter By Date Range");
			completedFilterItem.addItem(cDFilter);	*/

			return completedFilterItem;
		},

		/**
		 *
		 * @returns Filter Items for Snoozed task
		 * @private
		 */
		_getSnoozedFilterItems: function() {

			//SNOOZED filter item
			var snoozedFilterItem = FilterItemsCreator.createFilterCategory(this._i18nBundle.getText("filter.resumein"), false);

			var SON_FILTER_KEY = this._FILTER_CATEGORY_SNOOZED + ":" + this._FILTER_CATEGORY_SNOOZED_IN_7_DAYS;
			var s7Filter = FilterItemsCreator.createFilterItem(SON_FILTER_KEY, this._i18nBundle.getText("filter.resumein.resumein7days"),this._complexFilter);
			snoozedFilterItem.addItem(s7Filter);

			var S2_FILTER_KEY = this._FILTER_CATEGORY_SNOOZED + ":" + this._FILTER_CATEGORY_SNOOZED_IN_2_WEEKS;
			var S2Filter = FilterItemsCreator.createFilterItem(S2_FILTER_KEY, this._i18nBundle.getText("filter.resumein.resumein2weeks"),this._complexFilter);
			snoozedFilterItem.addItem(S2Filter);

			var S1_FILTER_KEY = this._FILTER_CATEGORY_SNOOZED + ":" + this._FILTER_CATEGORY_SNOOZED_IN_1_MONTH;
			var s1Filter = FilterItemsCreator.createFilterItem(S1_FILTER_KEY, this._i18nBundle.getText("filter.resumein.resumein1month"),this._complexFilter);
			snoozedFilterItem.addItem(s1Filter);

			var S3_FILTER_KEY = this._FILTER_CATEGORY_SNOOZED + ":" + this._FILTER_CATEGORY_SNOOZED_IN_3_MONTHS;
			var s3Filter = FilterItemsCreator.createFilterItem(S3_FILTER_KEY, this._i18nBundle.getText("filter.resumein.resumein3month"),this._complexFilter);
			snoozedFilterItem.addItem(s3Filter);

			/*var SDATE_FILTER_KEY = this._FILTER_CATEGORY_SNOOZED + ":" + this._FILTER_CATEGORY_SNOOZED_FILTER_BY_DATE;
				var sDFilter = FilterItemsCreator.createFilterItem(SDATE_FILTER_KEY,"Filter By Date Range");
				SnoozedFilterItem.addItem(sDFilter); */

			return snoozedFilterItem;
		}
	};

	return cross.fnd.fiori.inbox.util.OutboxFilterContributor;
});