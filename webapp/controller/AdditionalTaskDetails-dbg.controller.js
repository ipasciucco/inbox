/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"cross/fnd/fiori/inbox/controller/BaseController",
	"cross/fnd/fiori/inbox/model/formatter",
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device"
], function (BaseController, formatter, JSONModel, Device) {
	"use strict";

	return BaseController.extend("cross.fnd.fiori.inbox.controller.AdditionalTaskDetails", {
		formatter: formatter,

		onInit: function () {
			this.oRouter = this.getOwnerComponent().getRouter();
			this.oRouter.getRoute("additionalTaskDetails").attachPatternMatched(this._onAdditionalTaskDetailsMatched, this);
		},

		onExit : function () {
			this.getRouter().detachRoutePatternMatched(this._onAdditionalTaskDetailsMatched, this);
		},

		/**
		 * Handle fullScreen button of AdditionalTaskDetails view.
		 */
		handleFullScreen: function () {
			var sNextLayout = this.getModel("fcl").getProperty("/actionButtonsInfo/endColumn/fullScreen");
			var sLayout = sNextLayout;
			// eslint-disable-next-line camelcase
			this.oRouter.navTo("additionalTaskDetails", {SAP__Origin: encodeURIComponent(this.SAP__Origin),
				InstanceID: encodeURIComponent(this.InstanceID), layout: sLayout}, this.bReplaceHistory);
		},

		/**
		 * Handle exitFullScreen button of AdditionalTaskDetails view.
		 */
		handleExitFullScreen: function () {
			var sNextLayout = this.getModel("fcl").getProperty("/actionButtonsInfo/endColumn/exitFullScreen");
			var sLayout = sNextLayout;
			// eslint-disable-next-line camelcase
			this.oRouter.navTo("additionalTaskDetails", {SAP__Origin: encodeURIComponent(this.SAP__Origin),
				InstanceID: encodeURIComponent(this.InstanceID), layout: sLayout}, this.bReplaceHistory);
		},

		/**
		 * Handle close button of AdditionalTaskDetails view.
		 */
		handleClose: function () {
			this.getModel("parametersModel").setProperty("/showDetailsButtonPressed", false);
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
		_onAdditionalTaskDetailsMatched: function (oEvent) {
			var oArguments = oEvent.getParameter("arguments");

			// eslint-disable-next-line camelcase
			this.SAP__Origin = decodeURIComponent(oArguments.SAP__Origin);
			this.InstanceID = decodeURIComponent(oArguments.InstanceID);
			this.bReplaceHistory = !Device.system.phone;
		}
	});
}, true);
