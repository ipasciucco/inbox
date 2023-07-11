/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"cross/fnd/fiori/inbox/controller/BaseController",
	"sap/ui/model/json/JSONModel"
], function(BaseController, JSONModel) {
	"use strict";

	return BaseController.extend("cross.fnd.fiori.inbox.view.DetailDeepEmpty", {
		onInit : function() {
			var oComponent = cross.fnd.fiori.inbox.util.tools.Application.getImpl().getComponent();
			var sMessageStripText = oComponent.getModel().sDetailDeepEmptyMessage;
			if (!sMessageStripText) {
				var i18nBundle = this.getResourceBundle();
				sMessageStripText = i18nBundle.getText("detailDeepEmptyView.noLongerAvailableTaskMessage")
				+ " " + i18nBundle.getText("detailDeepEmptyView.closingTabMessage");
			}
			var oModel = new JSONModel();
			oModel.setData({
				messageStripText: sMessageStripText
			});
			this.getView().setModel(oModel);
		}
	});
});
