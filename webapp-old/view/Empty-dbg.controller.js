/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"cross/fnd/fiori/inbox/controller/BaseController",
	"sap/ui/dom/includeStylesheet",
	"sap/ui/core/library",
	"sap/ca/ui/images/images",
	"sap/m/library"
], function (BaseController, includeStylesheet, UICoreLibrary, images, library) {
	"use strict";

	var TitleAlignment = parseFloat(sap.ui.version) >= 1.72 ? library.TitleAlignment : null;
	var TitleLevel = UICoreLibrary.TitleLevel;

	return BaseController.extend("cross.fnd.fiori.inbox.view.Empty", {
		onInit : function() {
			var oImage = this.byId("flower");
			if (oImage) {
				oImage.setSrc(images.Flower);
			}
			includeStylesheet(sap.ui.require.toUrl("cross/fnd/fiori/inbox") + "/css/flower.css", "emptyView_stylesheet");
			this.getView().addEventDelegate(this, this);
			this.getView().addEventDelegate({
				onBeforeShow : jQuery.proxy(function(oEvent) {
					if (oEvent.data && (oEvent.data.viewTitle || oEvent.data.languageKey || oEvent.data.infoText)) {
						this.setTitleAndMessage(oEvent.data.viewTitle, oEvent.data.languageKey, oEvent.data.infoText);
					}
					else if(!this.isTitleSet){
						this.setTitleAndMessage();
					}
				}, this)
			});
		},

		setTitleAndMessage : function (sViewTitle, sLanguageKey, sInfoText) {
			// If the title is set manually, skip onBeforeShow else
			this.isTitleSet = true;

			// set view title
			var oPage = this.byId("cross.fnd.fiori.inbox.view.Empty");
			var oResourceBundle = cross.fnd.fiori.inbox.util.tools.Application.getImpl().getResourceBundle();
			var sTitle = oResourceBundle.getText(sViewTitle);
			
			if(!sViewTitle && !sLanguageKey && !sInfoText){
				sTitle = "";
			}
			else if (!sTitle || sTitle === sViewTitle) {
				//fallback: show message also as title
				if (!sInfoText) {
					sTitle = oResourceBundle.getText(cross.fnd.fiori.inbox.util.tools.Application.getImpl().oConfiguration.getDefaultEmptyMessageKey());
				}
				else {
					sTitle = sInfoText;
				}
			}
			oPage.setTitle(sTitle);
			oPage.setTitleLevel(TitleLevel.H2);
			if (TitleAlignment) {
				oPage.setTitleAlignment(TitleAlignment.Center);
			}
			// set message text
			var oLabel = this.byId("emptyLabel");
			if (!sInfoText) {
				var sMessage = oResourceBundle.getText(sLanguageKey);
				if (!sMessage || sMessage === sLanguageKey) {
					//fallback
					sMessage = oResourceBundle.getText(cross.fnd.fiori.inbox.util.tools.Application.getImpl().oConfiguration.getDefaultEmptyMessageKey());
				}
				oLabel.setText(sMessage);
			}
			else {
				oLabel.setText(sInfoText);
			}
		}
	});
});
