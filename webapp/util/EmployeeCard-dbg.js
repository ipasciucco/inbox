/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/base/Object",
	"cross/fnd/fiori/inbox/util/QuickView",
	"cross/fnd/fiori/inbox/util/Conversions",
	"sap/m/library"
], function(BaseObject, QuickView, Conversions, library) {
	"use strict";

	var QuickViewGroupElementType = library.QuickViewGroupElementType;

	// Ensure cross.fnd.fiori.inbox.util.EmployeeCard object structure exists
	BaseObject.extend("cross.fnd.fiori.inbox.util.EmployeeCard", {});
	cross.fnd.fiori.inbox.util.EmployeeCard = {
		displayEmployeeCard: function(oControl, oResult) {
			var oi18Bundle = cross.fnd.fiori.inbox.util.tools.Application.getImpl().getComponent().oDataManager.oi18nResourceBundle;
			var oPageSettings = {
					pages:{
						header: oi18Bundle.getText("bc.title.employee"),
						icon: Conversions.formatterUserCardIcon(oResult.__metadata.media_src),
						title: oResult.DisplayName,
						description: oResult.Department,
						groups: [
							{	heading:  oi18Bundle.getText("bc.title.employee.contactDetails"),
								elements:[
									{
										label: oi18Bundle.getText("bc.label.employee.contactDetails.mobile"),
										value: oResult.MobilePhone,
										type: QuickViewGroupElementType.mobile
									},
									{
										label: oi18Bundle.getText("bc.label.employee.contactDetails.phone"),
										value: oResult.WorkPhone,
										type: QuickViewGroupElementType.phone
									},
									{
										label: oi18Bundle.getText("bc.label.employee.contactDetails.email"),
										value: oResult.Email,
										type: QuickViewGroupElementType.email
									}

								]
							},
							{	heading: oi18Bundle.getText("bc.title.employee.company"),
								elements:[
									{
										label: oi18Bundle.getText("bc.label.employee.company.name"),
										value: oResult.Company
									},
									{
										label: oi18Bundle.getText("bc.label.employee.company.address"),
										value: Conversions.getEmployeeAddress(oResult.Address)
									}
								]
							}
						]
					}
			};

			// var oEmployeeBusinessCard = new QuickView(oPageSettings);
			var oEmployeeBusinessCard = new QuickView(oPageSettings);
			oEmployeeBusinessCard.setContact(oResult);
			oEmployeeBusinessCard.setPlacement("Auto");

			oEmployeeBusinessCard.attachAfterClose(function(oEvent) {
				//destroy the control everytime it closes
				this.destroy();
			});

			//Fix to align display of employee card next to username link instead of timeline item - not handled in  SAPUI5 versions lower than 1.45.0-snapshot
			if (oControl.$("username").length > 0) {
				oEmployeeBusinessCard.openBy(oControl.$("username"));
			}
 else {
				oEmployeeBusinessCard.openBy(oControl);
			}

		}
	};
	return cross.fnd.fiori.inbox.util.EmployeeCard;
});