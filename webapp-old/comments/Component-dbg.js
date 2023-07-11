/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
		"sap/ui/core/UIComponent",
		"sap/ui/core/mvc/View",
		"cross/fnd/fiori/inbox/comments/util/Formatters"
], function (UIComponent, View, Formatters) {
	"use strict";

	return UIComponent.extend("cross.fnd.fiori.inbox.comments.Component", {

		metadata : {
			properties : {
				mainView : {name:"mainView", type:"sap.ui.view"}, // contains the comments view reference
			},
			publicMethods: ["fnShowLoaderForComments", "fnSetFeedInputIcon", "fnGetFeedInputIcon","fnIsFeedInputPresent", "setNoDataText"],
			rootView: "cross.fnd.fiori.inbox.comments.view.Comments",
		},

		init : function() {
			UIComponent.prototype.init.apply(this, arguments);
		},

		exit : function() {
		},

		fnShowLoaderForComments: function(bShow) {
			var oView = this.getAggregation("rootControl");
			oView.byId("MIBCommentList").setBusyIndicatorDelay(1000);
			oView.byId("MIBCommentList").setBusy(bShow);
		},

		fnSetFeedInputIcon: function(url) {
			var oFeedInput = this.getAggregation("rootControl").byId("commentsFeedInput");
			oFeedInput.setIcon(url);
		},

		fnGetFeedInputIcon: function() {
			var oFeedInput = this.getAggregation("rootControl").byId("commentsFeedInput");
			return oFeedInput.getIcon();
		},

		fnIsFeedInputPresent: function() {
			var oFeedInput = this.getAggregation("rootControl").byId("commentsFeedInput");
			if (oFeedInput) {
				return true;
			}
			else {
				return false;
			}
		},

		setNoDataText: function (sText) {
			var oCommentsTab = this.getAggregation("rootControl").byId("MIBCommentList");
			oCommentsTab.setNoDataText(sText);
			},

		createContent: function() {
			var oViewData = {component: this};
			return sap.ui.view({
				type : sap.ui.core.mvc.ViewType.XML,
				viewName : "cross.fnd.fiori.inbox.comments.view.Comments",
				viewData : oViewData
			});
		}
	});
});
