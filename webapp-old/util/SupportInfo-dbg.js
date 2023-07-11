/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/Fragment",
	"sap/base/Log",
	"cross/fnd/fiori/inbox/Component"
], function (
	UI5Object,
	JSONModel,
	Fragment,
	BaseLog,
	Component
) {
	"use strict";

	UI5Object.extend("cross.fnd.fiori.inbox.util.SupportInfo", {});

	cross.fnd.fiori.inbox.util.SupportInfo = {
		open: function(oView) {
			oView.setModel(cross.fnd.fiori.inbox.util.tools.Application.getImpl().AppI18nModel, "i18n");
			var sCreatedByUniqueId = oView.createId("BTN_SUPPORTINFO");
			this.oModel = this.getJSONModel();
			this.setScenarioConfig();
			var sCompVersion = Component.getMetadata().getVersion();
			this.getJSONModel().setProperty("/compversion", sCompVersion);
			this.getJSONModel().setProperty("/sapui5version", sap.ui.version);
			this.oDialog = oView.byId(sCreatedByUniqueId + "--DLG_SUPPORTINFO");

			if (!this.oDialog) {
				this._createSupportInfoPromise(sCreatedByUniqueId).then(function(dialog) {
					this.oDialog = dialog;
					oView.addDependent(this.oDialog);
					this._openDialog.call(this);
				}.bind(this));
			}
			else {
				this._openDialog.call(this);
			}
		},

		setGroup: function(sGroup) {
			this.getJSONModel().setProperty("/groupby", sGroup);
		},

		setFilters: function(sFilters) {
			var sFilterString = "";
			for (var key in sFilters) {
				if (sFilters.hasOwnProperty(key)) {
					sFilterString = sFilterString+key + "\n";
				}
			}
			this.getJSONModel().setProperty("/filters", sFilterString);

		},

		setSorters: function(oSorters) {
			this.getJSONModel().setProperty("/orderby", oSorters);
		},

		setSearchPattern: function(oPattern) {
			this.getJSONModel().setProperty("/searchby", oPattern);
		},

		setTask: function(oTask, oCustomAttributeDefinition, oExternalModel) {
			this.getJSONModel().setProperty("/Task", oTask);
			if (oCustomAttributeDefinition) {
				var oMod = this.getJSONModel().getProperty("/Task");

				if (oMod && oMod.CustomAttributeData) {

					for (var iCustAttrCount=0; iCustAttrCount < oMod.CustomAttributeData.length; iCustAttrCount++) {
						var oDataManager = cross.fnd.fiori.inbox.util.tools.Application.getImpl().getComponent().getDataManager();
						// fix with added typeof to work custom attributes info, when showAdditionalAttributes is off and click claim or release of task in
						// detail deep and then open support information
						if (oDataManager.getShowAdditionalAttributes() || typeof oMod.CustomAttributeData[iCustAttrCount] === "string") {
							oMod.CustomAttributeData[iCustAttrCount] = oExternalModel.getProperty("/" + oMod.CustomAttributeData[iCustAttrCount]);
						}
						for (var iCustAttrDefCount=0; iCustAttrDefCount < oCustomAttributeDefinition.length; iCustAttrDefCount++) {
							if (oMod.CustomAttributeData[iCustAttrCount].Name === oCustomAttributeDefinition[iCustAttrDefCount].Name) {
								oMod.CustomAttributeData[iCustAttrCount].Type = oCustomAttributeDefinition[iCustAttrDefCount].Type;
							}
						}
					}
				}

				this.getJSONModel().setProperty("/Task", oMod);
			}
		},

		setScenarioConfig: function() {
			var oComponent = cross.fnd.fiori.inbox.util.tools.Application.getImpl().getComponent();
			var oDataManager = oComponent.getDataManager();
			var scenarioConfig = oDataManager.getScenarioConfig();
			this.getJSONModel().setProperty("/ScenarioConfig", scenarioConfig);
		},

		getJSONModel: function() {
			if (!this.oModel) {
				this.oModel = new JSONModel();
				return this.oModel;
			}
			else {
				return this.oModel;
			}
		},

		formatVisibility:function (value) {
			if (value) {
				return true;
			}
			else {
				return false;
			}
		},

		decodeString: function(str) {
			return str != null // eslint-disable-line eqeqeq
				? decodeURIComponent(str) : "";
		},

		onCancelDialog: function() {
			if (this.oDialog) {
				this.oDialog.close();
				this.getJSONModel().setProperty("/Task", null);
			}
		},

		_openDialog: function() {
			this.oDialog.setModel(this.oModel);
			this.oDialog.open();
			this.oDialog.setEscapeHandler(function(oPromise) {
				this.onCancelDialog();
				oPromise.resolve();
			}.bind(this));
		},

		_createSupportInfoPromise: function(sCreatedByUniqueId) {
			return Fragment.load({
				id: sCreatedByUniqueId,
				type: "XML",
				name: "cross.fnd.fiori.inbox.frag.SupportInfo",
				controller: this
			})
			.catch(function() {
				BaseLog.error("Support Info dialog was not created successfully");
			});
		}
	};

	return cross.fnd.fiori.inbox.util.SupportInfo;
});
