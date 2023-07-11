/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"cross/fnd/fiori/inbox/util/Conversions",
	"cross/fnd/fiori/inbox/util/CommonFunctions",
	"sap/m/Button",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/m/BusyDialog",
	"sap/m/QuickView"
], function(
	Conversions,
	CommonFunctions,
	Button,
	MessageToast,
	MessageBox,
	BusyDialog,
	QuickView
) {
	"use strict";

	QuickView.extend("cross.fnd.fiori.inbox.util.QuickView", {

		_oContact: null,
		i18nBundle: null,

		setContact: function(oContact) {
			this._oContact = oContact;
		},

		onBeforeRenderingPopover: function() {
			QuickView.prototype.onBeforeRenderingPopover.call(this);

			//Add button to employee card if device supports contacts plugin
			if (this.isFunctionAvailable("navigator.contacts")) {
				var page = this._oNavContainer.getPages()[0];

				this.i18nBundle = cross.fnd.fiori.inbox.util.tools.Application.getImpl().AppI18nModel.getResourceBundle();

				page.addContent(new Button({
					text: this.i18nBundle.getText("XBUT_ADDCONTACT"),
					press: jQuery.proxy(this._addContact, this)
				}));
			}

		},

		_addContact: function() {
			var that = this;
			var oResult = this._oContact;
			var oContactPlugin = that.getPlugin("navigator.contacts");
			var contact = oContactPlugin.create();

			//name
			var ContactName = that.getPlugin("ContactName");

			var name = new ContactName();
			if (oResult.FirstName) {
				name.givenName = oResult.FirstName;
			}
			if (oResult.LastName) {
				name.familyName = oResult.LastName;
			}
			contact.name = name;

			contact.displayName = ( name.givenName || name.familyName ) ? [name.givenName, name.familyName].join(" ") : null;

			if (contact.displayName) {
				contact.displayName = contact.displayName.trim();
			}

			//phoneNumbers
			var phoneNumbers = [];
			var ContactField = that.getPlugin("ContactField");
			if (oResult.WorkPhone) {
				phoneNumbers.push(new ContactField("work", oResult.WorkPhone));
			}
			if (oResult.MobilePhone) {
				phoneNumbers.push(new ContactField("mobile", oResult.MobilePhone));
			}
			if (oResult.HomePhone) {
				phoneNumbers.push(new ContactField("home", oResult.HomePhone));
			}
			if (phoneNumbers.length !== 0) {
				contact.phoneNumbers = phoneNumbers;
			}

			//emails
			var emails = [];
			if (oResult.Email) {
				emails.push(new ContactField("work", oResult.Email));
				contact.emails = emails;
			}

			//address array
			var contactAddresses = [];
			var ContactAddress = that.getPlugin("ContactAddress");
			var contactAddress = new ContactAddress();
			var addressMainteained = false;
			if (oResult.Address.Street) {
				contactAddress.streetAddress = oResult.Address.Street + " " + (oResult.Address.StreetNumber ? oResult.Address.StreetNumber : "");
				addressMainteained = true;
			}
			if (oResult.Address.City) {
				contactAddress.locality = oResult.Address.City;
				addressMainteained = true;
			}
			if (oResult.Address.State) {
				contactAddress.region = oResult.Address.State;
				addressMainteained = true;
			}
			if (oResult.Address.PostalCode) {
				contactAddress.postalCode = oResult.Address.PostalCode;
				addressMainteained = true;
			}
			if (oResult.Address.Country) {
				contactAddress.country = oResult.Country;
				addressMainteained = true;
			}
			if (addressMainteained) {
				contactAddresses.push(contactAddress);
				contact.addresses = contactAddresses;
			}
			//contact image
			var oDialog = new BusyDialog({
				text: this.i18nBundle.getText("dialog.info.mq.contantBeingCreated")
			});
			oDialog.open();

			var contactPhotos = [];
			if (oResult.__metadata.media_src) {
				contactPhotos.push(new ContactField("url", oResult.__metadata.media_src));
				contact.photos = contactPhotos;
			}

			contact.save(
				function() {
					oDialog.close();
					MessageToast.show(that.i18nBundle.getText("dialog.success.mq.contactSaved"));
				},
				function(contactError) {
					oDialog.close();
					var sErrorText = that.i18nBundle.getText("dialog.error.mq.contactCreationFailed");
					MessageBox.error(sErrorText,
						{ details: CommonFunctions.fnRemoveHtmlTags(contactError.code) });
				}
			);
		},

		getPlugin: function(sPluginName) {
			try {
				return this._namespaceExists(sPluginName);
			}
			catch (e) {
				return null;
			}
		},

		isFunctionAvailable: function(sPluginName) {
			try {
				return (typeof this._namespaceExists(sPluginName) !== "undefined");
			}
			catch (e) {
				return false;
			}
		},

		_namespaceExists: function(namespace) {
			var tokens = namespace.split(".");
			return tokens.reduce(function(prev, curr) {
				return (typeof prev === "undefined") ? prev : prev[curr];
			}, window);
		}

	});
	return cross.fnd.fiori.inbox.util.QuickView;
});