/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"cross/fnd/fiori/inbox/controller/BaseController",
	"sap/base/Log"
], function (BaseController, Log) {
	"use strict";

	return BaseController.extend("cross.fnd.fiori.inbox.view.ReplaceDetail", {
		onInit: function () {
			var oMyInboxComponent = this.getOwnerComponent();
			oMyInboxComponent.getRouter().attachRoutePatternMatched(this.fnHandleNavToTaskUIDetail, this);
			oMyInboxComponent.getDataManager().fnShowReleaseLoader(false);
		},

		fnHandleNavToTaskUIDetail: function (oEvent) {
			if (oEvent.getParameter("name") === "replace_detail" || oEvent.getParameter("name") === "replace_detail_deep") {
				this.oEventParameters = oEvent.getParameters().arguments;
				this.oDataManager = this.getOwnerComponent().getDataManager();
				this.fnCreateIntentBasedComponent();
			}
		},

		fnCreateIntentBasedComponent: function () {
			var oIntentModel = this.getOwnerComponent().getModel("intentModel");
			var oIntentData = oIntentModel ? oIntentModel.getData() : null;

			// Check if 'Open Task' button was NOT clicked by user
			// And 'intentModel' was NOT set by S3.controller
			if (!oIntentData) {
				// Navigate to 'detail' with the same task data
				// Entering 'replace_detail' route requires task data
				this.getOwnerComponent().getRouter().navTo("detail", {
					SAP__Origin: this.oEventParameters.SAP__Origin, // eslint-disable-line camelcase
					InstanceID : this.oEventParameters.InstanceID,
					contextPath : this.oEventParameters.contextPath
				}, true);

				return;
			}

			var that = this;

			this.fnDestroyIntentBasedComponent(); // destroy existing component if present
			var oNavigationService = sap.ushell.Container.getService("CrossApplicationNavigation");
			var oComponentData = {
				onTaskUpdate: jQuery.proxy(that.fnDelegateTaskRefresh, that)
			};
			var sParameters = oIntentData.params ? "?" + that.fnCreateURLParameters(oIntentData.params) : "";
			var sIntent = oIntentData.params.openMode ? oIntentData.NavigationIntent + sParameters : oIntentData.NavigationIntent;
			oNavigationService.createComponentInstance(sIntent, {
					componentData: oComponentData
				}, that.getOwnerComponent())
				.done(function (oComponent) {
					that.byId("appContent").setComponent(oComponent);
				})
				.fail(function (oError) {
					Log.error(oError);
				});
		},

		fnCreateURLParameters: function (data) {
			return Object.keys(data).map(function (key) {
				return [key, data[key]].map(encodeURIComponent).join("=");
			}).join("&");
		},

		fnDelegateTaskRefresh: function () {
			var oNavigationParameters = this.oEventParameters;
			var sSAPOrigin = oNavigationParameters.SAP__Origin;
			var sInstanceId = oNavigationParameters.InstanceID;

			if (oNavigationParameters && sSAPOrigin && sInstanceId) {
				this.oDataManager.fnUpdateSingleTask(sSAPOrigin, sInstanceId);
			}
		},

		fnDestroyIntentBasedComponent: function () {
			var oIntentBasedComponent = this.byId("appContent").getComponentInstance();
			if (oIntentBasedComponent) {
				oIntentBasedComponent.destroy();
			}
		}
	});
});