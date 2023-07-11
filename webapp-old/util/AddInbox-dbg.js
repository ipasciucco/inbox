/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/base/Object",
	"sap/base/Log",
	"sap/ui/core/mvc/XMLView",
	"sap/ui/model/json/JSONModel",
	"cross/fnd/fiori/inbox/util/Substitution",
	"cross/fnd/fiori/inbox/util/tools/Application"
], function (
	UI5Object,
	BaseLog,
	XMLView,
	JSONModel,
	Substitution,
	Application
) {
	"use strict";

	var _oXmlView = null;
	var _oDialog = null;
	var _oList = null;
	var _sModeTakeOver = "TAKE_OVER";
	var _oDataManager = null;

	UI5Object.extend("cross.fnd.fiori.inbox.util.AddInbox", {});

	cross.fnd.fiori.inbox.util.AddInbox = {
		open: function() {
			if (!_oXmlView) {
				this._createAddInboxDialogPromise().then(function(oXmlView) {
					_oXmlView = oXmlView;
					_oDialog = _oXmlView.byId("DLG_ADD_INBOX");
					_oList = _oXmlView.byId("LST_USERS");
					_oDataManager = cross.fnd.fiori.inbox.util.tools.Application.getImpl().getComponent().getDataManager();

					this._setUpAndOpenDialog.call(this);
				}.bind(this));
			}
			else {
				this._setUpAndOpenDialog.call(this);
			}
		},

		_setAgents: function(aAgents) {
			_oDialog.getModel().setProperty("/agents", aAgents);
			_oDialog.rerender();
		},

		refreshDataAfterUpdateSubstitutionRule: function() {
			_oList.setBusyIndicatorDelay(1000);
			_oList.setBusy(true);
			_oDataManager.readAddInboxUsers(
					jQuery.proxy(this._addInboxUsersReadSuccess, this),
					function() {
						_oList.setBusy(false);
						_oDialog.close();
					}
			);
		},

		_addInboxUsersReadSuccess: function(oResult) {
			var aData = [];
			var bNewEntry;
			var that = this;
			_oList.setBusy(false);

			jQuery.each(oResult.results, function(i, oOriginalRule) {
				if (oOriginalRule.Mode === _sModeTakeOver && !Substitution.isRuleOutdated(oOriginalRule.EndDate)) {
					bNewEntry = true;
					oOriginalRule.User = oOriginalRule.User.toUpperCase();
					jQuery.each(aData, function(index, oProcessedRule) {
						if (oProcessedRule.User === oOriginalRule.User) {
							that._mergeRule(oProcessedRule, oOriginalRule);
							bNewEntry = false;
							return false;
						}
					});
					if (bNewEntry) {
						aData.push(that._getProcessedRuleObject(oOriginalRule));
					}
				}
			});

			if (aData.length > 0) {
				this._setStatus(aData);
				this._setAgents(aData);
			}
			else {
				_oList.setShowNoData(true);
				_oList.rerender();
			}
		},

		_mergeRule: function(oMasterRule, oChildRule) {
			// Even if the rule is enabled in a single back end, overall status for the user should be active
			if (!oMasterRule.IsEnabled && oChildRule.IsEnabled) {
				oMasterRule.IsEnabled = true;
			}

			var aKeysArray = oChildRule.IsEnabled ? oMasterRule.aEnabledRules: oMasterRule.aDisabledRules;
			aKeysArray.push({
				subRuleId: oChildRule.SubstitutionRuleID,
				sOrigin: oChildRule.SAP__Origin
			});
		},

		_getProcessedRuleObject: function(oRule) {
			var oNewRule = {
				User : oRule.User,
				FullName : oRule.FullName,
				SupportsEnableSubstitutionRule: oRule.SupportsEnableSubstitutionRule,
				IsEnabled : oRule.IsEnabled,
				SAP__Origin: oRule.SAP__Origin, // eslint-disable-line camelcase
				aEnabledRules : [],
				aDisabledRules : []
			};

			var aKeysArray = oRule.IsEnabled ? oNewRule.aEnabledRules: oNewRule.aDisabledRules;
			aKeysArray.push({
				subRuleId: oRule.SubstitutionRuleID,
				sOrigin: oRule.SAP__Origin
			});

			return oNewRule;

		},

		_setStatus: function(aData) {
			jQuery.each(aData, function(i, oRule) {
				oRule.bShowWarning = (oRule.aEnabledRules.length > 0 && oRule.aDisabledRules.length > 0) ? true : false;
			});
		},

		_setUpAndOpenDialog: function() {
			var oModel = new JSONModel();
			_oDialog.setModel(oModel);
			_oList.setShowNoData(false);
			_oList.removeSelections(true);

			_oDialog.open();
			// read substitutes rule collection and extract out relevant rules to display
			this.refreshDataAfterUpdateSubstitutionRule();
		},

		_createAddInboxDialogPromise: function() {
			return XMLView.create({
				id: "MIB_VIEW_ADD_INBOX",
				viewName: "cross.fnd.fiori.inbox.view.AddInbox"
			}).catch(function() {
				BaseLog.error("Add Inbox dialog was not created successfully");
			});
		}
	};

	return cross.fnd.fiori.inbox.util.AddInbox;
});
