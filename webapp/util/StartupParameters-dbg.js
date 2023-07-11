/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/base/Object",
	"sap/base/util/UriParameters"
], function(UI5Object, UriParameters) {
	"use strict";

	/*	This class is Singleton and collect Startup parameters.
		It can be used when define the path "cross.fnd.fiori.inbox.util.StartupParameters" in the class,
		where will be used and with StartupParameters.getInstance() method.
	*/

	var oInstance;

	var StartupParameters = UI5Object.extend("cross.fnd.fiori.inbox.util.StartupParameters", {
		
		/**
		 * true if flexView or flexibleColumnLayout mode is active and expert mode or outbox is not
		 * and if it is true Task Center app will be opened in the first loading, otherwise My Inbox will be opened.
		 */
		bModeActive: false,

		bFlexibleColumnLayout: false,
		bFlexView: false,
		bExpertMode: false,
		bOutbox: false,

		/**
		 * Constructor which initialize start up parameters from FLP or from url path
		 *
		 * @param {object} oOwnerComponent Component of application
		 */
		constructor: function(oOwnerComponent) {
			if (oOwnerComponent) {
				var oComponentData = oOwnerComponent.getComponentData();
				if (oComponentData) {
					var oStartupParameters = oComponentData.startupParameters;
					this._getURLParametersfromStartUpParameters(oStartupParameters);
				}
				else {
					this._getURLParameters();
				}
				this.bModeActive = !(this.bExpertMode || this.bOutbox) && (this.bFlexibleColumnLayout || this.bFlexView);
			}
		},

		/**
		 * Function sets url parameters to boolean variables
		 *
		 * @constructor
		 * @param {object} oStartupParameters object with data with start up parameters
		 */
		_getURLParametersfromStartUpParameters: function(oStartupParameters) {
			if (oStartupParameters) {
				var oUriParameters = new UriParameters(window.location.href);
				if (oStartupParameters.mode && oStartupParameters.mode.length > 0) {
					this.bFlexibleColumnLayout = oStartupParameters.mode[0] === "flexibleColumnLayout";
					this.bFlexView = oStartupParameters.mode[0] === "flexView";
				}
				else {
					this.bFlexibleColumnLayout = oUriParameters.get("mode") === "flexibleColumnLayout";
					this.bFlexView = oUriParameters.get("mode") === "flexView";
				}
				if (oStartupParameters.expertMode && oStartupParameters.expertMode.length > 0) {
					this.bExpertMode = oStartupParameters.expertMode[0] === "true";
				}
				else {
					this.bExpertMode = oUriParameters.get("expertMode") === "true";
				}
				if (oStartupParameters.outbox && oStartupParameters.outbox.length > 0) {
					this.bOutbox = oStartupParameters.outbox[0] === "true";
				}
				else {
					this.bOutbox = oUriParameters.get("outbox") === "true";
				}
			}
			else {
				this._getURLParameters();
			}
		},

		/**
		 * Function sets url parameters to boolean variables, if there is no FLP information provided
		 *
		 * @constructor
		 */
		_getURLParameters: function() {
			var oUriParameters = new UriParameters(window.location.href);
			this.bFlexibleColumnLayout = oUriParameters.get("mode") === "flexibleColumnLayout";
			this.bFlexView = oUriParameters.get("mode") === "flexView";
			this.bExpertMode = oUriParameters.get("expertMode") === "true";
			this.bOutbox = oUriParameters.get("outbox") === "true";
		},

		/**
		 * Getter function for bFlexibleColumnLayout url parameter
		 *
		 * @returns {boolean} true, if flexibleColumnLayout mode is active
		 */
		isFlexibleColumnLayout: function() {
			return this.bFlexibleColumnLayout;
		},

		/**
		 * Getter function for bFlexView url parameter
		 *
		 * @returns {boolean} true, if flexView mode is active
		 */
		isFlexView: function() {
			return this.bFlexView;
		},

		/**
		 * Getter function for bModeActive url parameter.
		 * Can be used to find out, whether Task Center or My Inbox will be opened on initial loading.
		 *
		 * @returns {boolean} true, if flexView or flexibleColumnLayout mode is active and expert mode or outbox is not
		 */
		isModeActive: function() {
			return this.bModeActive;
		},

		/**
		 * Getter function for bExpertMode url parameter
		 *
		 * @returns {boolean} true, if expert mode is active
		 */
		isExpertMode: function() {
			return this.bExpertMode;
		},

		/**
		 * Getter function for bOutbox url parameter
		 *
		 * @returns {boolean} true, if outbox mode is active
		 */
		isOutbox: function() {
			return this.bOutbox;
		}
	});

	return {
		getInstance: function(oOwnerComponent) {
			if (!oInstance) {
				oInstance = new StartupParameters(oOwnerComponent);
			}
			return oInstance;
		}
	};
});