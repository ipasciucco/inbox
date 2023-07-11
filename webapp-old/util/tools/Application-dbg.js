/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/thirdparty/jquery",
	"sap/m/MessageToast",
	"sap/base/util/ObjectPath",
	"sap/ui/base/ManagedObject",
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device",
	"cross/fnd/fiori/inbox/util/tools/ApplicationFacade",
	"cross/fnd/fiori/inbox/util/tools/ApplicationImplementation",
	"cross/fnd/fiori/inbox/util/tools/ConfigurationBase",
	"cross/fnd/fiori/inbox/Component",
	"sap/ui/model/BindingMode"
], function (
	jQuery,
	MessageToast,
	ObjectPath,
	ManagedObject,
	JSONModel,
	Device,
	ApplicationFacade,
	ApplicationImplementation,
	ConfigurationBase,
	Component,
	BindingMode
) {
	"use strict";

	ManagedObject.extend("cross.fnd.fiori.inbox.util.tools.Application", {
		metadata: {
			properties: {
				identity: "string",
				oViewHook: "string",
				component: "object"
			}
		},

		constructor: function (sId, mSettings) {
			// super
			ManagedObject.apply(this, arguments);

			// wait until Core is initialized to create the models & root component
			sap.ui.getCore().attachInit(jQuery.proxy(function () {

				// call the application controller
				this.main();

			}, this));

		},

		createDeviceModel: function () {
			// set device model
			var deviceModel = new JSONModel({
				isTouch: Device.support.touch,
				isNoTouch: !Device.support.touch,
				isPhone: Device.system.phone,
				isNoPhone: !Device.system.phone,
				listMode: (Device.system.phone) ? "None"
					: "SingleSelectMaster",
				listItemType: (Device.system.phone) ? "Active"
					: "Inactive"
			});
			deviceModel.setDefaultBindingMode(BindingMode.OneWay);
			this.getComponent().setModel(deviceModel, "device");
		},

		main: function () {
			var oApplicationImplementation = new ApplicationImplementation (
				{
					identity: this.getIdentity(),
					oViewHook: this.getOViewHook(),
					component: this.getComponent()
				});

			this.createDeviceModel();

			// create a static method to retrieve this instance
			// (used by BaseMasterController)
			cross.fnd.fiori.inbox.util.tools.Application.getImpl = (function(value) {
				return function() {
					return value;
				};
			}(oApplicationImplementation));

			var oApplicationFacade = new ApplicationFacade (oApplicationImplementation);

			// The Configuration module was moved into this module
			// in order to workaround circular dependency
			this.setConfiguration();

			var oConfigClass = ObjectPath.get(this.getIdentity() + ".Configuration");
			var oConfiguration = new oConfigClass();
			oConfiguration._setApplicationFacade(oApplicationFacade);

			// show message if in demo mode
			if (oApplicationImplementation.isMock()) {
				var msg = "Running in demo mode with mock data";
				MessageToast.show(msg, {
					duration: 1000
				});
			}
			oApplicationImplementation.startApplication(oConfiguration);
		},

		setConfiguration: function() {
			ConfigurationBase.extend("cross.fnd.fiori.inbox.Configuration", {

				oServiceParams: {
					serviceList: [
						{
							name: "TASKPROCESSING",
							masterCollection: "TaskCollection",
							serviceUrl: (function() {
								var tcmURL = "";
								//Get tcmURL from component data
								var sComponentData = cross.fnd.fiori.inbox.util.tools.Application.getImpl().getComponent().getComponentData();
								if (sComponentData && sComponentData.startupParameters && sComponentData.startupParameters.tcmURL) {
									tcmURL = sComponentData.startupParameters.tcmURL[0];
								}
								//If tcmURL exists in component data, consider it, else consder default from manifest entry
								if (tcmURL) {
									// For workflow service on CF similar to "/comsapbpmworkflow.crossfndfioriinbox/~210220081704+0000~""
									// Fon One Inbox service will contain too ".crossfndfioriinbox"
									if (-1 < sap.ui.require.toUrl("cross/fnd/fiori/inbox").indexOf(".crossfndfioriinbox")) {
										return sap.ui.require.toUrl("cross/fnd/fiori/inbox") + tcmURL;
									}
									else {
										return tcmURL;
									}
								}
								else {
									return Component.getMetadata().getManifestEntry("sap.app").dataSources["TASKPROCESSING"].uri;
								}
							})(),
							isDefault: true,
							mockedDataSource: sap.ui.require.toUrl("cross/fnd/fiori/inbox") + "/" + Component.getMetadata().getManifestEntry("sap.app").dataSources["TASKPROCESSING"].settings.localUri,
							useBatch: true,
							useV2ODataModel:true,
							noBusyIndicator:true,
							fRequestFailed: function(oEvent) {
								var oComponent = cross.fnd.fiori.inbox.util.tools.Application.getImpl().getComponent();
								oComponent.getDataManager().handleRequestFailed(oEvent);
							}
						},
						{
							name: "POSTACTION",
							masterCollection: "TaskCollection",
							serviceUrl: (function () {
								var tcmURL = "";
								//Get tcmURL from component data
								var sComponentData = cross.fnd.fiori.inbox.util.tools.Application.getImpl().getComponent().getComponentData();
								if (sComponentData && sComponentData.startupParameters && sComponentData.startupParameters.tcmURL) {
									tcmURL = sComponentData.startupParameters.tcmURL[0];
								}
								//If tcmURL exists in component data, consider it, else consder default from manifest entry
								if (tcmURL) {
									// For workflow service on CF similar to "/comsapbpmworkflow.crossfndfioriinbox/~210220081704+0000~""
									// Fon One Inbox service will contain too ".crossfndfioriinbox"
									if (-1 < sap.ui.require.toUrl("cross/fnd/fiori/inbox").indexOf(".crossfndfioriinbox")) {
										return sap.ui.require.toUrl("cross/fnd/fiori/inbox") + tcmURL;
									}
									else {
										return tcmURL;
									}
								}
								else {
									return Component.getMetadata().getManifestEntry("sap.app").dataSources["TASKPROCESSING"].uri;
								}
							})(),
							isDefault: false,
							useBatch: true,
							useV2ODataModel:true,
							noBusyIndicator:true,
							fRequestFailed: function(oEvent) {
								var oComponent = cross.fnd.fiori.inbox.util.tools.Application.getImpl().getComponent();
								oComponent.getDataManager().handleRequestFailed(oEvent);
							}
						}
					]
				},

				getServiceParams: function () {
					return this.oServiceParams;
				},

				/**
				 * @inherit
				 */
				getServiceList: function () {
					return this.oServiceParams.serviceList;
				},

				/**
				* Indicates whether stable IDs should be generated for buttons.
				* This method overrides same method from ConfigurationBase. It is introduced in order to use
				* stable ID for Log button ("LogButtonID")
				*
				* @Original name cross.fnd.fiori.inbox.util.tools.ConfigurationBase#isUsingStableIds
				* @returns {boolean} true if the application uses stable IDs.
				*/
				isUsingStableIds : function () {
					return true;
				},

				getMasterKeyAttributes : function() {
					return ["Id"];
				}

			});
		}
	});
	return cross.fnd.fiori.inbox.util.tools.Application;
});
