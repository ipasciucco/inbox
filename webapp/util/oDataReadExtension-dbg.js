/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
/*
 * This method overrides the read method of the oDataModel
 * and  processes any custom Sorters and custom Groupers
 * */

sap.ui.define([], function () {
	"use strict";

	cross.fnd.fiori.inbox.util.oDataReadExtension = {
		overrideRead : function(oDataModel) {

			//stores the original read method of oDataModel
			oDataModel.originalRead = oDataModel.read;

			//override odataModel's read method
			oDataModel.read = function(sPath, mParameters) {
			var bCustomProcessingNeeded = (sPath === "/TaskCollection")? true : false;


				//store the success handler
				var fnSuccess = mParameters.success;

				/*
				* fnCustomSuccess intercepts the original success handler, processes the
				* custom sorters/groupers and agains calls the original success handler
				* with the updated data
				* */
				var fnCustomSuccess = function( data, response ) {
					var aItems = data.results;
					var fnCustomGrouper = oDataModel.extFnCustomGrouper ;
					var fnCustomSorter= oDataModel.extFnCustomSorter;
					var sGroupingProperty = oDataModel.extSGroupingProperty ;

					if ( fnCustomGrouper|| fnCustomSorter ) {
						var aGroups = [];
						var i = 0;

						if (fnCustomGrouper || sGroupingProperty) {
							// Either standard or custom grouping is active.

							var oGroup;
							var sGroupingValue;

							for (i = 0; i < aItems.length; i++) {
								if (sGroupingValue !== aItems[i][sGroupingProperty]) {
									sGroupingValue = aItems[i][sGroupingProperty];
									oGroup = {
											GroupingValue: sGroupingValue,
											Elements: []
									};
									aGroups.push(oGroup);
								}

								oGroup.Elements.push(aItems[i]);
							}

							if (fnCustomGrouper) {
								aGroups.sort(fnCustomGrouper);
							}
						}
						else {
							// No grouping, put everything into one group.

							aGroups.push({
								GroupingValue: null,
								Elements: aItems
							});
						}

						if (fnCustomSorter) {
							// If custom sorting is needed, then do it for each group.

							for (i = 0; i < aGroups.length; i++) {
								aGroups[i].Elements.sort(fnCustomSorter);
							}
						}

						// Concatenate groups into a single result array.

						aItems = [];

						for (i = 0; i < aGroups.length; i++) {
							aItems = aItems.concat(aGroups[i].Elements);
						}
					}

					//update data
					data.results = aItems;
					response.data.results = aItems;
					// call the original success handler
					fnSuccess(data,response);

				};

				if (bCustomProcessingNeeded ) mParameters.success = fnCustomSuccess ;

				// call the original read method to process the request and return the abort handles
				return this.originalRead(sPath,mParameters);
			};
		}
	};

	return cross.fnd.fiori.inbox.util.oDataReadExtension;
});
