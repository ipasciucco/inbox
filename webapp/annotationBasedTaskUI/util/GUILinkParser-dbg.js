/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([

], function(

) { "use strict";

    var GUILinkParser = function(sGUILink) {
        this._oParameters = {};
        this._aTokens = [];
        if (typeof sGUILink === "string") {
            this._sGUILink = sGUILink;
            this._initialParse(sGUILink);
        } else {
            this._sGUILink = "";
            throw new TypeError("GUILink passed to new GUILinkParser is not a string.");
        }
    };

    /**
     * @param {string} sName The name of the parameter that should be returned
     * @returns {string} The value of a GUI_Link parameter of the format name=value
     */
    GUILinkParser.prototype.getParameter = function(sName) {
        return (this._oParameters[sName] ? this._oParameters[sName].raw : undefined);
    };

    /**
     * Returns all tokens from the GUI_Link that were not of the format name=value
     * @returns {string[]} An array containing the string tokens
     */
    GUILinkParser.prototype.getTokens = function() {
        return this._aTokens;
    };

    /**
     * Parses the 'decisionactions' parameter from the GUI_Link if it is present
     * @returns {object[]} An array of objects containing entity name and qualifier for each decision action
     */
    GUILinkParser.prototype.getDecisionActions = function() {
        if (this._oParameters.decisionactions === undefined) {
            return [];
        } else if (this._oParameters.decisionactions.parsed !== null) {
            return this._oParameters.decisionactions.parsed;
        }
        var aActions = [];
        var aTokens = this._oParameters.decisionactions.raw.split(",");
        aTokens.forEach(function(sToken) {
            var iSeparator = sToken.indexOf("#");
            if (iSeparator !== -1) {
                aActions.push({
                    entityName: sToken.substring(0, iSeparator),
                    qualifier: sToken.substring(iSeparator)
                });
            } else {
                aActions.push({
                    entityName: sToken,
                    qualifier: ""
                });
            }
        });
        this._oParameters.decisionactions.parsed = aActions;
        return aActions;
    };

    GUILinkParser.prototype._initialParse = function() {
        var iParameterStart = this._sGUILink.indexOf("?") + 1;
        var aParameters = this._sGUILink.substring(iParameterStart).split("&");
        aParameters.forEach(function(sParameter) {
            var iSeparator = sParameter.indexOf("=");
            if (iSeparator !== -1) {
                var sKey = sParameter.substring(0,iSeparator);
                var sValue = sParameter.substring(iSeparator + 1);
                this._oParameters[sKey] = {
                    raw: sValue,
                    parsed: null
                };
            } else {
                this._aTokens.push(sParameter);
            }
        }.bind(this));
    };

    return GUILinkParser;

}, true);