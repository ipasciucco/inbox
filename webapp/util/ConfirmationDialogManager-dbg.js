/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/library",
	"sap/ui/core/Fragment",
	"sap/base/Log",
	"sap/ui/thirdparty/jquery"
], function(Object, JSONModel, library, Fragment, BaseLog, jQuery) {
	"use strict";

	var ValueState = library.ValueState;

	return {
		AppI18nModel : null,

		/**
		 * Creates and opens a decision dialog dialog
		 * @param {object} oDialogSettings  Settings for the dialog
		 */
		showDecisionDialog: function(oDialogSettings) {
			if (oDialogSettings.i18nModel) {
				this.AppI18nModel = oDialogSettings.i18nModel;
			}
			else {
				this.AppI18nModel = cross.fnd.fiori.inbox.util.tools.Application.getImpl().AppI18nModel;
			}
			oDialogSettings = this._initializeDialogSettings(oDialogSettings);

			this.confirmationDialogModel = new JSONModel({
				submitButtonEnabled: !oDialogSettings.noteMandatory && !oDialogSettings.reasonOptionsSettings.required,
				dialogSettings: oDialogSettings,
				reasonOptionsSettings: oDialogSettings.reasonOptionsSettings
			});

			this.confirmationDialogPromise = Fragment.load({
				type: "XML",
				name: "cross.fnd.fiori.inbox.frag.ConfirmationDialog",
				controller: this
			}).then(function(confirmationDialogFragment) {
				confirmationDialogFragment.setModel(this.confirmationDialogModel);
				confirmationDialogFragment.setModel(this.AppI18nModel, "i18n");
				confirmationDialogFragment.open();

				return confirmationDialogFragment;
			}.bind(this))
			.catch(function() {
				BaseLog.error("Confirmation dialog was not created successfully");
			});
		},

		/**
		 * Load the reason options which are part of this decision option.
		 * (This function is not used in TaskCenter. reasonOptionsSettings are prepared before this dialog is opened.)
		 * @param {object} oDecision - a decision option which reason options will be loaded
		 * @param {object} oDataManager - The data manager object used for the creation of the request.
		 *
		 * @returns {Promise} - containing if resolved an array of reason options see Task Consumption Model for more info
		 */
		loadReasonOptions: function(oDecision, oDataManager) {
			if (oDataManager.checkFunctionImportExistsInMetadata(oDataManager.FUNCTION_IMPORT_REASONOPTIONS)) {
				return new Promise(function(resolve, reject) {
					oDataManager.readReasonOptions(oDecision.SAP__Origin, oDecision.InstanceID, oDecision.DecisionKey, function(reasonOptions) {
						var reasonOptionsSettings = {
							show: (oDecision.ReasonRequired === "REQUIRED" || oDecision.ReasonRequired === "OPTIONAL") && reasonOptions.length > 0,
							required: oDecision.ReasonRequired === "REQUIRED",
							reasonOptions: reasonOptions
						};

						resolve(reasonOptionsSettings);
					},
					function(oError) {
						reject(oError);
					});
				});
			}
			else {
				return null;
			}
		},

		/**
		 * Submit handler for the confirmation dialog
		 */
		handleSubmit: function() {
			this.confirmationDialogPromise.then(function(confirmationDialog) {
				var oDialogSettings = this.confirmationDialogModel.getData().dialogSettings;
				var reasonOptionsSettings = this.confirmationDialogModel.getData().reasonOptionsSettings;

				// Get the reason option value from the combo box
				// No additional specificity added to lint ignore comment as it does not pass lint checks on gerrit otherwise
				// eslint-disable-next-line
				var reasonOptionSelectedItem = reasonOptionsSettings.show ? sap.ui.getCore().byId("reasonOptionsSelect").getSelectedItem() : null;

				var sReasonCode = reasonOptionSelectedItem !== null && reasonOptionSelectedItem.getKey() !== "defaultSelectedKey" ? reasonOptionSelectedItem.getKey() : null;

				// Get the note value from the text area
				// No additional specificity added to lint ignore comment as it does not pass lint checks on gerrit otherwise
				// eslint-disable-next-line
				var sNote = oDialogSettings.showNote ? sap.ui.getCore().byId("confirmDialogTextarea").getValue() : null;

				// Execute the passed confirmation handler
				oDialogSettings.confirmActionHandler(sNote, sReasonCode);

				confirmationDialog._bClosedViaButton = true;
				confirmationDialog.close();
			}.bind(this));
		},

		/**
		 * Cancel handler for the confirmation dialog
		 */
		handleCancel: function() {
			var that = this;

			that.confirmationDialogPromise.then(function(confirmationDialog) {
				var oDialogSettings = that.confirmationDialogModel.getData().dialogSettings;

				confirmationDialog._bClosedViaButton = true;
				confirmationDialog.close();
				oDialogSettings.cancelActionHandler();
			});
		},

		/**
		 * Change handler for the reason option combo box
		 *
		 * @param {sap.ui.base.Event} oEvent
		 */
		handleReasonOptionChange: function(oEvent) {
			var comboBox = oEvent.getSource();

			this.confirmationDialogPromise.then(function(confirmationDialog) {
				var comboBoxRequired = this.confirmationDialogModel.getData().reasonOptionsSettings.required;

				// Set the tooltip useful when the currently selected item's text is truncated
				comboBox.setTooltip(comboBox.getValue());

				comboBox.setValueState(comboBox.getSelectedItem() === null ? ValueState.Error : ValueState.None);

				// Special case where if reason options is optional and all 
				// the text is deleted value state should be none (corner case)
				if (!comboBoxRequired && comboBox.getValue() === "") {
					comboBox.setValueState(ValueState.None);
				}
				// Special case where if value in combo box gets partially deleted by the user
				// there is no selection yet button is not disabled
				if (!comboBoxRequired && comboBox.getValue() !== "" && comboBox.getSelectedItem() === null) {
					confirmationDialog.getBeginButton().setEnabled(false);
					return;
				}
				// Update the submit button state (disabled / enabled)
				this._toggleSubmitButtonState();
			}.bind(this));
		},

		/**
		 * Live change handler for the note (textarea) control
		 */
		handleNoteLiveChange: function() {
			this._toggleSubmitButtonState();
		},

		/**
		 * On close handler to clean the dialog
		 * removes it from the dom as well so to not have duplicate id error
		 */
		handleAfterClose: function() {
			var that = this;

			that.confirmationDialogPromise.then(function(confirmationDialog) {
				if (confirmationDialog._bClosedViaButton) {
					// dialog is closed via button
					delete confirmationDialog._bClosedViaButton;
				}
				else {
					// dialog is closed by other means (e.g. pressing Escape)
					var oDialogSettings = that.confirmationDialogModel.getData().dialogSettings;

					oDialogSettings.cancelActionHandler();
				}

				confirmationDialog.destroy();
			}.bind(this));
		},

		/**
		 * In case of optional reason option combo box a (None) option
		 * is created as to have a default selection 
		 *
		 * @param {object} oDialogSettings - the dialog settings 
		 */
		_buildNoneOption: function(oDialogSettings) {
			if (oDialogSettings.reasonOptionsSettings && 
				oDialogSettings.reasonOptionsSettings.reasonOptions &&
				!oDialogSettings.reasonOptionsSettings.required ) {

				var noneText = "(" + this.AppI18nModel.getResourceBundle().getText("XSEL_DECISION_REASON_NONE_OPTION") + ")";
				oDialogSettings.reasonOptionsSettings.reasonOptions.unshift({
					Name: noneText,
					Code: "defaultSelectedKey"
				});
			}
		},

		/**
		 * Setup some default dialog settings values for its properties if not present
		 * @param {object} oDialogSettings  Settings for the dialog
		 * @returns {object} Returns copy of all setting provided with oDialogSettings
		 */
		_initializeDialogSettings: function(oDialogSettings) {
			this._buildNoneOption(oDialogSettings);

			return jQuery.extend({
				noteMandatory: false,
				question: "",
				title: "",
				confirmButtonLabel: "",
				showNote: false,
				reasonOptionsSettings: {
					show: false,
					required: false
				},
				confirmActionHandler : function() {
					return;
				},
				cancelActionHandler: function() {
					return;
				},
			}, oDialogSettings);
		},

		/**
		 * Disables on enables the submit (confirmation) button depending on the controls state (value, isRequired)
		 */
		_toggleSubmitButtonState: function() {
			var dialogData = this.confirmationDialogModel.getData();

			var noteRequired = dialogData.dialogSettings.noteMandatory;
			// No additional specificity added to lint ignore comment as it does not pass lint checks on gerrit otherwise
                  	// eslint-disable-next-line
			var noteFilled = sap.ui.getCore().byId("confirmDialogTextarea").getValue().trim().length > 0;
			var comboBoxRequired = dialogData.reasonOptionsSettings.required;
			// No additional specificity added to lint ignore comment as it does not pass lint checks on gerrit otherwise
                  	// eslint-disable-next-line
			var comboBoxFilled = sap.ui.getCore().byId("reasonOptionsSelect").getSelectedItem() !== null;

			var noteFlag = (noteRequired && noteFilled) || !noteRequired;
			var comboBoxFlag = (comboBoxRequired && comboBoxFilled) || !comboBoxRequired;

			this.confirmationDialogModel.setProperty("/submitButtonEnabled", noteFlag && comboBoxFlag);
		}
	};
}, true);
