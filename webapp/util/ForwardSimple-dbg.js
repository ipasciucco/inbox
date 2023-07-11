/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/mvc/XMLView",
	"sap/base/Log"
], function (
		BaseObject,
		JSONModel,
		XMLView,
		BaseLog
) {
		"use strict";
		// Ensure cross.fnd.fiori.inbox.util.ForwardSimple object structure exists
		BaseObject.extend("cross.fnd.fiori.inbox.util.ForwardSimple", {});

		cross.fnd.fiori.inbox.util.ForwardSimple = (function() {
			return {
				_oForwardSimpleViewPromise: null,

				open: function(fnCloseDlg, iNumberOfItems) {
					this._oForwardSimpleViewPromise = this._oForwardSimpleViewPromise === null ?
										   this._createForwardSimpleViewPromise() :
										   this._oForwardSimpleViewPromise;

					this._oForwardSimpleViewPromise.then(function(oForwardSimpleView) {
						var oModel = new JSONModel({ closeDlg: fnCloseDlg, numberOfItems: iNumberOfItems});
						var oDialog = oForwardSimpleView.byId("DLG_FORWARD_SIMPLE");
						oDialog.setModel(oModel);

						oDialog.open();
					});
				},

				_createForwardSimpleViewPromise: function() {
					return XMLView.create({
						id: "MIB_VIEW_FORWARD_SIMPLE",
						viewName: "cross.fnd.fiori.inbox.view.ForwardSimple"
					})
					.catch(function() {
						BaseLog.error("Forward Simple dialog was not created successfully");
					});
				}
			};
		}());

		return cross.fnd.fiori.inbox.util.ForwardSimple;
});
