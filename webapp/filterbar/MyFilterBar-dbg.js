/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/comp/filterbar/FilterBar",
	"sap/ui/comp/smartvariants/PersonalizableInfo",
	"sap/ui/comp/smartvariants/SmartVariantManagement"
], function(FilterBar, PersonalizableInfo, SmartVariantManagement) {
	"use strict";

	var oMyFilterBar =  FilterBar.extend("cross.fnd.fiori.inbox.filterbar.MyFilterBar", {
		renderer: "sap.ui.comp.filterbar.FilterBarRenderer"
	});

	oMyFilterBar.prototype._createVariantManagement = function() {
		this._oSmartVM = new SmartVariantManagement({
				showExecuteOnSelection: true,
				showShare: true
		});
		return this._oSmartVM;
	};

	oMyFilterBar.prototype._initPersonalizationService = function() {
		var oPersInfo = new PersonalizableInfo({
			type: "filterBar",
			keyName: "persistencyKey"
		});
		oPersInfo.setControl(this);
		this._oSmartVM.addPersonalizableControl(oPersInfo);
		this._oSmartVM.initialise(this._initialiseVariants, this);
	};

	oMyFilterBar.prototype.fetchVariant = function() {
		var aFiltersInfo;
		var oVariant = {};
		aFiltersInfo = this._determineVariantFiltersInfo(undefined,true);

		oVariant.filterbar = (!aFiltersInfo) ? [] : aFiltersInfo;
		oVariant.filterBarVariant = this._fetchVariantFiltersData();

		return oVariant;
	};

	oMyFilterBar.prototype.applyVariant = function(oVariant) {
		this._applyVariant(oVariant);
	};

	oMyFilterBar.prototype.setStandardItemText = function(oText) {
		this._oSmartVM.setStandardItemText(oText);
	};
});