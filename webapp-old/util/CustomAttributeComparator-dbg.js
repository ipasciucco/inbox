/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
/* This module contains comparators for all Custom Attribute data types and also "DateTime" and "Time Duration" parsers.
 * The proper format that should be supplied to OData request of My Inbox is oulined here: http://www.odata.org/documentation/odata-version-2-0/json-format/
 * Note that since returned data are in JSON format, literal OData format should not be used: http://www.odata.org/documentation/odata-version-2-0/overview/
 */
sap.ui.define([
	"sap/base/Log",
	"sap/ui/base/Object",
], function (
	logInfoMessage,
	UI5Object
) {
	"use strict";

	UI5Object.extend("cross.fnd.fiori.inbox.util.CustomAttributeComparator", {});

	cross.fnd.fiori.inbox.util.CustomAttributeComparator = {
		// Returns proper comparator for the supplied Custom Attribute comparator.
		getCustomAttributeComparator: function(sType) {
			if (sType == null) return null;  // eslint-disable-line eqeqeq

			if (sType.indexOf("Edm.") !== 0) {
				sType = this.fnMapBPMTypes(sType);
			}

			switch (sType) {
			 case "Edm.String"		: return cross.fnd.fiori.inbox.util.CustomAttributeComparator.fnStringComparator;
			 case "Edm.Int16"		: return cross.fnd.fiori.inbox.util.CustomAttributeComparator.fnNumberComparator; // fnIntegerComparator;
			 case "Edm.Int32"		: return cross.fnd.fiori.inbox.util.CustomAttributeComparator.fnNumberComparator; // fnIntegerComparator;
			 case "Edm.Int64"		: return cross.fnd.fiori.inbox.util.CustomAttributeComparator.fnNumberComparator; // fnIntegerComparator;
			 case "Edm.Boolean"		: return cross.fnd.fiori.inbox.util.CustomAttributeComparator.fnBooleanComparator;
			 case "Edm.Single"		: return cross.fnd.fiori.inbox.util.CustomAttributeComparator.fnNumberComparator; // fnFloatComparator;
			 case "Edm.Double"		: return cross.fnd.fiori.inbox.util.CustomAttributeComparator.fnNumberComparator; // fnDoubleComparator;
			 case "Edm.Decimal" 	: return cross.fnd.fiori.inbox.util.CustomAttributeComparator.fnNumberComparator; // fnDecimalComparator;
			 case "Edm.DateTime"	: return cross.fnd.fiori.inbox.util.CustomAttributeComparator.fnDateTimeComparator;
			 case "Edm.Time"		: return cross.fnd.fiori.inbox.util.CustomAttributeComparator.fnDurationComparator;
			 case "Edm.Binary"		: return cross.fnd.fiori.inbox.util.CustomAttributeComparator.fnBinaryComparator;
			 case "Edm.Byte"		: return cross.fnd.fiori.inbox.util.CustomAttributeComparator.fnNumberComparator; // fnByteComparator;
			 case "Edm.SByte"		: return cross.fnd.fiori.inbox.util.CustomAttributeComparator.fnNumberComparator; // fnByteComparator;
			/* case "Edm.Guid" :
			   case "Edm.DateTimeOffset" :
			*/
			 default : return null;
			}
		},

		/**
		 * Maps BPM supplied Custom Attribute types to the standard OData types
		 *
		 * @param {string} sType BPM Custom Attribute data type
		 * @returns {string} OData Custom Attribute data type
		 * @public
		 */
		fnMapBPMTypes: function(sType) {
			switch ( sType ) {
			case "class java.lang.String"		:	return "Edm.String";
			case "class java.lang.Integer"		:	return "Edm.Int32";
			case "class java.lang.Long" 		:	return "Edm.Int64";
			case "class java.lang.Float"		:	return "Edm.Single";
			case "class java.math.BigDecimal"	:	return "Edm.Decimal";
			case "class java.lang.Boolean"		:	return "Edm.Boolean";
			case "class java.util.Date"			:	return "Edm.DateTime";
			case "class java.sql.Time"			:	return "Edm.Time";
			//default :	console.log("Can not resolve Custom Attribute Type:<"+sType+"> in cross.fnd.fiori.inbox.util.CustomAttributeComparator.fnMapBPMTypes");
			default:	logInfoMessage.info("Can not resolve Custom Attribute Type:<"+sType+">","","cross.fnd.fiori.inbox.util.CustomAttributeComparator.fnMapBPMTypes");
						return "Edm.String";
			}
		},

		/**
		 * Maps Custom Attribute types to the standard OData types
		 *
		 * @param {string} sType Custom Attribute data type
		 * @returns {string} OData Custom Attribute data type
		 * @public
		 */
		fnMapDataTypes: function(sType) {
			switch ( sType.toLowerCase() ) {
				case "string":
				case "edm.string":
					return "Edm.String";
				case "integer":
				case "edm.int32":
					return "Edm.Int32";
				case "long":
				case "edm.int64":
					return "Edm.Int64";
				case "edm.single":
					return "Edm.Single";
				case "float":
				case "edm.double":
					return "Edm.Double";
				case "edm.float":
					return "Edm.Float";
				case "decimal":
				case "edm.decimal":
					return "Edm.Decimal";
				case "boolean":
				case "edm.boolean":
					return "Edm.Boolean";
				case "date":
				case "edm.date":
				case "datetime":
				case "edm.datetime":
					return "Edm.DateTime";
				case "time":
				case "edm.time":
					return "Edm.Time";
				case "edm.binary":
					return "Edm.Binary";
			default:	logInfoMessage.info("Can not resolve Custom Attribute Type:<"+sType+">","","cross.fnd.fiori.inbox.util.CustomAttributeComparator.fnMapDataTypes");
				return "Edm.String";
			}
		},

		/**
		 * Compares two parameters in the simple case when both are equal or one of them has value, "undefined" or "null".
		 *
		 * @param {any} a the first parameter to compare
		 * @param {any} b the second parameter to compare
		 * @returns {int} -1, 0 or 1 depending on the values of a and b
		 * @public
		 */
		fnDataCheck: function(a,b) {
			if (a == b) { // eslint-disable-line eqeqeq
				return 0;
			}
			if (b == null) { // eslint-disable-line eqeqeq
				return -1;
			}
			if (a == null) { // eslint-disable-line eqeqeq
				return 1;
			}
		},
		/**
		 * Compares two strings using localeCompare
		 *
		 * @param {string} a the first parameter to compare
		 * @param {string} b the second parameter to compare
		 * @returns {int} -1, 0 or 1 depending on the values of a and b
		 * @public
		 */
		fnStringComparator: function(a,b) { // Edm.String. This code follows the default Sorter comparator.
			var test = cross.fnd.fiori.inbox.util.CustomAttributeComparator.fnDataCheck(a,b);
			if (!test) {
				if (typeof a === "string" && typeof b === "string") {
					return a.localeCompare(b);
				}
				if (a < b) {
					return -1;
				}
				if (a > b) {
					return 1;
				}
				return 0;
			}
			return test;
		},
		/**
		 * Compares two Numbers formatted as JSON strings.
		 *
		 * Process all number formats: Edm.Int16, Edm.Int32, Edm.Int64, Edm.Single, Edm.Double, Edm.Decimal, Edm.Byte, Edm.SByte
		 *
		 * @param {string} a the first parameter to compare
		 * @param {string} b the second parameter to compare
		 * @returns {int} -1, 0 or 1 depending on the values of a and b
		 * @public
		 */
		fnNumberComparator: function(a,b) {
			var test = cross.fnd.fiori.inbox.util.CustomAttributeComparator.fnDataCheck(a,b);
			if (!test) {
				a = Number(a);
				b = Number(b);
				if (isNaN(a)) return  1;
				if (isNaN(b)) return -1;
				if (a < b) {
					return -1;
				}
				if (a > b) {
					return 1;
				}
				return 0;
			}
			return test;
		},
		/**
		 * Compares two numbers in Hexadecimal format formatted as JSON strings.
		 *
		 * @param {string} a the first parameter to compare
		 * @param {string} b the second parameter to compare
		 * @returns {int} -1, 0 or 1 depending on the values of a and b
		 * @public
		 */
		fnBinaryComparator: function(a,b) { //Edm.Binary
			var test = cross.fnd.fiori.inbox.util.CustomAttributeComparator.fnDataCheck(a,b);
			if (!test) {
				a = Number.parseInt(a,16);
				b = Number.parseInt(b,16);
				if (isNaN(a)) return  1;
				if (isNaN(b)) return -1;
				if (a < b) {
					return -1;
				}
				if (a > b) {
					return 1;
				}
				return 0;
			}
			return test;
		},
		/**
		 * Compares two Boolean values formatted as JSON strings.
		 *
		 * @param {string} a the first parameter to compare
		 * @param {string} b the second parameter to compare
		 * @returns {int} -1, 0 or 1 depending on the values of a and b
		 * @public
		 */
		fnBooleanComparator: function(a, b) { // Edm.Boolean
			var test = cross.fnd.fiori.inbox.util.CustomAttributeComparator.fnDataCheck(a,b);
			if (!test) {
				a = (a.toLowerCase() == "true") ? true : false;
				b = (b.toLowerCase() == "true") ? true : false;
				/*if (a == b) return 0;
				return a ? -1 : 1; */
				if (a < b) {
					return -1;
				}
				if (a > b) {
					return  1;
				}
				return 0;
				}
			return test;
		},
		/**
		 * Compares two dates formatted as JSON strings, or a UNIX time stamps in milliseconds.
		 *
		 * @param {(string,int)} a the first parameter to compare
		 * @param {(string,int)} b the second parameter to compare
		 * @returns {int} -1, 0 or 1 depending on the values of a and b
		 * @public
		 */
		fnDateTimeComparator: function(a, b) { // Edm.DateTime
			var test = cross.fnd.fiori.inbox.util.CustomAttributeComparator.fnDataCheck(a,b);
			if (!test) {
				var aStamp = cross.fnd.fiori.inbox.util.CustomAttributeComparator.fnTimeParser(a);
				var bStamp = cross.fnd.fiori.inbox.util.CustomAttributeComparator.fnTimeParser(b);
				if (isNaN(aStamp)) return  1;
				if (isNaN(bStamp)) return -1;
				if (aStamp < bStamp) {
					return -1;
				}
				if (aStamp > bStamp) {
					return  1;
				}
				return 0;
			}
			return test;
		},

		/**
		 * Compares two times of a day formatted as JSON strings, or a UNIX time stamps in milliseconds.
		 *
		 * @param {(string,int)} a the first parameter to compare
		 * @param {(string,int)} b the second parameter to compare
		 * @returns {int} -1, 0 or 1 depending on the values of a and b
		 * @public
		 */
		fnDurationComparator: function(a, b) { // Edm.Time
		var test = cross.fnd.fiori.inbox.util.CustomAttributeComparator.fnDataCheck(a,b);
		if (!test) {
			var aTime = cross.fnd.fiori.inbox.util.CustomAttributeComparator.fnDurationParser(a);
			var bTime = cross.fnd.fiori.inbox.util.CustomAttributeComparator.fnDurationParser(b);
			if (isNaN(aTime)) return  1;
			if (isNaN(bTime)) return -1;
			var iTimezoneOffset = (new Date()).getTimezoneOffset();
			aTime = (aTime -  iTimezoneOffset*60*1000) % (24*3600*1000);
			bTime = (bTime -  iTimezoneOffset*60*1000) % (24*3600*1000);
			if (aTime < bTime) {
				return -1;
			}
			if (aTime > bTime) {
				return  1;
			}
			return 0;
		}
		return test;
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
			if (sTime == null || sTime === "00000000") return ""; //Show empty value in My Inbox. Customer incident 0020751294 0000322049 2020
			if (typeof sTime === "number") return sTime; // Date as Time Stamp in  milliseconds
			var aInt = [];
			var re = /\(|\)/;		// Time Format	"\/Date(869080830000)\/". This should be the default Time Format.
			var a = sTime.split(re);
			if (a[0] == "/Date") return parseInt(a[1], 10);
			re = /[^0-9]/;			// Time Format	"YYYYMMDD". Old TGW format.
			if (sTime.match(re) === null && sTime.length == 8) {
				aInt[0] = parseInt(sTime.slice(0,4),10);
				aInt[1] = parseInt(sTime.slice(4,6),10);
				aInt[2] = parseInt(sTime.slice(6),10);
				var date = new Date();
				date.setUTCFullYear(aInt[0]);
				date.setUTCMonth(aInt[1]-1);
				date.setUTCDate(aInt[2]);
				date.setUTCHours(0, 0, 0, 0);
				return date.getTime();
			}
			if (sTime.indexOf("T") == 10) {  // Time Format	"2018-01-05T00:00:00". BPM and TGW-cloud format. Time is in UTC.
				if (sTime.length > 19) { // This is introduced to process ISO8601 strings like "1997-07-16T20:20:30.45+01:00" and "1997-07-16T19:20:30.45Z"
					return (new Date(sTime)).getTime();
				}
				else if (sTime.length === 19) {
					return (new Date(sTime+"Z")).getTime();  //  Correct sTime string to proper UTC format and return time stamp
				}
			}
			return NaN; 			// If Time format is not recognized.
		},

		/**
		 * Parses different time of day formats supplied from the back-ends. It returns UNIX time stamp in milliseconds.
		 * If Time of Day Format contains unexpected symbols or Format is not recognized NaN is returned.
		 *
		 * @param {(string,int)} sTime date format to be parsed. If int UNIX time stamp in milliseconds is assumed.
		 * @returns {int} UNIX time stamp in milliseconds. (milliseconds that have elapsed since 00:00:00 UTC, Thursday, 1 January 1970)
		 * @public
		 */
		fnDurationParser: function(sDuration) {
			if (sDuration == null) return NaN; // eslint-disable-line eqeqeq

			if (typeof sDuration === "number") return sDuration; // Time as Time Stamp in  milliseconds

			var iHours   = 0;
			var iMinutes = 0;
			var iSeconds = 0;
			var re = null;
			var a = null;
			if (sDuration.indexOf("PT") === 0) {
				re = /PT|H|M|S/;		// Time Duration Format "PT19H20M30S". BPM Format. This should also be the default Time Duration Format.
				a = sDuration.split(re);
				if (a.length == 5) {
					iHours = parseInt(a[1],10);
					iMinutes = parseInt(a[2],10);
					iSeconds = parseInt(a[3],10);
					return (3600*iHours + 60*iMinutes +  iSeconds)*1000;
				}
				else if (a.length > 1) {  // Case when some entries are missing in Format "PT19H20M30S"
					var sTemp = sDuration.slice(2);
					var indexH = sTemp.indexOf("H");
					if (indexH > 0) {
						iHours = parseInt(sTemp.substring(0, indexH),10);
						sTemp = sTemp.slice(indexH+1);
					}
					var indexM = sTemp.indexOf("M");
					if (indexM > 0) {
						iMinutes = parseInt(sTemp.substring(0, indexM),10);
						sTemp = sTemp.slice(indexM+1);
					}
					var indexS = sTemp.indexOf("S");
					if (indexS > 0) {
						iSeconds = parseInt(sTemp.substring(0, indexS),10);
					}
					return (3600*iHours + 60*iMinutes +  iSeconds)*1000;
				}
			}

			re = /[^0-9]/;		// Time Diration Format	"HHMMSS". Old TGW format.
			if (sDuration.match(re) == null && sDuration.length === 6) {
				iHours = parseInt(sDuration.slice(0,2),10);
				iMinutes = parseInt(sDuration.slice(2,4),10);
				iSeconds = parseInt(sDuration.slice(4),10);
				return (3600*iHours + 60*iMinutes +  iSeconds)*1000;
			}

			if (sDuration.indexOf("T") == 10) {
				re = /-|T|\:/;		// Time Diration Format "0001-01-01T10:20:30". TGW-cloud format.
				a = sDuration.split(re);
				if (a.length === 6) {
					iHours = parseInt(a[3],10);
					iMinutes = parseInt(a[4],10);
					iSeconds = parseInt(a[5],10);
					return (3600*iHours + 60*iMinutes +  iSeconds)*1000;
				}
				else if (a.length === 5) {			// Time Diration Format "0001-01-01T10:20".
					iHours = parseInt(a[3],10);
					iMinutes = parseInt(a[4],10);
					return (60*iHours + iMinutes)*60000;
				}
			}
			return NaN;			// If Time Duration Format is not recognized.
		}
	};

	return cross.fnd.fiori.inbox.util.CustomAttributeComparator;
});
