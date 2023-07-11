/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/core/Fragment",
	"sap/base/Log"
], function (
	UI5Object,
	Fragment,
	BaseLog
) {
	"use strict";

	UI5Object.extend("cross.fnd.fiori.inbox.util.Resubmit", {});

	cross.fnd.fiori.inbox.util.Resubmit = {
		_oResubmitFrag: null,

		open: function(_sResubmitUniqueId , oController , oView) {
			//Create ReSubmit PopUp
			if (!this._oResubmitFrag) {
				this._createResubmitDialogPromise(_sResubmitUniqueId, oController).then(function(oResubmitFrag) {
					this._oResubmitFrag = oResubmitFrag;
					oView.addDependent(this._oResubmitFrag);

					this._setupAndOpenDialog(_sResubmitUniqueId);
				}.bind(this));
			}
			else {
				this._setupAndOpenDialog(_sResubmitUniqueId);
			}
		},

		close : function() {
			cross.fnd.fiori.inbox.util.Resubmit._oResubmitFrag.close();
			cross.fnd.fiori.inbox.util.Resubmit._oResubmitFrag.destroy(true); //skip default calendar validation -> this.validateDate used instead
			cross.fnd.fiori.inbox.util.Resubmit._oResubmitFrag = null;
		},

		validateDate : function() {
			var oCalendar = Fragment.byId(this.sResubmitUniqueId, "DATE_RESUBMIT");
			var oSelectedDate = oCalendar.getSelectedDates()[0].getStartDate(); //get the selected date
			var oCurrentDate = new Date();
			var oResubmitOkBtn = Fragment.byId(this.sResubmitUniqueId, "RESUBMIT_BTN_OK");
			if (oCurrentDate > oSelectedDate) {
				oResubmitOkBtn.setEnabled(false);
				oCalendar.removeAllSelectedDates();
			}
			else {
				oResubmitOkBtn.setEnabled(true);
			}
		},

		_setupAndOpenDialog: function(_sResubmitUniqueId) {
			var oCalendar = Fragment.byId(_sResubmitUniqueId, "DATE_RESUBMIT");
			if (oCalendar) {
				oCalendar.removeAllSelectedDates();
				oCalendar.focusDate(new Date());
			}

			this._oResubmitFrag.open();
		},

		_createResubmitDialogPromise: function(id, oController) {
			return Fragment.load({
				id: id,
				name: "cross.fnd.fiori.inbox.frag.Resubmit",
				controller: oController
			})
			.catch(function() {
				BaseLog.error("Resubmit dialog was not created successfully");
			});
		}
	};

	return cross.fnd.fiori.inbox.util.Resubmit;
});
