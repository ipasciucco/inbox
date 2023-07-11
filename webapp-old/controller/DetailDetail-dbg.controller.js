/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"cross/fnd/fiori/inbox/controller/BaseController",
	"cross/fnd/fiori/inbox/model/formatter",
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device",
	"cross/fnd/fiori/inbox/model/models"
], function (BaseController, formatter, JSONModel, Device, models) {
	"use strict";

	return BaseController.extend("cross.fnd.fiori.inbox.controller.DetailDetail", {
		formatter: formatter,

		onInit: function () {
			this.oRouter = this.getOwnerComponent().getRouter();
			this.oRouter.getRoute("myTasksDetailDetail").attachPatternMatched(this._onDetailDetailMatched, this);

			models.attachEvent("workflowLogModelUpdated", null, function () {
				this.getModel("parametersModel").setProperty("/workflowLogNoDataText", this.getResourceBundle().getText("DetailDetail_WokrflowLogNoDataText"));
				this.setModel(models.getWorkflowLogModel(), "workflowLogModel");
				this.getModel("parametersModel").setProperty("/busyIndicatorWorkflowLog", false);
			}, this);

            models.attachEvent("workflowLogModelUpdateError", null, function() {
				this.getModel("parametersModel").setProperty("/workflowLogNoDataText", this.getResourceBundle().getText("DetailDetail_WokrflowLogNoDataText"));
				this.setModel(models.getWorkflowLogModel(), "workflowLogModel");
				this.getModel("parametersModel").setProperty("/busyIndicatorWorkflowLog", false);
			}, this);
		},

		onExit : function () {
			this.getRouter().detachRoutePatternMatched(this._onDetailDetailMatched, this);
		},

		/**
		 * Handle fullScreen button of DetailDetail view.
		 */
		handleFullScreen: function () {
			var sNextLayout = this.getModel("fcl").getProperty("/actionButtonsInfo/endColumn/fullScreen");
			var sLayout = sNextLayout;
			// eslint-disable-next-line camelcase
			this.oRouter.navTo("myTasksDetailDetail", {SAP__Origin: encodeURIComponent(this.SAP__Origin),
				InstanceID: encodeURIComponent(this.InstanceID), layout: sLayout}, this.bReplaceHistory);
		},

		/**
		 * Handle exitFullScreen button of DetailDetail view.
		 */
		handleExitFullScreen: function () {
			var sNextLayout = this.getModel("fcl").getProperty("/actionButtonsInfo/endColumn/exitFullScreen");
			var sLayout = sNextLayout;
			// eslint-disable-next-line camelcase
			this.oRouter.navTo("myTasksDetailDetail", {SAP__Origin: encodeURIComponent(this.SAP__Origin),
				InstanceID: encodeURIComponent(this.InstanceID), layout: sLayout}, this.bReplaceHistory);
		},

		/**
		 * Handle close button of DetailDetail view.
		 */
		handleClose: function () {
			this.getModel("parametersModel").setProperty("/showLogButtonPressed", false);
			models.resetWorkflowLogModel();
			var sNextLayout = this.getModel("fcl").getProperty("/actionButtonsInfo/endColumn/closeColumn");
			var sLayout = sNextLayout;
			// eslint-disable-next-line camelcase
			this.oRouter.navTo("myTasksDetail", {SAP__Origin: encodeURIComponent(this.SAP__Origin),
				InstanceID: encodeURIComponent(this.InstanceID), layout: sLayout}, this.bReplaceHistory);
		},

		/**
		 * Stores properties neeeded for further actions.
		 *
		 * @param {sap.ui.base.Event} oEvent router attachPatternMatched event
		 *
		 * @private
		 */
		_onDetailDetailMatched: function (oEvent) {
			var oArguments = oEvent.getParameter("arguments");
			// Get path to image file dynamically. Required due to different file structure in different deployment options.
			if (!this.getModel("parametersModel").getProperty("/workflowLogUserPictureUrl")) {
				this.getModel("parametersModel").setProperty("/workflowLogUserPictureUrl", sap.ui.require.toUrl("cross/fnd/fiori/inbox/img/placeholder.jpg"));
			}
			// When workflow model is updated, property "modelUpdated" is set to true.
			// In that case creating again the same request is ommited.
			if (!models.getWorkflowLogModel().getProperty("/modelUpdated")) {
				this.getModel("parametersModel").setProperty("/busyIndicatorWorkflowLog", true);
				this.getModel("parametersModel").setProperty("/workflowLogNoDataText", " ");
				this.setModel(models.getWorkflowLogModel(), "workflowLogModel");
				models.refreshWorkflowLogModel(oArguments.InstanceID, oArguments.SAP__Origin);
			}
			// eslint-disable-next-line camelcase
			this.SAP__Origin = decodeURIComponent(oArguments.SAP__Origin);
			this.InstanceID = decodeURIComponent(oArguments.InstanceID);
			this.bReplaceHistory = !Device.system.phone;
		}
	});
}, true);
