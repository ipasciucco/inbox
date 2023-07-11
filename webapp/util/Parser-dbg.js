/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/base/Object"
], function(
	UI5Object
) {
	"use strict";

	UI5Object.extend("cross.fnd.fiori.inbox.util.Parser", {});

	cross.fnd.fiori.inbox.util.Parser = {

		fnParseComponentParameters: function(sRawString) {

			var oComponentParameters = {};

			// process only if the sapui5 scheme is sent
			if (this.isGuiLinkSapUi5Scheme(sRawString)) {
				oComponentParameters = this.getComponentParameters(sRawString);
			}

			return oComponentParameters;
		},

		getComponentParameters : function(sString) {
			var sAnnotationURL = "";
			var sServiceURL = "";
			var sDynamicComponentDetails = "";

			//get the data and the annotation details
			var oURIParameters = this.getURIParametersForComponent(sString);
			if (oURIParameters) {
				sServiceURL = oURIParameters.data && oURIParameters.data[0] ? oURIParameters.data[0] : sServiceURL;
				sAnnotationURL = oURIParameters.annotations && oURIParameters.annotations[0] ? oURIParameters.annotations[0] : sAnnotationURL;
			}

			//get the applicationPath and the component name
			sDynamicComponentDetails = this.stripURLParams(sString, oURIParameters);
			sDynamicComponentDetails = this.stripScheme(sDynamicComponentDetails, "sapui5://");

			var sApplicationPath = sDynamicComponentDetails.substring(0, sDynamicComponentDetails.lastIndexOf("/"));
			var sComponentName = sDynamicComponentDetails.substring(sDynamicComponentDetails.lastIndexOf("/") + 1);

			//create the Component parameter object with all the details required for Dynamic Component rendering.
			return {
				ComponentName: sComponentName,
				ApplicationPath: sApplicationPath,
				ServiceURL: sServiceURL,
				AnnotationURL: sAnnotationURL,
				QueryParameters:oURIParameters
			};
		},

		stripScheme : function(sString, scheme) {
			//Assumption is that the scheme is always in the beginning of the GUI_Link
			return sString.split(scheme)[1];
		},

		stripURLParams : function(sString, oURIParameters) {
			if (!jQuery.isEmptyObject(oURIParameters)) {
				return sString.substring(0, sString.indexOf("?"));
			}
			return sString;
		},

		isGuiLinkSapUi5Scheme: function(sString) {
			return sString && sString.indexOf("sapui5://") === 0;
		},

		getURIParametersForComponent: function(sUri) {
			var mParams = {};
			var sQueryString = sUri;
			if (sQueryString.indexOf("#") >= 0) {
				sQueryString = sQueryString.slice(0, sQueryString.indexOf("#"));
			}
			if (sQueryString.indexOf("?") >= 0) {
				sQueryString = sQueryString.slice(sQueryString.indexOf("?") + 1);
				var aParameters = sQueryString.split("&"),
					aParameter,
					sName,
					sValue;
				for (var i = 0; i < aParameters.length; i++) {
					var index = aParameters[i].indexOf("=");
					if (index === -1) {
						//console.log("Invalid Parameter :" + aParameters[i]);
						continue;
					}
					aParameter = [aParameters[i].slice(0, index), aParameters[i].slice(index + 1)];
					sName = decodeURIComponent(aParameter[0]);
					sValue = aParameter.length > 1 ? decodeURIComponent(aParameter[1].replace(/\+/g, " ")) : "";
					if (sName) {
						if (!Object.prototype.hasOwnProperty.call(mParams, sName)) {
							mParams[sName] = [];
						}
						mParams[sName].push(sValue);
					}
				}
			}

			return mParams;
		},

		/**
		 * Removes a parameters from url
		 *
		 * @param aKey - parameters for remove
		 * @param sSourceURL - url from where parameter to be removed
		 *
		 * @returns string with an url without input parameter
		 */
		removeParamsFromUrl : function(aKey, sSourceURL) {
			var	sQuery = (sSourceURL.indexOf("?") !== -1) ? sSourceURL.split("?")[1] : "";
			if (sQuery !== "") {
				var sUrl = sSourceURL.split("?")[0];
				var	sParam;
				var	aParams = [];
				aParams = sQuery.split("&");
				for (var n = 0; n <= aKey.length - 1; n++) {
					for (var i = aParams.length - 1; i >= 0; i -= 1) {
						sParam = aParams[i].split("=")[0];
						if (sParam === aKey[n]) {
							aParams.splice(i, 1);
						}
					}
				}
				sUrl = sUrl + "?" + aParams.join("&");
				return sUrl;
			}
			return sSourceURL;
		}
	};

	return cross.fnd.fiori.inbox.util.Parser;
});
