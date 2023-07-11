/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/base/security/URLWhitelist",
	"sap/base/Log",
	"sap/base/security/encodeURLParameters",
	"sap/ui/base/Object",
	"sap/ui/thirdparty/jquery",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"cross/fnd/fiori/inbox/util/Parser"
], function (URLWhitelist, Log, encodeURLParameters, UI5Object, jQuery, MessageBox, MessageToast, Parser) {
	"use strict";

	return UI5Object.extend("cross.fnd.fiori.inbox.util.ActionHelper", {
		GUILinkProperty: "GUI_Link",
		_oURLParsingService: null,

		constructor: function(oController, oView) {
			this._oView = oView;
			this._oController = oController;
			this._oResourceBundle = oController.getResourceBundle();
		},

		isIntentURL: function(sURL) {
			this._oURLParsingService = this._oURLParsingService ||
				sap.ushell &&
				sap.ushell.Container &&
				sap.ushell.Container.getService &&
				sap.ushell.Container.getService("URLParsing");

			return this._oURLParsingService && this._oURLParsingService.isIntentUrl(sURL);
		},

		isAnnotationBasedTask: function(sURL) {
			var oParameters = Parser.fnParseComponentParameters(sURL);

			return !jQuery.isEmptyObject(oParameters);
		},

		getURLParsingService: function() {
			return this._oURLParsingService;
		},

		/* validate the URL.
		 * If validation fails, try to encode URL parameters and then validate again.
		 * If still fails, encode the path and URL parameters both
		 * If validation fails again, show an error message.
		 */
		fnValidateOpenTaskURLAndRedirect: function(sURL, bPropogateSapURLParameters) {
			//Open task cannot be tested when running stand alone. for ex: from Web IDE
			if (sap.ushell.Container) {
				var urlParser = sap.ushell.Container.getService("URLParsing");
				if (urlParser) {
					if (urlParser.isIntentUrl(sURL)) {
						// Old navigation code
						// sap.m.URLHelper.redirect(encodeURI(sURL), true);
						var oParsed = urlParser.parseShellHash(sURL);
						oParsed.params["sap-ushell-navmode"] = ["explace"];
						oParsed.target = { semanticObject : oParsed.semanticObject,
											action : oParsed.action	};
						var oCrossAppNav = sap.ushell.Container.getService("CrossApplicationNavigation");
						oCrossAppNav.isNavigationSupported([oParsed]).done(function(aResponses) {
							if (aResponses[0].supported === true) {
								oCrossAppNav.toExternal(oParsed);
							}
							else {
								Log.error("Intent is not supported for sURL: " + sURL, "cross.fnd.fiori.inbox.util.ActionHelper");
							}
						}).fail(function(oError) {
							Log.error("isNavigationSupported failed processing sURL: " + sURL, oError, "cross.fnd.fiori.inbox.util.ActionHelper");
						});
					}
					else if (URLWhitelist.validate(sURL)) {
						sap.m.URLHelper.redirect(this.addOrReplaceParameters(sURL, bPropogateSapURLParameters ? this._getSapURLParameters(): {}), true);
					}
					else if (URLWhitelist.validate(encodeURI(sURL))) {
						sURL = encodeURI(sURL);
						sap.m.URLHelper.redirect(this.prependParameters(sURL, bPropogateSapURLParameters ? this._getSapURLParameters(): {}), true);
					}
					else {
							MessageBox.error(this._oResourceBundle.getText("dialog.error.taskExecutionUI"));
						}
				}
				else {
					Log.error("URL Parsing service look up failed as a result Open Task action will not work.");
				}
			}
			else {
				Log.error("ushell container does not exist as a result Open Task action will not work.");
			}
		},

		addOrReplaceParameters :function(url, additionalParams) {
			//Use ushell URL prasing to get Hash from the URL
			var urlParser = sap.ushell.Container.getService("URLParsing");
			var hash = urlParser.getHash(url);
			//Remove hash from url to get rooturl
			var rootUrl = url;
			if (hash) {
				rootUrl = url.substring(0, url.indexOf(hash) -1);//-1 to remove #
			}
			//Check if it is
			//Remove paramters from root Url
			var paramString;
			if (rootUrl.indexOf("?") !== -1) {
				paramString = rootUrl.substring(rootUrl.indexOf("?"));
				rootUrl = rootUrl.substring(0, rootUrl.indexOf("?"));
			}
			//Use ushell URL prasing to convert url parameters to JSON
			var params = urlParser.parseParameters(paramString);
			for (var property in additionalParams) {
				params[property] = additionalParams[property];
			}
			//create param string from params + additional params
			paramString = urlParser.paramsToString(params);
			//Reconstruct URL by adding additional parameters also.
			var reconstructedURL = rootUrl + "?" + paramString;

			if (hash) {
				reconstructedURL += "#" + hash;
			}

			return reconstructedURL;
		},

		prependParameters :function(url, additionalParams) {
			//Use ushell URL prasing to get Hash from the URL
			var urlParser = sap.ushell.Container.getService("URLParsing");
			var hash = urlParser.getHash(url);
			//Remove hash from url to get rooturl
			var rootUrl = url;
			if (hash) {
				rootUrl = url.substring(0, url.indexOf(hash) -1);//-1 to remove #
			}
			//Remove paramters from root Url
			var paramString;
			if (rootUrl.indexOf("?") !== -1) {
				paramString = rootUrl.substring(rootUrl.indexOf("?")+1);
				rootUrl = rootUrl.substring(0, rootUrl.indexOf("?"));
			}
			//create param string from params + additional params
			var additionalParamString = urlParser.paramsToString(additionalParams);
			//check if paramaString is empty
			paramString = (paramString)
				? paramString = additionalParamString + "&" + paramString
				: paramString = additionalParamString;

			//Reconstruct URL by adding additional parameters also.
			var reconstructedURL = rootUrl + "?" + paramString;
			if (hash) {
				reconstructedURL += "#" + hash;
			}
			return reconstructedURL;
		},

		/* Open task button should be disabled , will return false
		 * If TaskSupports.UIExecutionLink is false
		 * If TaskEntity.GUI_Link and TaskEntity.UIExecutionLink.GUI_Link is empty
		 * If TaskEntity.GUI_Link/ Task.UIExecutionLink.GUI_Link = intent with mode embedInttoDetail
		 * If Annotation based task is selectd
		 * */
		isOpenTaskEnabled: function(oItem, bEmbedInDetailOnSelect ) {
			if (!oItem.TaskSupports.UIExecutionLink) {
				return false;
			}
			else if ((oItem.GUI_Link  ||  (oItem.UIExecutionLink  && oItem.UIExecutionLink.GUI_Link )) && (this.isAnnotationBasedTask(oItem.GUI_Link  ?  oItem.GUI_Link : oItem.UIExecutionLink.GUI_Link))) {
				return false;
			}
			else if (oItem.TaskSupports.UIExecutionLink && !oItem.GUI_Link && oItem.UIExecutionLink  && !oItem.UIExecutionLink.GUI_Link) {
				return false;
			}
			else if (bEmbedInDetailOnSelect) {
				return false;
			}
			else {
				return true;
			}
		},

		_getSapURLParameters: function() {
			var oParams = this._getThemeandLanguageLocaleParams();
			jQuery.extend(oParams, this._getUI5LegacyFormatParams());
			jQuery.extend(oParams, this._getSapAccessibilityParam());
			jQuery.extend(oParams, this._getSapStatisticsParam());
			return oParams;
		},

		_getUI5LegacyFormatParams: function() {
			var oformatParams = {};
			var sLegacyDateFormat = sap.ui.getCore().getConfiguration().getFormatSettings().getLegacyDateFormat();
			var sLegacyTimeFormat = sap.ui.getCore().getConfiguration().getFormatSettings().getLegacyTimeFormat();
			var sLegacyNumberFormat = sap.ui.getCore().getConfiguration().getFormatSettings().getLegacyNumberFormat();
			if (sLegacyDateFormat) {
				oformatParams["sap-ui-legacy-date-format"] = sLegacyDateFormat;
			}
			if (sLegacyTimeFormat) {
				oformatParams["sap-ui-legacy-time-format"] = sLegacyTimeFormat;
			}
			if (sLegacyNumberFormat) {
				oformatParams["sap-ui-legacy-number-format"] = sLegacyNumberFormat;
			}
			return oformatParams;
		},

		_getSapAccessibilityParam: function() {
			var oAccessibilityParam = {};
			var sAccessibilityMode = sap.ushell.Container.getUser().getAccessibilityMode();
			if (sAccessibilityMode) {
				oAccessibilityParam["sap-accessibility"] = "X";
			}
			return oAccessibilityParam;
		},

		_getSapStatisticsParam: function() {
			var oStatisticsParam = {};
			var sSapStatistics = sap.ui.getCore().getConfiguration().getStatistics();
			if (sSapStatistics) {
				oStatisticsParam["sap-statistics"] = sSapStatistics;
			}
			return oStatisticsParam;
		},

		_getThemeandLanguageLocaleParams: function() {
			var sAppliedTheme = sap.ui.getCore().getConfiguration().getTheme();
			var sLanguage = sap.ui.getCore().getConfiguration().getSAPLogonLanguage() || "";
			var sLocale = sap.ui.getCore().getConfiguration().getLocale();
			var sThemeNWBC =  sap.ushell.Container
				? sap.ushell.Container.getUser().getTheme(sap.ushell.User.prototype.constants.themeFormat.NWBC)
				: null;

			var params = {};
			var rStandardThemePattern = /^sap_hcb/i;

			var mTaskAppThemesMap = {
				 // eslint-disable-next-line camelcase
				sap_hcb: {
					WDJ: "/com.sap.ui.lightspeed/themes/sap_hcb",
					WDA: "sap_hcb"
				}
			};

			if (sAppliedTheme) {
				if (rStandardThemePattern.test(sAppliedTheme)) {
					params["sap-ui-theme"] = sAppliedTheme;
					params["sap-theme-name"] = sAppliedTheme;
					var oTaskAppThemeMap = mTaskAppThemesMap[sAppliedTheme];
					if (oTaskAppThemeMap) {
						if (oTaskAppThemeMap["WDJ"]) {
							params["sap-cssurl"] = location.protocol + "//" + location.host + ":" + location.port + oTaskAppThemeMap["WDJ"];
						}
						if (oTaskAppThemeMap["WDA"]) {
							params["sap-theme"] = oTaskAppThemeMap["WDA"];
						}
					}
				}
				else {
					params["sap-ui-theme"] = sAppliedTheme;
					params["sap-theme-name"] = sAppliedTheme;
				}
			}
			if (sLanguage) {
				params["sap-language"] = sLanguage;
			}
			if (sLocale) {
				params["sap-locale"] = sLocale;
			}
			if (sThemeNWBC) {
				params["sap-theme-NWBC"] = sThemeNWBC;
			}
			return params;
		},

		openTaskInNewWindow: function(oUIExecutionLink) {
			if (oUIExecutionLink && oUIExecutionLink.GUI_Link && oUIExecutionLink.GUI_Link !== "") {
				var sUrl = oUIExecutionLink.GUI_Link;
				var oDataManager = cross.fnd.fiori.inbox.util.tools.Application.getImpl().getComponent().getDataManager();
				this.fnValidateOpenTaskURLAndRedirect(sUrl, oDataManager.isForwardUserSettings());
			}
			else {
				this.showErrorOnOpenTask();
			}
		},

		showErrorOnOpenTask: function() {
			MessageToast.show(this.i18nBundle.getText("dialog.error.taskExecutionUI"));
		},

		getSelectedTasksDetails: function(aSelectedContexts) {
			var oSelectedTasksDetails = {
				aSelectedTaskTypes: [],
				oSelectedTaskTypes: {},
				aItems: [],
				SupportsClaim: true,
				SupportsRelease: true,
				SupportsForward: true,
				SupportsResubmit: true,
				SupportsConfirm: true,
				bContainsConfirmableItem: false
			};
			var oItem, oBindingContext, oTaskSupports, sTaskDefinitionID, sInstanceID, sOrigin;

			for (var i in aSelectedContexts) {
				oBindingContext = aSelectedContexts[i];
				oTaskSupports = oBindingContext.getProperty("TaskSupports");
				sTaskDefinitionID = oBindingContext.getProperty("TaskDefinitionID");
				sInstanceID = oBindingContext.getProperty("InstanceID");
				sOrigin = oBindingContext.getProperty("SAP__Origin");

				// store selected items's details
				oItem = {
					InstanceID: sInstanceID,
					SAP__Origin: sOrigin, // eslint-disable-line camelcase
					sContextPath: oBindingContext.getPath()
				};
				oSelectedTasksDetails.aItems.push(oItem);

				// store unique Task Types of the selected tasks
				if (!oSelectedTasksDetails.oSelectedTaskTypes[sTaskDefinitionID]) {
					oSelectedTasksDetails.oSelectedTaskTypes[sTaskDefinitionID] = {
						TaskDefinitionID: sTaskDefinitionID,
						InstanceID: sInstanceID,
						SAP__Origin: sOrigin // eslint-disable-line camelcase
					};
					oSelectedTasksDetails.aSelectedTaskTypes.push(sTaskDefinitionID);
				}

				// store SupportsClaim
				if (oSelectedTasksDetails.SupportsClaim && !oTaskSupports.Claim) {
					oSelectedTasksDetails.SupportsClaim = false;
				}

				// store SupportsRelease
				if (oSelectedTasksDetails.SupportsRelease && !oTaskSupports.Release) {
					oSelectedTasksDetails.SupportsRelease = false;
				}

				// store SupportsForward
				if (oSelectedTasksDetails.SupportsForward && !oTaskSupports.Forward) {
					oSelectedTasksDetails.SupportsForward = false;
				}

				// store SupportsResubmit
				if (oSelectedTasksDetails.SupportsResubmit && !oTaskSupports.Resubmit) {
					oSelectedTasksDetails.SupportsResubmit = false;
				}

				// store SupportsConfirm
				if (oSelectedTasksDetails.SupportsConfirm && !oTaskSupports.Confirm) {
					oSelectedTasksDetails.SupportsConfirm = false;
				}

				// store variable value
				if (!oSelectedTasksDetails.bContainsConfirmableItem && oTaskSupports.Confirm) {
					oSelectedTasksDetails.bContainsConfirmableItem = true;
				}
			}
			return oSelectedTasksDetails;
		},

		getCommonDecisionsForMultipleTasks: function(aLists) {
			if (aLists.length === 0) {
				return [];
			}
			else if (aLists.length === 1) {
				return aLists[0];
			}
			var aIntersection = aLists[0];
			for (var i = 1; i < aLists.length; i++) {
				aIntersection = this._getCommonDecisionsForTwoTasks(aIntersection, aLists[i]);
				if (aIntersection.length === 0) {
					break;
				}
			}
			return aIntersection;
		},

		_getCommonDecisionsForTwoTasks: function(aArray1, aArray2) {
			var results = [];
			var i, j;
			var arr1Length = aArray1.length;
			var arr2Length = aArray2.length;

			for (i = 0; i < arr1Length; i++) {
				for (j = 0; j < arr2Length; j++) {
					if (aArray1[i].DecisionKey === aArray2[j].DecisionKey && aArray1[i].Nature === aArray2[j].Nature) {
						results.push(aArray1[i]);
					}
				}
			}
			return results;
		},

		// encode URL's query parameters
		getEncodedURL: function(sURL) {
			var aURLParts = sURL.split("?");
			sURL = aURLParts[0] + "?" + encodeURLParameters(this.getQueryObject(aURLParts[1]));
			return sURL;
		},

		// convert query string in to a key value pair object
		getQueryObject: function( sQueryString ) {
			var params = {}, aQueryParts, temp;

			// Split into key/value pairs
			aQueryParts = sQueryString.split("&");

			// Convert the array of query parts into a key value pair object
			jQuery.each(aQueryParts, function(i, sQueryPart) {
				temp = this.splitString(sQueryPart, "=");
				params[temp[0]] = temp[1];
			}.bind(this));

			return params;
		},

		// this function splits a string into two parts by the first occurence of a splitter
		splitString: function (sString, sSplitter) {
			var aParts = [],
			index = sString.indexOf(sSplitter) + 1;

			if (index) {
				aParts[0] = sString.split(sSplitter, 1)[0];
				aParts[1] = sString.substring(index);
			}

			return aParts;
		}
	});
});