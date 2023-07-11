/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
		"cross/fnd/fiori/inbox/util/Constants",
		"sap/ui/thirdparty/jquery"
	] , function (Constants, jQuery) {
		"use strict";

		return {
			_predefinedCustomAttributeNames: ["customtasktitle",
				"customnumbervalue",
				"customnumberunitvalue",
				"customobjectattributevalue",
				"customcreatedby"],

			/**
			 * This helper function gets an array of ResponseOptions (see TCM)
			 * and add a display priority number for each ResponseOption.
			 *
			 * High number means that button goes to the end of the list
			 * Low number means it goes to the front of the list
			 *
			 * 1-1000 Positive buttons
			 * 1001-2000 Negative buttons
			 * >2000 Neutral buttons and custom buttons
			 *
			 * @param {Array} aDecisionOptions - array of ResponseOptions (see TCM)
			 */
			addDisplayOrderPriorityIfMissing : function(aDecisionOptions) {
				for (var i = 0; i < aDecisionOptions.length; i++) {
					var oDecisionOption = aDecisionOptions[i];

					//assign iDisplayOrderPriority only if it is not a number and not set
					if (isNaN(oDecisionOption.iDisplayOrderPriority)) {

						/*
						* multiply index by 2 so that we have some empty priority numbers,
						* in case we want to add some button on a specific position in the future.
						*/
						var index = i * 2;
						if (!oDecisionOption.Nature) {
							oDecisionOption.iDisplayOrderPriority = 2000 + index;
						}
						else if (oDecisionOption.Nature.toUpperCase() === "POSITIVE") {
							oDecisionOption.iDisplayOrderPriority = index;
						}
						else if (oDecisionOption.Nature.toUpperCase() === "NEGATIVE") {
							oDecisionOption.iDisplayOrderPriority = 1000 + index;
						}
						else {
							oDecisionOption.iDisplayOrderPriority = 2000 + index;
						}
					}
					aDecisionOptions[i] = oDecisionOption;
				}
			},

			/**
			 * Gets an array of ResponseOptions (see TCM) and makes the following processing:
			 *
			 * 1. Add a display priority number for each ResponseOption (see function addDisplayOrderPriorityIfMissing() )
			 * 2. Separate ResponseOptions in two parts
			 * 		2.1 First part is returned with original array aResponseOptions and contain only ResponseOptions (ReasonDefinitionsData are deleted).
			 *			It is needed in array form because it will be copied to taskModel and bind to MenuButton, where order of action is required
			 *		2.2 "result" objects from the original data is removed and a map of ReponseOptions data (keyResponseOption: ResposnseOption) is created
			 *			It is returned with object mapResponseOptions, which is supposed to be provided empty when function is invoked. mapResponseOptions is
			 *			made to feed responseOptionsModel.
			 *
			 * @param {array} aResponseOptions - array of ResponseOptions (see TCM)
			 * @param {object} mapResponseOptions - map (keyResponseOption:ResponseOption). keyResponseOption is created from properties SAP__Origin, TaskDefinitionID, DecisionKey
			 */
			processResponseOptions: function(aResponseOptions,mapResponseOptions) {
				var  keyResponseOption, responseOption;
				this.addDisplayOrderPriorityIfMissing(aResponseOptions);
				for (var i = 0; i < aResponseOptions.length; i++) {
					responseOption = aResponseOptions[i];
					if (responseOption.SAP__Origin &&
						responseOption.TaskDefinitionID && responseOption.DecisionKey) {
						keyResponseOption = this.getKeyForResponseOption(responseOption);
					}
					responseOption[Constants.NP_REASON_DEFINITIONS_DATA] = responseOption[Constants.NP_REASON_DEFINITIONS_DATA].results;
					mapResponseOptions[keyResponseOption] = jQuery.extend(true,{},responseOption);
					delete responseOption[Constants.NP_REASON_DEFINITIONS_DATA];
				}
			},

			/**
			 * This helper function gets an array and convert it to map (object)
			 * It uses fnGetKey function to generate key for each array value
			 *
			 * @param {Array} aList - array to be converted to map (object)
			 * @param {Function} fnGetKey - function accept one parameter value and
			 *							should return key as string based on the value
			 *
			 * @returns {object} - object containing given keys mapped to the array values
			 */
			convertArrayToMap: function(aList, fnGetKey) {
				var map = {};
				for (var i in aList) {
					var value = aList[i];
					var key = fnGetKey(value);
					map[key] = value;
				}
				return map;
			},

			/**
			 * This function add prefix to the name of custom attribute used for recognising it compared with normal task attribute
			 *
			 * @param {object} mapCustAttr - map with custom attributes
			 */
			addPrefixToCustomAttributes: function(mapCustAttr) {
				var sPrefix = "CA_";
				var mapCustAttrKeys = Object.keys(mapCustAttr);
				for (var i = 0; i < mapCustAttrKeys.length; i++) {
					var key = mapCustAttrKeys[i];
					if (mapCustAttr[key].Name) {
						mapCustAttr[key].Name = sPrefix + mapCustAttr[key].Name;
					}
				}
			},

			getKeyForTaskModel: function(value) {
				// eslint-disable-next-line camelcase
				return "SAP__Origin=" + encodeURIComponent(value.SAP__Origin)
					+ ",InstanceID=" + encodeURIComponent(value.InstanceID);
			},

			getKeyForCustomAttributeDefinitionModel: function(value) {
				// eslint-disable-next-line camelcase
				return "SAP__Origin=" + encodeURIComponent(value.SAP__Origin)
					+ ",TaskDefinitionID=" + encodeURIComponent(value.TaskDefinitionID)
					+ ",Name=" + encodeURIComponent(value.Name);
			},

			getKeyForTaskDefinitionModel: function(value) {
				// eslint-disable-next-line camelcase
				return "SAP__Origin=" + encodeURIComponent(value.SAP__Origin)
					+ ",TaskDefinitionID=" + encodeURIComponent(value.TaskDefinitionID);
			},

			getKeyForResponseOption: function(value) {
				// eslint-disable-next-line camelcase
				return "SAP__Origin=" + encodeURIComponent(value.SAP__Origin) +
						",TaskDefinitionID=" + encodeURIComponent(value.TaskDefinitionID) +
						",DecisionKey=" + encodeURIComponent(value.DecisionKey);
			},

			/**
			 * Method for checking if any entity or property in entity exists in metadata
			 * and then to make request, because the service supports it.
			 *
			 * @param {string} sEntityName String with entity type name. If this is null the method checks
			 * into Task entity for the property, which is searched
			 * @param {string} sPropertyName String with property type name.
			 * @param {object} oServiceMetaModel Metadata model.
			 *
			 * @return {boolean} exists true if property exists in metadata
			 */
			checkPropertyExistsInMetadata: function (sEntityName, sPropertyName, oServiceMetaModel) {
				var exists = false;
				if (oServiceMetaModel
						&& oServiceMetaModel.oModel
						&& oServiceMetaModel.oModel.getData()
						&& oServiceMetaModel.oModel.getData().dataServices
						&& oServiceMetaModel.oModel.getData().dataServices.schema[0]) {

					var oEntitySet = oServiceMetaModel.getODataEntitySet(sEntityName);
					if (oEntitySet && !sPropertyName) {
						exists = true;
						return exists;
					}

					var namespace = oServiceMetaModel.oModel.getData().dataServices.schema[0].namespace;
					var oEntity = oServiceMetaModel.getODataEntityType(namespace + "." + (sEntityName ? sEntityName : "Task"));

					if (oEntity && sPropertyName) {
						if (oServiceMetaModel.getODataProperty(oEntity, sPropertyName)) {
							exists = true;
						}
						else if (oEntity.navigationProperty) {
							for (var i = 0; i < oEntity.navigationProperty.length; i++) {
								if (oEntity.navigationProperty[i].name === sPropertyName) {
									exists = true;
									break;
								}
							}
						}
					}
				}
				return exists;
			},

            /**
             * Append Labels from CustomAttributeDefinitions to CustomAttributeData
             * @param {object} newTaskData - response containing CustomAttributeData for the current task
             * @param {object} currentTaskData - current TaskDetail data
             * @param {object} taskDefData - CustomAttributeDefinition data
			 * @param {string} emptyCustomAttributeLabel - Empty Custom Attribute Label
             * @returns {object} - modified CustomAttributeData
             */
            updateCustAttrDataWithCustAttrDefsAndSetVisibility : function(newTaskData, currentTaskData, taskDefData, emptyCustomAttributeLabel) {
				if (newTaskData
						&& newTaskData.CustomAttributeData
						&& newTaskData.CustomAttributeData.results
						&& currentTaskData) {
					// eslint-disable-next-line camelcase
					var SAP__Origin = currentTaskData.SAP__Origin;
					var taskDefinitionID = currentTaskData.TaskDefinitionID;
					for (var i = 0; i < newTaskData.CustomAttributeData.results.length; i++) {
						var custtAttrName = newTaskData.CustomAttributeData.results[i].Name;
						// show only CustomAttributes which are NOT in the list of predefined names
						if (this._predefinedCustomAttributeNames.indexOf(custtAttrName.toLowerCase()) === -1) {
							newTaskData.CustomAttributeData.results[i].Visible = true;
							// if at least one CustomAttribute is visible in details, then we set the flag to "true"
							newTaskData.bShowCustomAttributesInDetail = true;
						}
						else {
							newTaskData.CustomAttributeData.results[i].Visible = false;
						}
						var paramsForTaskDefKey = {};
						// eslint-disable-next-line camelcase
						paramsForTaskDefKey.SAP__Origin = SAP__Origin;
						paramsForTaskDefKey.TaskDefinitionID = taskDefinitionID;
						var taskDefKey = this.getKeyForTaskDefinitionModel(paramsForTaskDefKey);
						// get TaskDefinition for the current task
						var currentTaskDefinitionData = taskDefData[taskDefKey];
						// set empty label in case some of the data below is missing
						newTaskData.CustomAttributeData.results[i].TaskDefinitionID = "";
						newTaskData.CustomAttributeData.results[i].Type = "";
						newTaskData.CustomAttributeData.results[i].Label = emptyCustomAttributeLabel;
						if (currentTaskDefinitionData && currentTaskDefinitionData.CustomAttributeDefinitionData) {
							var custAttrDefData = currentTaskDefinitionData.CustomAttributeDefinitionData;
							var paramsForCustAttrKey = {};
							// eslint-disable-next-line camelcase
							paramsForCustAttrKey.SAP__Origin = SAP__Origin;
							paramsForCustAttrKey.TaskDefinitionID = taskDefinitionID;
							paramsForCustAttrKey.Name = custtAttrName;
							var custAttrKey = this.getKeyForCustomAttributeDefinitionModel(paramsForCustAttrKey);
							// fetch CustomAttributeDefinitions for the current CustomAttribute based on the key values above
							var custAttrDef = custAttrDefData[custAttrKey];
							if (custAttrDef) {
								newTaskData.CustomAttributeData.results[i].TaskDefinitionID = custAttrDef.TaskDefinitionID;
								newTaskData.CustomAttributeData.results[i].Type = custAttrDef.Type;
								newTaskData.CustomAttributeData.results[i].Label = custAttrDef.Label;
								// If Format prop is present it is set to the new task data (it is optional)
								if (custAttrDef.Format) {
									newTaskData.CustomAttributeData.results[i].Format = custAttrDef.Format;
								}
							}
						}
					}
				}
				return newTaskData;
            },

            /**
             * Set flags responsible for the visibility of the TaskDescription
             * The flag bShowCustomAttributesInDetail has already been set in updateCustAttrDataWithCustAttrDefs
             * @param {object} taskDetails - response containing CustomAttributeData for the current task
             * @returns {object} - modified TaskDetail data
             */
            setVisibilityFlagsInDetail : function(taskDetails) {
				var description = taskDetails.Description;
				taskDetails.bAdditionalInformationVisible =
					(description
						&& ((description.DescriptionAsHtml && description.DescriptionAsHtml.length > 0)
							|| (description.Description && description.Description.length > 0)))
					|| false; // "OR false" added in case the rest is "undefined"
				taskDetails.bNoAdditionalInformationMessageVisible = (!taskDetails.bAdditionalInformationVisible)
					&& (!taskDetails.bShowCustomAttributesInDetail);
				return taskDetails;
            }
		};
	}
);