/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
		"sap/ui/model/json/JSONModel",
		"sap/ui/Device",
		"sap/ui/base/EventProvider",
		"sap/ui/model/Filter",
		"sap/base/Log",
		"cross/fnd/fiori/inbox/model/ModelsHelper",
		"cross/fnd/fiori/inbox/model/PagingHelper",
		"cross/fnd/fiori/inbox/util/Comparators",
		"cross/fnd/fiori/inbox/util/Constants"
	], function (JSONModel, Device, EventProvider, Filter, Log, ModelsHelper, PagingHelper, Comparators, Constants) {
		"use strict";

		var models = {
			mainModel : null,
			deviceModel : null,
			taskModel : null,
			taskDefinitionModel : null,
			responseOptionsModel : null,
			systemInfoModel : null,
			filterTabsModel : null,
			taskTypesModel : null,
			taskDetailModel : null,
			workflowLogModel : null
		};

		var pagingHelper = {};

		var modelAPISingleton = {};

		var ModelAPI = EventProvider.extend("cross.fnd.fiori.inbox.model.models", {

			sBatchGroupName: "batchCreate",
			sDecisionOptionsBatch: "DecisionOptionsBatch",
			sDetailsBatch: "DetailsBatch",
			sTabCountsBatch: "TabCountsBatchGrp",
			sCustomAttrColumnBatch: "CustomAttrColumnGrp",

			bResponseOptionsExist: false,

			setMainModel : function(model) {
				models.mainModel = model;
				this.setMainModelDeferredGroupsForBatch();
			},

			getMainModel : function() {
				return models.mainModel;
			},

			getDeviceModel : function () {
				if (!models.deviceModel) {
					models.deviceModel = new JSONModel(Device);
					models.deviceModel.setDefaultBindingMode("TwoWay");
				}
				return models.deviceModel;
			},

			resetDeviceModel : function () {
				models.deviceModel = null;
			},

			getTaskModel : function () {
				if (!models.taskModel) {
					models.taskModel = new JSONModel();
					models.taskModel.setDefaultBindingMode("TwoWay");
				}
				return models.taskModel;
			},

			resetTaskModel : function () {
				models.taskModel = null;
			},

			updateTaskModel : function (data) {
				this.getTaskModel().setData(data);
			},

			/**
			 * This method should be called only initially or upon filtering, refreshing, whenever we want to load the first page again.
			 *
			 * @param {object} oURLParameters - A map containing the parameters that will be passed as query strings to OData.read
			 * @param {sap.ui.model.Sorter[]} aSorters - An array of sorters to be included in the request URL
			 * @param {sap.ui.model.Filter[]} aFilters - An array of filters to be included in the request URL
			 * @param {string} sBatchGroupName - the name of the batch group that will be used for the oData batch request
			 */
			refreshTaskModel : function (oURLParameters, aSorters, aFilters, sBatchGroupName) {
				pagingHelper = new PagingHelper(oURLParameters, aSorters, aFilters);

				models.mainModel.read("/TaskCollection", {
					urlParameters: pagingHelper.getURLParameters(),
					sorters: pagingHelper.getSorters(),
					filters: pagingHelper.getFilters(),
					groupId: sBatchGroupName,
					success:function(oData, oResponse) {
							var oLastItem = oData.results[oData.results.length - 1];
							pagingHelper.setLastItem(oLastItem);
							oData.results = this._dataMassage(oData.results);
							if (this.bResponseOptionsExist) {
								this.updateTaskModelWithResponseOptions(oData.results);
							}
							this.updateTaskModel(oData);
							this.fireEvent("taskModelUpdated");
						}.bind(this),
					error:function(oError) {
						this.fireEvent("taskModelUpdateError");
					}.bind(this)
				});
			},

			/**
			 * This method should be called every time we want to load new page in the model.
			 */
			loadNextPageInTaskModel : function () {
				Log.debug("Model size begin: " + this.getTaskModel().getData().results.length, "models.js", "MyTasks");

				// don't proceed if the last page has been already loaded
				if (pagingHelper.getLastPageLoaded()) {
					this.getTaskModel().updateBindings();
					return;
				}
				// read the task collection using the paging helper.
				models.mainModel.read("/TaskCollection", {
					urlParameters: pagingHelper.getURLParameters(),
					sorters: pagingHelper.getSorters(),
					filters: pagingHelper.getFilters(),
					success: function(oData, oResponse) {
						// if there are no results the last page has been loaded with the previous request
						if (oData.results.length === 0) {
							this.getTaskModel().updateBindings();
							pagingHelper.setLastPageLoaded(true);
							Log.debug("Model size end: " + this.getTaskModel().getData().results.length, "models.js", "MyTasks");
							return;
						}

						// if the results are less then the page size then this result is the last page,
						// we set the flag but do not exit because we want to add the current result to the model
						if (oData.results.length < pagingHelper.getPageSize()) {
							pagingHelper.setLastPageLoaded(true);
						}

						// this is the last item in the odata result returend from the backend
						var oLastItem = oData.results[oData.results.length - 1];
						// this is the current last item in the paging helper
						var currentLastItem = pagingHelper.getLastItem();
						// if the last item in the odata result is the same as the last item in paging helper
						// then we exit this function, because it seems we have requested the same page
						// this can happen very rare in some race conditions,
						// when second request is performed before the last item was updated from previous request.
						if (currentLastItem.InstanceID === oLastItem.InstanceID) {
							return;
						}

						pagingHelper.setLastItem(oLastItem);
						var currentData = this.getTaskModel().getData();
						if (this.bResponseOptionsExist) {
							this.updateTaskModelWithResponseOptions(oData.results);
						}
						currentData.results = currentData.results.concat(oData.results);
						this.getTaskModel().updateBindings();

						Log.debug("Model size end: " + this.getTaskModel().getData().results.length, "models.js", "MyTasks");
						return;
					}.bind(this),
					error:function(oError) {
						this.fireEvent("taskModelUpdateError");
					}.bind(this)
				});
			},

			//Massaging task result to denormalize the custom attributes
			_dataMassage:function(tasks) {
				var oTask;
				for (var i=0; i<tasks.length; i++) {
					oTask = tasks[i];
					if (oTask.CustomAttributeData && oTask.CustomAttributeData.results) {
						for (var j=0; j<oTask.CustomAttributeData.results.length; j++) {
							 oTask[encodeURIComponent("CA_" + oTask.CustomAttributeData.results[j].Name)] = oTask.CustomAttributeData.results[j].Value;
						}
						tasks[i] = oTask;
					}
				}
				return tasks;
			},

			/**
			 * Add deferred group for the batch to the model.
			 */
			setMainModelDeferredGroupsForBatch : function () {
				var aDeferredGroups = models.mainModel.getDeferredGroups();
				aDeferredGroups.push(this.sBatchGroupName);
				aDeferredGroups.push(this.sDecisionOptionsBatch);
				aDeferredGroups.push(this.sDetailsBatch);
				aDeferredGroups.push(this.sTabCountsBatch);
				aDeferredGroups.push(this.sCustomAttrColumnBatch);
				models.mainModel.setDeferredGroups(aDeferredGroups);
			},

			/**
			 * The method creates and submit batch.
			 *
			 * @param {string} sCurrentAction Current action to perform.
			 * @param {object} oMapWithSelectedTasks Map with selected tasks.
			 * @param {array} aSelectedTasks List with tasks, which are selected.
			 * @param {function} fnActionSuccess CallBack function for execution on action success.
			 * @param {function} fnActionError CallBack function for execution on action error.
			 */
			performTaskAction : function (sCurrentAction,
											oMapWithSelectedTasks,
											aSelectedTasks,
											fnActionSuccess,
											fnActionError) {
				// Clear waiting entries for submit.
				if (models.mainModel.hasPendingChanges()) {
					models.mainModel.resetChanges();
				}
				var number = 0;
				var nChangeSetId;

				for (var key in oMapWithSelectedTasks) {
					if (oMapWithSelectedTasks.hasOwnProperty(key)) {
						var value = oMapWithSelectedTasks[key];
						nChangeSetId = "changeSetId" + number;
						// Create entry for batch request.
						models.mainModel.createEntry("/" + sCurrentAction,
							{
								changeSetId: nChangeSetId,
								groupId: this.sBatchGroupName,
								// eslint-disable-next-line camelcase
								urlParameters: {SAP__Origin: "'" + value.SAP__Origin + "'", InstanceID: "'" + value.InstanceID + "'"}
							});
						aSelectedTasks.push(value);
						number++;
					}
				}
				// Make the batch request with all entries.
				models.mainModel.submitChanges({
					groupId: this.sBatchGroupName,
					success: fnActionSuccess,
					error: fnActionError
				});
			},

			/**
			 * Update certain tasks in the task model.
			 *
			 * @param {array} aChangedTasks List with tasks, which must be updated.
			 * @param {array} aSelectedTasks List with tasks, which are selected.
			 */
			updateTaskModelForCertainTasks : function (aChangedTasks, aSelectedTasks) {
				if (aChangedTasks && aChangedTasks.length > 0) {
					var oTableModel = this.getTaskModel();
					var oChangedItem;

					for (var i = 0; i < aChangedTasks.length; i++) {
						oChangedItem = aChangedTasks[i];
						// not looping through each item and finding the context of the selected item which is changed.
						// instead using the index from the selected item's list to replace the item.
						// index in the changed item is being set in fnActionSuccess method when we process the batch response.
						// Merge the exiting task with new so that custom attributes are retained when new task is applied to model
						var task = oTableModel.getProperty(aSelectedTasks[oChangedItem.index].sContextPath);
						for (var property in task) {
							if (task.hasOwnProperty(property) && oChangedItem.oData.hasOwnProperty(property)) {
								task[property] = oChangedItem.oData[property];
							}
						}
						oTableModel.setProperty(aSelectedTasks[oChangedItem.index].sContextPath, task);
					}
				}
			},

            getTaskDefinitionModel : function() {
				if (!models.taskDefinitionModel) {
					models.taskDefinitionModel = new JSONModel();
					models.taskDefinitionModel.setDefaultBindingMode("TwoWay");
				}
				return models.taskDefinitionModel;
			},

			resetTaskDefinitionModel : function () {
				models.taskDefinitionModel = null;
				this.resetResponseOptionsModel();
			},

			updateTaskDefinitionModel : function (taskDefList, bCustomAttributesExist) {
				var i;
				if (bCustomAttributesExist) {
					for (i = 0; i < taskDefList.length; i++) {
						if ((taskDefList[i].CustomAttributeDefinitionData) && (taskDefList[i].CustomAttributeDefinitionData.results)) {
							// convert CustomAttributeDefinitions for the current TaskDefinition from array to map
							// and replace them in the taskDefList
							var mapCustAttr = ModelsHelper.convertArrayToMap(
								taskDefList[i].CustomAttributeDefinitionData.results,
								ModelsHelper.getKeyForCustomAttributeDefinitionModel);
							ModelsHelper.addPrefixToCustomAttributes(mapCustAttr);
							taskDefList[i].CustomAttributeDefinitionData = mapCustAttr;
						}
					}
				}

				/* In processResponseOptions() Display Order Priority to each ResponseOptions is added and ResponseOptions array is sorted by it.
				 * Object "mapResponseOptions" will be returned with  map of ResponseOptions to create responseOptionsModel. The ResponseOptions
				 * that remain in TaskDefinition structure will be stripped from Reasons and in Array form. Later they will be attached to each
				 * task in taskModel. One optimization here would be for every ResponseOption in TaskDefintion structure to retain only two properties
				 * "DecisionKey" and "DecisionText" which are binded to MenuButton in Worklist.view
				 */
				var mapResponseOptions = {};
				if (this.bResponseOptionsExist) {
					for (i = 0; i < taskDefList.length; i++) {
						var responseOptionsData = taskDefList[i][Constants.NP_RESPONSE_OPTIONS_DATA];
						if ((responseOptionsData) && (responseOptionsData.results)) {
							ModelsHelper.processResponseOptions(responseOptionsData.results, mapResponseOptions);
							responseOptionsData = responseOptionsData.results;
							responseOptionsData.sort(Comparators.fnResponseOptionsComparator);
							taskDefList[i][Constants.NP_RESPONSE_OPTIONS_DATA] = responseOptionsData;
						}
					}
				}

				var mapTaskDefs = ModelsHelper.convertArrayToMap(taskDefList, ModelsHelper.getKeyForTaskDefinitionModel);
				this.getTaskDefinitionModel().setData(mapTaskDefs);
				this.updateResponseOptionsModel(mapResponseOptions);
			},

			refreshTaskDefinitionModel : function () {
				var	aSelectValues = ["SAP__Origin", "TaskDefinitionID", "TaskName"];
				var aExpandValues = [];
				var aParams = [];
				var bCustomAttributesExist = false;
				if (this.checkPropertyExistsInMetadata("CustomAttributeDefinitionCollection", null)
				|| this.checkPropertyExistsInMetadata("CustomAttributeDefinition", null)) {
					bCustomAttributesExist = true;
					aExpandValues.push("CustomAttributeDefinitionData");
					aSelectValues.push("CustomAttributeDefinitionData");
				}

				// Request Response Options and Reason Definitions
				if (this.checkPropertyExistsInMetadata(Constants.ES_RESPONSE_OPTIONS_COLLECTION, null)) {
					this.bResponseOptionsExist = true;
					aSelectValues.push(Constants.NP_RESPONSE_OPTIONS_DATA);
					if (this.checkPropertyExistsInMetadata(Constants.ES_REASON_DEFINITIONS_COLLECTION, null)) {
						aExpandValues.push(Constants.NP_RESPONSE_OPTIONS_DATA + "/" + Constants.NP_REASON_DEFINITIONS_DATA);
					}
					else {
						aExpandValues.push(Constants.NP_RESPONSE_OPTIONS_DATA);
					}
				}

				aParams.push("$select=" + aSelectValues.join());
				if (aExpandValues.length > 0) {
					aParams.push("$expand=" + aExpandValues.join());
				}
				models.mainModel.read("/TaskDefinitionCollection", {
					urlParameters:aParams,
					success:function(oData) {
						this.updateTaskDefinitionModel(oData.results, bCustomAttributesExist);
						this.fireEvent("taskDefinitionModelUpdated");
					}.bind(this)
				});
			},

            getResponseOptionsModel : function() {
				if (!models.responseOptionsModel) {
					models.responseOptionsModel = new JSONModel();
					models.responseOptionsModel.setDefaultBindingMode("TwoWay"); // Do I need this?
				}
				return models.responseOptionsModel;
			},

			updateResponseOptionsModel : function (data) {
				this.getResponseOptionsModel().setData(data);
			},

			resetResponseOptionsModel : function () {
				models.responseOptionsModel = null;
			},

			getSystemInfoModel : function () {
				if (!models.systemInfoModel) {
					models.systemInfoModel = new JSONModel();
				}
				return models.systemInfoModel;
			},

			resetSystemInfoModel : function () {
				models.systemInfoModel = null;
			},

			updateSystemInfoModel : function (data) {
				this.getSystemInfoModel().setData(data);
			},

			refreshSystemInfoModel : function () {
				models.mainModel.read("/SystemInfoCollection", {
					success:function(oData, oResponse) {
						this.updateSystemInfoModel(oData);
						this.fireEvent("systemInfoModelUpdated");
					}.bind(this),
					error:function(oError) {
						this.fireEvent("systemInfoModelUpdateError");
					}.bind(this)
				});
			},

			checkPropertyExistsInMetadata : function (sEntityName, sPropertyName) {
				var oServiceMetaModel = models.mainModel.getMetaModel();
				return ModelsHelper.checkPropertyExistsInMetadata(sEntityName, sPropertyName, oServiceMetaModel);
			},

			getFilterTabsModel : function () {
				if (!models.filterTabsModel) {
					models.filterTabsModel = new JSONModel();
				}
				return models.filterTabsModel;
			},

			updateFilterTabsModel : function (data) {
				this.getFilterTabsModel().setData(data);
			},

			resetFilterTabsModel : function () {
				models.filterTabsModel = null;
			},

            getTaskTypesModel : function() {
				if (!models.taskTypesModel) {
					models.taskTypesModel = new JSONModel();
					models.taskTypesModel.setDefaultBindingMode("TwoWay");
				}
				return models.taskTypesModel;
			},

			updateTaskTypesModel : function (data) {
				this.getTaskTypesModel().setData(data);
			},

			resetTaskTypesModel : function () {
				models.taskTypesModel = null;
			},

            /**
             * (!!! Not used currently)
			 * Make a batch request for DecisionOptions (see TCM) for each task. (!!! Not used currently)
             * Add display order priority number for each DecisionOption if it is missing.
             * Sort the DecisionOptions for each task based on display order priority number.
             * Populate relevant taskModel entries with DefaultAction and DecisionOptions
             *
             * DefaultAction property - first entry from the sorted list of DecisionOptions
             * DecisionOptions property - other entries(exluding first) from the sorted list of DecisionOptions
             *
             * DefaultAction is used for a Default menu button action.
             * DecisionOptions is used to populate menu items.
             */
            updateTaskModelWithCustomActions : function () {
				// Clear waiting entries for submit.
				if (models.mainModel.hasPendingChanges()) {
					models.mainModel.resetChanges();
				}

				var fnSuccessCallback = function(oData) {
					var aBatchResponses = oData.__batchResponses;
					var oBatchResponse;
					var oResult;
					for (var j in aBatchResponses) {
						oBatchResponse = aBatchResponses[j];
						if (oBatchResponse.hasOwnProperty("data") && oBatchResponse.statusCode >= "200" && oBatchResponse.statusCode < "300") {
							oResult = oBatchResponse.data.results;
							if (oResult) {
								ModelsHelper.addDisplayOrderPriorityIfMissing(oResult);
								oResult.sort(Comparators.fnResponseOptionsComparator);
								models.taskModel.getData().results[j].DefaultAction = oResult.shift();
								models.taskModel.getData().results[j].DecisionOptions = oResult;
							}
						}
					}
					models.taskModel.updateBindings();
					this.fireEvent("customActionsUpdated");
				}.bind(this);

				var fnErrorCallback = function(oError) {
					this.fireEvent("customActionsUpdateError");
					// do nothing for now. Custom Actions will not be displayed.
					// If analysis is needed we can debug or analyze the network trace to see the error.
					// Some error handling might be implemented here if requested in the future.
				}.bind(this);

				var aTaskData = models.taskModel.getData().results;
				//iterate over task collection array to get params.
				for (var i = 0; i < aTaskData.length; i++) {
					var oTask = aTaskData[i];
					var sChangeSetId = "ChangeSetId" + i;
					var mURLParams = {
						SAP__Origin: oTask.SAP__Origin, // eslint-disable-line camelcase
						InstanceID : oTask.InstanceID
					};
					models.mainModel.callFunction("/DecisionOptions",{
						urlParameters: mURLParams,
						groupId: this.sDecisionOptionsBatch,
						changeSetId: sChangeSetId
					});
				}

				// Make the batch request with all entries.
				models.mainModel.submitChanges({
					groupId: this.sDecisionOptionsBatch,
					success: fnSuccessCallback,
					error: fnErrorCallback
				});
			},

			/**
			 * This function populates Response Options for each task.
			 * It should be invoked every time TaskCollection request is made to the OData TCM provider.
			 * Response Options are received initially with Task Definitions.
			 * They are sorted in updateTaskDefinitionModel() and are kept in TaskDefinitionModel.
			 * This function adds two new properties for each task.
			 * 1. DefaultAction   - This is Response Option sorted on the top and that will be shown on the menu button.
			 * 2. ResponseOptions - Array of the rest of Response Options seen from drop down menu.
			 *
			 * @param {array} aTaskData - array with TaskCollection data received from the OData TCM provider
			 */
			updateTaskModelWithResponseOptions : function (aTaskData) {
				var responseOptions,
					mTaskDefinitions = this.getTaskDefinitionModel().getData(),
					taskDefinition;

				if (mTaskDefinitions && aTaskData) {
					for (var i = 0; i < aTaskData.length; i++) {
						taskDefinition = mTaskDefinitions[ModelsHelper.getKeyForTaskDefinitionModel(aTaskData[i])];
						if (taskDefinition) {
							responseOptions = [].concat(taskDefinition[Constants.NP_RESPONSE_OPTIONS_DATA]);
							aTaskData[i].DefaultAction = responseOptions.shift();
							aTaskData[i][Constants.RESPONSE_OPTIONS] = responseOptions;
						}
					}
				}
			},

			/**
			 * Execute a decision option for a task.
			 * Calls Decision function import on the service and pass the given parameters.
			 *
			 * @param {object}  oDecision - it is an object containing all properties nessesary to send Decision request to TCM provider
			 *						sDecisionKey - desicion key of executed action
			 *						SAP__Origin - property of the task
			 *						InstanceID  - property of the task
			 * @param {function} fnSuccess - success callback function
			 * @param {function} fnError - error callback function
			 * @param {string}   sNote Note typed by user in Confirmation Dialog
			 * @param {string}   sReasonCode Reason Code text selected by user in Confirmation Dialog
			 */
			callCustomAction : function(oDecision, fnSuccess, fnError, sNote, sReasonCode) {
				var mURLParams = {
						// eslint-disable-next-line camelcase
						SAP__Origin:	oDecision.SAP__Origin,
						InstanceID :	oDecision.InstanceID,
						DecisionKey:	oDecision.DecisionKey
					};

				/* 
				 * 	If "sNote" or "sReasonCode value is "null" or "undefined", it should be excluded from Decision request.
				 * 	Format of "null" is not compatible with "Edm.String".
				 * 	When "sNote" is empty string we also do not send in Decision request.
				 */

				if (sNote) {
					mURLParams.Comments = sNote;
				}

				if (sReasonCode) {
					mURLParams.ReasonCode = sReasonCode;
				}

				models.mainModel.callFunction("/" + Constants.FI_DECISION,{
						method: "POST",
						urlParameters: mURLParams,
						success: fnSuccess,
						error: fnError
					});
				// Request example:
				// POST Decision?SAP__Origin='SuccessFactors'&InstanceID='45'&DecisionKey='keyRework'&Comments='test%3ARework'&ReasonCode='offers'
			},

			getTaskDetailModel : function() {
				if (!models.taskDetailModel) {
					models.taskDetailModel = new JSONModel();
				}
				return models.taskDetailModel;
			},

			/**
			 * Update task model with option for merging
			 *
			 * @param {object} data Data with it to be updated the model
			 * @param {boolean} merge if true the data is merged with the old one
			 * and if false old data is overrided with the new data
			 */
			updateTaskDetailModel : function (data, merge) {
				this.getTaskDetailModel().setData(data, merge);
			},

			resetTaskDetailModel : function () {
				models.taskDetailModel = null;
			},

			/**
			 * Calls read function to get task details
			 *
			 * @param {string} SAP__Origin task SAP__Origin
			 * @param {string} InstanceID task InstanceID
			 * @param {array} aParams request parameters
			 * @param {string} emptyCustomAttributeLabel
			 */
			 // eslint-disable-next-line camelcase
			refreshTaskDetailModel : function(SAP__Origin, InstanceID, aParams, emptyCustomAttributeLabel) {
				// Clear waiting entries for submit.
				if (models.mainModel.hasPendingChanges()) {
					models.mainModel.resetChanges();
				}

				var taskDetailModel = this.getTaskDetailModel().getData();

				var sChangeSetId = "ChangeSetIdDetails";
				models.mainModel.read("/TaskCollection(SAP__Origin='" + encodeURIComponent(SAP__Origin)
					+ "',InstanceID='" + encodeURIComponent(InstanceID) + "')", {
						urlParameters:aParams,
						groupId: this.sDetailsBatch,
						changeSetId: sChangeSetId});

				var fnSuccessCallback = function(taskSwitchCount, oData) {

					var currentTaskData = this.getTaskDetailModel().getData();

					// tc_d_tsc
					// Exit if another task was clicked while waiting
					if (taskSwitchCount !== currentTaskData.taskSwitchCount) {
						return;
					}

					if (oData.__batchResponses && oData.__batchResponses[0]) {
						var oBatchResponse = oData.__batchResponses[0];
						if (oBatchResponse.statusCode >= "200" && oBatchResponse.statusCode < "300") {
							var newTaskData = oBatchResponse.data;
							var taskDefData = this.getTaskDefinitionModel().getData();
							// merge CustomAttributeDefinitions with CustomAttributeData
							// and hide CustomAttributes with predefined names
							// might return newTaskData unmodified
							var oTaskDetails = ModelsHelper.updateCustAttrDataWithCustAttrDefsAndSetVisibility(
								newTaskData,
								currentTaskData,
								taskDefData,
								emptyCustomAttributeLabel);
							oTaskDetails = ModelsHelper.setVisibilityFlagsInDetail(oTaskDetails);
							this.updateTaskDetailModel(oTaskDetails, true);
							this.fireEvent("taskDetailRequestSuccess");
						}
					}
				}.bind(this, taskDetailModel.taskSwitchCount);

				var fnErrorCallback = function(taskSwitchCount, oError) {

					var currentTaskData = this.getTaskDetailModel().getData();

					// tc_d_tsc
					// Exit if another task was clicked while waiting
					if (taskSwitchCount !== currentTaskData.taskSwitchCount) {
						return;
					}
					
					this.fireEvent("taskDetailRequessError");

				}.bind(this, taskDetailModel.taskSwitchCount);

				// Make the batch request with all entries.
				models.mainModel.submitChanges({
					groupId: this.sDetailsBatch,
					success: fnSuccessCallback,
					error: fnErrorCallback
				});
			},

            getWorkflowLogModel: function() {
				if (!models.workflowLogModel) {
					models.workflowLogModel = new JSONModel();
				}
				return models.workflowLogModel;
			},

			/**
			 * Updates workflowLogModel
			 *
			 * @param {object} data response data
			 */
			updateWorkflowLogModel : function (data) {
				this.getWorkflowLogModel().setData(data);
			},

			/**
			 * Request workflow log data for selected task
			 *
			 * @param {String} InstanceID instance id of selected task
			 * @param {String} SAP__Origin sap origin of selected task
			 */
			// eslint-disable-next-line camelcase
			refreshWorkflowLogModel: function (InstanceID, SAP__Origin) {
				// eslint-disable-next-line camelcase
				var sContextPath = "/TaskCollection" + "(InstanceID='" + InstanceID + "'," + "SAP__Origin='" + SAP__Origin + "')" + "/WorkflowLogs";
				models.mainModel.read(sContextPath, {
					success:function(oData, oResponse) {
						this.updateWorkflowLogModel(oData);
						this.getWorkflowLogModel().setProperty("/modelUpdated", true);
						this.fireEvent("workflowLogModelUpdated");
					}.bind(this),
					error:function(oError) {
						this.fireEvent("workflowLogModelUpdateError");
					}.bind(this)
				});
			},

			/**
			 * Reset workflowLogModel
			 */
			resetWorkflowLogModel : function () {
				models.workflowLogModel = null;
			}
		});

		// Create essentially a singleton instance of this class
		modelAPISingleton = new ModelAPI();
		return modelAPISingleton;

	}
);