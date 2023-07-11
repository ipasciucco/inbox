/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	] , function () {
		"use strict";

		return {

			/**
			 * Parses different time of day formats supplied from the back-ends. It returns UNIX time stamp in milliseconds.
			 * If Time of Day Format contains unexpected symbols or Format is not recognized NaN is returned.
			 *
			 * @public
			 * @param {(string|int)} sDuration date format to be parsed. If int UNIX time stamp in milliseconds is assumed.
			 * @returns {int} UNIX time stamp in milliseconds. (milliseconds that have elapsed since 00:00:00 UTC, Thursday, 1 January 1970)
			 */
			fnDurationParser: function(sDuration) {
				if (sDuration === null) {
					return NaN;
				}
				else if (typeof sDuration === "number") {
					return sDuration; // Time as Time Stamp in  milliseconds
				}
				var	a,
					re,
					iHours   = 0,
					iMinutes = 0,
					iSeconds = 0;
				if (sDuration.indexOf("PT") === 0) {
					re = /PT|H|M|S/;		// Time Duration Format "PT19H20M30S". BPM Format. This should also be the default Time Duration Format.
					a = sDuration.split(re);
					if (a.length === 5) {
						return this.parseDurationHMS5(a);
					}
					else if (a.length > 1) {  // Case when some entries are missing in Format "PT19H20M30S"
						var sTemp = sDuration.slice(2);
						var indexH = sTemp.indexOf("H");
						if (indexH > 0) {
							iHours = parseInt(sTemp.substring(0, indexH),10);
							sTemp = sTemp.slice(indexH + 1);
						}
						var indexM = sTemp.indexOf("M");
						if (indexM > 0) {
							iMinutes = parseInt(sTemp.substring(0, indexM),10);
							sTemp = sTemp.slice(indexM + 1);
						}
						var indexS = sTemp.indexOf("S");
						if (indexS > 0) {
							iSeconds = parseInt(sTemp.substring(0, indexS),10);
						}
						return ((3600 * iHours) + (60 * iMinutes) +  iSeconds) * 1000;
					}
				}
				re = /[^0-9]/;		// Time Diration Format	"HHMMSS". Old TGW format.
				if ((sDuration.match(re)) === null && (sDuration.length === 6)) {
					return this.parseDurationHMSnull6(sDuration);
				}
				if (sDuration.indexOf("T") === 10) {
					re = /-|T|\:/;		// Time Diration Format "0001-01-01T10:20:30". TGW-cloud format.
					a = sDuration.split(re);
					if (a.length === 6) {
						return this.parseDurationHMS6(a);
					}
					else if (a.length === 5) {			// Time Diration Format "0001-01-01T10:20".
						return this.parseDurationHM(a);
					}
				}
				return NaN; 			// If Time Duration Format is not recognized.
			},

			/**
			 * Parses different time formats supplied from the back-ends. It returns UNIX time stamp in milliseconds.
			 * If Time Format contains unexpected symbols or Format is not recognized NaN is returned.
			 *
			 * @param {(string,int)} sTime date format to be parsed. If int UNIX time stamp in milliseconds is assumed.
			 * @returns {int} UNIX time stamp in milliseconds. (milliseconds that have elapsed since 00:00:00 UTC, Thursday, 1 January 1970)
			 * @public
			 */
			// 	!!! Date.UTC functions counts months from 0-11. If wrong month is supplied (e.g. 13) it will adjust result.
			fnTimeParser: function(sTime) {
				if (sTime === null) {
					return NaN;
				}
				if (typeof sTime === "number") {
					return sTime; // Date as Time Stamp in  milliseconds
				}
				var aInt = [];
				var re = /\(|\)/;		// Time Format	"\/Date(869080830000)\/". This should be the default Time Format.
				var a = sTime.split(re);
				if (a[0] === "/Date") {
					return parseInt(a[1], 10);
				}

				re = /^\d{4}-\d{2}-\d{2}$/; // Time Format "YYYY-MM-DD".
				if (re.test(sTime)) {
					// Convert "YYYY-MM-DD" => "YYYYMMDD" so that
					// it can be handled below
					sTime = sTime.replace(/-/g, '');
				}
				
				re = /[^0-9]/;			// Time Format	"YYYYMMDD". Old TGW format.
				if (sTime.match(re) === null && sTime.length === 8) {
					aInt[0] = parseInt(sTime.slice(0,4),10);
					aInt[1] = parseInt(sTime.slice(4,6),10);
					aInt[2] = parseInt(sTime.slice(6),10);
					var date = new Date();
					date.setUTCFullYear(aInt[0]);
					date.setUTCMonth(aInt[1] - 1);
					date.setUTCDate(aInt[2]);
					date.setUTCHours(0, 0, 0, 0);
					return date.getTime();
				}
				if (sTime.indexOf("T") === 10) {  // Time Format	"2018-01-05T00:00:00". BPM and TGW-cloud format. Time is in UTC.
					if (sTime.length > 19) { // This is introduced to process ISO8601 strings like "1997-07-16T20:20:30.45+01:00" and "1997-07-16T19:20:30.45Z"
					return (new Date(sTime)).getTime();
					}
					else if (sTime.length === 19) {
						return (new Date(sTime + "Z")).getTime();  //  Correct sTime string to proper UTC format and return time stamp
					}
				}
				return NaN; 			// If Time format is not recognized.
			},

			parseDurationHMS5: function(duration) {
				var iHours = parseInt(duration[1],10);
				var iMinutes = parseInt(duration[2],10);
				var iSeconds = parseInt(duration[3],10);
				return ((3600 * iHours) + (60 * iMinutes) + iSeconds) * 1000;
			},

			parseDurationHMS6: function(duration) {
				var iHours = parseInt(duration[3],10);
				var iMinutes = parseInt(duration[4],10);
				var iSeconds = parseInt(duration[5],10);
				return ((3600 * iHours) + (60 * iMinutes) +  iSeconds) * 1000;
			},

			parseDurationHMSnull6: function(duration) {
				var iHours = parseInt(duration.slice(0,2),10);
				var iMinutes = parseInt(duration.slice(2,4),10);
				var iSeconds = parseInt(duration.slice(4),10);
				return ((3600 * iHours) + (60 * iMinutes) +  iSeconds) * 1000;
			},

			parseDurationHM: function(duration) {
				var iHours = parseInt(duration[3],10);
				var iMinutes = parseInt(duration[4],10);
				return ((60 * iHours) + iMinutes) * 60000;
			},

			/**
			 * Maps different custom attribute types to the standard OData types.
			 * If no mapping is available and the type doesn't contain Edm,
			 * it is handled as a string. Otherwise, the original type is returned.
			 * 
			 * @param {string} sType Any valid 
			 * @returns {string} 
			 */
			normalizeCustomAttributeType: function( sType ) {
				switch(sType) {
					case "STRING": return "Edm.String";
					case "BOOLEAN": return "Edm.Boolean";
					case "INTEGER": return "Edm.Int32";
					case "FLOAT": return "Edm.Double";
					case "DATE": return "Edm.Date";
					case "DATETIME": return "Edm.DateTime";
					case "TIME": return "Edm.Time";
					default: 
						return sType.indexOf('Edm.') > -1 ? sType : "Edm.String";
				}
			},

			/**
			* Transforms a duration format(type) into a human readable one.
			* Used regex rather than string splitting gymnastics as for example M for months is the same as M for minutes
			* by specification. 
			* By specification any of the parts is optional thus leading to various cases and of various length.
			*
			* @param {string} unformattedDuration - the duration in its raw unformatted state
			* @param {sap.ui.model.resource.ResourceModel} i18nModel - the i18n resource model
			* 
			* @returns {string} - The formatted duration so it can be displayed to the user
			*/
			formatDuration: function(unformattedDuration, i18nModel) {
				// Case of null or undefined
				if (!unformattedDuration) {
					return unformattedDuration;
				}

				// Regex taken from https://www.w3.org/TR/xmlschema11-2/#duration
				// but with a small modification included a group for the year [0-9]+Y part
				var validDurationRegex = /-?P(((([0-9]+Y)([0-9]+M)?([0-9]+D)?|([0-9]+M)([0-9]+D)?|([0-9]+D))(T(([0-9]+H)([0-9]+M)?([0-9]+(\.[0-9]+)?S)?|([0-9]+M)([0-9]+(\.[0-9]+)?S)?|([0-9]+(\.[0-9]+)?S)))?)|(T(([0-9]+H)([0-9]+M)?([0-9]+(\.[0-9]+)?S)?|([0-9]+M)([0-9]+(\.[0-9]+)?S)?|([0-9]+(\.[0-9]+)?S))))/;
				
				// Execute match function the receive all the matching groups (if any)
				var matches = unformattedDuration.match(validDurationRegex);

				// RegExp hasn't managed to find a match so it is an invalid duration just return it
				if (matches === null) {
					return unformattedDuration;
				}
				
				// Try to match each part and so that later it can be formatted if successfully matched
				var yearsMatch = matches[4];
				var monthsMatch = matches[5] || matches[7];
				var daysMatch = matches[6] || matches[8] || matches[9];
				var hoursMatch = matches[12] || matches[23];
				var minutesMatch = matches[13] || matches[16] || matches[24] || matches[27];
				var secondsMatch = matches[14] || matches[17] || matches[25] || matches[28] || matches[30];
		
				// Helper object as minimize the code (less verbose).
				// Here the "split" property is used as by specification each period has a character after it
				// for example 15D as in 15 days (used to get the number part)
				var matchesData = [
					{ match: yearsMatch, single: i18nModel.getProperty("DurationFormatterYear"), plural: i18nModel.getProperty("DurationFormatterYears"), split: "Y"},
					{ match: monthsMatch, single: i18nModel.getProperty("DurationFormatterMonth"), plural: i18nModel.getProperty("DurationFormatterMonths"), split: "M"},
					{ match: daysMatch, single: i18nModel.getProperty("DurationFormatterDay"), plural: i18nModel.getProperty("DurationFormatterDays"), split: "D"},
					{ match: hoursMatch, single: i18nModel.getProperty("DurationFormatterHour"), plural: i18nModel.getProperty("DurationFormatterHours"), split: "H"},
					{ match: minutesMatch, single: i18nModel.getProperty("DurationFormatterMinute"), plural: i18nModel.getProperty("DurationFormatterMinutes"), split: "M"},
					{ match: secondsMatch, single: i18nModel.getProperty("DurationFormatterSecond"), plural: i18nModel.getProperty("DurationFormatterSeconds"), split: "S"}
				];
		
				var result = "";
		
				for (var i = 0; i < matchesData.length; i++) {
					// We haven't found a match for the currently iterated period so continue
					if (!matchesData[i].match) {
						continue;
					}
		
					// Could be years, months etc.
					var period = matchesData[i].match;
		
					var splitChar = matchesData[i].split;
					var single = matchesData[i].single;
					var plural = matchesData[i].plural;
		
					// Get the number part of the period to decide whether it will be in single or plural
					var periodAsString = period.split(splitChar)[0];
					var periodInNumbers = i === 5 ? parseFloat(periodAsString) : parseInt(periodAsString, 10); // if it seconds parse float otherwise parse int
					var singleOrPlural = periodInNumbers === 1 ? single : plural;
		
					// Add a space if it has an item before it
					result += result.length > 0 ? " " : "";
		
					// Concatenate the new item to result
					result += periodInNumbers + " " + singleOrPlural;
				}
		
				return result;
			}
		};
	}
);