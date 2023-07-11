/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
		"sap/ui/core/UIComponent",
		"sap/ui/Device",
		"sap/base/Log",
		"sap/f/FlexibleColumnLayoutSemanticHelper",
		"cross/fnd/fiori/inbox/model/models",
		"cross/fnd/fiori/inbox/controller/ErrorHandler",
		"cross/fnd/fiori/inbox/util/StartupParameters",
	    "sap/ui/core/routing/HashChanger",
		"sap/ui/core/library",
	    "sap/f/library",
	    "cross/fnd/fiori/inbox/util/Parser",
	    "sap/ushell/services/AppConfiguration"
	], function (UIComponent, Device, Log, FlexibleColumnLayoutSemanticHelper, models, ErrorHandler, StartupParameters,
			HashChanger, UICoreLibrary, library, Parser, AppConfiguration) {
		"use strict";

		var LayoutType = library.LayoutType;
		var ViewType = UICoreLibrary.mvc.ViewType;

		return UIComponent.extend("cross.fnd.fiori.inbox.Component", {

			metadata : {
				manifest: "json"
			},

			/**
			 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
			 * In this function, the FLP and device models are set and the router is initialized.
			 * @public
			 * @override
			 */
			init : function () {

				// The ShellUIService is used for modifying the Fiori header bar, which is only available in desktop full screen mode.
				// ShellUIService is available only in UI5 versions >= 1.40 (Fiori 2.0):
				this.initShellUIService();

				// call the base component's init function
				UIComponent.prototype.init.apply(this, arguments);

				// create the views based on the url/hash
				this.getRouter().initialize();
			},

			/**
			 * The component is destroyed by UI5 automatically.
			 * In this method, the ErrorHandler is destroyed.
			 * @public
			 * @override
			 */
			destroy : function () {
				if (this._oErrorHandler) {
					this._oErrorHandler.destroy();
				}

				// call the base component's destroy function
				UIComponent.prototype.destroy.apply(this, arguments);
			},

			initShellUIService: function() {
				if (sap.ushell && sap.ushell.ui5service && sap.ushell.ui5service.ShellUIService) {
					this.getService("ShellUIService").then(
						function (oService) {
							// Keep the reference to the ShellUIService
							// in the Component context for global use:
							this.oShellUIService = oService;
						}.bind(this),
						function (oError) {
							Log.error("Cannot get ShellUIService", oError, "cross.fnd.fiori.inbox.Component");
						}
					);
				}
			},

			/**
			 * Initialize the application
			 *
			 * @returns {sap.ui.core.Control} the content
			 */
			createContent : function() {
				var oViewData = {component: this};

                // initialize Startup Parameters
				this.oStartupParameters = StartupParameters.getInstance(this);

				if (this.oStartupParameters.isModeActive()) {
					// initialize the error handler with the component
					this._oErrorHandler = new ErrorHandler(this);

					// set the device model
					this.setModel(models.getDeviceModel(), "device");
				}

				// eslint-disable-next-line new-cap
				var oRootView = new sap.ui.view({
					viewName : "cross.fnd.fiori.inbox.view.App",
					type : ViewType.XML,
					viewData : oViewData
				});

				oRootView.addStyleClass(this.getContentDensityClass());
				var oDataManager = this.getDataManager();
				var sInstanceID = oDataManager.sTaskInstanceID;
				// eslint-disable-next-line camelcase
				var sSAP__Origin = oDataManager.sSapOrigin;

				var oHashChanger = HashChanger.getInstance();

				// eslint-disable-next-line camelcase
				if (sInstanceID && sSAP__Origin && window.location.href.indexOf("&/") === -1) {
					var sURL = this._getAppSpecificURL(sInstanceID,sSAP__Origin);
					if (sURL) {
						var aLeftRightURLSplit = window.location.href.split("#");
						var sLeftPartOfURL = aLeftRightURLSplit[0];
						//var sRightPartOfURL = aLeftRightURLSplit[1];

						oHashChanger.replaceHash(sURL);
						var sURLWithHash = this._getFullHash(sURL);

						if (window.history.replaceState) {
							if (sLeftPartOfURL.indexOf("InstanceID") !== -1 && sLeftPartOfURL.indexOf("SAP__Origin") !== -1) {
								sLeftPartOfURL = Parser.removeParamsFromUrl(["InstanceID","SAP__Origin"], sLeftPartOfURL);

								window.history.replaceState({fromExternal:true}, null, sLeftPartOfURL + "#" + sURLWithHash);
							}
							else {
								window.history.replaceState({fromExternal:true}, null, "#" + sURLWithHash);
							}
						}
					}
				}

				var oRouter = this.getRouter();
				var sUrl;
		        if (oDataManager.getTableView() && (!Device.system.phone || oDataManager.getTableViewOnPhone())) {
			        var currentHash = oHashChanger.getHash();
                    if (!currentHash.startsWith("detail_deep")) {
				        //to construct the correct URL all parameters defined in the routes's pattern have to be provided to the getURL function:
						sUrl = oRouter.getURL("table_view",{}); //adopt to your route
				        if (sUrl) {
							oHashChanger.replaceHash(sUrl);
				        }
			        }
		        }

				if (this.oStartupParameters.isModeActive()) {
			        sUrl = oRouter.getURL("myTasksMaster", {});
					if (sUrl) {
						oHashChanger.replaceHash(sUrl);
					}
				}

		        return oRootView;
			},

			setDataManager : function(oDataManager) {
				this.oDataManager = oDataManager;
			},

			getDataManager : function() {
				return this.oDataManager;
			},

			/**
			 * This method can be called to determine whether the sapUiSizeCompact or sapUiSizeCozy
			 * design mode class should be set, which influences the size appearance of some controls.
			 * @public
			 * @return {string} css class, either 'sapUiSizeCompact' or 'sapUiSizeCozy' - or an empty string if no css class should be set
			 */
			getContentDensityClass: function() {
				if (this._sContentDensityClass === undefined) {
					// check whether FLP has already set the content density class; do nothing in this case
					var oDomClassList = document.body.classList;

					if (oDomClassList.contains("sapUiSizeCozy") || oDomClassList.contains("sapUiSizeCompact")) {
						this._sContentDensityClass = "";
					}
					else if (!Device.support.touch) {
						// apply "compact" mode if touch is not supported
						this._sContentDensityClass = "sapUiSizeCompact";
					}
					else {
						// "cozy" in case of touch support; default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
						this._sContentDensityClass = "sapUiSizeCozy";
					}
				}
				return this._sContentDensityClass;
			},

			_getAppSpecificURL : function (sInstID, sSOrigin) {
				var sURL;
				if (sInstID && sSOrigin) {
					// task has been called from notification service
					var oRouter = this.getRouter();
					sURL = oRouter.getURL("detail", {
						// eslint-disable-next-line camelcase
						SAP__Origin: sSOrigin,
						InstanceID: sInstID,
						contextPath:  "TaskCollection(SAP__Origin='" + sSOrigin +"',InstanceID='" + sInstID+"')"
					});
				}
				return sURL;
			},

			_getFullHash : function (appSpecificHash) {
				var sURLWithHash = "";
				if (appSpecificHash) {
					if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getService) {
						var xnavservice = sap.ushell.Container.getService("CrossApplicationNavigation");
						sURLWithHash = xnavservice.hrefForAppSpecificHash(appSpecificHash);

						var urlParser = sap.ushell.Container.getService("URLParsing");
						var oShellHash = urlParser.parseShellHash(sURLWithHash);

						// delete oShellHash.params.InstanceID;
						// delete oShellHash.params.SAP__Origin;
						sURLWithHash = urlParser.constructShellHash(oShellHash);
					}
					else {
						Log.error("sap.ushell.Container.getService is not found.");
					}
				}
				return sURLWithHash;
			},

			//function to handle the width of the application. It is called by FLP when app is active.
			active : function () {
				var bFullWidth = false;
				if (this.getDataManager().getFullWidth() || this.oStartupParameters.isModeActive()) {
						bFullWidth = true;
				}
				AppConfiguration.setApplicationFullWidth(bFullWidth);
			},

			/**
			 * Getter method for ErrorHandler instance.
			 *
			 * @returns {object} ErrorHandler instance.
			 */
			getErrorHandler : function() {
				return this._oErrorHandler;
			},

			/**
			 * Returns an instance of the semantic helper. With this helper control buttons and layout of flexible column layout.
             *
			 * @returns {sap.f.FlexibleColumnLayoutSemanticHelper} An instance of the semantic helper
			 */
			getFCLHelper : function () {
				var oFCL = this.getRootControl().byId("fcl"),
					//oParams = new UriParameters(window.location.href),
					oSettings = {
						defaultTwoColumnLayoutType: LayoutType.TwoColumnsMidExpanded,
						defaultThreeColumnLayoutType: LayoutType.ThreeColumnsMidExpanded
						//initialColumnsCount: oParams.get("initial") can be used for initial opening of 2 columns for master detail view
					};

				return FlexibleColumnLayoutSemanticHelper.getInstanceFor(oFCL, oSettings);
			}
		});
	}
);