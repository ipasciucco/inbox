/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/core/mvc/XMLView",
	"sap/base/Log"
], function (
	UI5Object,
	XMLView,
	BaseLog
) {
	"use strict";

	UI5Object.extend("cross.fnd.fiori.inbox.util.MultiSelect", {});

	cross.fnd.fiori.inbox.util.MultiSelect = {
		_oFilterViewPromise : null,
		_oMessageViewPromise : null,
		_oDetailViewPromise : null,
		customAttributeDefinitionsLoaded: new jQuery.Deferred(),

		openFilterDialog: function(aFilterItems, fnOK, fnCancel, merge) {
			this._oFilterViewPromise = this._oFilterViewPromise === null
				? this._createDialog("cross.fnd.fiori.inbox.view.MultiSelectFilter")
				: this._oFilterViewPromise;

			this._oFilterViewPromise.then(function(oFilterView) {
				oFilterView.getController().openDialog(aFilterItems, fnOK, fnCancel);
				oFilterView.getController().byId("DIALOG").setBusy(!merge);
			});
		},

		openMessageDialog: function(aSuccessList, aErrorList, fnClose) {
			this._oMessageViewPromise = this._oMessageViewPromise === null
				? this._createDialog("cross.fnd.fiori.inbox.view.MultiSelectMessage")
				: this._oMessageViewPromise;

			this._oMessageViewPromise.then(function(oMessageView) {
				oMessageView.getController().openDialog(aSuccessList, aErrorList, fnClose);
			});
		},

		openDetailDialog: function(oDetailInfo, fnClose, fnBack) {
			this._oDetailViewPromise = this._oDetailViewPromise === null
				? this._createDialog("cross.fnd.fiori.inbox.view.MultiSelectDetail")
				: this._oDetailViewPromise;

			this._oDetailViewPromise.then(function(oDetailView) {
				oDetailView.getController().openDialog(oDetailInfo, fnClose, fnBack);
			});
		},

		_createDialog: function(sViewName) {
			return XMLView.create({
				viewName: sViewName
			})
			.catch(function() {
				BaseLog.error(sViewName + " was not created successfully");
			});
		},

		// LowerCase customcreatedbyname and customtasktitle
		// Encode CustomAttributeNames (replacing "/" symbol which breaks the binding")
		prepareWorkItems: function(aWorkItems) {
			if (aWorkItems.length === 0) {
				return;
			}

			for (var i = 0; i < aWorkItems.length; i++) {
				var workItem = aWorkItems[i];

				for (var prop in workItem) {
					var lowerCasedProp = prop.toLowerCase();

					if (workItem.hasOwnProperty(prop) &&
						lowerCasedProp === "customcreatedbyname" || lowerCasedProp === "customtasktitle") {
						aWorkItems[i][lowerCasedProp] = workItem[prop];
					}
					else if (workItem.hasOwnProperty(prop)) {
						aWorkItems[i][encodeURIComponent(prop)] = workItem[prop];
					}
				}
			}
		}
	};

	return cross.fnd.fiori.inbox.util.MultiSelect;
});
