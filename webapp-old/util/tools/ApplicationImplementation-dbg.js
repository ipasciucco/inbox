/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/thirdparty/jquery",
	"sap/ui/base/ManagedObject",
	"sap/ui/model/resource/ResourceModel",
	"sap/ui/Device",
	"sap/ui/core/routing/HashChanger",
	"sap/base/util/UriParameters",
	"sap/base/Log",
	"sap/m/GroupHeaderListItem",
	"cross/fnd/fiori/inbox/util/tools/ConnectionManager",
	"cross/fnd/fiori/inbox/util/tools/MasterHeaderFooterHelper",
	"cross/fnd/fiori/inbox/util/tools/DetailHeaderFooterHelper",
	"cross/fnd/fiori/inbox/util/tools/FullScreenHeaderFooterHelper"
], function(
	jQuery,
	ManagedObject,
	ResourceModel,
	Device,
	HashChanger,
	uriParameters,
	modelLogMessage,
	GroupHeaderListItem,
	ConnectionManager,
	MasterHeaderFooterHelper,
	DetailHeaderFooterHelper,
	FullScreenHeaderFooterHelper
) {
	"use strict";

	return ManagedObject.extend("cross.fnd.fiori.inbox.util.tools.ApplicationImplementation", {
		metadata : {
			properties : {
				identity : "string",
				component : "object",
				oViewHook : "string"
			},
			methods : ["getConnectionManager"]
		},

		init : function () {

		},

		sI18N : "i18n",

		startApplication : function (oConfiguration) {
			this.bManualMasterRefresh = false;
			// helpers need access to configuration
			this.oConfiguration = oConfiguration;
			this.oMHFHelper = new MasterHeaderFooterHelper(this);
			this.oDHFHelper = new DetailHeaderFooterHelper(this);
			this.oFHFHelper = new FullScreenHeaderFooterHelper(this);
			this.aMasterKeys = oConfiguration.getMasterKeyAttributes();
			this.aKeyValues = null;
			this.mApplicationModels = {};

			this.AppI18nModel = this.getComponent().getModel("i18n");

			var oComponent = this.getComponent();
			if (!sap.ui.getCore().getConfiguration().getDisableCustomizing()) {
				var oMetadata = oComponent.getMetadata();
				if (oMetadata) {
					var oExtServices = oMetadata.getConfig("sap.ca.i18Nconfigs");
					if (oExtServices.bundleName) {
						this.AppI18nModel.enhance(oExtServices);
					}
				}
			}

			this.UilibI18nModel = this.getComponent().getModel("i18n");

			this.oConnectionManager = ConnectionManager.getNewInstance(this.getIdentity(),
					this.oConfiguration, {}, this.getComponent());

			this.bIsPhone = Device.system.phone;
			this.bIsIPad  = Device.system.tablet;

			var oHookPage = sap.ui.getCore().byId(this.getOViewHook());
			oHookPage.setModel(this.AppI18nModel, this.sI18N);

			//register on device orientation change
			this.oCurController = {};
			this.oCurController.MasterCtrl = null;
			this.oCurController.DetailCtrl = null;
			this.oCurController.FullCtrl = null;
			Device.orientation.attachHandler(this.onChangeDeviceOrientation, this);

			this.registerExitModule(jQuery.proxy(this.onAppExit, this));
		},

		onAppExit: function () {
			Device.orientation.detachHandler(this.onChangeDeviceOrientation, this);
		},

		getResourceBundle : function () {
			return this.AppI18nModel.getResourceBundle();
		},

		getUiLibResourceBundle : function () {
			return this.UilibI18nModel.getResourceBundle();
		},

		getODataModel : function (sName) {
			if (sName === this.sI18N) {
				return this.AppI18nModel;
			}
			return this.oConnectionManager.getModel(sName);
		},

		setModels : function (oController) {
			var view = oController.getView();
			view.setModel(this.AppI18nModel, this.sI18N);
			// FIXME: this should not be needed but don't work if not here
			view.setModel(this.getComponent().getModel("device"), "device");

			jQuery.each(this.oConnectionManager.modelList, function (name, model) {
				if (name === "undefined") {
					view.setModel(model);
				}
				else {
					view.setModel(model, name);
				}
			});
		},

		isMock: function () {
			// The "reponder" URL parameter defines if the app shall run with mock
			// data
			var responderOn = uriParameters.fromURL(window.location.href).get("responderOn");

			// set the flag for later usage
			return (responderOn === "true");
		},

		getConnectionManager: function () {

			return this.oConnectionManager;
		},

		isDetailNavigationPossible: function (oController, sCurrentHash) {
			var oList = oController.getList();
			if (oList) {
				var oListItem = oList.getSelectedItem();
				if (oListItem === null) {
					return false;
				}
				if (oController.getDetailRouteName === undefined) {
					//baseMasterController is used
					var sPath = oListItem.getBindingContext(oController.sModelName).getPath().substr(1);
					if (sPath.indexOf("/")) {
						// if sPath contains a '/' the router will break; needs to be encoded here
						// since the application cannot overwrite this;
						sPath = encodeURIComponent(sPath);
					}
					if (oController.oRouter.getURL("detail", {contextPath : sPath}) !== sCurrentHash) {
						return true;
					}
				}
				else if (oController.oRouter.getURL(oController.getDetailRouteName(), oController.getDetailNavigationParameters(oListItem)) !== sCurrentHash) {
					return true;
				}
			}
			return false;
		},

		onMasterRefreshed : function (oController) {
			// get Hash before any toDetail navigation
			var oHasher = HashChanger.getInstance();
			var sCurrentHash = oHasher.getHash();
			this.setStoredSelectedItem(oController);
			//check if the manual refresh will trigger a navigation by comparing the current hash with the expected navigation hash
			var bAutoNavigate = false;
			if (this.bManualMasterRefresh === true) {
				bAutoNavigate = this.isDetailNavigationPossible(oController, sCurrentHash);
			}
			this.fireEvent("_OnMasterListRefresh", {bManualRefresh:this.bManualMasterRefresh, bAutoNavigation:bAutoNavigate});
			this.bManualMasterRefresh = false;
		},

		// Called each time the list binding is changed
		onMasterChanged : function (oController) {
			this.oMHFHelper.defineMasterHeaderFooter(oController);
		},

		setStoredSelectedItem : function (oController) {
			if (!this.aKeyValues || this.bManualMasterRefresh === true) {
				return;
			}
			var oList = oController.getList();
			var aItems = oList.getItems();
			oList.removeSelections();
			var bFound = false;
			var oListItem = null;

			// TODO this nested for cycles are nasty must refactor with caution.
			for ( var i = 0; i < aItems.length && !bFound; i++) {
				oListItem = aItems[i];
				if ((oListItem instanceof GroupHeaderListItem)) {
					continue;
				}
				var oItemBinding = oListItem.getBindingContext(oController.sModelName);
				bFound = true;
				for ( var j = 0; bFound && j < this.aKeyValues.length; j++) {
					bFound = this.aKeyValues[j] == oItemBinding.getProperty(this.aMasterKeys[j]);
				}
			}

			// on phone or when the action was triggered by a search (and not a refresh) we are only marking the item as selected (no navigation to it)
			if (this.bIsPhone || (oController._oControlStore && oController._oControlStore.bIsSearching)) {
				if (bFound) {
				// only phone: set line as selected
					oListItem.setSelected(true);
					oList.setSelectedItem(oListItem, true);
				}
				if (oController._oControlStore) {
				  oController._oControlStore.bIsSearching = false;
				}
			}
			else {
				if (!bFound) {
					// if item cannot be found again, then choose first 'real' item
					var oListItem = this.getFirstListItem(oController);
				}
				// if we have an item: select it
				if (oListItem) {
					oController.setListItem(oListItem);
	// Note: The difference between this implementation and the commented one is, that
	// in iPad portrait mode the list will not disappear after the refresh
	/*				oList.fireSelect({
						listItem : oListItem
					});	*/
				}
			}
			this.aKeyValues = null;     // prevent that this is used for future change events
		},

		// set header and footer of a detail page
		defineDetailHeaderFooter : function (oController) {
			this.oDHFHelper.defineDetailHeaderFooter(oController);
			//this.oCurController.DetailCtrl = oController;
		},

		defineFullscreenHeaderFooter : function (oController) {
			this.oFHFHelper.defineHeaderFooter(oController);
			//this.oCurController.FullCtrl = oController;
		},

		setSplitContainer : function (oSplitContainer) {
			this.oSplitContainer = oSplitContainer;
		},

		registerExitModule : function (fExitModule) {
			if (!this.aExitModules) {
				this.aExitModules = [];
				var oComponent = this.getComponent();
				var fAppExit = function () { };

				if (oComponent.exit) {
					fAppExit = jQuery.proxy(oComponent.exit, oComponent);
				}

				oComponent.exit = jQuery.proxy(function () {
					for (var i = 0; i < this.aExitModules.length; i++) {
						this.aExitModules[i]();
					}
					fAppExit();
				}, this);
			}
			this.aExitModules.push(fExitModule);
		},

		setMasterListBinding : function (oController, oBinding) {
			if (oController._oMasterListBinding) {
				oController._oMasterListBinding.detachChange(oController._onMasterListLoaded, oController);
				oController._oMasterListBinding.detachChange(oController._onMasterListChanged, oController);
			}

			oController._oMasterListBinding = oBinding;
			if (oController._oMasterListBinding) {
				oController._oMasterListBinding.attachChange(oController._onMasterListLoaded, oController);
				oController._oMasterListBinding.attachChange(oController._onMasterListChanged, oController);
			}
		},

		onChangeDeviceOrientation : function (mParams) {

	//		var bLandscape = mParams.landscape;
			if (this.oCurController.MasterCtrl && this.oCurController.MasterCtrl._oHeaderFooterOptions) {
				this.oMHFHelper.setHeaderFooter(this.oCurController.MasterCtrl, this.oCurController.MasterCtrl._oHeaderFooterOptions, this.oCurController.MasterCtrl._oControlStore.bAllDisabled, true);
			}
			if (this.oCurController.DetailCtrl && this.oCurController.DetailCtrl._oHeaderFooterOptions) {
				this.oDHFHelper.setHeaderFooter(this.oCurController.DetailCtrl, this.oCurController.DetailCtrl._oHeaderFooterOptions, true);
			}
			if (this.oCurController.FullCtrl && this.oCurController.FullCtrl._oHeaderFooterOptions) {
				this.oFHFHelper.setHeaderFooter(this.oCurController.FullCtrl, this.oCurController.FullCtrl._oHeaderFooterOptions, true);
			}
		},

			/**
			 * Store a sap.ui.model instance in a global hashmap for the application.
			 * This is used to allow apps to share models between different views.
			 * The models will not be assigned to the views automatically but can be retrieved and assigned manually.
			 * This is mainly made to have dirty hacks like settings model on sap.ui.getCore() or reading data from the oSplitContainer
			 * @param {string} sName The name for the model (must be non null)
			 * @param {sap.ui.model.Model} oModel the model to store
			 */
			setApplicationModel : function (sName, oModel) {
				if (sName != null) { // eslint-disable-line eqeqeq
					if (this.mApplicationModels.hasOwnProperty(sName)) {
						modelLogMessage.warning("There was already an application model defined for the name " + sName + " it will be overwritten");
					}
					this.mApplicationModels[sName] = oModel;
				}
				else {
					modelLogMessage.error("You cannot set an application Model with a 'null' name");
				}
			},

			/**
			 * Retrieve a model stored in the global hashmap based on its name
			 * @param {string} sName the string of the model to retrieve
			 */
			getApplicationModel : function (sName) {
				var oModel = null;
				if (this.mApplicationModels.hasOwnProperty(sName)) {
					oModel = this.mApplicationModels[sName];
				}
				return oModel;
			},

			// returns the first non-group item of the master list
			getFirstListItem : function (oController) {
				var oList = oController.getList(),
					aItems = oList.getItems();
				for (var i = 0; i < aItems.length; i++) {
					if (!(aItems[i] instanceof GroupHeaderListItem)) {
						return aItems[i];
					}
				}
				return null;
			}
	});
});
