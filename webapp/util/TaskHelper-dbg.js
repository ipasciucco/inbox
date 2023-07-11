/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	] , function () {
		"use strict";

		return {

			/**
			 * Prepare details for selected tasks.
			 *
			 * @param {object} oEventParameters Event parameters from handleSelectionChange event.
			 * @param {object} oSelectedTasksDetails Details for the selected tasks.
			 *
			 * @returns {object} Updated details for the selected tasks after handleSelectionChange event.
			 */
			getSelectedTasksDetails: function(oEventParameters, oSelectedTasksDetails) {
				var oTask, oBindingContext, oTaskSupports, bSupportsClaim, bSupportsRelease, sInstanceID, sOrigin, sTaskTitle, sKey;

				if (!oSelectedTasksDetails) {
					oSelectedTasksDetails = {
						oMapWithSelectedTasks: {},
						bIsClaimActive: true,
						bIsReleaseActive: true
					};
				}

				for (var i = 0; i < oEventParameters.listItems.length; i++) {
					oBindingContext = oEventParameters.listItems[i].getBindingContext("taskModel");
					sInstanceID = oBindingContext.getProperty("InstanceID");
					sOrigin = oBindingContext.getProperty("SAP__Origin");
					sTaskTitle = oBindingContext.getProperty("TaskTitle");
					sKey = sInstanceID + sOrigin;
					if (oEventParameters.selected) {
						oTaskSupports = oBindingContext.getProperty("TaskSupports");
						bSupportsClaim = oBindingContext.getProperty("SupportsClaim");
						bSupportsRelease = oBindingContext.getProperty("SupportsRelease");

						// store selected items's details
						oTask = {
							InstanceID: sInstanceID,
							// eslint-disable-next-line camelcase
							SAP__Origin: sOrigin,
							sTaskTitle: sTaskTitle,
							sContextPath: oBindingContext.getPath(),
							oTaskSupports: oTaskSupports,
							bSupportsClaim: bSupportsClaim,
							bSupportsRelease: bSupportsRelease
						};
						oSelectedTasksDetails.oMapWithSelectedTasks[sKey] = oTask;

						// store ClaimActive
						if (!bSupportsClaim && (!oTaskSupports || !oTaskSupports.Claim)) {
							oSelectedTasksDetails.bIsClaimActive = false;
						}
						// store ReleaseActive
						if (!bSupportsRelease  && (!oTaskSupports || !oTaskSupports.Release)) {
							oSelectedTasksDetails.bIsReleaseActive = false;
						}
					}
					else {
						// remove deselected task from the map and change state of buttons
						var oCurrentItem = oSelectedTasksDetails.oMapWithSelectedTasks[sKey];
						var value;
						delete oSelectedTasksDetails.oMapWithSelectedTasks[sKey];
						if (!oSelectedTasksDetails.bIsClaimActive && !(oCurrentItem.bSupportsClaim && oCurrentItem.oTaskSupports && oCurrentItem.oTaskSupports.Claim)) {
							oSelectedTasksDetails.bIsClaimActive = true;
							for (var keyClaim in oSelectedTasksDetails.oMapWithSelectedTasks) {
								if (oSelectedTasksDetails.oMapWithSelectedTasks.hasOwnProperty(keyClaim)) {
									value = oSelectedTasksDetails.oMapWithSelectedTasks[keyClaim];
									if (!value.bSupportsClaim && (!value.oTaskSupports || !value.oTaskSupports.Claim)) {
										oSelectedTasksDetails.bIsClaimActive = false;
										break;
									}
								}
							}
						}
						if (!oSelectedTasksDetails.bIsReleaseActive && !(oCurrentItem.bSupportsRelease && oCurrentItem.oTaskSupports && oCurrentItem.oTaskSupports.Release)) {
							oSelectedTasksDetails.bIsReleaseActive = true;
							for (var keyRelease in oSelectedTasksDetails.oMapWithSelectedTasks) {
								if (oSelectedTasksDetails.oMapWithSelectedTasks.hasOwnProperty(keyRelease)) {
									value = oSelectedTasksDetails.oMapWithSelectedTasks[keyRelease];
									if (!value.bSupportsRelease && (!value.oTaskSupports || !value.oTaskSupports.Release)) {
										oSelectedTasksDetails.bIsReleaseActive = false;
										break;
									}
								}
							}
						}
					}
				}

				return oSelectedTasksDetails;
			}
		};
	}
);