/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
		"sap/ui/base/Object",
		"sap/m/MessageBox",
		"cross/fnd/fiori/inbox/util/Utils"
	], function (UI5Object, MessageBox, Utils) {
		"use strict";

		return UI5Object.extend("cross.fnd.fiori.inbox.controller.ErrorHandler", {
			bIsMetadataLoadedFailed: null,

			/**
			 * Handles application errors by automatically attaching to the model events and displaying errors when needed.
			 * @class
			 * @param {sap.ui.core.UIComponent} oComponent reference to the app's component
			 * @public
			 * @alias cross.fnd.fiori.inbox.controller.ErrorHandler
			 */
			constructor : function (oComponent) {
				this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
				this._oComponent = oComponent;
				this._oModel = oComponent.getModel();
				this._bMessageOpen = false;
				this._sErrorText = this._oResourceBundle.getText("errorText");

				this._oModel.attachMetadataFailed(function (oEvent) {
					this.setIsMetadataLoadedFailed(true);
					var oParams = oEvent.getParameters();
					this._showServiceError(oParams.response);
				}, this);

				this._oModel.attachRequestFailed(function (oEvent) {
					var oParams = oEvent.getParameters();
					this._showServiceError(oParams.response);
				}, this);
			},

			/**
			 * Shows a {@link sap.m.MessageBox} when a service call has failed.
			 * Only the first error message will be display.
			 * @param {string} sDetails a technical error to be displayed on request
			 * @private
			 */
			_showServiceError : function (sDetails) {
				if (this._bMessageOpen) {
					return;
				}
				this._bMessageOpen = true;

				// remove html tags from input
				var oHtmlStrippedDetails = Utils.fnRemoveHtmlTags(sDetails);

				MessageBox.error(
					this._sErrorText,
					{
						details: oHtmlStrippedDetails,
						styleClass: this._oComponent.getContentDensityClass(),
						actions: [MessageBox.Action.CLOSE],
						onClose: function () {
							this._bMessageOpen = false;
						}.bind(this)
					}
				);
			},

			/**
			 * Change parameter bMessageOpen.
			 *
			 * @param {boolean} bMessageOpen if set to true it prevent error message box to open,
			 * if set to false error message box will be opened when need it.
			 */
			preventErrorMessageBoxToOpen : function (bMessageOpen) {
				this._bMessageOpen = bMessageOpen;
			},

			/**
			 * Convenience method for getting the Metadata loaded failed state.
			 * @public
			 * @returns {boolean} the Metadata loaded failed state
			 */
			getIsMetadataLoadedFailed : function () {
				return this.bIsMetadataLoadedFailed;
			},

			/**
			 * Convenience method for setting the Metadata loaded state if failed.
			 * @public
			 * @param {boolean} bIsFailed the Metadata loaded failed state
			 */
			setIsMetadataLoadedFailed : function (bIsFailed) {
				this.bIsMetadataLoadedFailed = bIsFailed;
			}
		});
	}
);