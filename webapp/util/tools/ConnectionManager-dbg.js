/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/base/Log",
	"sap/base/util/UriParameters",
	"sap/ui/model/odata/ODataUtils",
	"cross/fnd/fiori/inbox/util/CommonFunctions",
	"sap/ui/model/odata/v2/ODataModel",
	"sap/ui/base/ManagedObject",
	"sap/ui/model/odata/ODataMetadata",
	"sap/ui/model/odata/CountMode",
	"sap/m/MessageBox"
], function(
	Log,
	UriParameters,
	ODataUtils,
	CommonFunctions,
	ODataModel,
	ManagedObject,
	ODataMetadata,
	CountMode,
	MessageBox
) {
	"use strict";

	ManagedObject.extend("cross.fnd.fiori.inbox.util.tools.ConnectionManager", {
		metadata : {
			properties : {
				identity : "string",
				configuration : "object",
				defaultConfiguration : "object",
				component : "object"
			}
		},

		/**
		 * Initialize all the models as defined in the configuration service list. The models should define : - their
		 * url - the name of the model that they will create - a isDefault property that will set the model as the
		 * undefined model (to support getModel()) - a mockedDataSource to define if mock data are available (and to
		 * switch to MockServer class in this case)
		 */
		initModels : function () {

			function attachParams (oParams, sAdditionalParams) {
				(sAdditionalParams || "").split("&").forEach(function (sParam) {
					var i = sParam.indexOf("="), sKey = sParam, sValue = "";
					if (i >= 0) {
						sValue = decodeURIComponent(sKey.slice(i + 1));
						sKey = sKey.slice(0, i);
					}
					sKey = decodeURIComponent(sKey);
					if (sKey) {
						oParams[sKey] = sValue;
					}
				});
			}

			function cloneServiceList (aServiceList) {
				var aClone = JSON.parse(JSON.stringify(aServiceList));

				jQuery.each(aClone, function (i, oService) {
					oService.fRequestFailed = aServiceList[i].fRequestFailed;
				});

				return aClone;
			}

			this.modelList = {}; // Map containing all the models
			this.mockServerList = {}; // Map containing all the models
			this.iRequestCount = 0;
			// Init all the ODataModel based on the configuration
			//*deep* array clone in order not to overwrite SAP app configuration
			var serviceList = Array.isArray(this.getConfiguration().getServiceList())
					? cloneServiceList(this.getConfiguration().getServiceList())
					: null;
			var excludedParameters = this.getConfiguration().getExcludedQueryStringParameters() || [];
			var isMocked = this.getConfiguration().isMock();
			var that = this;
			var sapServer = UriParameters.fromURL(window.location.href).get("sap-server");
			var sapHost = UriParameters.fromURL(window.location.href).get("sap-host");
			var sapHostHttp = UriParameters.fromURL(window.location.href).get("sap-host-http");
			var sapClient = UriParameters.fromURL(window.location.href).get("sap-client");

			var oComponent = that.getComponent();
			// check if system alias is contained in startup parameters of the component
			var mStartupParameters = (oComponent.getComponentData() || {}).startupParameters || {};
			var vSapSystem = mStartupParameters["sap-system"] || {};
			var sSystemAlias = typeof vSapSystem === "object" ? vSapSystem[0] : vSapSystem;

			this.sErrorInStartMessage = "";
			this.bIsComponentBase = !!oComponent.setRouterSetCloseDialogs;
			this.bIsShowingMessage = false;   // suppress more then one message box (e.g. when several models provide an error
			if (!sap.ui.getCore().getConfiguration().getDisableCustomizing() && oComponent && oComponent.getMetadata()) {

				var oConfig = oComponent.getMetadata().getConfig(),
					serviceListExt = oConfig["sap.ca.serviceConfigs"] || [];

				var fMergeConfigs = function (aServiceList, aExtensionConfig) {
					var oServiceList, oExtConfig;
					//*deep* array clone in order not to overwrite the custom configuration
					var aExtConfig = Array.isArray(aExtensionConfig)
						? cloneServiceList(aExtensionConfig)
						: [];
					for (var i = 0; i < aServiceList.length; i++) {
						oServiceList = aServiceList[i];
						for (var j = 0; j < aExtConfig.length; j++) {
							oExtConfig = aExtConfig[j];
							if (oServiceList.name == oExtConfig.name) {
								for (var key in oExtConfig) {
									oServiceList[key] = oExtConfig[key];
								}
								aExtConfig.splice(j, 1);
								//array was sqashed - adapt the index in order to
								//check the 'new entry' that moved its position
								j--;
							}
						}
					}
					aServiceList = aServiceList.concat(aExtConfig);
					return aServiceList;
				};

				if (serviceListExt.length > 0 && serviceList != null) {
					serviceList = fMergeConfigs(serviceList, serviceListExt);
				}
			}

			if (serviceList != null) {
				jQuery.each(serviceList, function (index, service) {
					function logMetadataError(oEvt, oService) {
						var sError = "Cannot load meta data for service " + oService.serviceUrl,
							sDetails = oEvt.getParameter("statusCode"),
							sComponent = that.getIdentity() || "cross.fnd.fiori.inbox.util.tools.ConnectionManager";
						sDetails += " (";
						sDetails += oEvt.getParameter("statusText");
						sDetails += ") - ";
						sDetails += oEvt.getParameter("message");
						sDetails += "\n";
						sDetails += oEvt.getParameter("responseText");
						Log.error(sError, sDetails, sComponent);
					}
					var sUrlUri = URI(service.serviceUrl),
						bUseV2Model = (service.useV2ODataModel === true);

					if (sapServer != null && (excludedParameters.indexOf("sap-server") === -1)) {
						sUrlUri.addSearch("sap-server", sapServer);
					}
					else if (sapHost != null && (excludedParameters.indexOf("sap-host") === -1)) {
						sUrlUri.addSearch("sap-host", sapHost);
					}
					else if (sapHostHttp != null && (excludedParameters.indexOf("sap-host-http") === -1)) {
						sUrlUri.addSearch("sap-host-http", sapHostHttp);
					}
					if (sapClient != null && (excludedParameters.indexOf("sap-client") === -1)) {
						sUrlUri.addSearch("sap-client", sapClient);
					}
					var sUrl = sUrlUri.toString();
					// Add origin segment if sap-system start parameter is available
					if (sSystemAlias) {
						sUrl = DataUtils.setOrigin(sUrl, sSystemAlias);
					}

					var oConfig = {
						metadataUrlParams: {},
						json: true,
						loadMetadataAsync: service.loadMetadataAsync === true || bUseV2Model //v2.ODataModel always loads metadata async
					};

					attachParams(oConfig.metadataUrlParams, service.metadataParams);
					if (service.serviceUrl.indexOf("/sap/opu/") === 0) {
						// a Gateway URL, try adding sap-language to $metadata
						var sapLanguage;
						if (sap.ushell && sap.ushell.Container) {
							sapLanguage = sap.ushell.Container.getUser().getLanguage();
							// in some environments (e.g. portal) getLanguage() does not return
							// a language code that can be used as sap-language, so use SAP
							// logon language from UI5 Core instead; see BCP 265110/2019
							if (sapLanguage && !/^[A-Z]{2}$/i.test(sapLanguage)) {
								sapLanguage = sap.ui.getCore().getConfiguration()
									.getSAPLogonLanguage();
							}
						}
						else {
							sapLanguage = UriParameters.fromURL(window.location.href).get("sap-language");
						}
						if (sapLanguage && excludedParameters.indexOf("sap-language") < 0) {
							oConfig.metadataUrlParams["sap-language"] = sapLanguage;
						}
					}
					var oModel = bUseV2Model
							? new ODataModel(sUrl, oConfig)
							: new ODataModel(sUrl, oConfig);
					if (oConfig.loadMetadataAsync) {
						oModel.attachMetadataLoaded({oModel: oModel, oService: service}, function (oEvt, oParams) {
							that.checkModelMetaData(oParams.oModel,oParams.oService);
						}, this);
						oModel.attachMetadataFailed({oModel: oModel, oService: service}, function (oEvt, oParams) {
							logMetadataError(oEvt, oParams.oService);
							that.checkModelMetaData(oParams.oModel,oParams.oService);
						}, this);
					}
					else {
						oModel.attachMetadataFailed(service, logMetadataError, this);
						that.checkModelMetaData(oModel, service);
					}

					// Override Metadata way of returning properties
					if (service.overrideGetPropertyMetadata && oModel.oMetadata) {
						oModel.oMetadata._getPropertyMetadata = function (oEntityType, sProperty) {
							sProperty = sProperty.replace(/^\/|\/$|\)$|\w*\(/g, "");
							return ODataMetadata.prototype._getPropertyMetadata.apply(this, [oEntityType, sProperty]);
						};
					}

					// To comply with security guidelines, batch mode is used except if :
					// - service configuration explicitly contains useBatch:false
					// - service is a mock service
					if ((service.useBatch) && !isMocked) {
						oModel.setUseBatch(true);
					}
					if (service.countSupported) {
						// v2.ODataModel has no method setCountSupported; we keep it however for the ODataModel as apps may call oModel.isCountSupported then
						if (bUseV2Model) {
							oModel.setDefaultCountMode(CountMode.Request);
						}
						else {
							oModel.setCountSupported(true);
						}
					}
					else if (bUseV2Model) {
						oModel.setDefaultCountMode(CountMode.Inline);
					}
					else {
						oModel.setCountSupported(false);
					}
					if (service.sDefaultBindingMode) {
						oModel.setDefaultBindingMode(service.sDefaultBindingMode);
					}
					if (service.fRequestFailed) {
						oModel.attachRequestFailed(null, service.fRequestFailed);
					}
					else {
						oModel.attachRequestFailed(null, jQuery.proxy(that.handleRequestFailed, that));
					}
					// some applications requested the possibility to avoid the busy indicator
					if (service.noBusyIndicator == true) {
						// attach only default logic
						oModel.attachRequestSent(null, jQuery.proxy(that.handleRequestSentInner, that));
						oModel.attachRequestCompleted(null, jQuery.proxy(that.handleRequestCompletedInner, that));
					}
					else {
						// attach default logic + busy Indicator
						oModel.attachRequestSent(null, jQuery.proxy(that.handleRequestSent, that));
						oModel.attachRequestCompleted(null, jQuery.proxy(that.handleRequestCompleted, that));
					}
					if (service.isDefault) {
						that.modelList[undefined] = oModel;
						that.setDefaultConfiguration(service);
					}
					else {
						that.modelList[service.name] = oModel;
					}
				});
			}
		},

		checkModelMetaData: function (oModel, oService) {
			if (!oModel.getServiceMetadata()) {
				var oII18NModel = this.getProperty("configuration").oApplicationFacade.oApplicationImplementation.UilibI18nModel
						.getResourceBundle();
				this.sErrorInStartMessage = oII18NModel.getText("ERROR_MSG_NO_METADATA", [oService.name]);
				var oSettings = {
					message : this.sErrorInStartMessage,
					details : oII18NModel.getText("ERROR_DETAIL_NO_METADATA", [oService.serviceUrl])
				};
				this.showMessageBox(oSettings);
				return;
			}
		},

		setIdentity : function (sIdentity) {
			var oldIdentity = this.getIdentity();
			if (oldIdentity != sIdentity) {
				this.setProperty("identity", sIdentity);
			}
		},

		/**
		 * Retrieve a single model based on its name
		 *
		 * @param {string} sName
		 * @returns {*}
		 */
		getModel : function (sName) {
			return this.modelList[sName];
		},

		/**
		 * Method to be called each time a request is sent on the ODataModel
		 *
		 * @param {object} oEvent
		 */
		handleRequestSent : function (oEvent) {
			this.handleRequestSentInner(oEvent);
		},

		handleRequestSentInner : function (oEvent) {
			this.iRequestCount++;
			Log.info("Connection Manager", "Request sent");
		},

		/**
		 * Method to be called each time a request fails on the ODataModel
		 *
		 * @param {object} oEvent
		 */
		handleRequestFailed : function (oEvent) {
			Log.error("Connection Manager", "Failed to load data");
			// v2 provides the error nested in response parameter
			var oResponse = oEvent.getParameter("response"),
				oSettings = {
					message : oEvent.getParameter("message")
						|| (oResponse && oResponse.message),
					details : oEvent.getParameter("responseText")
						|| (oResponse && oResponse.responseText)
				};
			this.showMessageBox(oSettings);
		},

		/**
		 * Method to be called each time a request is completed on the ODataModel
		 *
		 * @param {object} oEvent
		 */
		handleRequestCompleted : function (oEvent) {
			this.handleRequestCompletedInner(oEvent);
		},

		handleRequestCompletedInner : function (oEvent) {
			if (oEvent.getParameter("success")) {
				Log.info("Connection Manager", "Request succesfully completed");
			}
			else {
				Log.info("Connection Manager", "Request completed with errors", oEvent.getParameter("message"));
			}
		},

		showMessageBox : function (oSettings) {
			if (this.bIsShowingMessage) {
				return;
			}
			this.bIsShowingMessage = true;
			if (this.bIsComponentBase) {
				var oComponent = this.getComponent();
				var bIsClosing = oComponent._bRouterCloseDialogs;
				oComponent.setRouterSetCloseDialogs(false);
			}
			MessageBox.error(oSettings.message,
				{	details: CommonFunctions.fnRemoveHtmlTags(oSettings.details),
					onClose: jQuery.proxy(function () {
								this.bIsShowingMessage = false;
								if (this.bIsComponentBase) {
									oComponent.setRouterSetCloseDialogs(bIsClosing);
								}
							}, this)
				}
			);
		}
	});

	// factory method may be more flexible in future
	cross.fnd.fiori.inbox.util.tools.ConnectionManager.getNewInstance = function (sIdentity, oConfiguration, oDefaultConfiguration, oComponent) {
		var oConnManager = new cross.fnd.fiori.inbox.util.tools.ConnectionManager({
			identity : sIdentity,
			configuration : oConfiguration,
			defaultConfiguration : oDefaultConfiguration,
			component : oComponent
		});
		oConnManager.initModels();
		return oConnManager;
	};

	return cross.fnd.fiori.inbox.util.tools.ConnectionManager;
});