/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/base/Object",
	"cross/fnd/fiori/inbox/util/tools/CommonHeaderFooterHelper",
	"sap/m/Bar",
	"sap/m/GroupHeaderListItem",
	"sap/ui/Device",
	"sap/m/SearchField",
	"sap/m/PullToRefresh",
	"sap/m/Title",
	"sap/m/Button",
	"sap/ui/core/library"
], function(
	BaseObject,
	CommonHeaderFooterHelper,
	Bar,
	GroupHeaderListItem,
	Device,
	SearchField,
	PullToRefresh,
	Title,
	Button,
	UICoreLibrary
) {
	"use strict";

	var TitleLevel = UICoreLibrary.TitleLevel;

	BaseObject.extend("cross.fnd.fiori.inbox.util.tools.MasterHeaderFooterHelper", {

		constructor : function(oApplicationImplementation) {
			this.oApplicationImplementation = oApplicationImplementation;
			this.oCommonHeaderFooterHelper = new CommonHeaderFooterHelper(oApplicationImplementation, {});
		},

		// set master header bar and footer bar
		defineMasterHeaderFooter : function(oController, bAllDisabled) {
			this.defineMasterHeaderFooterInner(oController, bAllDisabled);
		},

		defineMasterHeaderFooterInner : function(oController, bAllDisabled) {
			var oOptions = oController.getHeaderFooterOptions();
			this.setHeaderFooter(oController, oOptions, bAllDisabled);
		},

		setHeaderFooter : function(oController, oOptions, bAllDisabled, bKeepModifications) {
			// get content information from app
			if (!oOptions) {
				return;
			}
			var oPage = this.oCommonHeaderFooterHelper.startBuild(oController, oOptions, { bEditState : false, bIsSearching : false, bAllDisabled : bAllDisabled }, bKeepModifications);
			this.defineHeader(oController, oPage);
			this.defineFooter(oController, oPage);
			this.oApplicationImplementation.oCurController.MasterCtrl = oController;
			this.oApplicationImplementation.oCurController.FullCtrl = null;

			this.oCommonHeaderFooterHelper.endBuild(oController);

		},

		// function defining the master header
		defineHeader : function(oController, oPage) {
			var oCustHeader = oPage.getCustomHeader();
			if (!oCustHeader) {
				oCustHeader = new Bar();
				oPage.setCustomHeader(oCustHeader);
			}
			this.defineMasterSubHeader(oController, oPage);
			var iCount = -1;
			if (oController._oControlStore.oMasterSearchField) {
				var sFilterPattern = oController._oControlStore.oMasterSearchField.getValue();
				if (sFilterPattern) {
					iCount = oController.applySearchPattern(sFilterPattern);
					oController.evaluateClientSearchResult(iCount, oController.getList(), oController._emptyList);
				}
			}
			if (iCount < 0) {
				if (oController._oMasterListBinding) {
					iCount = oController._oMasterListBinding.getLength();
				}
				else {
					var oList = oController.getList();
					var aItems = oList.getItems();
					iCount = 0;
					for (var i = 0; i < aItems.length; i++) {
						if (!(aItems[i] instanceof GroupHeaderListItem)) {
							iCount++;
						}
					}
				}
			}
			this.defineMasterTitle(oController, oCustHeader, iCount);
			this.oCommonHeaderFooterHelper.setBackButton(oController, oCustHeader, true);
			this.defineEditButton(oController, oCustHeader);
		},

		// function defining the master footer
		defineFooter : function(oController, oPage) {
			this.defineSettingsButton(oController);
			this.defineFooterRight(oController);
		},

		// define subheader of master list
		defineMasterSubHeader : function(oController, oPage) {
			if (oController._oControlStore.oMasterSearchField || oController._oControlStore.oMasterPullToRefresh) {
				return; // subheader has already been set
			}
			var oSubHeader = new Bar();
			oPage.setSubHeader(oSubHeader);
			var bIsTouch = Device.support.touch;
			this.createMasterSearchField(oController, oSubHeader, bIsTouch);
			if (bIsTouch && !oController._oControlStore.bAllDisabled) {
				this.createMasterPullToRefresh(oController, oPage);
			}
		},

		createMasterSearchField : function(oController, oSubHeader, bIsTouch) {
			oController._oControlStore.oMasterSearchField = new SearchField({
				id: this.oCommonHeaderFooterHelper.createId(oController, "myInbox_SEARCH")
			});
			oController._oControlStore.oMasterSearchField.setEnabled(!oController._oControlStore.bAllDisabled);
			if (!bIsTouch) {
				oController._oControlStore.oMasterSearchField.setShowRefreshButton(true);
				oController._oControlStore.oMasterSearchField.setRefreshButtonTooltip(
					oController.getOwnerComponent().getModel("i18n").getResourceBundle().getText("XBUT_REFRESH"));
			}
			oController._oControlStore.oMasterSearchField.setShowRefreshButton(!bIsTouch);
			oController._oControlStore.oMasterSearchField.setSelectOnFocus(false);
			//init search text
			oController._oControlStore.sMasterSearchText = null;
			// currently required for refresh and search
			oController._oControlStore.oMasterSearchField.attachSearch(jQuery.proxy(function(oEvent) {
				this.handleMasterSearch(oController, oEvent);
			}, this));
			var _oController = oController;
			oController._oControlStore.oMasterSearchField.attachLiveChange(jQuery.proxy(function() {
				_oController._applyClientSideSearch();
				_oController._oControlStore.sMasterSearchText = _oController._oControlStore.oMasterSearchField.getValue();
			}, this));

			var oBundle = oController.getOwnerComponent().getModel("i18n").getResourceBundle(),
				sPlaceholder = null;
			if (oController._oHeaderFooterOptions.sI18NSearchFieldPlaceholder) {
				sPlaceholder = oBundle.getText(oController._oHeaderFooterOptions.sI18NSearchFieldPlaceholder);
			}
			else {
				sPlaceholder = oBundle.getText("MASTER_PLACEHOLDER_SEARCHFIELD");
			}
			oController._oControlStore.oMasterSearchField.setPlaceholder(sPlaceholder);
			oSubHeader.addContentMiddle(oController._oControlStore.oMasterSearchField);
		},

		createMasterPullToRefresh : function(oController, oPage) {
			oController._oControlStore.oMasterPullToRefresh = new PullToRefresh();
			oController._oControlStore.oMasterPullToRefresh.attachRefresh(jQuery.proxy(function() {
				this.handleMasterPullToRefresh(oController);
			}, this));
			oPage.insertContent(oController._oControlStore.oMasterPullToRefresh, 0);
		},

		handleMasterSearch : function(oController, oEvent) {
			var bIsRefresh = oEvent.getParameter("refreshButtonPressed");
			if (!bIsRefresh) {
				//if not refreshing, store the text of the master search field in the control store
				//a refresh will only be done with the last entered search term stored in the control store
				oController._oControlStore.sMasterSearchText = oController._oControlStore.oMasterSearchField.getValue();
			}
			if (bIsRefresh) {
				this.refreshList(oController, bIsRefresh);
			}
			// todo: handle paging case
		},

		handleMasterPullToRefresh : function(oController) {
			this.refreshList(oController, true);
		},

		refreshList : function(oController, bIsRefresh) {
			//moved from S2.controller to avoid overriding
			var oDataManager = this.oApplicationImplementation.getComponent().getDataManager();
			oDataManager.fetchTaskDefinitionsandCustomAttributeDefinitions(jQuery.proxy(oDataManager.initTaskDefnandCustomAttrDefnnModel, oDataManager));
			//restore old search pattern if we are in refresh mode
			bIsRefresh = bIsRefresh && (oController._oControlStore.sMasterSearchText != null || oController._oMasterListBinding != null);
			oController._oControlStore.bIsSearching = !bIsRefresh;          // when we are in a search we will not do a renavigation later on

			var sTempSearchField = null;
			if (bIsRefresh) {
				//in this case not confirmed search text will be replaced by last entered
				sTempSearchField = oController._oControlStore.sMasterSearchText;
				if (sTempSearchField === null) {
					sTempSearchField = "";
				}
				oController._oControlStore.oMasterSearchField.setValue(sTempSearchField);
				this.oApplicationImplementation.bManualMasterRefresh = true;
			}
			else {
				sTempSearchField = oController._oControlStore.oMasterSearchField.getValue();
			}
			var oList = oController.getList();
			//collect selected list items
			this.oApplicationImplementation.aKeyValues = null;
			if (this.oApplicationImplementation.aMasterKeys) {
				var aItems = oList.getItems();
				for ( var i = 0; i < aItems.length; i++) {
					var oListItem = aItems[i];
					if (oListItem.getSelected()) {
						this.oApplicationImplementation.aKeyValues = [];
						var oItemBinding = oListItem.getBindingContext(oController.sModelName);
						for ( var j = 0; j < this.oApplicationImplementation.aMasterKeys.length; j++) {
							this.oApplicationImplementation.aKeyValues.push(oItemBinding
									.getProperty(this.oApplicationImplementation.aMasterKeys[j]));
						}
						i = aItems.length;
					}
				}
			}
			// give the application the possibility to step in. There are two possible scenarios for this:
			// 1. Application might want to prevent the refresh (e.g. because there are unsaved	changes)
			// 2. List is not bound to an oData model but to a json model -> must do refresh themselves
			if (oController._oHeaderFooterOptions.onRefresh) {
				var fRefreshCompleted = jQuery.proxy(function() {
					this.oApplicationImplementation.onMasterRefreshed(oController);
					if (oController._oControlStore.oMasterPullToRefresh) {
						oController._oControlStore.oMasterPullToRefresh.hide();
					}
				}, this);
				// possible outcomes:
				// >0: proceed as normal
				// =0: refresh has been aborted
				// <0: App will perform the refresh itself and call fRefreshCompleted when finished
				var iDecision = oController._oHeaderFooterOptions.onRefresh(sTempSearchField, fRefreshCompleted);
				if (iDecision == 0) {
					this.aKeyValues = null;                           // prevent that this is used for future change events
					oController._oControlStore.bIsSearching = false;
					if (oController._oControlStore.oMasterPullToRefresh) {
						oController._oControlStore.oMasterPullToRefresh.hide();
					}
				}

				if (iDecision <= 0) {
					if (iDecision < 0) {
						this.setMasterListVisible(oController);
					}

					return;
				}
			}
			var oBinding = oController._oMasterListBinding;
			var bBackendCalled = !oBinding;
			if (oBinding) {
				oBinding.attachChange(oController._onMasterListLoaded, oController);
				var fReceivedHandler = jQuery.proxy(function() {
					if (oController._oControlStore.oMasterPullToRefresh) {
						oController._oControlStore.oMasterPullToRefresh.hide();
					}
					oBinding.detachDataReceived(fReceivedHandler);
				}, this);

				//will be called synchronously
				var fRequestedHandler = jQuery.proxy(function() {
					bBackendCalled = true;
					oBinding.detachDataRequested(fRequestedHandler);
				}, this);

				oBinding.attachDataRequested(fRequestedHandler);
				oBinding.attachDataReceived(fReceivedHandler);
			}

			//if application does not bind because of invalid search pattern (e.g. too little characters)
			if ((bIsRefresh) && (!bBackendCalled && oController._oMasterListBinding)) {
				oController._oMasterListBinding.refresh();
			}

			this.setMasterListVisible(oController);
		},

		setMasterListVisible: function(oController) {
			//if live search and backend search are both active it can happen that the master list is still
			//set to invisible (after a unsuccessful live search) when a backend search/refresh is done
			//-> make sure to display the master list after a refresh/backend search
			if (oController._emptyList && !oController._emptyList.hasStyleClass("hiddenList")) {
				// oController._emptyList.setVisible(false);
				// oController.getList().setVisible(true);
				oController._emptyList.addStyleClass("hiddenList");
				oController.getList().removeStyleClass("hiddenList");
			}
		},

		defineMasterTitle : function(oController, oCustHeader, iCount) {
			var sTitleId;
			if (!oController._oHeaderFooterOptions.sI18NMasterTitle) {
				return;
			}
			if (!oController._oControlStore.oMasterTitle) {
				if (this.oCommonHeaderFooterHelper.isUsingStableIds()) {
					sTitleId = oController._oHeaderFooterOptions.sMasterTitleId;
					sTitleId = this.oCommonHeaderFooterHelper.createId(oController, sTitleId);
				}
				oController._oControlStore.oMasterTitle = new Title(sTitleId, {level: TitleLevel.H2});
				oController.getList().addAriaLabelledBy(oController._oControlStore.oMasterTitle);
				oCustHeader.addContentMiddle(oController._oControlStore.oMasterTitle);
			}
			this.setMasterTitle(oController, iCount);
		},

		setMasterTitle : function(oController, iCount) {
			if (!oController._oControlStore.oMasterTitle) {
				return;
			}
			var oBundle = oController.getOwnerComponent().getModel("i18n").getResourceBundle();
			var sTitle = oBundle.getText(oController._oHeaderFooterOptions.sI18NMasterTitle, [iCount]);
			oController._oControlStore.oMasterTitle.setText(sTitle);
		},

		// handle standard edit button
		defineEditButton : function(oController, oCustHeader) {
			var sId;
			if (oController._oHeaderFooterOptions.onEditPress || oController._oHeaderFooterOptions.oEditBtn) {
				if (!oController._oControlStore.oEditBtn) {
					sId = oController._oHeaderFooterOptions.oEditBtn
						&& this.oCommonHeaderFooterHelper.createId(oController,
							oController._oHeaderFooterOptions.oEditBtn.sId);
					if (!sId) {
						sId = this.oCommonHeaderFooterHelper.createId(oController, "myInbox_EDIT");
					}
					oController._oControlStore.oEditBtn = new Button({id: sId});
					oCustHeader.addContentRight(oController._oControlStore.oEditBtn);
					oController._oControlStore.oEditBtn.attachPress(jQuery.proxy(function() {
						if (oController._oControlStore.bEditState) {
							oController._oControlStore.oEditBtn.setIcon("sap-icon://multi-select");
							oController._oControlStore.oEditBtn.setTooltip(
								oController.getOwnerComponent().getModel("i18n").getResourceBundle().getText("XBUT_MULTI_SELECT"));
						}
						else {
							oController._oControlStore.oEditBtn.setIcon("sap-icon://sys-cancel");
							oController._oControlStore.oEditBtn.setTooltip(
								oController.getOwnerComponent().getModel("i18n").getResourceBundle().getText("XBUT_CANCEL"));
						}
						oController._oControlStore.bEditState = !oController._oControlStore.bEditState;
						(oController._oHeaderFooterOptions.onEditPress || oController._oHeaderFooterOptions.oEditBtn.onBtnPressed)(oController._oControlStore.bEditState);
					}, this));
				}
				if (oController._oControlStore.bEditState) {
					oController._oControlStore.oEditBtn.setIcon("sap-icon://sys-cancel");
					oController._oControlStore.oEditBtn.setTooltip(
							oController.getOwnerComponent().getModel("i18n").getResourceBundle().getText("XBUT_CANCEL"));
				}
				else {
					oController._oControlStore.oEditBtn.setIcon("sap-icon://multi-select");
					oController._oControlStore.oEditBtn.setTooltip(
							oController.getOwnerComponent().getModel("i18n").getResourceBundle().getText("XBUT_MULTI_SELECT"));
				}
				oController._oControlStore.oEditBtn.setVisible(true);
				oController._oControlStore.oEditBtn.setEnabled(!(!(oController._oHeaderFooterOptions.onEditPress || !oController._oHeaderFooterOptions.oEditBtn.bDisabled) || oController._oControlStore.bAllDisabled));
				if (oController._oHeaderFooterOptions.oEditBtn && oController._oHeaderFooterOptions.oEditBtn.sId) {
					oController._oControlStore.oButtonListHelper.mButtons[oController._oHeaderFooterOptions.oEditBtn.sId] = oController._oControlStore.oEditBtn;
				}
			}
			else if (oController._oControlStore.oEditBtn) {
				oController._oControlStore.oEditBtn.setVisible(false);
			}
		},

		defineSettingsButton : function(oController) {
			this.oCommonHeaderFooterHelper.createSettingsButton(oController);
		},

		defineFooterRight : function(oController) {
			var iFooterRightCount = this.getFooterRightCount(oController);
			// this.oCommonHeaderFooterHelper.getGenericButtons(iFooterRightCount, oController,
			// oController._oControlStore.oButtonListHelper);
			if (oController._oHeaderFooterOptions.buttonList) {
				for ( var i = 0; i < oController._oHeaderFooterOptions.buttonList.length; i++) {
					var oBtnMeta = {};
					jQuery.extend(oBtnMeta, oController._oHeaderFooterOptions.buttonList[i]);
					delete oBtnMeta.sIcon;
					if (this.oCommonHeaderFooterHelper.isUsingStableIds()) {
						this.oCommonHeaderFooterHelper.addIds(oBtnMeta,
							oController._oHeaderFooterOptions.buttonList[i].sId,
							oController,
							undefined
						);
					}
					oController._oControlStore.oButtonListHelper.ensureButton(oBtnMeta, "b", iFooterRightCount);
				}
			}
			this.oCommonHeaderFooterHelper.getGenericButtons(iFooterRightCount, oController,
			oController._oControlStore.oButtonListHelper);

			if (oController._oHeaderFooterOptions.onAddPress || oController._oHeaderFooterOptions.oAddOptions) {
				this.addAddButton(oController);
			}
		},

		getFooterRightCount : function(oController) {
			var iSmall = 1;
			var iMedium = 2;
			var iLimit = iSmall;

			var iGenCount = this.oCommonHeaderFooterHelper.getGenericCount(oController);
			var iActCount = this.oCommonHeaderFooterHelper.getActionsCount(oController, true);

			if (this.oApplicationImplementation.bIsPhone && Device.orientation.landscape) {
				if (iActCount === 1 && iGenCount < 4) {
					return iActCount + iGenCount;
				}

				iLimit = iMedium;
			}
			// avoid that the overflow contains only one generic item
			if (iActCount === 0) {
				return 3;
			}
			if (iActCount === iLimit && iGenCount === 1) {
				return iLimit + 1;
			}
			return iLimit;
		},

		addAddButton: function (oController) {
			var oBtnMeta = {};
			if (oController._oHeaderFooterOptions.onAddPress) {
				oBtnMeta.onBtnPressed = oController._oHeaderFooterOptions.onAddPress;
				oBtnMeta.sTooltip = oController.getOwnerComponent().getModel("i18n").getResourceBundle().getText("ADD");
			}
			else {
				jQuery.extend(oBtnMeta, oController._oHeaderFooterOptions.oAddOptions);
				delete oBtnMeta.sBtnText;
				delete oBtnMeta.sI18nBtnTxt;
			}
			if (this.oCommonHeaderFooterHelper.isUsingStableIds()) {
				this.oCommonHeaderFooterHelper.addIds(oBtnMeta,
					oController._oHeaderFooterOptions.oAddOptions
						? oController._oHeaderFooterOptions.oAddOptions.sId : undefined,
					oController, "myInbox_ADD");
			}
			oBtnMeta.sIcon = "sap-icon://add";
			oController._oControlStore.oButtonListHelper.ensureButton(oBtnMeta, "b");
		}
	});
	return cross.fnd.fiori.inbox.util.tools.MasterHeaderFooterHelper;
});
