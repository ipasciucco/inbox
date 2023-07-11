/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.declare("cross.fnd.fiori.inbox.annotationBasedTaskUI.util.util");

cross.fnd.fiori.inbox.annotationBasedTaskUI.util.util = {
	getBindingPath: function(sUri) {
		// e.g.: /PurchaseOrders(PurchaseOrder='4500019958')
		var sBindingPath = "";
		if (sUri.indexOf("sid(") >= 0) {
			sBindingPath = sUri.slice(sUri.indexOf("("));
			sBindingPath = sBindingPath.slice(sBindingPath.indexOf("/"));
		} else {
			sBindingPath = sUri.slice(sUri.lastIndexOf("/"));
		}
		return sBindingPath;
	},

	getServiceSRVUrl: function(sUri) {
		// e.g.: /sap/opu/odata/sap/CB_PURCHASE_ORDER_;o=sid(Q7D.004)
		var sServiceUrl = "";
		if (sUri.indexOf("sid(") >= 0) {
			sServiceUrl = sUri.substr(0, sUri.indexOf(")") + 1);
		} else {
			sServiceUrl = sUri.substr(0, sUri.indexOf("/"));
		}
		return sServiceUrl;
	},

	appendUrlParameter: function(sUrl, sName, sValue) {
		if (!sUrl) {
			return sUrl;
		}
		return sUrl + (sUrl.indexOf("?") < 0 ? "?" : "&") + jQuery.sap.encodeURL(sName) + "=" + jQuery.sap.encodeURL(sValue);
	},

	onTableUpdateFinished: function(oEvent) {
		var iItemNumber = oEvent.getParameter("total");
		var sTitleId = oEvent.getSource().getHeaderToolbar().getTitleId();

		if (iItemNumber === 0) {
			oEvent.getSource().setVisible(false);
		} else {
			oEvent.getSource().setVisible(true);
			oEvent.getSource().getHeaderToolbar().getContent().forEach(function(oContent) {
				if (oContent.getId() === sTitleId) {
					var sHeaderText = oContent.getText();
					sHeaderText = sHeaderText.substring(0, sHeaderText.lastIndexOf("(")).trim();
					sHeaderText = sHeaderText + " (" + iItemNumber + ")";
					oContent.setText(sHeaderText);
				}
			});
		}
	},

	getHeaderFormattedObject: function(sValuePath, sCurrencyPath) {
		var oReturnObject = "{parts : [ { path : '" + sValuePath + "'}, { path : '" + sCurrencyPath +
			"'} ], type: 'sap.ui.model.type.Currency', formatOptions: {style: 'standard', showMeasure: false}}";

		return oReturnObject;
	},

	getListItemType: function(meta) {
		return meta.hasOwnProperty("com.sap.vocabularies.UI.v1.HeaderInfo") ? "Navigation" : "Inactive";
	},

	isNavigationProperty: function(item) {
		//I assume that only a navigation property does not have an EdmType property
		return !item.hasOwnProperty("EdmType");
	},

	createFirstColumnHandledContext: function() {
		var oModel = new sap.ui.model.json.JSONModel({
			handled: false
		});
		return new sap.ui.model.Context(oModel, "/");
	},

	getMinScreenWidthAttribute: function(firstColumnHandledContext) {
		if (!firstColumnHandledContext.handled){
			firstColumnHandledContext.handled = true;
			return "";
		}
		return "Tablet";
	},

	cleanObject: function(oObject) {
		for (var sProperty in oObject) {
			if (oObject.hasOwnProperty(sProperty)) {
				delete oObject[sProperty];
			}
		}
	},

	parseEntityKeyProperties: function(aEntityKeyParts) {
		var mKeyProperties = {};
		aEntityKeyParts.forEach(function(sPropertyValuePair) {
			var iSeparator = sPropertyValuePair.indexOf("=");
			if (iSeparator === -1) {
				return null;
			}
			var sProperty = sPropertyValuePair.substring(0, iSeparator);
			var sValue = sPropertyValuePair.substring(iSeparator + 1);
			// If the value is a string it will be in quotation marks, but createKey doesn't expect them so remove them
			if (jQuery.sap.startsWith(sValue, "'") && jQuery.sap.endsWith(sValue, "'")) {
				sValue = sValue.substring(1, sValue.length - 1);
			}
			mKeyProperties[sProperty] = sValue;
		});
		return mKeyProperties;
	},

	standardizeEntityKey: function(oModel, sEntitySet, sEntityKey) {
		var sFallback = "/" + sEntitySet + "(" + sEntityKey + ")",
			aEntityKeyParts = sEntityKey.split(",");
		// In case of a single key property without a property name, return it as is
		if (aEntityKeyParts.length === 1 && aEntityKeyParts[0].indexOf("=") === -1) {
			return sFallback;
		}
		// Otherwise parse the parts into a property-value-map...
		var mKeyProperties = this.parseEntityKeyProperties(aEntityKeyParts);
		if (!mKeyProperties) {
			jQuery.sap.log.error("[Util] Entity keyPredicate '" + sEntityKey + "' could not be parsed.");
			return sFallback;
		}
		// ...then order them in the same way as they are ordered in the entity type definition
		return "/" + oModel.createKey(sEntitySet, mKeyProperties);
	},

	formatTableLabelText: function(oText) {
	    //handle also null and undefined values properly by casting to String
	    return "<strong>" + jQuery.sap.encodeHTML("" + oText) + "</strong>";
	},

	formatValueState: function(sValueState) {
		return sap.ui.core.ValueState[sValueState] || sap.ui.core.ValueState.None;
	},

	hasDetails: function(oValue) {
		return !!(oValue && oValue.InboxDetails && oValue.InboxDetails.AnnotationPath);
	}
};

cross.fnd.fiori.inbox.annotationBasedTaskUI.util.formatHeaderTitle = function(oInterface, oValue, oAdditionalValue, oCurrency) {
	var sValuePath = sap.ui.model.odata.AnnotationHelper.format(oInterface, oValue);
	if (!oAdditionalValue) {
		return sValuePath;
	}
	var removeLeadingSlash = function(sPath) {
		return sPath.substring(1, sPath.length - 1);
	};
	var sAdditionalValuePath = sap.ui.model.odata.AnnotationHelper.format(oInterface, oAdditionalValue);
	var sCurrencyPath = sap.ui.model.odata.AnnotationHelper.format(oInterface, oCurrency);
	sValuePath = removeLeadingSlash(sValuePath);
	sAdditionalValuePath = removeLeadingSlash(sAdditionalValuePath);
	sCurrencyPath = removeLeadingSlash(sCurrencyPath);
	var oReturnObject = "{parts : [{ path : '" + sAdditionalValuePath + "'}, { path : '" + sCurrencyPath + "'}, { path : '" + sValuePath +
		"'}]}";
	return oReturnObject;
};
cross.fnd.fiori.inbox.annotationBasedTaskUI.util.formatHeaderTitle.requiresIContext = true;

cross.fnd.fiori.inbox.annotationBasedTaskUI.util.formatHeaderNumber = function(oInterface, oValue, oCurrency) {

	var sValuePath = sap.ui.model.odata.AnnotationHelper.simplePath(oInterface, oValue);
	var sCurrencyPath = sap.ui.model.odata.AnnotationHelper.simplePath(oInterface, oCurrency);

	sValuePath = sValuePath.replace("{", "").replace("}", "");
	sCurrencyPath = sCurrencyPath.replace("{", "").replace("}", "");

	var oReturnObject = cross.fnd.fiori.inbox.annotationBasedTaskUI.util.util.getHeaderFormattedObject(sValuePath, sCurrencyPath);

	return oReturnObject;
};
cross.fnd.fiori.inbox.annotationBasedTaskUI.util.formatHeaderNumber.requiresIContext = true;

cross.fnd.fiori.inbox.annotationBasedTaskUI.util.formatTableLabel = function(oInterface, oValue) {
	var sPathExpression = sap.ui.model.odata.AnnotationHelper.format(oInterface, oValue);
	if (jQuery.sap.startsWith(sPathExpression, "{") && jQuery.sap.endsWith(sPathExpression, "}")) {
		sPathExpression = sPathExpression.substring(0, sPathExpression.length - 1) +
			",formatter:'cross.fnd.fiori.inbox.annotationBasedTaskUI.util.util.formatTableLabelText'}";
	}
	return sPathExpression;
};
cross.fnd.fiori.inbox.annotationBasedTaskUI.util.formatTableLabel.requiresIContext = true;

cross.fnd.fiori.inbox.annotationBasedTaskUI.util.formatValueStateExpression = function(oInterface, oValue) {
	var sPathExpression = sap.ui.model.odata.AnnotationHelper.format(oInterface, oValue);
	if (jQuery.sap.startsWith(sPathExpression, "{") && jQuery.sap.endsWith(sPathExpression, "}")) {
		sPathExpression = sPathExpression.substring(0, sPathExpression.length - 1) +
			",formatter:'cross.fnd.fiori.inbox.annotationBasedTaskUI.util.util.formatValueState'}";
	}
	return sPathExpression;
};
cross.fnd.fiori.inbox.annotationBasedTaskUI.util.formatValueStateExpression.requiresIContext = true;
