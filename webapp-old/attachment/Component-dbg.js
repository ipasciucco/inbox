/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/core/mvc/View"
], function(
	UIComponent,
	View
) {
	"use strict";

	return UIComponent.extend("cross.fnd.fiori.inbox.attachment.Component", {
		metadata : {
			properties : {
				attachmentHandle : "any"
			},
			publicMethods: [ "uploadURL" ],
			rootView: "cross.fnd.fiori.inbox.attachment.view.Attachments",

		},

		init : function() {
			sap.ui.core.UIComponent.prototype.init.apply(this, arguments);
		},

		uploadURL: function(sUploadUrl) {
			var oUploadCollectionControl = this.view.byId("uploadCollection");
			oUploadCollectionControl.setUploadUrl(sUploadUrl);
		},

		exit : function() {},

		createContent : function() {
			var oViewData = {component: this};

			this.view = sap.ui.view({
				type : sap.ui.core.mvc.ViewType.XML,
				viewName : "cross.fnd.fiori.inbox.attachment.view.Attachments",
				viewData : oViewData
			});

			return this.view;
		}
	});
});
