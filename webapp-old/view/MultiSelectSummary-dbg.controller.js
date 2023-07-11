/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/m/Column",
	"sap/m/Label",
	"sap/ui/model/json/JSONModel",
	"cross/fnd/fiori/inbox/controller/BaseController",
	"sap/ui/base/DataType",
	"cross/fnd/fiori/inbox/util/MultiSelect",
	"cross/fnd/fiori/inbox/util/MultiSelectCustomAttributeHelper",
	"cross/fnd/fiori/inbox/util/TableOperations",
	"cross/fnd/fiori/inbox/util/MultiSelectSortingHelper",
	"sap/ui/core/syncStyleClass",
	"sap/m/TablePersoController"
], function (Column, Label, JSONModel, BaseController, DataType, MultiSelect, MultiSelectCustomAttributeHelper,
		TableOperations, MultiSelectSortingHelper, syncStyleClass, TablePersoController) {
	"use strict";

	return BaseController.extend("cross.fnd.fiori.inbox.view.MultiSelectSummary", {

		_oTablePersoController: null,

		onInit: function() {
			cross.fnd.fiori.inbox.util.tools.Application.getImpl().getComponent()
			.getEventBus().subscribe("cross.fnd.fiori.inbox", "multiselect", this.onMultiSelectEvent, this);
			var oOwnerComponent = this.getOwnerComponent();
			oOwnerComponent.getEventBus().subscribe("cross.fnd.fiori.inbox", "multiselect", this.onMultiSelectEvent, this);
			this.oRouter = oOwnerComponent.getRouter();
			this.oRouter.attachRouteMatched(this.handleNavToDetail, this);

			this.bInited = false;
			this._oTableOperations = new TableOperations(this.getMultiSelectTable(), this.getView(), ["TaskTitle", "Priority", "DueOn"]);

			this._oSorting = new MultiSelectSortingHelper(this._oTableOperations, this.getView());

			this._tableHelper = new MultiSelectCustomAttributeHelper(this, this.getView(), this.getMultiSelectTable(), this._oSorting);
		},

		onMultiSelectEvent: function(sChannelId, sEventId, oMultiSelectEvent) {
			var i;
			if (oMultiSelectEvent.Source === "S2" || oMultiSelectEvent.Source === "action") {
				if (oMultiSelectEvent.reInitialize) {
					this.aWorkItems = oMultiSelectEvent.WorkItems;
				}

				if (oMultiSelectEvent.WorkItems.length > 0) {
					for (i = 0; i < oMultiSelectEvent.WorkItems.length; i++) {
						if (oMultiSelectEvent.Selected) {
							oMultiSelectEvent.WorkItems[i].Selected = oMultiSelectEvent.Selected;
							this.addWorkItem(oMultiSelectEvent.WorkItems[i]);
						}
						else {
							this.removeWorkItem(oMultiSelectEvent.WorkItems[i]);
						}
					}
				}
				else {
					this.aWorkItems = [];
				}

				this.refreshModel();
				this._oSorting.applySorting();
			}

			if (oMultiSelectEvent.Source === "MultiSelectSummary" && !oMultiSelectEvent.Selected && oMultiSelectEvent.WorkItems.length > 0) {
				for (i = 0; i < oMultiSelectEvent.WorkItems.length; i++) {
					this.removeWorkItem(oMultiSelectEvent.WorkItems[i]);
				}

				this.refreshModel();
				this._oSorting.applySorting();
			}
		},

		removeWorkItem: function(oWorkItemToRemove) {
			this.aWorkItems = this.aWorkItems.filter(function(oWorkItem) {
				return !(oWorkItemToRemove.SAP__Origin === oWorkItem.SAP__Origin &&
					oWorkItemToRemove.InstanceID === oWorkItem.InstanceID);
			});
		},

		addWorkItem: function(oWorkItem) {
			var i;
			for (i = 0; i < this.aWorkItems.length; i++) {
				if (this.aWorkItems[i].SAP__Origin === oWorkItem.SAP__Origin
						&& this.aWorkItems[i].InstanceID === oWorkItem.InstanceID) {
					return;
				}
			}

			var oWorkItemCopy = jQuery.extend(true, {}, oWorkItem);

			if (this.areCustomDefinitionsPresent()) {
				var listItem = oWorkItem.listItem;
				var listItemContext = listItem.getBindingContext();

				//Here we get all the customDataAttribute for the specific item.
				var aCustomAttributes = jQuery.extend(true, [], listItemContext.getProperty("CustomAttributeData"));

				for (i = 0; i < aCustomAttributes.length; i++) {
					var sPath = "/" + aCustomAttributes[i];
					var customAttribute = listItem.getModel().getProperty(sPath);
					oWorkItemCopy[customAttribute.Name] = customAttribute.Value;
				}
			}

			this.aWorkItems.push(oWorkItemCopy);
		},

		refreshModel: function() {
			MultiSelect.prepareWorkItems(this.aWorkItems);
			var oModel = new JSONModel(this.aWorkItems);
			this.getMultiSelectTable().setModel(oModel, "multiSelectSummaryModel");
		},

		handleNavToDetail: function(oEvent) {
			if (oEvent.getParameter("name") !== "multi_select_summary") {
				return;
			}

			// Reset sorting when you reach the multiselect page
			this._oSorting.resetSorting();
			this._tableHelper.hideCustomAttributeColumns();
			this.aWorkItems = [];
			this.refreshModel();
			if (this.areCustomDefinitionsPresent()) {
				jQuery.when(MultiSelect.customAttributeDefinitionsLoaded).then(function() {
					MultiSelect.customAttributeDefinitionsLoaded = new jQuery.Deferred();
					this.initTableHeader();
					this._initPersonalization();
				}.bind(this));
			}
			else {
				this._initPersonalization();
			}

			if (!this.bInited) {
				this.bInited = true;

				this.getMultiSelectTable().bindItems("multiSelectSummaryModel>/", this.getView().byId("LIST_ITEM"));
			}
		},

		onItemSelect: function(oEvent) {
			var oMultiSelectEvent = { };
			oMultiSelectEvent.Source = "MultiSelectSummary";
			oMultiSelectEvent.Selected = oEvent.getParameter("selected");

			var listItems = oEvent.getParameter("listItems");
			var workItems = [];

			for (var i = 0; i < listItems.length; i++) {
				workItems[i] = listItems[i].getBindingContext("multiSelectSummaryModel").getProperty();
			}

			oMultiSelectEvent.WorkItems = workItems;

			cross.fnd.fiori.inbox.util.tools.Application.getImpl().getComponent().getEventBus().publish("cross.fnd.fiori.inbox", "multiselect",
				oMultiSelectEvent);
		},

		onSortPressed: function() {
			this._oSorting.openSortingDialog();
		},

		/**
		 * Utility method to attach a control, typically a dialog,
		 * to the view, and syncing the styleclass of the application
		 * @param {sap.ui.core.Control} oControl the control to be attached
		 * @public
		 */
		attachControl: function(oControl) {
			var sCompactCozyClass = this.getOwnerComponent().getContentDensityClass();
			syncStyleClass(sCompactCozyClass, this.getView(), oControl);
			this.getView().addDependent(oControl);
		},

		initTableHeader: function () {
			this.customAttributeDefinitions = this.getOwnerComponent()
														.getModel("customAttributeDefinitionsModel")
														.getData()
														.results;

			for (var i = 0; i < this.customAttributeDefinitions.length; i++) {
				if (this.customAttributeDefinitions[i]) {
					this._tableHelper.addColumn(this.customAttributeDefinitions[i]);
				}
			}

			var oMultiSelectTable = this.getMultiSelectTable();
			oMultiSelectTable.bindItems(oMultiSelectTable.getBindingInfo("items"));
			oMultiSelectTable.getBinding("items").refresh();
		},

		areCustomDefinitionsPresent: function () {
			// If it is an object (not undefined) then it is set then showAdditionalAttributes flag is set to true in the DataManager
			var CASModel = this.getOwnerComponent().getModel("customAttributeDefinitionsModel");
			if (CASModel === null) {
				return false;
			}

		    return typeof CASModel === "object";
		},

		getMultiSelectTable: function() {
			return this.byId("idMultiSelectTable");
		},

		_initPersonalization: function () {
			if (sap.ushell.Container) {
				if (this._oTablePersoController !== null) {
					this._oTablePersoController.destroy();
					this._oTablePersoController = null;
				}

				var oTable = this.oView.byId("idMultiSelectTable");
				var oPersonalizationService = sap.ushell.Container.getService("Personalization");
				var oPersonalizer = oPersonalizationService.getPersonalizer({
					container: "cross.fnd.fiori.inbox.multiSelect.table", // This key must be globally unique (use a key to
					// identify the app) Note that only 40 characters are allowed
					item: "idMultiSelectTable" // Maximum of 40 characters applies to this key as well
				});
				this._oTablePersoController = new sap.m.TablePersoController({
					table: oTable,
					componentName: "idMultiSelectTable",
					showResetAll: false,
					persoService: oPersonalizer
				}).activate();
			}
		},

		onPersonalizationPressed: function () {
			this._oTablePersoController.openDialog();
		}
	});
});
