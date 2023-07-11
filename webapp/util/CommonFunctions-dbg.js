/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
/*
Use this to declare common functions in one place to avoid duplicate code.
*/

sap.ui.define([
	"sap/ui/base/Object",
	"sap/m/FormattedText"
], function(
	UI5Object,
	FormattedText
) {
	"use strict";

	UI5Object.extend("cross.fnd.fiori.inbox.util.CommonFunctions", {});

	cross.fnd.fiori.inbox.util.CommonFunctions = {
		/*
		Function is used to compare two buttons for display order pirority.
		High number means that button goes to the end of the list
		Low number means it goes to the front of the list
		1-200 Positive buttons
		201-400 Negative buttons
		401-1000 Neutral buttons and custom buttons
		1001-2000 Standard buttons
		>2000 if you want action to be placed after standard butttons
		*/
		compareButtons: function(a, b) {
			if (!a.iDisplayOrderPriority) {
				a.iDisplayOrderPriority = 700;
			}
			if (!b.iDisplayOrderPriority) {
				b.iDisplayOrderPriority = 700;
			}
			return a.iDisplayOrderPriority - b.iDisplayOrderPriority;
		},

		/**
		 * Function is used to make an union of two object based arrays
		 * Currently not in use.
		 * @param {array} aA the first value for unity [{id: 1}, {id: 5}, {id: 3}, {id: 4}]
		 * @param {array} aB the second value for unity [{id: 1}, {id: 2}, {id: 3}, {id: 7}]
		 * @param {string} sFieldName unique field name for comparison 'id'
		 * @returns {array} aResult contains not ordered nonduplicates [{id: 1}, {id: 5}, {id: 3}, {id: 4}, {id: 2}, {id: 7}]
		 * @public
		 */
		unionTwoArraysByFieldName: function(aA, aB, sFieldName) {
			var aResult = [];
			for (var i = 0; i < aB.length; i++) {
				var found = false;

				for (var j = 0; j < aA.length; j++) {
					if (aB[i][sFieldName] === aA[j][sFieldName]) {
						found = true;
						break;
					}
				}

				if (!found) {
					aResult.push(aB[i]);
				}
			}

			return aA.concat(aResult);
		},

		/**
		 * This function removes Html tags from input String or Object.
		 *
		 * @param {object|string} oHtmlData object or text that needs to be stripped from HTML tags.
		 * @returns {object|string} oHtmlData stripped from HTML tags.
		 */
		fnRemoveHtmlTags : function (oHtmlData) {
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
		 * This function compares InstanceID and SAP__Origin between 2 task items to determine are they same object.
		 * oTaskItemFirst should be the object that is curently in proccess.
		 * Best way to take oTaskItemSecond is from this.oModel2.getData().
		 * 
		 * @param {object} oTaskItem object the frist to compare
		 * @param {object} oTaskItemSecond object the second to compare.
		 * @returns {boolean} true if both objects are same.
		 * @public
		 */
		areTasksIdentical: function(oTaskItemFirst, oTaskItemSecond) {
			if (oTaskItemFirst.InstanceID === oTaskItemSecond.InstanceID && oTaskItemFirst.SAP__Origin === oTaskItemSecond.SAP__Origin) {
				return true;
			}
			else {
				return false;
			}
		},

		/**
		 * This function checks if parameter item is a Json or not.
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
		}
	};

	return cross.fnd.fiori.inbox.util.CommonFunctions;
});
