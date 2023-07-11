/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/Device",
	"sap/ui/model/json/JSONModel"
], function (
	Device,
	JSONModel
) {
	"use strict";

	return sap.ui.controller("cross.fnd.fiori.inbox.view.MultiSelectFilter", {
		onInit: function() {
			this.getView().setModel(cross.fnd.fiori.inbox.util.tools.Application.getImpl().AppI18nModel, "i18n");
			this.getView().byId("DIALOG").addStyleClass("sapUiPopupWithPadding"); // FIXME: css fix for ui5 1.24.2-SNAPSHOT
			if (Device.system.phone) {
				var oDialog = this.getView().byId("DIALOG");
				oDialog.setStretch(true);
			}
			this.getView().byId("DIALOG").setBusyIndicatorDelay(0);
		},

		openDialog: function(aFilterItems, fnOK, fnCancel) {
			this.fnOK = fnOK;
			this.fnCancel = fnCancel;

			// Configure dialog.

			var oView = this.getView();
			var oModel = oView.byId("LIST").getModel();
			if (!oModel) {
				oModel = new JSONModel();
				oView.byId("LIST").setModel(oModel);
			}
			oModel.setData(aFilterItems);

			//oView.byId("OK_BUTTON").setEnabled(false);

			// Display dialog.
			if (!oView.byId("DIALOG").isOpen()) {
				oView.byId("LIST").removeSelections();
				oView.byId("DIALOG").open();
			}
			else {
				oView.byId("LIST").rerender();
			}
		},

		closeDialog: function() {
			this.getView().byId("DIALOG").close();
		},

		onItemSelect: function() {
			this.closeDialog();

			if (this.fnOK) {
				var oFilterItem = this.getView().byId("LIST").getSelectedItem().getBindingContext().getProperty();
				this.fnOK(oFilterItem);
			}

			// Enable OK button as soon as an item is selected.

	/*		var oButton = this.getView().byId("OK_BUTTON");
			oButton.setEnabled(true);
			oButton.rerender(); // FIXME: Rerender button to show it in enabled state.*/
		},

	/*	onOKPress: function() {
			this.closeDialog();

			if (this.fnOK) {
				var oFilterItem = this.getView().byId("LIST").getSelectedItem().getBindingContext().getProperty();
				this.fnOK(oFilterItem);
			}
		},
	*/
		onCancelPress: function() {
			this.closeDialog();

			if (this.fnCancel)
				this.fnCancel();
		}
	});
});
