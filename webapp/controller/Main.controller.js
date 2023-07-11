/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
		"cross/fnd/fiori/inbox/controller/BaseController",
		"cross/fnd/fiori/inbox/util/Conversions",
		"cross/fnd/fiori/inbox/util/SupportInfo",
		"cross/fnd/fiori/inbox/util/AddInbox",
		"cross/fnd/fiori/inbox/util/FooterButtonExtension",
		"cross/fnd/fiori/inbox/util/MultiSelect",
		"cross/fnd/fiori/inbox/util/tools/Application",
		"cross/fnd/fiori/inbox/util/tools/Startup",
		"sap/ui/model/json/JSONModel",
		"sap/ui/Device",
		"sap/ui/core/UIComponent",
		"sap/base/Log",
		"sap/m/Button",
		"cross/fnd/fiori/inbox/annotationBasedTaskUI/Component"
	], function (BaseController, Conversions, SupportInfo, AddInbox, FooterButtonExtension, MultiSelect, Application,
		Startup, JSONModel, Device, UIComponent, Log, Button, ComponentBasedTaskUI) {
		"use strict";

		return BaseController.extend("cross.fnd.fiori.inbox.Main", {

			onInit : function() {

				Startup.init("cross.fnd.fiori.inbox", this);
				var oAppImpl = Application.getImpl();
				var oModelList = oAppImpl.oConnectionManager ? oAppImpl.oConnectionManager.modelList : {};
				var oOwnerComponent = this.getOwnerComponent();
				sap.ui.getCore().setModel(new JSONModel(),"controllerModel");
				sap.ui.getCore().getModel("controllerModel").setProperty("/controller",this);

				var oView = this.getView();

				//Setting the models to the view
				for (var sModelName in oModelList) {
					if (oModelList.hasOwnProperty(sModelName)) {
						if (sModelName !== "undefined") {
							oView.setModel(oModelList[sModelName], sModelName);
							oOwnerComponent.setModel(oModelList[sModelName], sModelName);
						}
						else {
							oView.setModel(oModelList[sModelName]);
							oOwnerComponent.setModel(oModelList[sModelName]);
						}
					}
				}

				var oDataManager = oOwnerComponent.getDataManager();
				oDataManager.setModel(oOwnerComponent.getModel());

				FooterButtonExtension.overrideEnsureButton();

				if (!Device.system.phone && oDataManager.bOutbox) {
					Conversions.setShellTitleToOutbox(oOwnerComponent, "cross.fnd.fiori.inbox.Main");
				}

				if (typeof sap.ushell!=="undefined" && typeof sap.ushell.renderers !== "undefined" && typeof sap.ushell.renderers.fiori2 !== "undefined") {
					var rendererExt = sap.ushell.renderers.fiori2.RendererExtensions;
				}
				else {
					rendererExt=undefined;
				}

				if (rendererExt) {
					var oBundle = this.getResourceBundle();
					this.oRouter = UIComponent.getRouterFor(this);
					if (oDataManager.getSubstitutionEnabled()) {
						this.oSubstButton = new Button({
								text: oBundle.getText("substn.navigation_button"),
								icon: "sap-icon://citizen-connect",
								tooltip:oBundle.getText("userdrop.manage_my_substitutes_tooltip"),
								press: (jQuery.proxy(function() {
									this.oRouter.navTo("substitution", {} , false);
								}, this))
							});

						rendererExt.addOptionsActionSheetButton(this.oSubstButton,rendererExt.LaunchpadState.App);

						this.oAddInboxButton = new Button({
							text: oBundle.getText("XBUT_SUBSTITUTE_FOR"),
							icon: "sap-icon://personnel-view",
							tooltip:oBundle.getText("userdrop.substitute_for_tooltip"),
							press: function(oEvent) {
								AddInbox.open();
							}
						});
						rendererExt.addOptionsActionSheetButton(this.oAddInboxButton,rendererExt.LaunchpadState.App);
					}
					this.oSupportInfoButton = new Button({
						text: oBundle.getText("supportinfo.navigation_button"),
						icon: "sap-icon://message-information",
						tooltip:oBundle.getText("userdrop.support_information_tooltip"),
						press: function(oEvent) {
									oView.getController().getOwnerComponent().getEventBus().publish("cross.fnd.fiori.inbox", "open_supportinfo",{source:"MAIN"});
									SupportInfo.open(oView);
								}
					});
					rendererExt.addOptionsActionSheetButton(this.oSupportInfoButton,rendererExt.LaunchpadState.App);
				}
				else {
					Log.error("sap.ushell.renderers.fiori2.RendererExtensions not found. My Inbox menu options will not be added");
				}
			},

			/**
			 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
			 *
			 * @memberOf MainXML
			 */
			onExit : function() {
				//exit cleanup code here
				if (Conversions) {
					Conversions.setDataManager(null);
				}
				var rendererExt = sap.ushell.renderers?sap.ushell.renderers.fiori2.RendererExtensions:undefined;
				if (rendererExt) {
					if (this.oSubstButton) {
						rendererExt.removeOptionsActionSheetButton(this.oSubstButton,rendererExt.LaunchpadState.App);
					}

					if (this.oAddInboxButton) {
						rendererExt.removeOptionsActionSheetButton(this.oAddInboxButton,rendererExt.LaunchpadState.App);
					}

					if (this.oSupportInfoButton) {
						rendererExt.removeOptionsActionSheetButton(this.oSupportInfoButton,rendererExt.LaunchpadState.App);
					}
				}
			}
		});
	}
);