/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"cross/fnd/fiori/inbox/controller/BaseController",
	"cross/fnd/fiori/inbox/model/formatter",
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device",
	"cross/fnd/fiori/inbox/model/models",
	"cross/fnd/fiori/inbox/model/ModelsHelper",
	"sap/m/Button",
	"sap/m/ToolbarSpacer",
	"sap/ui/core/CustomData",
	"cross/fnd/fiori/inbox/util/ResponseOptionsHelper",
	"cross/fnd/fiori/inbox/util/Constants",
	"sap/m/library",
	"sap/base/Log",
	"sap/base/security/URLListValidator",
	"sap/m/MessageBox",
], function(BaseController, formatter, JSONModel, Device, models, ModelsHelper, Button, ToolbarSpacer, CustomData,
	ResponseOptionsHelper, Constants, library, Log, URLListValidator, MessageBox) {
	"use strict";

	return BaseController.extend("cross.fnd.fiori.inbox.controller.Detail", {
		formatter: formatter,
		// This counter will be used as an unique identifier of every task selection
		// It will be incremented on every task select. When the program flow face
		// asynchronious code (request, promise) we will bind the current count to the callback function.
		// When the operation is done and the callback is invoked, we will compare the binded count with the current one
		// so we know, that there were no other task selection while we was waiting
		// Search key: tc_d_tsc
		_taskSwitchCount: 0,

		onInit: function () {
			this.oRouter = this.getOwnerComponent().getRouter();
			this.oRouter.getRoute("myTasksDetail").attachPatternMatched(this._onDetailMatched, this);
			this.setModel(models.getTaskDetailModel(), "detailView");
			models.attachEvent("taskDetailRequestSuccess", null, function () {
				var oIconTabBar = this.byId("iconTabBar");
				oIconTabBar.setBusy(false);
			}, this);
			models.attachEvent("taskDetailRequessError", null, function () {
				var oIconTabBar = this.byId("iconTabBar");
				oIconTabBar.setBusy(false);
			}, this);
		},

		onExit : function () {
			this.getRouter().detachRoutePatternMatched(this._onDetailMatched, this);
		},

		openDetailDetail: function () {
			var oNextUIState = this.getOwnerComponent().getFCLHelper().getNextUIState(2);
			var sLayout = oNextUIState.layout;
			// eslint-disable-next-line camelcase
			this.oRouter.navTo("myTasksDetailDetail", {SAP__Origin: encodeURIComponent(this.SAP__Origin),
				InstanceID: encodeURIComponent(this.InstanceID), layout: sLayout}, this.bReplaceHistory);
		},

		/**
		 * Handle fullScreen button of Detail view.
		 */
		handleFullScreen: function () {
			var sNextLayout = this.getModel("fcl").getProperty("/actionButtonsInfo/midColumn/fullScreen");
			var sLayout = sNextLayout;
			// eslint-disable-next-line camelcase
			this.oRouter.navTo("myTasksDetail", {SAP__Origin: encodeURIComponent(this.SAP__Origin),
				InstanceID: encodeURIComponent(this.InstanceID), layout: sLayout}, this.bReplaceHistory);
		},

		/**
		 * Handle exitFullScreen button of Detail view.
		 */
		handleExitFullScreen: function () {
			var sNextLayout = this.getModel("fcl").getProperty("/actionButtonsInfo/midColumn/exitFullScreen");
			var sLayout = sNextLayout;
			// eslint-disable-next-line camelcase
			this.oRouter.navTo("myTasksDetail", {SAP__Origin: encodeURIComponent(this.SAP__Origin),
				InstanceID: encodeURIComponent(this.InstanceID), layout: sLayout}, this.bReplaceHistory);
		},

		/**
		 * Handle close button of Detail view.
		 */
		handleClose: function () {
			this.oRouter.navTo("myTasksMaster", null, this.bReplaceHistory);
		},

		/**
		 * Stores properties neeeded for further actions.
		 *
		 * @param {sap.ui.base.Event} oEvent router attachPatternMatched event
		 * @private
		 */
		_onDetailMatched: function (oEvent) {
			var oArguments = oEvent.getParameter("arguments");
			// eslint-disable-next-line camelcase
			var currentSAP__Origin = decodeURIComponent(oArguments.SAP__Origin);
			var currentInstanceID = decodeURIComponent(oArguments.InstanceID);
			this.bReplaceHistory = !Device.system.phone;

			// unpress show log button on task selection
			this.getModel("parametersModel").setProperty("/showLogButtonPressed", false);

			// unpress show details button on task selection
			this.getModel("parametersModel").setProperty("/showDetailsButtonPressed", false);

			// eslint-disable-next-line camelcase
			if ((!this.SAP__Origin && !this.InstanceID) || (this.SAP__Origin !== currentSAP__Origin || this.InstanceID !== currentInstanceID)) {
				// eslint-disable-next-line camelcase
				this.SAP__Origin = currentSAP__Origin;
				this.InstanceID = currentInstanceID;
			}
			else {
				return;
			}
			// tc_d_tsc
			this._taskSwitchCount++;

			this.fillTaskDetail();
		},

		/**
		 * Returns the currently opened details item from TaskCollection
		 * 
		 * @returns {object} The currently opened item
		 */
		getItem: function () {
			var sContextPath = "TaskCollection(SAP__Origin='" + encodeURIComponent(this.SAP__Origin)
				+ "',InstanceID='" + encodeURIComponent(this.InstanceID) + "')";
			var oContext = new sap.ui.model.Context(this.getView().getModel(), sContextPath);
			var oItem = this.getView().getModel().getData(oContext.getPath(), oContext);
			// in some services SAP__Origin and InstanceID is reversed and the item can not be found
			if (!oItem) {
				sContextPath = "TaskCollection(InstanceID='" + encodeURIComponent(this.InstanceID)
				+ "',SAP__Origin='" + encodeURIComponent(this.SAP__Origin) + "')";
				oContext = new sap.ui.model.Context(this.getView().getModel(), sContextPath);
				oItem = this.getView().getModel().getData(oContext.getPath(), oContext);
			}

			return oItem;
		},

		/**
		 * Returns TaskDefinition from TaskDefinitionCollection based
		 * on the passed item's TaskDefinitionID
		 * 
		 * @param {object} oItem The currently opened detail item
		 * @returns {object} The Task Definition for the current item
		 */
		getTaskDefinition: function(oItem) {
			var sContextPath = "TaskDefinitionCollection(SAP__Origin='" + encodeURIComponent(oItem.SAP__Origin) 
				+ "',TaskDefinitionID='" + encodeURIComponent(oItem.TaskDefinitionID) + "')";
			var oContext = new sap.ui.model.Context(this.getView().getModel(), sContextPath);
			var oTaskDefinition = this.getView().getModel().getData(oContext.getPath(), oContext);

			return oTaskDefinition;
		},

		/**
		 * Fill task detail.
		 */
		fillTaskDetail: function () {
			var oItem = this.getItem();
			var oTaskDefinition = this.getTaskDefinition(oItem);

			// tc_d_tsc
			oItem.taskSwitchCount = this._taskSwitchCount;

			oItem.bAdditionalInformationVisible = false;
			oItem.bNoAdditionalInformationMessageVisible = false;
			oItem.bPriorityVisible = false;
			oItem.bShowCustomAttributesInDetail = false;

			if (oItem.Priority) {
				oItem.bPriorityVisible = true;
			}
			
			if (oTaskDefinition) {
				oItem.TaskDefinitionName = oTaskDefinition.TaskName;
			}

			if (!oItem.TaskDefinitionName) {
				oItem.TaskDefinitionName = this.getResourceBundle().getText("DetailView_HeaderText");
			}

			var sTaskDefKey = ModelsHelper.getKeyForTaskDefinitionModel(
				{
					// eslint-disable-next-line camelcase
					SAP__Origin: oItem.SAP__Origin,
					TaskDefinitionID: oItem.TaskDefinitionID
				}
			);

			var taskDefinitions = models.getTaskDefinitionModel().getData();

			if (taskDefinitions && taskDefinitions[sTaskDefKey]) {
				var aResponseOptionsData = taskDefinitions[sTaskDefKey][Constants.NP_RESPONSE_OPTIONS_DATA];

				if (aResponseOptionsData && aResponseOptionsData.length > 0) {
					// If at least one response option exists, update oItem
					oItem = jQuery.extend(
						{},
						oItem,
						{ ResponseOptions: aResponseOptionsData }
					);
				}
			}

			this._populateFooterWithButtons(oItem);

			models.updateTaskDetailModel(oItem);
			// create show log button in the header of the page
			this._setShowLogButtonVisibility(oItem);
			
			// create show details button in the header of the page
			this._setShowDetailsButtonVisibility(oItem);

			var oTaskDetailModel = models.getTaskDetailModel();
			var aParams = [];
			var bGetDescription = false;
			var bGetCustomAttributes = false;

			if (oItem.TaskSupports) {
				// temp fix due to 500 error from service when requesting non-existing description - begin
				// if (oItem.TaskSupports.Description) {
				// 	bGetDescription = true;
				// }
				// temp fix due to 500 error from service when requesting non-existing description - end
				if (oItem.TaskSupports.CustomAttributeData) {
					bGetCustomAttributes = true;
				}
			}

			var oIconTabBar = this.byId("iconTabBar");

			if (bGetDescription || bGetCustomAttributes) {
				oIconTabBar.setBusyIndicatorDelay(0);
				oIconTabBar.setBusy(true);
				var
					aSelectValues = ["SAP__Origin", "InstanceID"],
					aExpandValues = [];

				if (bGetDescription) {
					aExpandValues.push("Description");
					aSelectValues.push("Description");
					oTaskDetailModel.setProperty("/bAdditionalInformationVisible", true);
				}
				if (bGetCustomAttributes) {
					aExpandValues.push("CustomAttributeData");
					aSelectValues.push("CustomAttributeData");
				}
				aParams.push("$select=" + aSelectValues.join());
				if (aExpandValues.length > 0) {
					aParams.push("$expand=" + aExpandValues.join());
				}
				models.refreshTaskDetailModel(
					this.SAP__Origin,
					this.InstanceID,
					aParams,
					this.getModel("i18n").getProperty("DetailView_EmptyCustomAttributeLabel"));
			}
			else {
				oIconTabBar.setBusy(false);
				oTaskDetailModel.setProperty("/bNoAdditionalInformationMessageVisible", true);
			}
		},

         /**
		 * Handler for show log button click
		 */
		handleShowLogPress: function() { //oEvent parameter can be added for future usage
			if (this.byId("showLogButton").getPressed()) {
				this.getModel("parametersModel").setProperty("/showDetailsButtonPressed", false);
				this._showLogs();
			}
			else {
				models.resetWorkflowLogModel();
				this.handleNavBackToDetail();
			}
		},

		/**
		 *  Navigate to task on LoB system
		 */
		handleOpenTaskButton: function() {

			var oTaskDetailModel = models.getTaskDetailModel();

			if (oTaskDetailModel) {
				var sURL = oTaskDetailModel.getProperty("/GUI_Link");
				if (sURL) {
					if (URLListValidator.validate(sURL)) {
						library.URLHelper.redirect(sURL, true);
					}
					else if (URLListValidator.validate(encodeURI(sURL))) {
						library.URLHelper.redirect(encodeURI(sURL), true);
					}
					else {
						MessageBox.error(this.getModel("i18n").getProperty("dialog.error.taskExecutionUI"));
					}
				}
			}
		},

		/**
		 * Closing third column
		 */
		handleNavBackToDetail: function() {
			var sNextLayout = this.getModel("fcl").getProperty("/actionButtonsInfo/endColumn/closeColumn");
			var sLayout = encodeURIComponent(sNextLayout);
			// eslint-disable-next-line camelcase
			this.oRouter.navTo("myTasksDetail", {SAP__Origin: encodeURIComponent(this.SAP__Origin),
				InstanceID: encodeURIComponent(this.InstanceID), layout: sLayout}, this.bReplaceHistory);
		},

		/**
		 * Show logs in DetailDetail
		 */
		_showLogs: function() {
			this.openDetailDetail();
		},
		
		
		/**
		 * The method controls show log button visibility
		 *
		 * @param {object} oItem selected item from the worklist
		 */
		_setShowLogButtonVisibility: function(oItem) {
			if (oItem.TaskSupports && oItem.TaskSupports.WorkflowLog) {
				this.getModel("parametersModel").setProperty("/showLogButtonVisible", true);
			}
			else {
				this.getModel("parametersModel").setProperty("/showLogButtonVisible", false);
			}
		},

		/**
		 * Handler for show details button click
		 */
		handleShowDetailsPress: function() { //oEvent parameter can be added for future usage
			if (this.byId("showDetailsButton").getPressed()) {
				this.getModel("parametersModel").setProperty("/showLogButtonPressed", false);
				this._showDetails();
			}
			else {
				this.handleNavBackToDetail();
			}
		},

		/**
		 * The method controls show details button visibility
		 *
		 * @param {object} oItem selected item from the worklist
		 */
		_setShowDetailsButtonVisibility: function(oItem) {
			// Button "Show Details" will be set temporary to invisible because 3rd column is still not implemented and now raises fatal error.
			// After implementation of 3rd column the below logic should be uncommented in order to set visibility of the button conditionally.

			// if (oItem.TaskSupports &&
			// 		(oItem.TaskSupports.Comments || oItem.TaskSupports.Attachments || oItem.TaskSupports.TaskObject)) {
			// 	this.getModel("parametersModel").setProperty("/showDetailsButtonVisible", true);
			// }
			// else {
				this.getModel("parametersModel").setProperty("/showDetailsButtonVisible", false);
			// }
		},

		/**
		 * Show details in third column
		 */
		_showDetails: function() {
			this._openAdditionalTaskDetails();
		},

		/**
		 * Navigate to AdditionalTaskDetails view
		 */
		_openAdditionalTaskDetails: function() {
			var oNextUIState = this.getOwnerComponent().getFCLHelper().getNextUIState(2);
			var sLayout = oNextUIState.layout;
			// eslint-disable-next-line camelcase
			this.oRouter.navTo("additionalTaskDetails", {SAP__Origin: encodeURIComponent(this.SAP__Origin),
				InstanceID: encodeURIComponent(this.InstanceID), layout: sLayout}, this.bReplaceHistory);
		},

		/**
		 * Populates the footer of the Detail view with buttons
		 * 
		 * @param {Object} oItem - contains the buttons' respective item
		 * @private
		 */
		 _populateFooterWithButtons: function(oItem) {
			var aResponseOptionsData = oItem.ResponseOptions;
			var oOverflowToolbar = this.byId("overflowToolbar");

			// removes pre-existing buttons from the OverflowToolbar
			oOverflowToolbar.destroyContent();

			if (!aResponseOptionsData
				|| aResponseOptionsData.length === 0) {
				return;
			}

			var sOverflowToolbarId = oOverflowToolbar.getId();

			// ToolbarSpacer makes buttons in OverflowToolbar right-aligned
			new ToolbarSpacer().placeAt(sOverflowToolbarId);

			for (var i = 0; i < aResponseOptionsData.length; i++) {
				var responseOption = aResponseOptionsData[i];

				var oCurrentButton = new Button({
					text: responseOption.DecisionText,
					type: "Ghost"
				})
					.attachPress(this._onFooterButtonPress.bind(this))
					.placeAt(sOverflowToolbarId);

				// adding data to button (to be read on press, see "_onFooterButtonPress")
				oCurrentButton.data("oItem", oItem);

				var oDataDecisionKey = new CustomData({ key: "DecisionKey", value: responseOption.DecisionKey });

				oCurrentButton.addCustomData(oDataDecisionKey);
			}
		},

		/**
		 * Footer button press event handler
		 * 
		 * @param {sap.ui.base.Event} oEvent Event from pressing footer button.
		 * @private
		 */
		_onFooterButtonPress: function(oEvent) {
			var oPressedButton = oEvent.getSource();
			var aCustomData = oPressedButton.getCustomData();
			var oItem = aCustomData[0].getValue();
			var sDecisionKey = aCustomData[1].getValue();
			var sButtonText = oPressedButton.getProperty("text");

			ResponseOptionsHelper.processCustomAction(sDecisionKey, sButtonText, oItem, undefined, this);
		}
	});
}, true);
