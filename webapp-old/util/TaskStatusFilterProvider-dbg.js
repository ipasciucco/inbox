/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function(
	BaseObject,
	Filter,
	FilterOperator
) {
	"use strict";

	// Ensure cross.fnd.fiori.inbox.util.TaskStatusFilterProvider object structure exists
	BaseObject.extend("cross.fnd.fiori.inbox.util.TaskStatusFilterProvider", {});

	cross.fnd.fiori.inbox.util.TaskStatusFilterProvider = {
		/**
		 *
		 * @param outbox - flag , true in case outbox is enabled
		 * @param aStatusFilterKeys
		 * @returns Array of task Status Filter which will be used in ODATA  call
		 */
		getAllFilters: function(outbox, aStatusFilterKeys,aFilters) {
			if (!aStatusFilterKeys) {
				aStatusFilterKeys = [];
			}

			aStatusFilterKeys = aStatusFilterKeys.slice(0);
			if (aStatusFilterKeys.length === 0) {
				if (outbox) {
					if (aFilters!==null && aFilters!==undefined && aFilters[0]!==undefined) {
						for (var i=0;i<aFilters.length;i++) {
							if (aFilters[i].sPath==="CompletedOn") {
								aStatusFilterKeys.push("COMPLETED");
							}
							if (aFilters[i].sPath==="ResumeOn") {
								aStatusFilterKeys.push("FOR_RESUBMISSION");
							}
						}
					}
					if (aStatusFilterKeys.length===0) {
						aStatusFilterKeys.push("FOR_RESUBMISSION");
						aStatusFilterKeys.push("COMPLETED");
					}
				}
				else {
					// Default status filter.
					aStatusFilterKeys.push("READY");
					aStatusFilterKeys.push("RESERVED");
					aStatusFilterKeys.push("IN_PROGRESS");
					aStatusFilterKeys.push("EXECUTED");

				}
			}
			var aStatusFilters = [];

			for (var j = 0; j < aStatusFilterKeys.length; j++) {
				var oStatusFilter = new Filter({
					path: "Status",
					operator: FilterOperator.EQ,
					value1: aStatusFilterKeys[j]
				});
				aStatusFilters.push(oStatusFilter);
			}

			if (aStatusFilters.length > 0) {
				return aStatusFilters;
			}
		}
	};

	return cross.fnd.fiori.inbox.util.TaskStatusFilterProvider;
});