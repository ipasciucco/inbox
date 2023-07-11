/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/core/mvc/XMLView",
	"sap/ui/model/json/JSONModel",
	"sap/base/Log"
], function (
	BaseObject,
	XMLView,
	JSONModel,
	BaseLog
) {
	"use strict";
	// Ensure cross.fnd.fiori.inbox.util.Forward object structure exists
	BaseObject.extend("cross.fnd.fiori.inbox.util.Forward", {});

	cross.fnd.fiori.inbox.util.Forward = (function() {
		return {
			_oForwardViewPromise: null,

			open: function(fnStartSearch, fnCloseDlg, iNumberOfItems) {
				this._oForwardViewPromise = this._oForwardViewPromise === null ?
										   this._createForwardViewPromise() :
										   this._oForwardViewPromise;

				this._oForwardViewPromise.then(function(oForwardXmlView) {
					var oModel = new JSONModel({startSearch: fnStartSearch,
						closeDlg: fnCloseDlg,
						numberOfItems: iNumberOfItems});
					var oDialog = oForwardXmlView.byId("DLG_FORWARD");
					oDialog.setModel(oModel);
					oForwardXmlView.byId("LST_AGENTS").removeSelections(true);

					oDialog.open();
				});
			},

			setAgents: function(aAgents) {
				this._oForwardViewPromise.then(function(oForwardXmlView) {
					var oDialog = oForwardXmlView.byId("DLG_FORWARD");
					oDialog.getModel().setProperty("/agents", aAgents);
					oDialog.getModel().setProperty("/isPreloadedAgents", aAgents.length > 0);

					oDialog.rerender();
				});
			},

			setOrigin: function(sOrigin) {
				this._oForwardViewPromise.then(function(oForwardXmlView) {
					var oDialog = oForwardXmlView.byId("DLG_FORWARD");
					oDialog.getModel().setProperty("/origin", sOrigin);
				});
			},

			_createForwardViewPromise: function() {
				return XMLView.create({
					id: "MIB_VIEW_FORWARD",
					viewName: "cross.fnd.fiori.inbox.view.Forward"
				})
				.catch(function() {
					BaseLog.error("Forward dialog was not created successfully");
				});
			}
		};
	}());

	return cross.fnd.fiori.inbox.util.Forward;
});
