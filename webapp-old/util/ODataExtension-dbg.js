/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/model/odata/v2/ODataModel",
	"cross/fnd/fiori/inbox/util/pagination/ODataListBindingExtension"
], function(UI5Object, ODataModel, ODataListBindingExtension) {
	"use strict";

	return UI5Object.extend("cross.fnd.fiori.inbox.ODataExtension", {

		overrideBindList : function(oDataModel) {
			if (oDataModel) {
				oDataModel.bindList = function(sPath, oContext, aSorters, aFilters, mParameters) {
					var oBinding = new ODataListBindingExtension(this, sPath, oContext, aSorters, aFilters, mParameters);
					return oBinding;
				};
			}
			return this;
		},

		overrideProcessSuccess : function(oDataModel) {
			if (oDataModel) {
				oDataModel._processSuccess = function(oRequest, oResponse, fnSuccess, mGetEntities, mChangeEntities, mEntityTypes) {
					var sUrl, sUrlPath;
					sUrl = oRequest.requestUri;
					sUrlPath = sUrl.replace(this.sServiceUrl,"");
					//in batch requests all paths are relative
					if (!sUrlPath.startsWith("/")) {
						sUrlPath = "/" + sUrlPath;
					}
					sUrlPath = this._normalizePath(sUrlPath);
					if ("/Forward" === sUrlPath && oResponse.data) {
						oResponse.data.Status = "Forwarded";
					}
					ODataModel.prototype._processSuccess.apply(this, arguments);

					// Workaround for master task list refresh in old versions of UI5 (below or equal to 1.40) where $expand properties
					// are not fully implemented and cause change events when added to the main TaskCollection objects:
					var ui5Version = parseFloat(sap.ui.version);
					if (!isNaN(ui5Version) && ui5Version <= 1.40 && sUrl.indexOf("TaskCollection") > -1 && sUrl.indexOf("$expand") > -1) {
						try {
							var aExpUrl = decodeURIComponent(sUrl.substring(sUrl.indexOf("$expand"))).split("&");
							var aExpandParams = aExpUrl[0].substring(aExpUrl[0].indexOf("=") + 1).split(",");
							var masterController = cross.fnd.fiori.inbox.util.tools.Application.getImpl().oCurController.MasterCtrl; //The S2 controller
							var masterListBinding = masterController._oMasterListBinding; //The S2 list binding
							var aContexts = masterListBinding._getContexts(masterListBinding.iLastStartIndex, masterListBinding.iLastLength, masterListBinding.iLastThreshold);

							for (var i = 0; i < aContexts.length; i++) {
								if (aContexts[i].sPath === sUrlPath) {
									if (JSON.stringify(aContexts[i].getObject()) !== masterListBinding.aLastContextData[i]) {
										var oCurrentObjClone = jQuery.extend(true, {}, aContexts[i].getObject());
										for (var j = 0; j < aExpandParams.length; j++) {
											delete oCurrentObjClone[aExpandParams[j]]; //Delete the $expand properties from the clone
										}
										// If the difference between the new and the old task objects is ONLY in the expanded properties
										// then we replace the old object with the new one so that no change events are fired.
										// If any other task property changes a change event will be fired as expected:
										if (JSON.stringify(oCurrentObjClone) === masterListBinding.aLastContextData[i]) {
											masterListBinding.aLastContextData[i] = JSON.stringify(aContexts[i].getObject());
										}
									}
									break;
								}
							}
						}
						catch (oException) {
							// Not critical if it breaks.
						}
					}
				};
			}
			return this;
		},

		overrideImportData : function(oDataModel) {
			if (oDataModel) {
				oDataModel._doNotoverwriteNullPropertyValue = true;
				oDataModel._importData = function(oData, mChangedEntities) {
					var that = this,
					aList, sKey, oResult, oEntry;
					if (oData.results) {
						aList = [];
						jQuery.each(oData.results, function(i, entry) {
							var sKey = that._importData(entry, mChangedEntities);
							if (sKey) {
								aList.push(sKey);
							}
						});
						return aList;
					}
					else {
						sKey = this._getKey(oData);
						if (!sKey) {
							return sKey;
						}
						oEntry = this.oData[sKey];
						if (!oEntry) {
							oEntry = oData;
							this.oData[sKey] = oEntry;
						}
						jQuery.each(oData, function(sName, oProperty) {
							if (oProperty && (oProperty.__metadata && oProperty.__metadata.uri || oProperty.results) && !oProperty.__deferred) {
								oResult = that._importData(oProperty, mChangedEntities);
								if (Array.isArray(oResult)) {
									oEntry[sName] = { __list: oResult };
								}
								else {
									oEntry[sName] = { __ref: oResult };
								}
							}
							else if (!oProperty || !oProperty.__deferred) { //do not store deferred navprops
								if (that._doNotoverwriteNullPropertyValue) {
									if (oProperty != null) { // eslint-disable-line eqeqeq
										// This will cause the Overdue indicator to refresh:
										if (sName === "CompletionDeadLine" && !oEntry.IsOverdue) {
											if (oProperty - (new Date()) < 0) {
												oEntry.IsOverdue = true;
											}
										}
										oEntry[sName] = oProperty;
									}
								}
								else {
									oEntry[sName] = oProperty;
								}
							}
						});
						mChangedEntities[sKey] = true;
						return sKey;
					}
				};
			}
			return this;
		}
	});
});