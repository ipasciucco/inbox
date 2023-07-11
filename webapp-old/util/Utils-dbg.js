/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
		"sap/m/FormattedText",
		"sap/ui/base/DataType"
	] , function (FormattedText, DataType) {
		"use strict";

		return {

			/**
			 * This function checks if parameter testVar is a string or not.
			 *
			 * @param {object} testVar Any object to test if it is a string.
			 * @returns {boolean} true If testVar is a string and false otherwise.
			 */
			isString : function (testVar) {
				if (typeof testVar === "string" || testVar instanceof String) {
					return true;
				}
				else {
					return false;
				}
			},

			/**
			 * This function removes Html tags from input String or Object.
			 *
			 * @param {object|string} oHtmlData object or text that needs to be stripped from HTML tags.
			 * @returns {object|string} oHtmlData stripped from HTML tags.
			 */
			fnRemoveHtmlTags : function (oHtmlData) {
				if (!oHtmlData) {
					return oHtmlData;
				}
				if (this.isString(oHtmlData)) {
					return this.stripHTMLfromText(oHtmlData);
				}

				for (var prop in oHtmlData) {
					// using hasOwnProperty to get only string owned properties
					if (!oHtmlData.hasOwnProperty(prop) || !this.isString(oHtmlData[prop])) {
						continue;
					}

					oHtmlData[prop] = this.stripHTMLfromText(oHtmlData[prop]);
				}

				return oHtmlData;
			},

			/**
			 * Removes HTML tags from text.
			 *
			 * @param {String} sText text for stripping.
			 * @returns {String} stripped text
			 */
			stripHTMLfromText: function(sText) {
				// use FormattedText control to remove "dangerous" tags.
				var sResult = new FormattedText().setHtmlText(sText).getHtmlText();

				// remove all remaining html tags and trim front and back.
				sResult = sResult.replace(/<[^>]*>?/gm, " ").trim();

				// trim multi spaces if any.
				while (sResult.indexOf("  ") !== -1) {
					sResult = sResult.replace("  ", " ");
				}

				return sResult;
			},

			/**
			* This function checks if parameter item is a Json or not. 
			* It is copied from CommonFunctions.js to avoid loading another module.
			*
			* @param {object|string|boolean|number} item Any object to test if it is a Json.
			* @returns {boolean} true If item is a Json and false otherwise.
			*/
			isJson: function(item) {
				var innerItem = typeof item !== "string"
					? JSON.stringify(item)
					: item;

				try {
					innerItem = JSON.parse(innerItem);
				}
				catch (e) {
					return false;
				}

				if (typeof innerItem === "object" && innerItem !== null) {
					return true;
				}

				return false;
			},
			
			//All descendants of sap.ui.base.ManagedObject must meet the requirements of namespace sap.ui.core.ID -
			//  for the property sId even though their type is documented as String
			//  see Internal Incident: 1880658140, Error creating column with special symbol in ID
			//  "Allowed is a sequence of characters (capital/lowercase), digits, underscores, dashes, points and/or colons. It may start with a character or underscore only."
			genSafeId: function(customAttribute, bCheckFirstChar, sAllowedChars, sAllowedFirstSymbols) {
				var allAllowedChars = sAllowedChars ? sAllowedChars : "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz0123456789_-.:";
				//old way - escaping of some chars - leaving it as it is because tests are set this way
				var id = (decodeURIComponent(customAttribute.TaskDefinitionID) + customAttribute.Name).replace(/\//g, "");

				var oType = DataType.getType("sap.ui.core.ID");
				if (!oType.isValid(id)) {
					//replacing all others with ascii code in order to avoid the case when two IDs differ only by escaped symbols
					for (var i = 0; i < id.length; i++) {
						if (allAllowedChars.indexOf(id[i]) < 0) {
							id = id.replace(new RegExp(id[i], "g"), id[i].charCodeAt(0));
						}
					}
					if ((id.length > 0) && bCheckFirstChar) {
						var alphabetLettersAndUnderscore = sAllowedFirstSymbols ? sAllowedFirstSymbols : "_AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz";
						if (alphabetLettersAndUnderscore.indexOf(id[0]) < 0) {
							id = "a" + id;
						}
					}
				}
				return id;
			},

			/**
			 * Check if sort by Custom Attribute is selected.
			 *
			 * @param {Array} aSorters array with sorters.
			 * @returns {boolean} true if sort by custom attribute is active
			 */
			checkIfFirstSorterIsCustomAttribute: function(aSorters) {
				return aSorters && aSorters[0] && aSorters[0].sPath && aSorters[0].sPath.indexOf("CA_") === 0;
			},

			/**
			 * Check filtering by CustomAttribute.
			 *
			 * @param {Array} aFilters array with filters.
			 * @returns {boolean} true if filtered by custom attribute
			 */
			checkIfFilteredByCustomAttribute: function(aFilters) {
				var bCAFilter = false;
				for (var i = 0; i < aFilters.length; i++) {
					if (aFilters[i] 
							&& aFilters[i].aFilters 
							&& aFilters[i].aFilters[0] 
							&& aFilters[i].aFilters[0].sPath 
							&& aFilters[i].aFilters[0].sPath.indexOf("CA_") === 0) {
						bCAFilter = true;
						break;
					}
				}
				return bCAFilter;
			}
		};
	}
);