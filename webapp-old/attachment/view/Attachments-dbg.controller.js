/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
		"sap/ui/core/mvc/Controller"
	], function (Controller) {
		"use strict";

		return Controller.extend("cross.fnd.fiori.inbox.attachment.view.Attachments", {

			onInit: function() {
				this.oAttachmentControl = this.getView().byId("uploadCollection"); //get the control

			},

			onAttachmentUploadComplete: function(oEvent) {
				this.getOwnerComponent().getAttachmentHandle().fnOnAttachmentUploadComplete(oEvent);

			},

			onAttachmentDeleted: function(oEvent) {
				this.getOwnerComponent().getAttachmentHandle().fnOnAttachmentDeleted(oEvent);
			},

			onAttachmentChange: function(oEvent) {
				this.getOwnerComponent().getAttachmentHandle().fnOnAttachmentChange(oEvent);
			}
		});

	}
);
