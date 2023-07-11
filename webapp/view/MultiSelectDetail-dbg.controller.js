/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/m/Bar",
	"sap/m/Button",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/IconPool/createControlByURI",
	"sap/m/Image",
	"sap/m/Title",
	"sap/m/library"
], function (
	Bar,
	Button,
	JSONModel,
	createControlByURI,
	Image,
	Title,
	library
) {
	"use strict";

	var ButtonType = library.ButtonType;

	return sap.ui.controller("cross.fnd.fiori.inbox.view.MultiSelectDetail", {
		onInit: function () {
			var oView = this.getView();

			oView.setModel(cross.fnd.fiori.inbox.util.tools.Application.getImpl().AppI18nModel, "i18n");

			var oDialog = oView.byId("DIALOG");

			// creating custom header as the back button can not be inserted in the default header
			this.oCustomHeader = new Bar();
			this.oCustomHeader.addContentLeft(new Button({
				type: ButtonType.Back,
				press: jQuery.proxy(this.onBackPress, this)
			}));
			oDialog.setCustomHeader(this.oCustomHeader);

		},

		openDialog: function (oDetailInfo, fnClose, fnBack) {
			this.fnClose = fnClose;
			this.fnBack = fnBack;

			// Create detail message.

			var i18nBundle = this.getView().getModel("i18n").getResourceBundle();

			var sMessage = "";

			for (var i = 0; i < oDetailInfo.itemStatusList.length; i++) {
				var oItemStatus = oDetailInfo.itemStatusList[i];

				if (sMessage.length > 0)
					sMessage += "\n";

				sMessage += i18nBundle.getText("multi.itemstatus", [oItemStatus.InstanceID, oItemStatus.SAP__Origin]) + "\n";
				sMessage += oItemStatus.message + "\n";
			}

			// Configure dialog.

			var oView = this.getView();

			var oModel = new JSONModel();
			oModel.setData(jQuery.extend({}, oDetailInfo, {
				detailMessage: sMessage
			}));
			oView.setModel(oModel);

			var oDialog = oView.byId("DIALOG");

			// adding middle content in the custom header
			this.oCustomHeader.destroyContentMiddle();

			var oIconImage = createControlByURI({
				src: oDialog.getIcon()
			}, Image).addStyleClass("sapMDialogIcon");
			this.oCustomHeader.insertAggregation("contentMiddle", oIconImage, 0);

			this.oCustomHeader.addContentMiddle(new Title({
				text: oView.byId("DIALOG").getTitle(),
				level: "H1"
			}).addStyleClass("sapMDialogTitle"));

			// Display dialog.
			oDialog.open();
		},

		closeDialog: function () {
			this.getView().byId("DIALOG").close();
		},

		onOKPress: function () {
			this.closeDialog();

			if (this.fnClose)
				this.fnClose();
		},

		onBackPress: function () {
			this.closeDialog();

			if (this.fnBack)
				this.fnBack();
		}
	});
});