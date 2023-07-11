/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/library",
	"sap/ui/core/format/DateFormat",
	"sap/ui/Device",
	"sap/ui/core/IconPool",
	"sap/ui/core/Icon",
	"cross/fnd/fiori/inbox/util/Conversions"
], function (
	UI5Object,
	Filter,
	FilterOperator,
	library,
	DateFormat,
	Device,
	IconPool,
	Icon,
	Conversions
) {
	"use strict";

	UI5Object.extend("cross.fnd.fiori.inbox.Substitution", {});

	var _oDataManager = null;
	var _aUserPictureAvailability = {};
	var _userDetailsInfo = null;
	var ListType = library.ListType;

	cross.fnd.fiori.inbox.Substitution = {
		formatterUserIconVisibility: function(sUserId, sSapOrigin) {
			this.getParent().data("userid",sUserId);
			var sUrl = this.getModel().sServiceUrl + "/UserInfoCollection(SAP__Origin='" + sSapOrigin + "',UniqueName='" + sUserId + "')/$value";
			return !(cross.fnd.fiori.inbox.Substitution._isImagePresent(sUrl));
		},

		formatterUserPictureVisibility: function(sUserId, sSapOrigin) {
			this.getParent().data("userid",sUserId);
			var sUrl = this.getModel().sServiceUrl + "/UserInfoCollection(SAP__Origin='" + sSapOrigin + "',UniqueName='" + sUserId + "')/$value";
			return cross.fnd.fiori.inbox.Substitution._isImagePresent(sUrl);
		},

		//if substitution on phone , do not merge the column cells
		formatterToMerge: function(bPhone) {
			return !bPhone ? true : false;
		},

		_isImagePresent: function(sUrl) {
			if (!_oDataManager) {
				_oDataManager = cross.fnd.fiori.inbox.util.tools.Application.getImpl().getComponent().getDataManager();
			}
			if (_aUserPictureAvailability[sUrl] == undefined) {
					_aUserPictureAvailability[sUrl] = _oDataManager.fnIsImagePresent(sUrl);
			}
			return _aUserPictureAvailability[sUrl];
		},

		_processSubstitutedUsersCollection: function(oSubstitutedUser) {
			var oNewEntry = {
				UniqueName : oSubstitutedUser.UniqueName,
				DisplayName : oSubstitutedUser.DisplayName,
				SAP__Origin: oSubstitutedUser.SAP__Origin // eslint-disable-line camelcase
			};
			return oNewEntry;
		},

		_getSubstitutedUserFilters : function(aSubstitutedUserFilterKeys) {
			var filters = [];
			for (var i = 0; i < aSubstitutedUserFilterKeys.length; i++) {
				var oSubstitutedUserFilter = new Filter({
					path: "SubstitutedUser",
					operator: FilterOperator.EQ,
					value1: aSubstitutedUserFilterKeys[i]
				});
				filters.push(oSubstitutedUserFilter);

				//My Tasks - key="" -> also include null values
				//Produces: (SubstitutedUser eq '' or SubstitutedUser eq null)
				if (aSubstitutedUserFilterKeys[i] === "") {
					var nullFilter = new Filter({
						path: "SubstitutedUser",
						operator: FilterOperator.EQ,
						value1: null
					});
					filters.push(nullFilter);
				}

			}
			return filters;
		},

		formatterUserPictureUrl: function (sUserId, sSapOrigin) {
			return this.getModel().sServiceUrl + "/UserInfoCollection(SAP__Origin='" + sSapOrigin + "',UniqueName='" + sUserId + "')/$value";
		},

		formatterUserName : function(sUserId, sFullName) {
			this.data("userid",sUserId);
			return sFullName;
		},

		formatterToAlignColumn: function(bPhone) {
			//If the device is phone , hAlign should be Begin
			return bPhone ? "Begin" : "End";
		},

		formatterProfileText : function(sProfileText, sProfile) {
			var sProfileValue = (!sProfileText || sProfileText.trim() === "" ) ? sProfile : sProfileText;
			if (sProfileValue) {
				return " " + sProfileValue;
			}
			else {
				return this.getModel("i18n").getResourceBundle().getText("substn.table.profile_text");
			}
		},

		formatterPlannedOrUnplannedNavigation: function(bPlanned) {
			if (bPlanned) {
				return ListType.Navigation;
			}
			else {
				return ListType.Active;
			}
		},

		formatterSubstitutionStartDate : function(sDate) {
			return DateFormat.getDateInstance({style:"short"}).format(sDate);
		},

		formatterUserPictureIcon: function(sMediaSrc) {
			return Conversions.formatterUserIconForSubstitutors(sMediaSrc);
		},

		// formatter for the end date
		formatterSubstitutionEndDate: function(sBeginDate,sEndDate) {
			if (sEndDate == null || sEndDate == undefined) { // eslint-disable-line eqeqeq
				return "";
			}
			var iTotalDays = cross.fnd.fiori.inbox.Substitution._getActiveDays(true, sBeginDate, sEndDate);

			return (iTotalDays>3650) ? "" : DateFormat.getDateInstance({style:"short"}).format(sEndDate);
		},

		formatterTimeDuration: function(beginDate, endDate) {
			if (endDate == null || endDate == undefined) { // eslint-disable-line eqeqeq
				return "";
			}
			var bInCurrentDateRange = !cross.fnd.fiori.inbox.Substitution._isFutureDate(beginDate);
			var iTotalDays = cross.fnd.fiori.inbox.Substitution._getActiveDays(bInCurrentDateRange, beginDate, endDate);
			var oResourceBundle = this.getModel("i18n").getResourceBundle();
			if (bInCurrentDateRange) {
				if (iTotalDays === 1) {
					iTotalDays = oResourceBundle.getText("substn.table.one_day_left");
				}
				else if (iTotalDays > 1 && iTotalDays <= 60) {
					iTotalDays = oResourceBundle.getText("substn.table.days_left", iTotalDays);
				}
				else if (iTotalDays > 60 && iTotalDays < 3650) {
					iTotalDays = oResourceBundle.getText("substn.table.months_left", Math.floor(iTotalDays/30) );
				}
				else if (iTotalDays > 3650) {
					iTotalDays = oResourceBundle.getText("substn.table.forever_left");
				}

				return iTotalDays;
			}
			else {
				if (iTotalDays === 1) {
					iTotalDays = oResourceBundle.getText( "substn.table.starts_in_one_day" );
				}
				else if ( iTotalDays > 1 && iTotalDays <= 60 ) {
					iTotalDays = oResourceBundle.getText( "substn.table.starts_in_days", iTotalDays );
				}
				else if ( iTotalDays > 60 ) {
					iTotalDays = oResourceBundle.getText( "substn.table.starts_in_months", Math.floor(iTotalDays/30) );
				}
				return iTotalDays;
			}
		},

		formatterDisplayErroneousRuleStatus : function(bSuccessful) {
			//if rule is created successfully hide the error message
			return bSuccessful ? false : true;
		},

		/* following function returns difference in days between the current date and end date if the rule is active.
			else if the rule is in future, it returns the difference between the current date and start date */

		_getActiveDays: function(bInCurrentDateRange, startDate, endDate) {
			var timeDiff = cross.fnd.fiori.inbox.Substitution._getDiffWithCurrentTime(bInCurrentDateRange ? endDate : startDate) / (1000 * 60 * 60 * 24);
			if (timeDiff > 1) {
				return Math.floor(timeDiff);
			}
			else if (timeDiff > 0) {
				return Math.ceil(timeDiff);
			}
		},

		// following function returns difference in milliseconds between dateValue and current date

		_getDiffWithCurrentTime: function(dateValue) {
			var today = new Date();
			var deadline = new Date(dateValue.getFullYear(), dateValue.getMonth(), dateValue.getDate(), 24, 0, 0);
			var diff = deadline.getTime() - (today.getTime());
			return diff;
		},

		// following function returns true if the rule is out dated else false
		isRuleOutdated: function(dateValue) {
			if (dateValue && cross.fnd.fiori.inbox.Substitution._getDiffWithCurrentTime(dateValue) < 0) {
				return true;
			}
			return false;
		},

		// following function returns true if dateValue is the current date else false
		_isCurrentDate: function(dateValue) {
			if (dateValue) {
				var oCurrentDate = new Date();
				if ((oCurrentDate.getDate() === dateValue.getDate())
					&& (oCurrentDate.getMonth() === dateValue.getMonth())
					&& (oCurrentDate.getYear() === dateValue.getYear())
				) {
					return true;
				}
			}
		},

		// following function returns true if dateValue is in future else false
		_isFutureDate: function(dateValue) {
			if (dateValue) {
				if (cross.fnd.fiori.inbox.Substitution._getDiffWithCurrentTime(dateValue) > 0
					&& !cross.fnd.fiori.inbox.Substitution._isCurrentDate(dateValue)
				) {
					return true;
				}
			}
			return false;
		},

		// following function returns end of current day
		getEndOfCurrentDate: function() {
			var oCurrentDate = new Date();
			return new Date(oCurrentDate.getFullYear(), oCurrentDate.getMonth(), oCurrentDate.getDate(), 23, 59, 59);
		},

		// dynamic binding of active status of a substitute
		// It does not work for userInfo correctly hence a variable userDetailsInfo is created and set
		formatterSubstitutesStatus: function (sUser, bActive, sMode, sBeginDate) {
			var sActiveStatusText = this.getModel("i18n").getResourceBundle().getText("substn.table.active");
			var sInactiveStatusText =  this.getModel("i18n").getResourceBundle().getText("substn.table.inactive");
			if (sUser) {
				//do not show status for unplanned substitutes
				if ((sMode !== "TAKE_OVER") && (_userDetailsInfo[sUser] != undefined)) {
					if (Device.system.phone) {
						//for phone , we need to recalculate the substitutes status as in table if one rule was active we set the status as Active
						var bInCurrentDateRange = !cross.fnd.fiori.inbox.Substitution._isFutureDate(sBeginDate);
						return bInCurrentDateRange
							? sActiveStatusText : sInactiveStatusText;
					}
					else {
						return _userDetailsInfo[sUser].bActive
							? sActiveStatusText : sInactiveStatusText;
					}
				}
				else {
					return "";
				}
			}
		},

		setUserInfo: function(users) {
			_userDetailsInfo = users;
		},

		formatterSubstitutedUserName: function(sId, sName) {
			sName = sName.trim();
			return sName ? sName : sId;
		},

		formatterSubstitutedUserPicture: function(sUserId, sSapOrigin) {
			var that = this;
			var oParent = this.getParent();
			if (!_oDataManager) {
				_oDataManager = cross.fnd.fiori.inbox.util.tools.Application.getImpl().getComponent().getDataManager();
			}
			var url = _oDataManager.oModel.sServiceUrl + "/UserInfoCollection(SAP__Origin='" + sSapOrigin + "',UniqueName='" + sUserId + "')/$value";
			if (_aUserPictureAvailability[url] == undefined) { // eslint-disable-line eqeqeq
				_aUserPictureAvailability[url] = _oDataManager.fnIsImagePresent(url,sUserId);
			}
			var bImagePresent = _aUserPictureAvailability[url];
			if (bImagePresent) {
				return url;
			}
			else {
				// After removing the already added image, an icon is created and added in the cell
				oParent.removeItem(that);
				that.destroy();
				url = IconPool.getIconURI("person-placeholder");
				var oIcon1 = new Icon({
					size : "2rem",
					width : "1.25em",
					height : "1.25em",
					color : "#bfbfbf",
					backgroundColor : "#f2f2f2",
					src: url
				});
				oParent.insertItem(oIcon1, 0);
			}
		},
	};

	return cross.fnd.fiori.inbox.Substitution;
});
