/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"cross/fnd/fiori/inbox/model/models",
	"cross/fnd/fiori/inbox/model/ModelsHelper",
	"cross/fnd/fiori/inbox/util/Utils",
	"cross/fnd/fiori/inbox/util/ConfirmationDialogManager"
], function(models, ModelsHelper, Utils, ConfirmationDialogManager) {
	"use strict";

	return {
		//keeps info for tasks to be removed after some task action in form {index : value, SAP__Origin : value}.
		_tasksPendingRemoval: [],

		/**
		 * Prepares data and opens Confirmation Dialog when action is selected from MenuButton.
		 *
		 *
		 * @param {string} sDecisionKey - decision key needed to identify what is the custom action
		 * @param {string} sButtonText - the text of the button/menu used for error handling.
		 * @param {Object} oTask - task object with all properties according to TCM
		 * @param {string} sContextPath - binding context path of the column list item (current task object).
		 * @param {Object} sController - controller invoking the method.
		 */
		processCustomAction: function(sDecisionKey, sButtonText, oTask, sContextPath, sController) {
			delete this._bCompletedTaskIsDifferentFromDetail;

			if (typeof sContextPath === "undefined") {
				sContextPath = this._sPressedItemContextPath;
			}
			else if (sContextPath !== this._sPressedItemContextPath) {
				// an unselected task is updated via the table
				this._bCompletedTaskIsDifferentFromDetail = true;
			}

			//get the string after the last '/' symbol, which represent the index in model
			var index = sContextPath.slice(sContextPath.lastIndexOf("/") + 1);

			//convert index from string to decimal int (base 10).
			index = parseInt(index, 10);

			if (!isNaN(index)) { //if index is a number push it to the array for removal.
				this._tasksPendingRemoval.push({ "index": index, "SAP__Origin": oTask.SAP__Origin });
			}

			// This object is created for convenience. It is used in callCustomAction() and getKeyForResponseOption()
			var oDecision = {
				DecisionKey: sDecisionKey,
				InstanceID: oTask.InstanceID,
				TaskDefinitionID: oTask.TaskDefinitionID,
				SAP__Origin: oTask.SAP__Origin
			};
			var keyResponseOption = ModelsHelper.getKeyForResponseOption(oDecision);
			var responseOption = models.getResponseOptionsModel().getData()[keyResponseOption];
			var bCommentMandatory = !!responseOption.CommentMandatory;
			var bCommentSupported = !!responseOption.CommentSupported;

			/* This object is needed for predefined reasons area of Confirmation Dialog.
			   show: 			Whether predefined reasons menu will be shown.
			   required: 		Whether selecting predefined reason is mandatory to submit action. 
								   If "true" and reason not entered, "Submit" button will be inactive.
			   reasonOptions: 	Array of reasons available for the action. Copy of array is important because ConfirmationDialogManager
								  modifies it, which in turn will change the original data in the responseOptionsModel.
			*/
			var reasonOptionsSettings =
			{
				"show": !!responseOption.ReasonRequired
					&& (responseOption.ReasonRequired === "REQUIRED" || responseOption.ReasonRequired === "OPTIONAL")
					&& responseOption.ReasonDefinitionsData.length > 0,
				"required": responseOption.ReasonRequired === "REQUIRED",
				"reasonOptions": [].concat(responseOption.ReasonDefinitionsData)
			};

			/*
			   question: 		Dialog confirmation text of selected action.
			   showNote: 		Whether "Decision Note" input field will be shown.
			   noteMandatory: 	If "true" and note "Decision Note" not entered "Submit" button is disabled.
			   sNote: 			Contain "Decision Note" typed in Confirmation Dialog. In Decision request it is send as (Comments=sNote).
			   sReasonCode: 	"ReasonCode" for reason selected in Confirmation Dialog field "Decision Reason".
			*/
			ConfirmationDialogManager.showDecisionDialog({
				question: sController.getResourceBundle().getText("XMSG_DECISION_QUESTION", sButtonText),
				textAreaLabel: sController.getResourceBundle().getText("XFLD_TextArea_Decision"),
				showNote: bCommentSupported,
				title: sController.getResourceBundle().getText("XTIT_SUBMIT_DECISION"),
				confirmButtonLabel: sController.getResourceBundle().getText("XBUT_SUBMIT"),
				noteMandatory: bCommentMandatory,
				i18nModel: sController.getModel("i18n"),
				reasonOptionsSettings: reasonOptionsSettings,
				confirmActionHandler: function(oDecision, sNote, sReasonCode) {
					models.callCustomAction(oDecision, this.customActionSuccess.bind(this), this.customActionError.bind(this, sButtonText), sNote, sReasonCode);
				}.bind(this, oDecision),
				cancelActionHandler: this.cancelActionHandler.bind(this)
			});

			sController.getOwnerComponent().getErrorHandler().preventErrorMessageBoxToOpen(true);
		},

		/**
		 * Success handler for custom action execution.
		 *
		 * @param {Object} oData - oData result(TCM task object) from the service after custom action was executed
		 * @param {Object} response - actual response with headers, body, status and other properties.
		 */
		customActionSuccess: function(oData, response) {
			//get the first element from the array so that the removal is processed in queue.
			var taskToRemove = this._tasksPendingRemoval.shift();
			var taskStatus = response.data.Status;

			//Check if task need to be removed from the table
			if (taskStatus === "COMPLETED") {
				//reindex items greater then taskToRemove.index
				for (var i = 0; i < this._tasksPendingRemoval.length; i++) {
					if (this._tasksPendingRemoval[i].index > taskToRemove.index) {
						this._tasksPendingRemoval[i].index--;
					}
				}

				// Remove task from the table
				models.getTaskModel().getData().results.splice(taskToRemove.index, 1);
				models.getTaskModel().getData().__count--;
				models.getTaskModel().updateBindings();
			}

			models.fireEvent("customActionSuccess", { "taskStatus": taskStatus, "taskToRemove": taskToRemove });
		},

		/**
		 * Error handler for custom action execution
		 *
		 * @param {string} sActionText - the button text used for proper message.
		 * @param {Object} oError - error object with responseText, header, message and other properties.
		 */
		customActionError: function(sActionText, oError) {
			var taskToRemove = this._tasksPendingRemoval.shift();
			var task = models.getTaskModel().getData().results[taskToRemove.index];
			var aSelectedTasks = [task],
				aSuccessList = [],
				aErrorList,
				response;

			// Handle case of non JSON error. (This is error returned from mock server when mock request is not maintained.)
			if (Utils.isJson(oError.responseText)) {
				response = JSON.parse(oError.responseText);
				aErrorList = [{
					sTaskTitle: task.TaskTitle,
					InstanceID: task.InstanceID,
					sMessage: response.error.message.value,
					sErrorCode: response.error.code,
					sErrorBody: response.error.message.value
				}];
			}
			else if (Utils.isString(oError.responseText)) {
				aErrorList = [{
					sTaskTitle: task.TaskTitle,
					InstanceID: task.InstanceID,
					sMessage: Utils.isString(oError.message) ? oError.message : "Error message cannot be parsed",
					sErrorCode: Utils.isString(oError.statusCode) ? oError.statusCode : "Error code cannot be parsed",
					sErrorBody: oError.responseText
				}];
			}

			models.fireEvent("customActionError", {
				"sCurrentAction": sActionText,
				"aSuccessList": aSuccessList,
				"aErrorList": aErrorList,
				"aSelectedTasks": aSelectedTasks
			});
		},

		/**
		 * Confirmation dialog cancel handler.
		 */
		cancelActionHandler: function() {
			this._tasksPendingRemoval.pop();
		}
	};
});
