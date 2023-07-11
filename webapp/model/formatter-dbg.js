/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/core/format/DateFormat",
	"sap/ui/core/format/NumberFormat",
	"cross/fnd/fiori/inbox/util/Utils",
	"cross/fnd/fiori/inbox/util/ProcessLogConfig",
	"cross/fnd/fiori/inbox/model/FormatterHelper"
], function (UI5Object, DateFormat, NumberFormat, Utils, ProcessLogConfig, FormatterHelper) {
	"use strict";
	var oProcessLogConfig;

	return {

		/**
		 * This function gets a string with names, for example "John Smith"
		 * and returns initials - "JS".
		 * If there are more than 2 names then the initials will be constructed from
		 * the first letter of the first name and the first letter of the last name.
		 * For example "John Smith Junior" will return "JJ"
		 *
		 * @param {string} sValue A string containing the names.
		 * @returns {string} A string containing the initials.
		 */
		initials : function (sValue) {
			if (!sValue || !Utils.isString(sValue)) {
				return "";
			}
			var names = sValue.split(" ");
			var initials = names[0].substring(0, 1).toUpperCase();

			if (names.length > 1) {
				initials += names[names.length - 1].substring(0, 1).toUpperCase();
			}
			return initials;
		},

		/**
		 * This function gets a string with priority state, for example "High"
		 * and returns a string "Warning". Convert the state to appropriate
		 * format for the control.
		 *
		 * @param {string} sValue A string containing the priority state.
		 * @returns {string} A string containing the formatted priority state.
		 */
		priorityState : function (sValue) {
			if (!sValue || !Utils.isString(sValue)) {
				return "Default";
			}
			else if (sValue.toUpperCase() === "VERY_HIGH") {
				return "Negative";
			}
			else if (sValue.toUpperCase() === "HIGH") {
				return "Critical";
			}
			else if (sValue.toUpperCase() === "LOW") {
				return "Default";
			}
			else {
				return "Default";
			}
		},

		/**
		 * This function gets a string with priority state, for example "High"
		 * and returns a string "Warning". Convert the state to appropriate
		 * format for the control.
		 *
		 * @param {string} sValue A string containing the priority state.
		 * @returns {string} A string containing the formatted priority state.
		 */
		priorityStateOnDetail : function (sValue) {
			if (!sValue || !Utils.isString(sValue)) {
				return "None";
			}
			else if (sValue.toUpperCase() === "VERY_HIGH") {
				return "Error";
			}
			else if (sValue.toUpperCase() === "HIGH") {
				return "Warning";
			}
			else if (sValue.toUpperCase() === "LOW") {
				return "Success";
			}
			else {
				return "None";
			}
		},

		/**
		 * This function gets a string with priority state and returns
		 * a string with sap icon path.
		 *
		 * @param {string} sValue A string containing the priority state.
		 * @returns {string} A string containing sap icon path.
		 */
		priorityIcon : function (sValue) {
			if (!sValue || !Utils.isString(sValue)) {
				return null;
			}
			else if (sValue.toUpperCase() === "VERY_HIGH") {
				return "sap-icon://arrow-top";
			}
			else if (sValue.toUpperCase() === "HIGH") {
				return "sap-icon://trend-up";
			}
			else if (sValue.toUpperCase() === "LOW") {
				return "sap-icon://arrow-bottom";
			}
			else {
				return null;
			}
		},

		/**
		 * This function gets a string with priority state and returns
		 * a string.
		 *
		 * @param {string} sValue A string containing the priority state.
		 * @returns {string} A string containing the text needed for UI.
		 */
		priorityText : function (sValue) {
			var resourceBundle = this.getView().getController().getResourceBundle();
			if (!sValue || !Utils.isString(sValue)) {
				return "";
			}
			else if (sValue.toUpperCase() === "VERY_HIGH") {
				return resourceBundle.getText("Tooltip_VeryHighPriority");
			}
			else if (sValue.toUpperCase() === "HIGH") {
				return resourceBundle.getText("Tooltip_HighPriority");
			}
			else if (sValue.toUpperCase() === "LOW") {
				return resourceBundle.getText("Tooltip_LowPriority");
			}
			else {
				return resourceBundle.getText("Tooltip_MediumPriority");
			}
		},

		/**
		 * This function gets a PriorityNumber containing task Priority and returns an array
		 * containing string that is used for priority group text displayed in the UI and the
		 * group key to be set for the processed task.
		 *
		 * @param {number} iPriorityNumber A number containing the task property "PriorityNumber"
		 * @param {number} oView This is Worklist view
		 *
		 * @returns {array} Pair of string containing test with value of the priority groups to be displayed in UI and key for the group.
		 */
		formatPriorityForGrouping: function(iPriorityNumber, oView) {
			var resourceBundle = oView.getController().getResourceBundle();
			if 	(iPriorityNumber) {
				if (iPriorityNumber <= 2) {
					return [resourceBundle.getText("GroupTitle_VeryHighPriority"), "VERY_HIGH"];
				}
				else if (iPriorityNumber === 3 || iPriorityNumber === 4) {
					return [resourceBundle.getText("GroupTitle_HighPriority"), "HIGH"];
				}
				else if (iPriorityNumber === 5) {
					return [resourceBundle.getText("GroupTitle_MediumPriority"), "MEDIUM"];
				}
				else {
					return [resourceBundle.getText("GroupTitle_LowPriority"), "LOW"];
				}
			}
			else {
				return 	[resourceBundle.getText("GroupTitle_NoPriority"), "NoPriority"];
			}
		},

		/**
		 * This function gets a date and returns a string containing the
		 * formatted date.
		 * For example "Sun Mar 03 2019 00:00:00 GMT+0200 (Eastern European
		 * Standard Time)" will return ""Mar 3, 2019".
		 *
		 * @param {Date} sDate A date for formatting.
		 * @returns {string} A string containing the formatted date.
		 */
		formatDate : function (sDate) {
			if (!sDate || !(sDate instanceof Date)) {
				return "";
			}
			var oFormatOptions = {style: "medium"};
			var oLocale = sap.ui.getCore().getConfiguration().getLocale();
			var oDateFormatter = (oLocale) ? DateFormat.getDateInstance(oFormatOptions, oLocale) : DateFormat.getDateInstance(oFormatOptions);
			var sFormattedDate = oDateFormatter.format(sDate, false);
			return sFormattedDate;
		},

		/**
		 * This function gets a deadline date and returns a string containing
		 * the due state. If the deadline date has passed, it returns
		 * "Error" in other case returns "None".
		 *
		 * @param {Date} sDateDeadLine A date for formatting.
		 * @returns {string} A string containing the due state.
		 */
		dueState : function (sDateDeadLine) {
			var oDate = new Date();
			if (sDateDeadLine && sDateDeadLine instanceof Date && sDateDeadLine - oDate < 0) {
				return "Error";
			}
			else {
				return "None";
			}
		},

		/**
		 * This function gets a string Status and returns
		 * a translated string.
		 *
		 * @param {string} sValue a string containing the status.
		 * @returns {string} A string containing the translated text.
		 */
		formatStatus : function (sValue) {

			var resourceBundle = this.getView().getController().getResourceBundle();

			if (!sValue || !Utils.isString(sValue)) {
				return "";
			}
			else if (sValue.toUpperCase() === "READY") {
				return resourceBundle.getText("TableColumnCellValue_StatusReadyAsOpen");
			}
			else if (sValue.toUpperCase() === "RESERVED") {
				return resourceBundle.getText("TableColumnCellValue_StatusReserved");
			}
			else if (sValue.toUpperCase() === "IN_PROGRESS") {
				return resourceBundle.getText("TableColumnCellValue_StatusInProgress");
			}
			else if (sValue.toUpperCase() === "EXECUTED") {
				return resourceBundle.getText("TableColumnCellValue_StatusExecuted");
			}
			else {
				return sValue;
			}
		},

		/**
		 * This function gets a string Status and returns
		 * a string to highlit state of the row.
		 *
		 * @param {string} sValue A string containing the status.
		 * @returns {string} A string containing the highlit state.
		 */
		formatHighlitByStatus : function (sValue) {

			if (sValue.toUpperCase() === "RESERVED") {
				return "Information";
			}
			else {
				return "None";
			}
		},

		/**
		 * This function gets a string status and returns
		 * a translated string.
		 *
		 * @param {string} status A string containing the status.
		 * @param {number} oView This is Worklist view
		 *
		 * @returns {string} A string containing the translated text.
		 */
		formatStatusForGrouping: function(status, oView) {
			var resourceBundle = oView.getController().getResourceBundle();
			if 	(status) {
				if (!status || !Utils.isString(status)) {
				return "";
				}
				else if (status.toUpperCase() === "READY") {
					return resourceBundle.getText("GroupTitle_StatusReadyAsOpen");
				}
				else if (status.toUpperCase() === "RESERVED") {
					return resourceBundle.getText("GroupTitle_StatusReserved");
				}
				else if (status.toUpperCase() === "IN_PROGRESS") {
					return resourceBundle.getText("GroupTitle_StatusInProgress");
				}
				else if (status.toUpperCase() === "EXECUTED") {
					return resourceBundle.getText("GroupTitle_StatusExecuted");
				}
			}
			return status;
		},

		/**
		 * This function gets SAP__Origin from taskModel and based on its value returns
		 * corresponding DisplayName from systemInfoModel.
		 *
		 * @param {string} sValue A string containing the SAP__Origin.
		 *
		 * @returns {string} A string containing DisplayName.
		 */
		showDisplayName: function(sValue) {
			var dictionary = this.oView.getController().OriginsToDisplayNameDictionary;
			return dictionary[sValue];
		},

		/**
		 * This function gets button visibility depends from if the device is phone and button state.
		 *
		 * @param {boolean} bPhone true if the device is phone
		 * @param {String} sValue value of button state
		 *
		 * @returns {boolean} if it returns true, the Button is visible
		 */
		enterExitFullScreenButtonsVisibility: function(bPhone, sValue) {
			return !bPhone && sValue !== null;
		},

		/**
		 * This function gets Description object and if there is DescriptionAsHtml it returns it formatted.
		 * If there is no DescriptionAsHtml then returns formatted Description.
		 *
		 * @param {Object} oDescription Description object of a task
		 *
		 * @returns {String} formatted description
		 */
		descriptionHtml: function (oDescription) {
			var sString = "";
			if (oDescription) {
				if (oDescription.DescriptionAsHtml) {
					sString = oDescription.DescriptionAsHtml;
				}
				else if (oDescription.Description) {
					sString = oDescription.Description;
				}
			}

			if (sString) {
				var sFinal = sString.replace(/<a /g, "<a target=\"_blank\" rel=\"noreferrer noopener\"");
				sString = "<div class=\"sapMText\">" + sFinal + "</div>";
			}

			return sString;
		},

		/**
		 * This function returns sap icon based on provided Status and ResultType.
		 *
		 * @param {Object} sStatus Status of Workflow Log entry
		 * @param {Object} sResultType ResultType of Workflow Log entry
		 *
		 * @returns {String} sap icon
		 */
		formatterWorkflowLogStatusIcon: function (sStatus, sResultType) {
			var sStatusIcon;
			//Set icon based on log status
			sStatusIcon = this.formatter._getWorkflowLogStatusName(sStatus);
			//Modify icon in case task is approved/rejected
			if (sResultType) {
				if (sResultType.toUpperCase() === "NEGATIVE") {
					sStatusIcon = "REJECTED";
				}
				else if (sResultType.toUpperCase() === "POSITIVE") {
					sStatusIcon = "APPROVED";
				}
			}
			if (!oProcessLogConfig) {
				oProcessLogConfig = ProcessLogConfig.getProcessLogConfig();
			}
			return oProcessLogConfig[sStatusIcon] && oProcessLogConfig[sStatusIcon].icon;
		},

		/**
		 * This function returns status name mapped to provided Status
		 *
		 * @param {Object} sStatus Status of Workflow Log entry
		 *
		 * @returns {String} Status name
		 */
		_getWorkflowLogStatusName: function (sStatus) {
			var sStatusName;
			//Mapping to relevant workflow log status icon names
			switch (sStatus) {
				case "READY":
					sStatusName = "WORKFLOW_TASK_CREATED";
					break;
				case "IN_PROGRESS":
					sStatusName = "WORKFLOW_TASK_IN_PROGRESS";
					break;
				case "COMPLETED":
					sStatusName = "WORKFLOW_TASK_COMPLETED";
					break;
				case "WORKFLOW_STARTED":
					sStatusName = sStatus;
					break;
				case "FOR_RESUBMISSION":
					sStatusName = "WORKFLOW_TASK_SUSPENDEDED";
					break;
				case "CANCELLED":
					sStatusName = "WORKFLOW_TASK_CANCELED";
					break;
				default :
			}
			return sStatusName; //unsupported values are returned as empty
		},

		/**
		 * This function returns username or empty string based on status.
		 * If empty string is returned, username is not shown.
		 *
		 * @param {Object} sName Username of Workflow Log entry
		 * @param {Object} sStatus Status of Workflow Log entry
		 *
		 * @returns {String} Username
		 */
		formatterWorkflowLogUsername: function (sName, sStatus) {
			var sStatusName = this.formatter._getWorkflowLogStatusName(sStatus);
			if (oProcessLogConfig[sStatusName] && oProcessLogConfig[sStatusName].showUsername) {
				return sName;
			}
			return "";
		},

		/**
		 * This function returns status text based on received status and username.
		 * When username is empty, status is returned in impersonal form.
		 *
		 * @param {Object} sStatus Status of Workflow Log entry
		 * @param {Object} sUser Username of Workflow Log entry
		 *
		 * @returns {String} Status text
		 */
		formatterWorkflowLogStatusText: function (sStatus, sUser) {
			if (!oProcessLogConfig) {
				oProcessLogConfig = ProcessLogConfig.getProcessLogConfig();
			}
			var sStatusText;
			if (sUser) {
				sStatusText = this.formatter._getWorkflowLogStatusName(sStatus);
			}
			else {
				sStatusText = this.formatter._getImpersonalWorkflowLogStatusName(sStatus);
			}
			return this.getModel("i18n").getProperty(sStatusText);
		},

		/**
		 * This function returns impersonal status name based on provided status
		 *
		 * @param {Object} sStatus Status of Workflow Log entry
		 *
		 * @returns {String} Status name
		 */
		_getImpersonalWorkflowLogStatusName: function (sStatus) {
			var sStatusName;
			//Mapping to relevant workflow log status icon names
			switch (sStatus) {
				case "READY":
					sStatusName = "IMPERSONAL_WORKFLOW_TASK_CREATED";
					break;
				case "IN_PROGRESS":
					sStatusName = "IMPERSONAL_WORKFLOW_TASK_IN_PROGRESS";
					break;
				case "COMPLETED":
					sStatusName = "IMPERSONAL_WORKFLOW_TASK_COMPLETED";
					break;
				case "WORKFLOW_STARTED":
					sStatusName = "IMPERSONAL_WORKFLOW_STARTED";
					break;
				case "FOR_RESUBMISSION":
					sStatusName = "IMPERSONAL_WORKFLOW_TASK_SUSPENDEDED";
					break;
				case "CANCELLED":
					sStatusName = "IMPERSONAL_WORKFLOW_TASK_CANCELED";
					break;
				default:
			}
			return sStatusName; //unsupported values are returned as empty
		},

		/**
		 * This function formats state text color based on provided Result type
		 *
		 * @param {Object} sResultType Result type of Workflow Log entry
		 *
		 * @returns {enum} Value state
		 */
		formatterWorkflowLogResultState : function (sResultType) {
			switch (sResultType.toUpperCase()) {
				case "POSITIVE":
					return sap.ui.core.ValueState.Success;
				case "NEGATIVE":
					return sap.ui.core.ValueState.Error;
				case "NEUTRAL":
					return sap.ui.core.ValueState.None;
				default:
					return sap.ui.core.ValueState.None;
			}
		},

		getCustomAttributeTypeWorklistFormatter: function (sType, oView, sFormat) {
			var that = this;
			return function customAttributeTypeWorklistFormatter(sValue) {
				return that.customAttributeTypeFormatter(sValue, sType, sFormat, oView);
			};
		},

		/* formats custom attribute values according to the definition provided
		 * and returns back formatted values
		 */
		customAttributeTypeFormatter: function( sValue, sType, sFormat, oView) {
			var iFinalValue;
			sType = FormatterHelper.normalizeCustomAttributeType(sType); 
			var oNumberFormatter = NumberFormat.getInstance();
			var oFloatNumberFormat = NumberFormat.getFloatInstance();
			oView = oView || this;
			var i18nModel = oView.getModel("i18n");
			var tmpValue;
			switch ( sType ) {
				case "Edm.String": {
					if (sFormat && sFormat === "DURATION") {
						iFinalValue = FormatterHelper.formatDuration(sValue, i18nModel);
						break;
					}

					iFinalValue = sValue;
					break;
				}
				case "Edm.Date":
				case "Edm.DateTime": {
					if (typeof sValue === "undefined" || sValue === null || sValue === "") { // This check solves the issue with "Invalid Date" displayed in the empty column when
						iFinalValue = sValue;			   // more that one Task Definiton Type is selected in "task Type" filter.
						break;
					}
					else {
						tmpValue = FormatterHelper.fnTimeParser(sValue);
						if (isNaN(tmpValue)) {
							iFinalValue = "Invalid Date";
						}
						else {
							var oDateFormatter = DateFormat.getDateInstance();
							iFinalValue = oDateFormatter.format(new Date(tmpValue));
						}
					}
					break;
				}
				case "Edm.Boolean" : {
					if ( sValue === "true") {
						iFinalValue = i18nModel.getProperty("CustAttrTrue");
					}
					else if ( sValue === "false") {
						iFinalValue = i18nModel.getProperty("CustAttrFalse");
					}
					break;
				}
				case "Edm.Int64":
				case "Edm.Int32":
				case "Edm.Int16": {
					iFinalValue = oNumberFormatter.format(sValue);
					break;
				}
				case "Edm.Time": {
					if (typeof sValue === "undefined" || sValue === null || sValue === "") {
						iFinalValue = sValue;
						break;
					}
					else {
						tmpValue = FormatterHelper.fnDurationParser(sValue);
						if (isNaN(tmpValue)) {
							iFinalValue = "Invalid Time";
						}
						else {
							var oTimeFormatter = DateFormat.getTimeInstance();
							var	tempDate = new Date();
							tempDate.setUTCHours(0, 0, 0, tmpValue);
							iFinalValue = oTimeFormatter.format(tempDate);
						}
					}
					break;
				}
				case "Edm.Single":
				case "Edm.Double":
				case "Edm.Decimal": {
					iFinalValue = oFloatNumberFormat.format(sValue);
					break;
				}
				default: {
					iFinalValue = sValue;
					break;
				}
			}
			return iFinalValue;
		}
	};
});
