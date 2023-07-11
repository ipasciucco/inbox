/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
		"cross/fnd/fiori/inbox/controller/BaseController",
		"cross/fnd/fiori/inbox/util/Utils"
	], function (BaseController, Utils) {
		"use strict";

		return BaseController.extend("cross.fnd.fiori.inbox.controller.MultiSelectMessageDialog", {

			oDetailDialogView: null,

			/**
			 * Called when the multi select message controller is instantiated.
			 */
			onInit: function() {
				// Configure dialog.
				var oModel = new sap.ui.model.json.JSONModel();
				oModel.setData({
					title: null,
					messageStripTitle: null,
					items: []
				});
				this.getView().setModel(oModel);
			},

			/**
			 * Prepare and open dialog.
			 *
			 * @param {string} sCurrentAction String with current action name.
			 * @param {array} aSuccessList List with tasks, where action is successful.
			 * @param {array} aErrorList List with tasks, where action is with error.
			 * @param {array} aChangedTasks List with tasks, which must be updated.
			 * @param {function} fnClose Function to be executed after closing the dialog.
			 */
			openDialog: function(sCurrentAction, aSuccessList, aErrorList, aChangedTasks, fnClose) {
				this.sCurrentAction = sCurrentAction;
				this.aSuccessList = aSuccessList;
				this.aErrorList = aErrorList;
				this.aChangedTasks = aChangedTasks;
				this.fnClose = fnClose;

				// Create message view items.
				var i18nBundle = this.getModel("i18n").getResourceBundle();

				var aTableItems = [];

				for (var i = 0; i < aSuccessList.length; i++) {
					var oSuccessItem = {
							type: sap.ui.core.MessageType.Success,
							title: aSuccessList[i].sTaskTitle,
							subtitle: aSuccessList[i].sMessage,
							markupDescription: false // for disabling arrow navigation, this need to be changed to false
					};

					aTableItems.push(oSuccessItem);
				}

				var sActionName = this.sCurrentAction;
				if (this.sCurrentAction === "Claim") {
					sActionName = i18nBundle.getText("DialogMultiMessage_Claim");
				}

				if (this.sCurrentAction === "Release") {
					sActionName = i18nBundle.getText("DialogMultiMessage_Release");
				}

				var sUserInstructions;
                var oErrorStrippedDetails;
				for (var n = 0; n < aErrorList.length; n++) {
					// remove html tags from error object
					oErrorStrippedDetails = Utils.fnRemoveHtmlTags(aErrorList[n]);

					sUserInstructions = this._prapareUserInstructions(oErrorStrippedDetails.sErrorCode, this.sCurrentAction);

					var oErrorItem = {
							type: sap.ui.core.MessageType.Error,
							title: oErrorStrippedDetails.sTaskTitle,
							subtitle: oErrorStrippedDetails.sMessage + " " + sUserInstructions,
							markupDescription: true,
							description: oErrorStrippedDetails.sMessage + " " + sUserInstructions + // Error message for detail page of message view
								"<br><h3>" + i18nBundle.getText("DialogMultiMessage_TechnicalDetailsTitle") + "</h3>" +
								"<p><b>" + i18nBundle.getText("DialogMultiMessage_TaskName") + "</b><br>" + oErrorStrippedDetails.sTaskTitle + "</p>" +
								"<p><b>" + i18nBundle.getText("DialogMultiMessage_ActionName") + "</b><br>" + sActionName + "</p>" +
								"<p><b>" + i18nBundle.getText("DialogMultiMessage_TaskID") + "</b><br>" + oErrorStrippedDetails.InstanceID + "</p>" +
								"<p><b>" + i18nBundle.getText("DialogMultiMessage_ErrorCode") + "</b><br>" + oErrorStrippedDetails.sErrorCode + "</p>" +
								"<p><b>" + i18nBundle.getText("DialogMultiMessage_SourceMessage") + "</b><br>" + oErrorStrippedDetails.sErrorBody + "</p>"
					};

					aTableItems.push(oErrorItem);
				}

				var bHasSuccessAndErrorMessages = false;
				if (aSuccessList.length > 0) {
					bHasSuccessAndErrorMessages = true;
				}

				// Configure dialog.
				var sDialogState = "Error";
				var sDialogTitle = i18nBundle.getText("DialogMultiMessage_Error");
				var sIconSrc = "sap-icon://message-error";
				var sIconColor = "Negative";
				var sIconAlt = "error-icon";
				var sMessageStripTitle;
				var sMessageStripType;
				var bMessageStripVisible = false;

				if (aTableItems.length > 1) {
					sMessageStripType = "Error";
					if (bHasSuccessAndErrorMessages) {
						sDialogState = "Warning";
						sIconSrc = "sap-icon://message-warning";
						sIconColor = "Critical";
						sIconAlt = "warning-icon";
						sMessageStripType = "Warning";
					}
					bMessageStripVisible = true;
					if (this.sCurrentAction === "Claim") {
						sDialogTitle = i18nBundle.getText("DialogMultiMessage_ClaimTitle");
						if (bHasSuccessAndErrorMessages) {
							sMessageStripTitle = i18nBundle.getText("DialogMultiMessage_ClaimInfoSome");
						}
						else {
							sMessageStripTitle = i18nBundle.getText("DialogMultiMessage_ClaimInfoAll");
						}
					}

					if (this.sCurrentAction === "Release") {
						sDialogTitle = i18nBundle.getText("DialogMultiMessage_ReleaseTitle");
						if (bHasSuccessAndErrorMessages) {
							sMessageStripTitle = i18nBundle.getText("DialogMultiMessage_ReleaseInfoSome");
						}
						else {
							sMessageStripTitle = i18nBundle.getText("DialogMultiMessage_ReleaseInfoAll");
						}
					}
				}

				var oModel = this.getModel();
				oModel.setData({
					dialogState: sDialogState,
					dialogTitle: sDialogTitle,
					iconSrc: sIconSrc,
					iconColor: sIconColor,
					iconAlt: sIconAlt,
					messageStripTitle: sMessageStripTitle,
					messageStripType: sMessageStripType,
					messageStripVisible: bMessageStripVisible,
					items: aTableItems
				});
				this.setModel(oModel);

				var oDialog = this.byId("multiSelectMessageDialog");
				// keyboard escape handler
				oDialog.setEscapeHandler(function(oPromise) {
					this.onClosePress();
					oPromise.resolve();
				}.bind(this));

				this.byId("messageView").navigateBack(); // this is needed to bring back messageView mode to list view, if it is closed, when it is on the detials mode

				// Display dialog.
				oDialog.open();
			},

			/**
			 * Prapare instructions for user.
			 *
			 * @param {string} sErrorCode Error code.
			 * @param {string} sAction Action performed to the task.
			 *
			 * @returns {string} Instructions for user.
			 *
			 * @private
			 */
			_prapareUserInstructions: function(sErrorCode, sAction) {
				if (sErrorCode === "/IWBEP/CX_MGW_BUSI_EXCEPTION" && sAction === "Claim" || sErrorCode === "403") {
					return this.getModel("i18n").getResourceBundle().getText("DialogMultiMessage_RefreshInstructions");
				}
				return this.getModel("i18n").getResourceBundle().getText("DialogMultiMessage_ContactSystemAdministratorInstructions");
			},

			/**
			 * Method for operating what to happen when select item on message view list.
			 */
			onItemSelect: function() {
				// if the message item is only one, message view select it automatically and navigate to details
				// if there are more than one message items, there is need to set visible the backButton
				if (this.aSuccessList.length + this.aErrorList.length > 1) {
					this.byId("multiSelectMessageDialogNavBackButton").setVisible(true);
					this.byId("messageStrip").setVisible(false);
				}
			},

			/**
			 * Method for backButton press function. Navigate back to list view and set backButton to be not visible.
			 */
			handleBackButtonPress: function() {
				this.byId("multiSelectMessageDialogNavBackButton").setVisible(false);
				this.byId("messageStrip").setVisible(true);
				this.byId("messageView").rerender(); // this is needed to reset scroll in messageView details
				this.byId("messageView").navigateBack(); // this is needed to bring back messageView mode to list view, on backButton press
			},

			/**
			 * Method for closing dialog and destroying dialog's custom header.
			 */
			closeDialog: function() {
				var oDialog = this.byId("multiSelectMessageDialog");
				oDialog.close();
				this.byId("multiSelectMessageDialogNavBackButton").setVisible(false);
				this.byId("messageView").rerender(); // this is needed to reset scroll in messageView details
			},

			/**
			 * On dialog's close button pressed this method close the dialog and invoke close function.
			 */
			onClosePress: function() {
				this.closeDialog();

				if (this.fnClose) {
					this.fnClose(this.aChangedTasks);
				}
			}
		});
	}
);