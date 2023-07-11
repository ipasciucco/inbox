/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/Device",
	"cross/fnd/fiori/inbox/util/AddInbox",
	"cross/fnd/fiori/inbox/util/EmployeeCard",
	"cross/fnd/fiori/inbox/util/Conversions"
], function (Controller, Device, AddInbox, EmployeeCard, Conversions) {
	"use strict";

	return Controller.extend("cross.fnd.fiori.inbox.view.AddInbox", {
		_oDialog: null,
		_oDataManager: null,
		_bRefreshOnCloseDialog: null,
		_oList: null,

		onInit: function() {
			this.getView().setModel(cross.fnd.fiori.inbox.util.tools.Application.getImpl().AppI18nModel, "i18n");
			this._oDialog = this.getView().byId("DLG_ADD_INBOX");
			this._oList = this.getView().byId("LST_USERS");
			// TODO is it okay to access dataManager from here or do we pass the dataManager from util object ?
			this._oDataManager = cross.fnd.fiori.inbox.util.tools.Application.getImpl().getComponent().getDataManager();
			if (Device.system.phone) {
				this._oDialog.setStretch(true);
			}
		},

		onCancelDialog: function(oEvent) {
			if (this._bRefreshOnCloseDialog) {
				this._oDataManager.refreshListOnAddInboxDone(oEvent);
			}
			this._oDialog.close();
		},

		updateSubstitutionRuleSuccess: function(iSuccessfulRequests) {
			if (iSuccessfulRequests > 0) {
				this._bRefreshOnCloseDialog = true;
			}
			this._setListBusyLoader(false);
			AddInbox.refreshDataAfterUpdateSubstitutionRule();
		},

		updateSubstitutionRuleError: function() {
			this._setListBusyLoader(false);
		},

		handleChange: function(oEvent) {
			var oBindingContext = oEvent.getSource().getBindingContext();
			var oAddInboxUserModel = this._oDialog.getModel();

			// all the userinfo
			var oAddUserInfo = oAddInboxUserModel.getProperty( oBindingContext.getPath() , oBindingContext);
			var bEnabled = oEvent.getParameter("state") ? true : false;

			if (oAddUserInfo.aDisabledRules.length> 0 || oAddUserInfo.aEnabledRules.length > 0) {
				this._setListBusyLoader(true);
				this._oDataManager.updateSubstitutionRule(
					oAddUserInfo, bEnabled,
					this.updateSubstitutionRuleSuccess.bind(this),
					this.updateSubstitutionRuleError.bind(this));
			}
		},

		onBeforeOpenDialog: function() {
			this._bRefreshOnCloseDialog = null;
		},

		// to show employee details on click of substitute user link
		onSelectUserLink: function(oEvent) {
			var oBindingContext = oEvent.getSource().getBindingContext();
			var oDlgModel = this._oDialog.getModel();

			// get control that triggers the BusinessCard
			var oSelectedControl = Conversions.getSelectedControl(oEvent);

			this._setListBusyLoader(true);
			this._oDataManager.readUserInfo(
				oDlgModel.getProperty("SAP__Origin", oBindingContext),
				oDlgModel.getProperty("User", oBindingContext),
				this._showEmployeeCard.bind(this, oSelectedControl),
				function() {
					this._setListBusyLoader(false);
				}.bind(this),
				true
			);
		},

		// TODO move this function to utils file as it's being used by forward, substitution, add inbox and other functionalities
		_showEmployeeCard: function(oControl, oResult) {
			this._setListBusyLoader(false);
			EmployeeCard.displayEmployeeCard(oControl,oResult);
		},

		_setListBusyLoader: function(bSetBusy) {
			if (bSetBusy) {
				this._oList.setBusyIndicatorDelay(1000);
			}
			this._oList.setBusy(bSetBusy);
		}
	});
});