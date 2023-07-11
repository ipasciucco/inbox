/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/base/Object",
	"cross/fnd/fiori/inbox/model/formatter",
	"cross/fnd/fiori/inbox/model/models",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"cross/fnd/fiori/inbox/util/Comparators"
], function (UI5Object, Formatter, models, Filter, FilterOperator, Comparators) {
	"use strict";

	//const ALL_TAB_NAME = "All";
	return UI5Object.extend("cross.fnd.fiori.inbox.util.IconTabBarHelper ", {
		/* This class is created to hold all function related to IconTabBar. All logic related to manipulation and updates of tabs information should be here.
		   #MD-743 Currently some of logic still remains in the Worklist.controller. This need to be handled on separate commit after paging is implemented.
		   #MD-743 Array "aTabsData" is invoked several times as local variable of some functions. This is not necessary. It is better to be defined as class variable
				   and accessed from all functions. It should be always kept in synchronization with filterTabsModel data.
			The following operations are done here.
			1. Creation of tabs and "filterTabsModel" - createTabsAndFilters() and createTabsModelData()
			2. Create all App Filters for all tabs  - prepareTabFilters()
			3. Prepare request for Tabs counts - prepareRequestforSingleTabCounts(sKey), prepareRequestsforTabCounts
			4. Set tabcounts when data are received - setTabCounters()
			5. Prepare Task Types lists for all tabs - prepareTaskTypesListForAllTabs(), prepareTaskTypesListForTab(sTabKey)
			6. Function to update taskTypesModel - updateTaskTypesListForTab(sTabKey)
		*/

		/**
		 * @class
		 * Constructor function for class IconTabBarHelper
		 * @param {object} oTableOperations - Interface class containing functions with table operations.
		 * @param {object} oView - View containing table.
		 * @public
		 * @alias cross.fnd.fiori.inbox.util.IconTabBarHelper
		 * @extends sap.ui.base.Object
		 */


		constructor: function (oTableOperations, oView) {
			this._oView = oView;
			this._oTableOperations = oTableOperations;  // needed this to use TableOperations for creating predefined filters
			this._offlineSystems = [];
			this.aTabsData = []; // Local variable containing data for all tabs. Should be the same as models.getFilterTabsModel().getData()
			this.numberOfNonUpdatedTabCounts = 0; //Used to know when all tab counts are updated before invoke updateBindings() for filterTabsModel.
			/*  oTabsDictionary is a map containing following objects
				1. "aSAP__OriginList"	- List of "SAP__Origin" properties for the tab. (Information from SystemInfoCollection)
				2. "aSystemTypeList"	- List of "SystemType" properties for the tab.  (Information from SystemInfoCollection)
				3. "aTabTaskTypesList"	- List of Task Types for the Tab excluding types from offline systems. (Information from SystemInfoCollection and TaskDefinitionCollection)
				When for some "TaskDefinitioID" property associated "TaskName" is empty, last element of "aTabTaskTypesList" has the following structure:
				{TaskDefinitionName: "Others", TaskDefinitionId: "Others", TaskDefinitionIds : <Array with "TaskDefinitioID" without "TaskName"> }
				e.g. {TaskDefinitionName: "Others", TaskDefinitionId: "Others", TaskDefinitionIds : [TS21500012", "TS8291723"]}
				The full format is:
				{ <Tab key1> : [TaskDefinitionName: <TaskDefinitionName value1>, TaskDefinitionId: <TaskDefinitionId value2>, ...,], <Tab key2> : [...], ...,  }
				e.g. [HR : {TaskDefinitionName: "CAD Design and release for approval", TaskDefinitionId: "TS20000166"}, {TaskDefinitionName: "Equipment repair", TaskDefinitionId: "TS8019283"}]
			*/
			this.oTabsDictionary = {};
			this.oTabFiltersList = {};	// This object is a map. Has structute ( key : oFilter). Key is unique for Icon Tab. Value is the filter for this tab
			this.oTabCounts = {};		// This object is a map. Has structute ( key : counts). Key is unique for Icon Tab. Value is count in Icon Tab with key.
			// Would be beter to combine this.oTabFiltersList, this.oTabCounts in one object, but at this stage it might make code more difficult to read.
			// In case we need a third map this refactoring should be considered.

			this.mIconTabBarKeytoID = {}; // Map with structure ( Icon Tab key : Icon Tab index).
			this.mSAP__OriginToIconTabID ={}; // Map with structure ( SAP__Origin: Icon Tab key).

			this.oFilterTabsIconByType = {
				"SuccessFactors": "sap-icon://customer",
				"Ariba": "sap-icon://cart-3",
				"Concur": "sap-icon://flight",
				"CPWorkflow": "sap-icon://process",
				"Generic": "sap-icon://crm-sales",
				"S/4HANA": "sap-icon://batch-payments",
				"Fieldglass": "sap-icon://family-care"
			};
			this.selectedTabKey = "All";				// Keeps key for curently selected tab

			/*	_bTaskDefinitionModelUpdated	- Flag that indicates that "taskDefinitionModel" is updated
				_bFilterTabsModelUpdated		- Flag that indicates that "filterTabsModel" is updated
				These flags are meant to be used exclusively to decide when to execute function prepareTaskTypesListForAllTabs().
				This should happen when both SystemInfoCollection and TaskDefinitionCollection are both updated.
				Initial state of both flags is false, and when prepareTaskTypesListForAllTabs() is executed they should be again reset to false.
			*/
			this._bTaskDefinitionModelUpdated = false;
			this._bFilterTabsModelUpdated = false;
			models.attachEvent("taskDefinitionModelUpdated", null, function () {
				if (this._bFilterTabsModelUpdated) {
					this.prepareTaskTypesListForAllTabs();
					this._bFilterTabsModelUpdated = false;
				}
				else {
					this._bTaskDefinitionModelUpdated = true;
				}
			}, this);
		},

		getTabFilterList: function () {
			return this.oTabFiltersList;
		},

		getTabFilterForKey: function (sKey) {
			return this.oTabFiltersList[sKey];
		},

		/**
		 * Gets Icon Tab property  named "propertyKey".
		 * @param {string} sTabKey - Key for the selected Icon Tab
		 * @param {string} propertyKey - Name of the Icon Tab property
		 *
		 * @return {any} return Icon Tab property for key "propertyKey"
		 * @public
		 */
		getIconTabProperty: function (sTabKey, propertyKey) {
			var tabIndex = this.mIconTabBarKeytoID[sTabKey];
			return this.aTabsData[tabIndex][propertyKey];
		},

		/**
		 * Sets Icon Tab property named "propertyKey". It is made to set Icon Tab "count" property directly.
		 * Setting directty other Tab properties can have unpredicted effects. Use with caution.
		 * @param {string} sTabKey - Key for the selected Icon Tab
		 * @param {string} propertyKey - Name of the Icon Tab property
		 * @param {any} propertyValue - Value for the Icon Tab property
		 * @public
		 */
		setIconTabProperty: function (sTabKey, propertyKey, propertyValue) {
			var tabIndex = this.mIconTabBarKeytoID[sTabKey];
			if (propertyKey === "count") {
				this.oTabCounts[sTabKey] = propertyValue;
			}
			this.aTabsData[tabIndex][propertyKey] = propertyValue;			
		},

		updateOfflineSystems: function (aSystemInfoData) {
			var i;
			// Reset array with ofline systems
			this._offlineSystems = [];

			for (i = 0; i < aSystemInfoData.length; i++) {
				//populate offlineSystems
				if (aSystemInfoData[i].Status && aSystemInfoData[i].Status.toUpperCase() === "OFFLINE") {
					this._offlineSystems.push(aSystemInfoData[i].SAP__Origin);
				}
			}
			models.getSystemInfoModel().setProperty("/offlineSystems", this._offlineSystems);
		},

		/**
		 * Updates taskTypesModel for currently selected tab and updates bindings of taskTypesModel
		 * To ensure correct result should be invoked only after one of the following functions is invoked
		 * prepareTaskTypesListForAllTabs() or prepareTaskTypesListForTab(sTabKey)
		 *
		 * @param {string} sTabKey - Key for the selected Tab
		 * @public
		*/
		updateTaskTypesListForTab: function (sTabKey) {
			models.updateTaskTypesModel(this.oTabsDictionary[sTabKey].aTabTaskTypesList);
			models.getTaskTypesModel().updateBindings();
		},

		/**
		 * Prepare Task Types List for all created tabs and stores them in this.oTabsDictionary map in Array property aTabTaskTypesList
		 * Then updates taskTypesModel for currently selected tab.
		 * Should be invoked each time function createTabsModelData(aSystemInfoData) is invoked.
		 * Can be invoked only after function createTabsModelData(aSystemInfoData) is invoked at least one time.
		*/
		prepareTaskTypesListForAllTabs: function () {
			for (var sKey in this.oTabsDictionary) {
				this.prepareTaskTypesListForTab(sKey);
			}
			this.updateTaskTypesListForTab(this.selectedTabKey);
		},

		/**
		 * Prepare Task Types List for a tab with key sTabKey and stores them in this.oTabsDictionary map in Array property aTabTaskTypesList
		 * Can be invoked only after function createTabsModelData(aSystemInfoData) is invoked at least one time.
		 *
		 * @param {string} sTabKey - Key for the tab
		 * @public
		*/
		prepareTaskTypesListForTab: function (sTabKey) {
			var aTaskDefinitions = [],
				aOthersDefinitions = [],
				taskDefinitionsModel = models.getTaskDefinitionModel().getData(),
				aSapOriginList = sTabKey ? this.oTabsDictionary[sTabKey].aSAP__OriginList : [];

			for (var taskDefKey in taskDefinitionsModel) {
				// For "All" tab is selected, aSAP__OriginList is empty and we fill all task definitions.
				// For other tabs we check if aSAP__OriginList contains the SAP_Origin of the current task definition.
				if ((aSapOriginList.indexOf(taskDefinitionsModel[taskDefKey].SAP__Origin) !== -1 || sTabKey === "All")
					&& this._offlineSystems.indexOf(taskDefinitionsModel[taskDefKey].SAP__Origin) === -1) {
					if (taskDefinitionsModel[taskDefKey].TaskName) {
						aTaskDefinitions.push({
							TaskDefinitionName: taskDefinitionsModel[taskDefKey].TaskName,
							TaskDefinitionId: taskDefinitionsModel[taskDefKey].TaskDefinitionID
						});
						//Push TaskDefinitionID of every task definition without TaskName in aOthersDefinitions
					}
					else {
						aOthersDefinitions.push(taskDefinitionsModel[taskDefKey].TaskDefinitionID);
					}
				}
			}

			//Sort task definitions(aTaskDefinitions) alphabetically
			aTaskDefinitions.sort(Comparators.fnNameComparator);
			//Add "Others" entry on the last position
			//Set TaskDefinitionId:"Others" in order to notify that this entry should be handled differently
			if (aOthersDefinitions.length > 0) {
				aTaskDefinitions.push({
					TaskDefinitionName: "Others",
					TaskDefinitionId: "Others",
					TaskDefinitionIds: aOthersDefinitions
				});
			}
			this.oTabsDictionary[sTabKey].aTabTaskTypesList = aTaskDefinitions;
		},

		/**
		 * This function should be invoked each time SystemInfoCollection is requested from the OData service.
		 * Should be invoked after execution of createTabsModelData(aSystemInfoData).
		 * It prepares all tab filters and saves them in this.oTabFiltersList object.
		 *   1. Filters consist of default application filter added with AND to the filter by SAP__Origin for on-line systems available for the Tab
		 *   2. If no online system is available for the Tab then filter is set to null. Later no requests to OData service are made for such Tabs.
		 *
		 * @public
		*/
		prepareTabFilters: function () {
			var i, j, k,
				oFilter,
				aTabsData,
				aFilterList;

			aTabsData = this.aTabsData;
			// Reset TabFilters map
			this.oTabFiltersList = {};

			this._oTableOperations.resetAppFilters();

			// Create filter for tab "All" (filter exludes all offline systems)
			for (k = 0; k < this._offlineSystems.length; k++) {
				oFilter = new Filter("SAP__Origin", "NE", this._offlineSystems[k]);
				this._oTableOperations.addAppFilter(oFilter, "SAP__Origin");
			}
			this._oTableOperations.createAppFilterList();
			this.oTabFiltersList[aTabsData[0].key] = new Filter(this._oTableOperations.getAppFilters(), true);
			this._oTableOperations.resetAppFilters();

			// Create filters for other tabs
			for (k = 1; k < aTabsData.length; k++) {
				aFilterList = aTabsData[k].aSAP__OriginList;
				// flag that will indicate if there is no online system in the current filter
				var noOnlineSystemsInFilter = true;
				for (i = 0; i < aFilterList.length; i++) {
					var isOffline = false;
					for (j = 0; j < this._offlineSystems.length; j++) {
						if (aFilterList[i] === this._offlineSystems[j]) {
							isOffline = true;
							break;
						}
					}
					// If the system is offline don't add it to the current filter.
					// If no systems present in "Others" tab artificialy created system "EmptyOthersTab" is treated as offline system.
					if (isOffline || aFilterList[i] === "EmptyOthersTab") {
						continue;
					}

					//if we reach this code there is at least one online system in the filter
					noOnlineSystemsInFilter = false;
					oFilter = new Filter("SAP__Origin", "EQ", aFilterList[i]);
					this._oTableOperations.addAppFilter(oFilter, "SAP__Origin");
				}

				// If there is no online system in the filter for the current tab, filter will be set to null, so no request is made to the TCM OData provider.
				if (noOnlineSystemsInFilter) {
					this.oTabFiltersList[aTabsData[k].key] = null;
				}
				else {
					this._oTableOperations.createAppFilterList();
					this.oTabFiltersList[aTabsData[k].key] = new Filter(this._oTableOperations.getAppFilters(), true);
					this._oTableOperations.resetAppFilters();
				}
			}
		},

		setTabCounters: function () {
			var tabCounts = 0,
				aTabsData = this.aTabsData;

			/*	Assigning JS array to variable "aTabsData" is done by reference.
				So all changes made in the "aTabsData" are directly reflected in the filterTabsModel data. */

			aTabsData[0].count = this.oTabCounts[aTabsData[0].key];
			for (var i = 1; i < aTabsData.length; i++) {
				// reset "count" properties of all tabs
				aTabsData[i].count = this.oTabCounts[aTabsData[i].key];
				tabCounts = tabCounts + this.oTabCounts[aTabsData[i].key];
			}
			// 	Consistency check of tab counts. Should enter here only in case some tabs disappear during Refresh
			if (this.selectedTabKey !== "All" && tabCounts < aTabsData[0].count) {
				aTabsData[0].count = tabCounts;
			}
			this._updateFilterTabsBindings();
		},

		/**
		 * Prepare count request for a tab with key sKey and add to group "TabCountsBatchGrp"
		 * Group request should be send andterwards. Now this happens in TableOperationsImpl.applyTableOperations().
		 *
		 * @param {string} sKey - Key for the tab
		 * @public
		*/

		prepareRequestforSingleTabCounts: function (sKey) {
			var oFilter = this.oTabFiltersList[sKey],
				aFilters = [],
				oldCounts = this.oTabCounts[sKey],
				newCounts;
			aFilters[0] = oFilter;
			if (oFilter) {
				models.getMainModel().read("/TaskCollection/$count", {
					filters: aFilters,
					groupId: "TabCountsBatchGrp",
					success: function (oData, oResponse) {
						newCounts = parseInt(oData, 10);
						if (oldCounts !== newCounts) {
							this.oTabCounts[sKey] = newCounts;
							this.oTabCounts["All"] = this.oTabCounts["All"] + newCounts - oldCounts;
						}
						this.setTabCounters();
					}.bind(this),
					error: function (oError) {
						//var testerrorInternal = "Error";
					}.bind(this)
				});
			}
			else {
				this.oTabCounts[sKey] = 0;
				this.oTabCounts["All"] = this.oTabCounts["All"] - oldCounts;
				this.setTabCounters();
			}
		},

		/**
		 * Prepare count requests for all tabs and add them to group "TabCountsBatchGrp"
		 * Group request should be send andterwards. Now this happens in TableOperationsImpl.applyTableOperations().
		 *
		 * @public
		*/
		prepareRequestsforTabCounts: function () {
			var aTemp = [], aFilters = [];

			this.numberOfNonUpdatedTabCounts = 0;
			for (var sKey in this.oTabFiltersList) {
				aTemp[0] = this.oTabFiltersList[sKey];
				aFilters = [].concat(aTemp); // Way to create new array object
				var fnSucess = (function () {
					var x = sKey;
					return function (oData, oResponse) {
						this.oTabCounts[x] = parseInt(oData, 10);
						this.numberOfNonUpdatedTabCounts--;
						if (this.numberOfNonUpdatedTabCounts === 0) {
							this.setTabCounters();
						}
					};
				}());
				if (aFilters[0]) {
					this.numberOfNonUpdatedTabCounts++;
					models.getMainModel().read("/TaskCollection/$count", {
						filters: aFilters,
						groupId: "TabCountsBatchGrp",
						success: fnSucess.bind(this),
						error: function (oError) {
							this.numberOfNonUpdatedTabCounts--;
							if (this.numberOfNonUpdatedTabCounts === 0) {
								this.setTabCounters();
							}
						}.bind(this)
					});
				}
				else {
					this.oTabCounts[sKey] = 0;
				}
			}

			if (this.numberOfNonUpdatedTabCounts === 0) {
				this.setTabCounters();
			}
		},

		/**
		 * Should be invoked after each refresh of SystemInfoCollection
		 * creates tabs for filtering by provider based on "Group" property from SystemInfoCollection
		 * one Group == one tab
		 * Systems without Group property, or with Group property == "OTHERS" case insensitive, are put in the group "Others".
		 * Systems with Group property == "ALL" case insensitive, are put in the default group "All".
		 * one tab(group) can contain tasks from multiple providers
		 * icons are based on "SystemType" property
		 * tab counters are populated with direct request to OData provider
		 * @param {array} aSystemInfoData - SystemInfoCollection
		 */
		createTabsAndFilters: function (aSystemInfoData) {
			var aTabsData = this.createTabsModelData(aSystemInfoData);
			this._updateFilterTabsModel(aTabsData);

			//This prepares filters for all tabs and stores them in a map in IconTabBarHelper class.
			this.prepareTabFilters();

			// Create Task type lists for all Tabs. Should be invoked after createTabsModelData() completes
			if (this._bTaskDefinitionModelUpdated) {
				this.prepareTaskTypesListForAllTabs();
				this._bTaskDefinitionModelUpdated = false;
			}
			else {
				this._bFilterTabsModelUpdated = true;
			}
		},

		/**
		 * Wrapper for updateFilterTabsModel
		 * Updating the model with an existing separator
		 * leads to disapperaing of the first tab after the separator
		 *
		 * @param {array} aTabsData - modified after parsing the systemInfoData
		 */
		_updateFilterTabsModel: function (aTabsData) {
			var oIconTabBar = this._oView.byId("idIconTabBar");
			this._deleteSeparator();
			models.updateFilterTabsModel(aTabsData);
			this._addSeparator();

			// after refresh select the same tab. If tab is missing select "All" tab
			if (oIconTabBar.oSelectedTab && this.oTabsDictionary[this.selectedTabKey]) {
				// after refresh select the same tab
				if (oIconTabBar.oSelectedTab.getProperty("key") !== this.selectedTabKey) {
					oIconTabBar.setSelectedKey(this.selectedTabKey);
				}
			}
			else {
				// set the "All" tab as selected tab on initial loading
				var allTab = oIconTabBar.getItems()[0];
				if (allTab) {
					oIconTabBar.oSelectedTab = allTab;
					this.selectedTabKey = "All";
					oIconTabBar.setSelectedKey(this.selectedTabKey);
				}
			}
		},

		/**
		 * Wrapper for updateBindings
		 * Updating the bindings with an existing separator
		 * leads to disapperaing of the first tab after the separator
		 */
		_updateFilterTabsBindings: function () {
			this._deleteSeparator();
			models.getFilterTabsModel().updateBindings();
			this._addSeparator();
		},

		_deleteSeparator: function () {
			var oIconTabBar = this._oView.byId("idIconTabBar");
			if ((oIconTabBar.getItems().length > 2)
				&& (oIconTabBar.getItems()[1] instanceof sap.m.IconTabSeparator)) {
				oIconTabBar.removeItem(oIconTabBar.getItems()[1]);
			}
		},

		_addSeparator: function () {
			var oIconTabBar = this._oView.byId("idIconTabBar");
			if ((oIconTabBar.getItems().length > 2)
				&& !(oIconTabBar.getItems()[1] instanceof sap.m.IconTabSeparator)) {
				var separator = new sap.m.IconTabSeparator();
				oIconTabBar.insertItem(separator, 1);
			}
		},

		/**
		 * Create data for the "filterTabsModel"
		 * Populate _offlineSystems array with SAP_Origins that are OFFLINE.
		 *
		 * Each tab data entry has two additional lists:
		 * aSystemTypeList contains system types for icon resolving
		 * aSAP__OriginList contains SAP_Origins in current tab for filtering. For tab "All" these list is empty.
		 *
		 * @param {array} aSystemInfoData - SystemInfoCollection
		 * @returns {array} aTabsData - modified after parsing the systemInfoData
		 */
		createTabsModelData: function (aSystemInfoData) {
			var aTabsData = [],
				oAllTab = {
					count: this.oTabCounts["All"],
					icon: "",
					key: "All",
					showAll: true,
					text: this._oView.getController().getResourceBundle().getText("allIconTabTitle"),
					visible: true,
					// eslint-disable-next-line camelcase
					aSAP__OriginList: [],
					aSystemTypeList: []
				};

			this.aTabsData = aTabsData;
			this.oTabsDictionary = {};

			// "All" tab is always added first
			aTabsData.push(oAllTab);
			this.oTabsDictionary["All"] = { aSAP__OriginList: [], aSystemTypeList: [] }; // eslint-disable-line camelcase

			if (!aSystemInfoData) {
				aSystemInfoData = [];
				return aTabsData;
			}

			//  Populate offline systems
			this.updateOfflineSystems(aSystemInfoData);

			var i, oOthersTab;
			// aSystemInfoData is parsed into oTabsDictionary
			for (i = 0; i < aSystemInfoData.length; i++) {
				// case insensitive "OTHERS", empty, null and undefined labels replaced with "Others" label
				// case insensitive "ALL" not created. Should go in our "All" tab
				var sGroup = aSystemInfoData[i].Group;
				if (jQuery.type(sGroup) !== "string") {
					sGroup = "Others";
				}
				else if (sGroup.length === 0 || sGroup.toUpperCase() === "OTHERS") {
					sGroup = "Others";
				}
				else if (sGroup.toUpperCase() === "ALL") {
					continue;
				}

				if (!this.oTabsDictionary.hasOwnProperty(sGroup)) {
					// if current label not stored - adding as new
					this.oTabsDictionary[sGroup] = {};
					this.oTabsDictionary[sGroup].aSystemTypeList = [aSystemInfoData[i].SystemType];
					this.oTabsDictionary[sGroup].aSAP__OriginList = [aSystemInfoData[i].SAP__Origin]; // eslint-disable-line camelcase
				}
				else {
					// if current label is already stored - updating arrays with SystemType and SAP_Origin
					if (this.oTabsDictionary[sGroup].aSystemTypeList.indexOf(aSystemInfoData[i].SystemType) === -1) {
						this.oTabsDictionary[sGroup].aSystemTypeList.push(aSystemInfoData[i].SystemType);
					}
					if (this.oTabsDictionary[sGroup].aSAP__OriginList.indexOf(aSystemInfoData[i].SAP__Origin) === -1) {
						this.oTabsDictionary[sGroup].aSAP__OriginList.push(aSystemInfoData[i].SAP__Origin);
					}
				}
			}

			// sorting oTabsDictionary alphabetically
			var oTabsDictionarySorted = [];
			var group;

			oTabsDictionarySorted = Object.keys(this.oTabsDictionary).sort(function (a, b) {
				return a.toLowerCase().localeCompare(b.toLowerCase());
			});

			// pushing all tabs from oTabsDictionary to aTabsData
			for (i = 0; i < oTabsDictionarySorted.length; i++) {
				group = oTabsDictionarySorted[i];
				if (group === "Others") {
					// "Others" tab will be pushed last so now it is only created
					oOthersTab = {
						count: this.oTabCounts["Others"],
						icon: this.oFilterTabsIconByType.Generic,
						key: "Others",
						//showAll: true,
						text: this._oView.getController().getResourceBundle().getText("tabOthersTitle"),
						visible: true,
						// eslint-disable-next-line camelcase
						aSAP__OriginList: this.oTabsDictionary[group].aSAP__OriginList,
						aSystemTypeList: this.oTabsDictionary[group].aSystemTypeList
					};
				}
				else if (group.toUpperCase() !== "ALL") {
					var sIcon = this.oFilterTabsIconByType.Generic;
					// if there is exactly one SystemType for this group/tab the icon is fetched from oFilterTabsIconByType
					// else setting Generic icon
					if (this.oTabsDictionary[group].aSystemTypeList.length === 1) {
						sIcon = this.oFilterTabsIconByType[this.oTabsDictionary[group].aSystemTypeList[0]];
					}
					if (!sIcon) {
						sIcon = this.oFilterTabsIconByType.Generic;
					}

					aTabsData.push({
						count: this.oTabCounts[group],
						icon: sIcon,
						key: group,
						text: group,
						visible: true,
						// eslint-disable-next-line camelcase
						aSAP__OriginList: this.oTabsDictionary[group].aSAP__OriginList,
						aSystemTypeList: this.oTabsDictionary[group].aSystemTypeList
					});
				}
			}

			// "Others" tab always last and always visible even if with zero tasks
			// but only if there is more than one tab
			if (aTabsData.length > 1) {
				if (!oOthersTab) {
					oOthersTab = {
						count: this.oTabCounts["Others"],
						icon: this.oFilterTabsIconByType.Generic,
						key: "Others",
						//showAll: true,
						text: this._oView.getController().getResourceBundle().getText("tabOthersTitle"),
						visible: true,
						// eslint-disable-next-line camelcase
						aSAP__OriginList: ["EmptyOthersTab"],
						aSystemTypeList: []
					};
					this.oTabsDictionary["Others"] = { aSAP__OriginList: [], aSystemTypeList: [] }; // eslint-disable-line camelcase
				}
				aTabsData.push(oOthersTab);
			}

			var j, aSystemTypeList;
			this.mSAP__OriginToIconTabID = {};
			this.mIconTabBarKeytoID = {};
			for (i = 0; i < aTabsData.length; i++) {
				this.mIconTabBarKeytoID[aTabsData[i].key] = i;
				aSystemTypeList = aTabsData[i].aSAP__OriginList;
				for (j = 0; j < aSystemTypeList.length; j++) {
					this.mSAP__OriginToIconTabID[aSystemTypeList[j]] = aTabsData[i].key; 
				}
			}
			return aTabsData;
		}
	});
});