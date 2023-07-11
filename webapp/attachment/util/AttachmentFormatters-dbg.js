/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/core/format/FileSizeFormat",
	"sap/ui/core/format/DateFormat"
	], function(
		FileSizeFormat,
		DateFormat
	) {
		"use strict";

		cross.fnd.fiori.inbox.attachment = (function() {


			return {
				/*
				sMediaSrc comes as an absolute URL, pointing to the attachment source system
				sLink comes for URL attachments
				Example:
				https://gwaassandbox-wf7c103a3.int.sap.hana.ondemand.com:443/odata/SAP/SWF_TCM;v=1;mo
					/AttachmentCollection(SAP__Origin='Y4H',InstanceID='000001314547',ID='464F4C33373030303030303030303030344558543433303030303030303030313037')/$value

				We reconstruct this URL to a relative one and pointing to the oData service used by My Inbox,
				which actually provides the referenced collection -> AttachmentCollection
				Like:
				1. Remove host and port
				2. Extract the collection and target parameters:
					/AttachmentCollection(SAP__Origin='Y4H',InstanceID='000001314547',ID='464F4C33373030303030303030303030344558543433303030303030303030313037')/$value
				3. Prepend the service URL:
					/odp/odata/SAP/SWF_TCM;v=1;mo;/AttachmentCollection(SAP__Origin='Y4H',InstanceID='000001314547',ID='464F4C33373030303030303030303030344558543433303030303030303030313037')/$value
				*/
				getRelativeMediaSrc : function(sMediaSrc, sLink, sMimeType) {
					//return sLink(if exists) prior to sMediaSrc
					if (sLink && sLink.length > 0 && sMimeType === "text/uri-list") {
						return sLink;
					}
					else {
						var sUrl = "";
						if (sMediaSrc && typeof sMediaSrc === "string") {
							//Using the integrated logic of HTML Anchor element to remove the host:port part
							var oLink = document.createElement("a");

							oLink.href = sMediaSrc;
							sUrl = (oLink.pathname.charAt(0) === "/") ? oLink.pathname : "/" + oLink.pathname;
						}

						//find the service URL
						if (this.getModel instanceof Function) { //In the QUnit suite model is not defined, so skip this part

							var serviceUrl = this.getModel("detail").getData().sServiceUrl; //this model property is set in S3.controller
							if (!serviceUrl) { //if it doesn't exist get it from Configuration
								var config = new cross.fnd.fiori.inbox.Configuration();
								serviceUrl = config.getServiceList()[0].serviceUrl;
							}

							//Access attachment via serviceURL
							if (serviceUrl && serviceUrl.length > 0) {
							   var indexAttachmentCollection = sUrl.indexOf("AttachmentCollection");

							   // if the URL doesn't point to attachment collection, leave it as it is
							   if (indexAttachmentCollection >= 0) {
									// check if service URL ends with / to avoid adding double // in URL
									if (serviceUrl.endsWith("/")) {
										sUrl = serviceUrl + sUrl.slice(indexAttachmentCollection, sUrl.length);
									}
									else {
										sUrl = serviceUrl + sUrl.slice(indexAttachmentCollection - 1, sUrl.length);
									}
							   }
							}
						}

						return sUrl;
					}
				},

				formatFileSize:  function (sValue, sLink, sMimeType) {
					//Hide file size when formatting url attachment
					if (sLink && sLink.length > 0 && sMimeType === "text/uri-list") {
						return "";
					}
					else if (jQuery.isNumeric(sValue)) {
						return FileSizeFormat.getInstance({
							maxFractionDigits : 1,
							maxIntegerDigits : 3
						}).format(sValue);
					}
					else {
						return sValue;
					}
				},

				//When sLink exists it means that attachment is URL, then we return sap icon "chain-link".
				getRelativeSapIcon: function (sLink, sMimeType) {
					var sUrl = "";
					if (sLink && sLink.length > 0 && sMimeType === "text/uri-list") {
						sUrl = "sap-icon://chain-link";
					}
					return sUrl;
				},

				formatAttachmentCreatedAtDate: function(sDate) {
					var oResultDate = sDate;

					// If is a string and not a Date object
					// Convert /Date(33535355)/ into a Date
					if (typeof sDate === "string" || sDate instanceof String) {
						var sDateForObject = sDate;

						if (sDate.indexOf("Date(") !== -1) {
							var sExtractedMiliseconds = sDate.substring(sDate.indexOf("(") + 1, sDate.indexOf(")"));
							sDateForObject = parseInt(sExtractedMiliseconds, 10);
						}

						oResultDate = new Date(sDateForObject);
					}

					// Set up everything for the formatting
					var oFormatOptions = { style: "medium" };
					var oLocale = sap.ui.getCore().getConfiguration().getLocale();
					var oDateFormatter = (oLocale) ?
						DateFormat.getDateTimeInstance(oFormatOptions, oLocale) :
						DateFormat.getDateTimeInstance(oFormatOptions);

					// return the formatted date
					return oDateFormatter.format(oResultDate, false);
				},

				formatFileName: function (sFileName, sLinkDisplayName, sMimeType) {
					if (sMimeType === "text/uri-list") {
						return sLinkDisplayName;
					}
					else {
						return sFileName;
					}
				}
			};
		}());

		return cross.fnd.fiori.inbox.attachment;
});