/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/base/Object"
], function (
	UI5Object
) {
	"use strict";

	var aUserPictureAvailability = {};
	var sPlaceHolderUrl = sap.ui.require.toUrl("cross/fnd/fiori/inbox") + "/img/home/placeholder.jpg";

	UI5Object.extend("cross.fnd.fiori.inbox.comments", {});

	cross.fnd.fiori.inbox.comments = {

		formatterUserIcon : function (sOrigin, sUser) {
			var that = this;
			var sUrl = cross.fnd.fiori.inbox.comments.getRelativeMediaSrc(sOrigin, sUser, this.getModel("detail").getData().sServiceUrl);

			/*
			 * check if the availability of user picture is cached.
			 * If this information is cached, set picture URL if picture is available.
			 * If picture not available, set a place holder image
			 * */
			var bUserPictureAvailable = aUserPictureAvailability[sUrl];
			if (bUserPictureAvailable != null) {
				if (bUserPictureAvailable) {
					return sUrl;
				}
				else {
					return 	;
				}
			}

			/*
			 * if availability of the picture isn't cached.
			 * set a placeholder image initially
			 * in parallel, send an async call to check if the picture is available or not, cache this information and bind the URL if picture available
			 * */

			var fnSuccess = function() {
				aUserPictureAvailability[sUrl] = true;
				that.setIcon(sUrl);
				that.rerender();
			};

			var fnError = function() {
				aUserPictureAvailability[sUrl] = false;
			};

			cross.fnd.fiori.inbox.comments.checkImageAvailabilityAsync(sUrl, fnSuccess, fnError);

			return sPlaceHolderUrl;
		},

		// asynchronous call to check whether the picture exists in the backend or not
		checkImageAvailabilityAsync: function(sUrl, fnSuccess, fnError) {
			jQuery.ajax({
				url: sUrl,
				type: "GET",
				contentType : "image/jpeg",
				async: true,
				success : function(data, status, jqXHR) {
					if (data != "" && data != undefined) {
						fnSuccess();
					}
					else {
						fnError();
					}
				},
				error: function(data, text, code) {
					fnError();
				}
			});
		},

		getRelativeMediaSrc : function(sOrigin, sUser, sServiceUrl) {
			return sServiceUrl + "/UserInfoCollection(SAP__Origin='" + sOrigin + "',UniqueName='" + sUser + "')/$value";
		}
	};

	return cross.fnd.fiori.inbox.comments;
});
