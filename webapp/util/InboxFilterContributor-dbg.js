/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/base/Object",
	"cross/fnd/fiori/inbox/util/FilterItemsCreator",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (
	UI5Object,
	FilterItemsCreator,
	Filter,
	FilterOperator
) {
	"use strict";

	UI5Object.extend("ross.fnd.fiori.inbox.util.InboxFilterContributor", {});

	cross.fnd.fiori.inbox.util.InboxFilterContributor = {
		//Filter constants
		_FILTER_CATEGORY_PRIORITY: "Priority",
		_FILTER_PRIORITY_VERY_HIGH: "VERY_HIGH",
		_FILTER_PRIORITY_HIGH: "HIGH",
		_FILTER_PRIORITY_MEDIUM: "MEDIUM",
		_FILTER_PRIORITY_LOW: "LOW",

		_FILTER_CATEGORY_COMPLETION_DEADLINE: "CompletionDeadLine",
		_FILTER_EXPIRY_DATE_OVERDUE: "Overdue",
		_FILTER_EXPIRY_DATE_DUE_IN_7_DAYS: "DueIn7days",
		_FILTER_EXPIRY_DATE_DUE_IN_30_DAYS: "DueIn30days",
		_FILTER_EXPIRY_DATE_ALL: "All",
		_FILTER_CATEGORY_STATUS: "Status",
		_FILTER_STATUS_NEW: "READY",
		//_FILTER_STATUS_IN_PROGRESS: "IN_PROGRESS:RESERVED",
		_FILTER_STATUS_IN_PROGRESS: "IN_PROGRESS",
		_FILTER_STATUS_COMPLETED: "COMPLETED",
		_FILTER_STATUS_AWAITING_CONFIRMATION: "EXECUTED",
		_FILTER_STATUS_RESERVED: "RESERVED",
		_FILTER_STATUS_NOT_RESERVED: "READY:IN_PROGRESS:EXECUTED",

		_FILTER_CATEGORY_CREATION_DATE: "CreatedOn",
		_FILTER_CREATION_DATE_TODAY: "Today",
		_FILTER_CREATION_DATE_LAST_7_DAYS: "Last7Days",
		_FILTER_CREATION_DATE_LAST_30_DAYS: "Last30Days",
		_FILTER_CREATION_DATE_ALL: "All",

		/**
		 *
		 * @param i18nBundle - For text Retrieval
		 * @returns Array of filters that must be shown once filter option is selected
		 */
		_complexFilter:null,
		_i18nBundle:null,

		getAllFilters: function(i18nBundle,complexFilter) {
			var filterItems = [];
			this._complexFilter=complexFilter;
			this._i18nBundle=i18nBundle;
			// Define filter Items for inbox
			filterItems.push(this._getPriorityFilterItems());
			filterItems.push(this._getDueDateFilterItems());
			filterItems.push(this._getStatusFilterItems());
			filterItems.push(this._getCreationDateFilterItems());
			return filterItems;
		},

		/**
		 *
		 * @param filterkey - filter key to find filter pattern used
		 * @returns priority Filter Item
		 */
		getFilterForPriorityBykey: function(filterkey) {
			var oPriorityFilters = null;
			if (filterkey[0] === this._FILTER_CATEGORY_PRIORITY && filterkey[1] && filterkey[1] !== "undefined") {
				 oPriorityFilters = new Filter(filterkey[0], FilterOperator.EQ, filterkey[1]);
				}
			return oPriorityFilters;
		},
		/**
		 *
		 * @param filterkey - filter key to find filter pattern used
		 * @returns DueDate Filter Item
		 */
		getFilterForDueDateByKey: function(filterkeys) {
			var oDueDateFilter = null;
			var filterkey = filterkeys[0];
			if (filterkey === this._FILTER_CATEGORY_COMPLETION_DEADLINE) {
				if (filterkeys[1] === this._FILTER_EXPIRY_DATE_ALL) {
					return null;
				}
				var today = new Date();
				if (filterkeys[1] === this._FILTER_EXPIRY_DATE_OVERDUE) {
					var todayStart = new Date();
					oDueDateFilter = new Filter(filterkey, FilterOperator.BT, new Date(0), todayStart);
				}
				else if (filterkeys[1] === this._FILTER_EXPIRY_DATE_DUE_IN_7_DAYS) {
					var sevenDaysAhead = new Date();
					sevenDaysAhead.setDate(today.getDate() + 8);
					oDueDateFilter = new Filter(filterkey, FilterOperator.BT, new Date(0), sevenDaysAhead);
				}
				else if (filterkeys[1] === this._FILTER_EXPIRY_DATE_DUE_IN_30_DAYS) {
					var thirtyDaysAhead = new Date();
					thirtyDaysAhead.setDate(today.getDate() + 31);
					oDueDateFilter = new Filter(filterkey, FilterOperator.BT, new Date(0), thirtyDaysAhead);
				}
				return oDueDateFilter;
			}

		},
		/**
		 *
		 * @param filterkey - filter key to find filter pattern used
		 * @returns Status Filter Item
		 */

		getFilterForStatusByKey: function(filterkeys) {
			if (filterkeys[0] === this._FILTER_CATEGORY_STATUS && filterkeys[1] && filterkeys[1] !== "undefined") {
				return filterkeys[1];
			}
			return null;
		},

		/**
		 *
		 * @param filterkey - filter key to find filter pattern used
		 * @returns CreationDate Filter Item
		 */

		getFilterForCreationDateByKey: function(aKeyParts) {
			var oCreationDateFilter = null;
			if (aKeyParts[0] === this._FILTER_CATEGORY_CREATION_DATE) {
				if (aKeyParts[1] === this._FILTER_CREATION_DATE_ALL) {
					return null;
				}
				var today = new Date();
				if (aKeyParts[1] === this._FILTER_CREATION_DATE_TODAY) {
					var todayStart = new Date();
					todayStart.setHours(0, 0, 0, 0);
					oCreationDateFilter = new Filter(aKeyParts[0], FilterOperator.GE, todayStart);

				}
				else if (aKeyParts[1] === this._FILTER_CREATION_DATE_LAST_7_DAYS) {
					var sevenDaysAgo = new Date();
					sevenDaysAgo.setDate(today.getDate() - 7);
					sevenDaysAgo.setHours(0, 0, 0, 0);
					oCreationDateFilter = new Filter(aKeyParts[0], FilterOperator.GE, sevenDaysAgo);

				}
				else if (aKeyParts[1] === this._FILTER_CREATION_DATE_LAST_30_DAYS) {
					var thirtyDaysAgo = new Date();
					thirtyDaysAgo.setDate(today.getDate() - 30);
					thirtyDaysAgo.setHours(0, 0, 0, 0);
					oCreationDateFilter = new Filter(aKeyParts[0], FilterOperator.GE, thirtyDaysAgo);
				}
			}

			return oCreationDateFilter;
		},

		/**
		*	Priority Filter Items.
			 @returns Filter Items for Priority
			 @private
		*/

		_getPriorityFilterItems: function() {
			//Priority filter item
			var priorityFilterItem = FilterItemsCreator.createFilterCategory(this._i18nBundle.getText("filter.priority"));

			var VH_FILTER_KEY = this._FILTER_CATEGORY_PRIORITY + ":" + this._FILTER_PRIORITY_VERY_HIGH;
			var vhFilter = FilterItemsCreator.createFilterItem(VH_FILTER_KEY, this._i18nBundle.getText(
				"view.Workflow.priorityVeryHigh"),this._complexFilter);
			priorityFilterItem.addItem(vhFilter);

			var H_FILTER_KEY = this._FILTER_CATEGORY_PRIORITY + ":" + this._FILTER_PRIORITY_HIGH;
			var hFilter = FilterItemsCreator.createFilterItem(H_FILTER_KEY, this._i18nBundle.getText(
				"view.Workflow.priorityHigh"),this._complexFilter);
			priorityFilterItem.addItem(hFilter);

			var M_FILTER_KEY = this._FILTER_CATEGORY_PRIORITY + ":" + this._FILTER_PRIORITY_MEDIUM;
			var mFilter = FilterItemsCreator.createFilterItem(M_FILTER_KEY, this._i18nBundle.getText(
				"view.Workflow.priorityMedium"),this._complexFilter);
			priorityFilterItem.addItem(mFilter);

			var L_FILTER_KEY = this._FILTER_CATEGORY_PRIORITY + ":" + this._FILTER_PRIORITY_LOW;
			var lFilter = FilterItemsCreator.createFilterItem(L_FILTER_KEY, this._i18nBundle.getText("view.Workflow.priorityLow"),this._complexFilter);
			priorityFilterItem.addItem(lFilter);

			return priorityFilterItem;
		},

		/**
		 *
		 * @returns Filter Items for Due Date
		 * @private
		 */
		_getDueDateFilterItems: function() {

			var dueDateFilterItem = FilterItemsCreator.createFilterCategory(this._i18nBundle.getText("filter.dueDate"), false);

			var OD_FILTER_KEY = this._FILTER_CATEGORY_COMPLETION_DEADLINE + ":" + this._FILTER_EXPIRY_DATE_OVERDUE;
			var odFilter = FilterItemsCreator.createFilterItem(OD_FILTER_KEY, this._i18nBundle.getText("filter.dueDate.overdue"),this._complexFilter);
			dueDateFilterItem.addItem(odFilter);

			var D7_FILTER_KEY = this._FILTER_CATEGORY_COMPLETION_DEADLINE + ":" + this._FILTER_EXPIRY_DATE_DUE_IN_7_DAYS;
			var d7Filter = FilterItemsCreator.createFilterItem(D7_FILTER_KEY, this._i18nBundle.getText(
				"filter.dueDate.dueWithin7Days"),this._complexFilter);
			dueDateFilterItem.addItem(d7Filter);

			var D30_FILTER_KEY = this._FILTER_CATEGORY_COMPLETION_DEADLINE + ":" + this._FILTER_EXPIRY_DATE_DUE_IN_30_DAYS;
			var d30Filter = FilterItemsCreator.createFilterItem(D30_FILTER_KEY, this._i18nBundle.getText(
				"filter.dueDate.dueWithin30Days"),this._complexFilter);
			dueDateFilterItem.addItem(d30Filter);

			var DA_FILTER_KEY = this._FILTER_CATEGORY_COMPLETION_DEADLINE + ":" + this._FILTER_EXPIRY_DATE_ALL;
			var daFilter = FilterItemsCreator.createFilterItem(DA_FILTER_KEY, this._i18nBundle.getText("filter.dueDate.all"),this._complexFilter);
			dueDateFilterItem.addItem(daFilter);

			return dueDateFilterItem;

		},
		/**
		 *
		 * @returns Filter Items for status
		 * @private
		 */
		_getStatusFilterItems: function() {
			var statusFilterItem = FilterItemsCreator.createFilterCategory(this._i18nBundle.getText("filter.status"));

			var SN_FILTER_KEY = this._FILTER_CATEGORY_STATUS + ":" + this._FILTER_STATUS_NEW;
			var snFilter = FilterItemsCreator.createFilterItem(SN_FILTER_KEY, this._i18nBundle.getText("filter.status.new"),this._complexFilter);
			statusFilterItem.addItem(snFilter);

			var SIP_FILTER_KEY = this._FILTER_CATEGORY_STATUS + ":" + this._FILTER_STATUS_IN_PROGRESS;
			var sipFilter = FilterItemsCreator.createFilterItem(SIP_FILTER_KEY, this._i18nBundle.getText(
				"filter.status.inProgress"),this._complexFilter);
			statusFilterItem.addItem(sipFilter);

			var SAC_FILTER_KEY = this._FILTER_CATEGORY_STATUS + ":" + this._FILTER_STATUS_AWAITING_CONFIRMATION;
			var sacFilter = FilterItemsCreator.createFilterItem(SAC_FILTER_KEY, this._i18nBundle.getText(
				"filter.status.awaitingConfirmation"),this._complexFilter);
			statusFilterItem.addItem(sacFilter);

			var SR_FILTER_KEY = this._FILTER_CATEGORY_STATUS + ":" + this._FILTER_STATUS_RESERVED;
			var srFilter = FilterItemsCreator.createFilterItem(SR_FILTER_KEY, this._i18nBundle.getText("filter.status.reserved"),this._complexFilter);
			statusFilterItem.addItem(srFilter);

			return statusFilterItem;
		},

		/**
		 *
		 * @returns Filter Items for CreationDate
		 * @private
		 */
		_getCreationDateFilterItems: function() {
			//Creation date filter item
			var creationDateFilterItem = FilterItemsCreator.createFilterCategory(this._i18nBundle.getText("filter.creationDate"),
				false);

			var CDT_FILTER_KEY = this._FILTER_CATEGORY_CREATION_DATE + ":" + this._FILTER_CREATION_DATE_TODAY;
			var cdtFilter = FilterItemsCreator.createFilterItem(CDT_FILTER_KEY, this._i18nBundle.getText(
				"filter.creationDate.today"),this._complexFilter);
			creationDateFilterItem.addItem(cdtFilter);

			var CD7_FILTER_KEY = this._FILTER_CATEGORY_CREATION_DATE + ":" + this._FILTER_CREATION_DATE_LAST_7_DAYS;
			var cd7Filter = FilterItemsCreator.createFilterItem(CD7_FILTER_KEY, this._i18nBundle.getText(
				"filter.creationDate.last7Days"),this._complexFilter);
			creationDateFilterItem.addItem(cd7Filter);

			var CD30_FILTER_KEY = this._FILTER_CATEGORY_CREATION_DATE + ":" + this._FILTER_CREATION_DATE_LAST_30_DAYS;
			var cd30Filter = FilterItemsCreator.createFilterItem(CD30_FILTER_KEY, this._i18nBundle.getText(
				"filter.creationDate.last30Days"),this._complexFilter);
			creationDateFilterItem.addItem(cd30Filter);

			var CDA_FILTER_KEY = this._FILTER_CATEGORY_CREATION_DATE + ":" + this._FILTER_CREATION_DATE_ALL;
			var cdaFilter = FilterItemsCreator.createFilterItem(CDA_FILTER_KEY, this._i18nBundle.getText(
				"filter.creationDate.all"),this._complexFilter);
			creationDateFilterItem.addItem(cdaFilter);
			return creationDateFilterItem;

		}

	};

	return cross.fnd.fiori.inbox.util.InboxFilterContributor;
});
