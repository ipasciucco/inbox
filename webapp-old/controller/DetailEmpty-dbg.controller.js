/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"cross/fnd/fiori/inbox/controller/BaseController",
	"sap/ui/Device"
], function(BaseController, Device) {
	"use strict";

	return BaseController.extend("cross.fnd.fiori.inbox.controller.DetailEmpty", {
		onInit: function() {
			this.oRouter = this.getOwnerComponent().getRouter();
			this.oRouter.getRoute("myTasksDetailEmpty").attachPatternMatched(this._onDetailEmptyMatched, this);

			var oPage = this.byId("emptyPage");
			var oEmptyLabel = this.byId("emptyLabel");
			var sEmptyMessage = this.getResourceBundle().getText("emptyView.message");

			oPage.setTitle(sEmptyMessage);
			oEmptyLabel.setText(sEmptyMessage);
		},

		onExit: function() {
			this.oRouter.detachRoutePatternMatched(this._onDetailEmptyMatched, this);
		},

		handleClose: function() {
			this.getOwnerComponent().getRouter().navTo("myTasksMaster", null, this.bReplaceHistory);
		},

		/**
		 * Stores properties needed for further actions.
		 *
		 * @private
		 */
		_onDetailEmptyMatched: function() {
			this.bReplaceHistory = !Device.system.phone;
		}
	});
}, true);
