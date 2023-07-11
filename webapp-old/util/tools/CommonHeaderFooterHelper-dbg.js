/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/base/Object",
	"sap/base/Log",
	"cross/fnd/fiori/inbox/util/tools/ButtonListHelper",
	"sap/m/library",
	"sap/m/ActionSheet",
	"sap/m/Button",
	"sap/m/Bar",
	"sap/m/Title",
	"sap/ui/core/library",
	"sap/ushell/ui/footerbar/JamShareButton",
	"sap/ushell/ui/footerbar/JamDiscussButton",
	"sap/ushell/ui/footerbar/AddBookmarkButton",
	"sap/ui/core/ID",
	"sap/ushell/services/AppConfiguration"
], function(
	UI5Object,
	BaseLog,
	ButtonListHelper,
	library,
	ActionSheet,
	Button,
	Bar,
	Title,
	UICoreLibrary,
	JamShareButton,
	JamDiscussButton,
	AddBookmarkButton,
	ID,
	AppConfiguration
) {
	"use strict";

	var ButtonType = library.ButtonType;
	var PlacementType = library.PlacementType;
	var TitleLevel = UICoreLibrary.TitleLevel;

	var CommonHeaderFooterHelper = UI5Object.extend("cross.fnd.fiori.inbox.util.tools.CommonHeaderFooterHelper", {

		DEBUG: BaseLog.isLoggable(BaseLog.Level.DEBUG),

		CLASSNAME: "cross.fnd.fiori.inbox.util.tools.CommonHeaderFooterHelper",

		constructor : function(oApplicationImplementation, detailHeaderFooterRules, bAutomaticOverflow) {
			this.oAppImp = oApplicationImplementation;
			this.detailHeaderFooterRules = detailHeaderFooterRules;
			this.bAutomaticOverflow = !!bAutomaticOverflow;
		},

		startBuild : function(oController, oOptions, oStartOptions, bKeepModifications) {
			var oControlStore = oController._oControlStore;

			oController._oHeaderFooterOptions = oOptions;
			var oPage = oController.getPage();
			if (oControlStore) {
				// store focus information; store information only once in one roundtrip
				if (!this.focusInfo) {
					this.focusInfo = oControlStore.oButtonListHelper.getFocusInfo(oControlStore.oShareSheet);
					if (this.DEBUG) {
						BaseLog.debug("Store focus information for " + oController.getMetadata().getName(),
							JSON.stringify(this.focusInfo), this.CLASSNAME);
					}
				}
				oController._oControlStore.oButtonListHelper.startBuild(bKeepModifications);
			}
			else {
				oController._oControlStore = {};
				if (oStartOptions) {
					jQuery.extend(oController._oControlStore, oStartOptions);
				}
				oController._oControlStore.oButtonListHelper =
					new ButtonListHelper(this.oAppImp, 20,
						oController._oControlStore.bAllDisabled,
						this.bAutomaticOverflow,
						this.createId(oController, "myInbox_OVERFLOW")
					);
				this.oAppImp.registerExitModule(function() {
					var sKey, o;
					if (oController._oControlStore) {
						oController._oControlStore.oButtonListHelper.destroy();
						delete oController._oControlStore.oButtonListHelper;
						for (sKey in oController._oControlStore) {
							o = oController._oControlStore[sKey];
							if (o && typeof o.destroy === "function") {
								o.destroy();
							}
							delete oController._oControlStore[sKey];
						}
						delete oController._oControlStore;
					}
				});
				// make sure to remove the old (probably empty) footer before creating a new one
				// otherwise duplicate id problems may occur of static viewIds are used
				var oFooter = oPage.getFooter();
				if (oFooter && oFooter.destroy) {
						oFooter.destroy();
				}
				oPage.setFooter(oController._oControlStore.oButtonListHelper.oBar);
			}
			return oPage;
		},

		endBuild : function(oController) {
			var oButtonListHelper = oController._oControlStore.oButtonListHelper;

			oButtonListHelper.endBuild();
			this._restoreFocus(oButtonListHelper, this);
		},

		defineFooterRight : function(oController, oPage, iFooterRightCount, bIncludeGenerics, bIncludePosNeg) {
			var bHasButton = false, bStableIds = this.isUsingStableIds(), oBtnMeta;
			if (this.bAutomaticOverflow) {
				// no buttons into overflow at the beginning
				iFooterRightCount = 10000;
			}
			// standard Buttons
			if (oController._oHeaderFooterOptions.oEditBtn) {
				oBtnMeta = {};
				jQuery.extend(oBtnMeta, oController._oHeaderFooterOptions.oEditBtn);
				if (bStableIds) {
					this.addIds(oBtnMeta, oController._oHeaderFooterOptions
						.oEditBtn.sId, oController, "myInbox_EDIT");
				}
				oBtnMeta.style = ButtonType.Emphasized;
				oController._oControlStore.oButtonListHelper.ensureButton(oBtnMeta, "b", iFooterRightCount);
				bHasButton = true;
			}
			else /* if (bIncludePosNeg) */{
				if (oController._oHeaderFooterOptions.oPositiveAction) {
					oBtnMeta = {};
					jQuery.extend(oBtnMeta, oController._oHeaderFooterOptions.oPositiveAction);
					if (bStableIds) {
						this.addIds(oBtnMeta, oController._oHeaderFooterOptions
							.oPositiveAction.sId, oController, "myInbox_POSITIVE");
					}
					oBtnMeta.style = ButtonType.Accept;
					oController._oControlStore.oButtonListHelper.ensureButton(oBtnMeta, "b", iFooterRightCount);
					bHasButton = true;
				}
				if (oController._oHeaderFooterOptions.oNegativeAction) {
					oBtnMeta = {};
					jQuery.extend(oBtnMeta, oController._oHeaderFooterOptions.oNegativeAction);
					if (bStableIds) {
						this.addIds(oBtnMeta, oController._oHeaderFooterOptions
							.oNegativeAction.sId, oController, "myInbox_NEGATIVE");
					}
					oBtnMeta.style = ButtonType.Reject;
					oController._oControlStore.oButtonListHelper.ensureButton(oBtnMeta, "b", iFooterRightCount);
					bHasButton = true;
				}
			}

			// App specific buttons
			if (oController._oHeaderFooterOptions.buttonList) {
				for (var i = 0; i < oController._oHeaderFooterOptions.buttonList.length; i++) {
					oBtnMeta = {};
					jQuery.extend(oBtnMeta, oController._oHeaderFooterOptions.buttonList[i]);
					if (bStableIds) {
						this.addIds(oBtnMeta, oController._oHeaderFooterOptions
							.buttonList[i].sId, oController, undefined);
					}
					oBtnMeta.style = ButtonType.Default;
					oController._oControlStore.oButtonListHelper.ensureButton(oBtnMeta, "b", iFooterRightCount);
					bHasButton = true;
				}
			}
			if (bIncludeGenerics) {
				var aGenButtons = this.getGenericButtons(iFooterRightCount, oController,
						oController._oControlStore.oButtonListHelper);
				bHasButton = bHasButton || aGenButtons.length > 0;
			}
			if (this.bAutomaticOverflow) {
				oController._oControlStore.oButtonListHelper.addOverflowButton();
			}
			bHasButton = this.defineShareButton(oController) || bHasButton;
			return bHasButton;
		},

		defineShareButton : function(oController) {
			var aButtons = this.getShareButtons(oController);
			if (aButtons.length === 0) {
				return false;
			}
			if (!oController._oControlStore.oShareSheet) {
				oController._oControlStore.oShareSheet = new ActionSheet();
				oController._oControlStore.oShareSheet.setShowCancelButton(true);
				oController._oControlStore.oShareSheet.setPlacement(PlacementType.Top);
			}
			else {
				oController._oControlStore.oShareSheet.removeAllButtons();
			}
			this.shareText = this.oAppImp.getResourceBundle().getText("share.tooltip");
			var oBtnMeta = {
				sIcon : "sap-icon://action",
				sTooltip: this.shareText,
				onBtnPressed : function(evt) {
					if (oController._oHeaderFooterOptions.oJamOptions) {
						if (oController._oHeaderFooterOptions.oJamOptions.fGetShareSettings) {
							var oShareSettings = oController._oHeaderFooterOptions.oJamOptions.fGetShareSettings();
							if (oShareSettings) {
								oController._oControlStore.oJamShareButton.setJamData(oShareSettings);
							}
						}
						if (oController._oHeaderFooterOptions.oJamOptions.fGetDiscussSettings) {
							var oDiscussSettings = oController._oHeaderFooterOptions.oJamOptions.fGetDiscussSettings();
							if (oDiscussSettings) {
								oController._oControlStore.oJamDiscussButton.setJamData(oDiscussSettings);
							}
						}
					}
					oController._oControlStore.oShareSheet.openBy(evt.getSource());
				}
			};
			if (this.isUsingStableIds()) {
				this.addIds(oBtnMeta, undefined, oController, "myInbox_SHARE");
			}
			oController._oControlStore.oButtonListHelper.ensureButton(oBtnMeta, "b");
			for (var i = 0; i < aButtons.length; i++) {
				oController._oControlStore.oShareSheet.addButton(aButtons[i]);
			}
			return true;
		},

		hasShareButtons : function(oController) {
			return oController.isMainScreen() || !!(oController._oHeaderFooterOptions.oEmailSettings
					|| (oController._oHeaderFooterOptions.oJamOptions && (oController._oHeaderFooterOptions.oJamOptions.oShareSettings
							|| oController._oHeaderFooterOptions.oJamOptions.fGetShareSettings || oController._oHeaderFooterOptions.oJamOptions.oDiscussSettings || oController._oHeaderFooterOptions.oJamOptions.fGetDiscussSettings))
					|| oController._oHeaderFooterOptions.oAddBookmarkSettings || (oController._oHeaderFooterOptions.additionalShareButtonList && oController._oHeaderFooterOptions.additionalShareButtonList.length > 0));
		},

		getShareButtons : function(oController) {
			var aRet = [];
			var oEmailButton = this.getEmailButton(oController);
			var oJamShareButton = this.getJamShareButton(oController);
			var oJamDiscussButton = this.getJamDiscussButton(oController);
			var oBookmarksButton = this.getBookmarkButton(oController);
			if (oEmailButton) {
				aRet.push(oEmailButton);
			}
			if (oJamShareButton) {
				aRet.push(oJamShareButton);
			}
			if (oJamDiscussButton) {
				aRet.push(oJamDiscussButton);
			}
			if (oBookmarksButton) {
				aRet.push(oBookmarksButton);
			}
			if (oController._oHeaderFooterOptions.additionalShareButtonList) {
				var aAddButtons = this.getAdditionalShareButtons(oController);
				aRet = aRet.concat(aAddButtons);
			}
			return aRet;
		},

		getEmailButton : function(oController) {
			var sBody;
			if (!oController._oHeaderFooterOptions.oEmailSettings) {
				return null;
			}
			if (!oController._oControlStore.oEmailButton) {
				oController._oControlStore.oEmailButton = new Button(
					{id: this.createId(oController, "myInbox_MAIL")});
				oController._oControlStore.oEmailButton.setIcon("sap-icon://email");
				oController._oControlStore.oEmailButton.setText(this.oAppImp.getResourceBundle().getText(
						"sendEmail.button"));
				oController._oControlStore.oEmailButton.attachPress(function() {
					if (oController._oHeaderFooterOptions.oEmailSettings.fGetMailBody) {
						sBody = oController._oHeaderFooterOptions.oEmailSettings.fGetMailBody();
					}
					else {
						sBody = null;
					}
					sap.m.URLHelper.triggerEmail(oController._oHeaderFooterOptions.oEmailSettings.sRecepient,
							oController._oHeaderFooterOptions.oEmailSettings.sSubject, sBody);
				});
			}
			this.supportEnablement(oController, oController._oControlStore.oEmailButton,
					oController._oHeaderFooterOptions.oEmailSettings);
			return oController._oControlStore.oEmailButton;
		},

		getJamShareButton : function(oController) {
			if (!oController._oHeaderFooterOptions.oJamOptions
					|| !(oController._oHeaderFooterOptions.oJamOptions.oShareSettings || oController._oHeaderFooterOptions.oJamOptions.fGetShareSettings)) {
				return null;
			}
			if (!oController._oControlStore.oJamShareButton) {
				oController._oControlStore.oJamShareButton =
					new JamShareButton(
						{id: this.createId(oController, "myInbox_JAMSHARE")});
			}
			if (oController._oHeaderFooterOptions.oJamOptions.oShareSettings) {
				oController._oControlStore.oJamShareButton
						.setJamData(oController._oHeaderFooterOptions.oJamOptions.oShareSettings);
				this.supportEnablement(oController, oController._oControlStore.oJamShareButton,
						oController._oHeaderFooterOptions.oJamOptions.oShareSettings);
			}
			return oController._oControlStore.oJamShareButton;
		},

		getJamDiscussButton : function(oController) {
			if (!oController._oHeaderFooterOptions.oJamOptions ||
					 !(oController._oHeaderFooterOptions.oJamOptions.oDiscussSettings ||  oController._oHeaderFooterOptions.oJamOptions.fGetDiscussSettings)) {
				return null;
			}
			if (!oController._oControlStore.oJamDiscussButton) {
				oController._oControlStore.oJamDiscussButton =
					new JamDiscussButton(
						{id: this.createId(oController, "myInbox_JAMDISCUSS")});
			}
			if (oController._oHeaderFooterOptions.oJamOptions.oDiscussSettings) {
			  oController._oControlStore.oJamDiscussButton.setJamData(oController._oHeaderFooterOptions.oJamOptions.oDiscussSettings);
			  this.supportEnablement(oController, oController._oControlStore.oJamDiscussButton,
					oController._oHeaderFooterOptions.oJamOptions.oDiscussSettings);
			}
			return oController._oControlStore.oJamDiscussButton;
		},

		getBookmarkButton : function(oController) {
			if (oController._oHeaderFooterOptions.bSuppressBookmarkButton || (!oController._oHeaderFooterOptions.oAddBookmarkSettings && !oController.isMainScreen())) {
				return null;
			}

			if (!oController._oControlStore.oBookmarkButton) {
				oController._oControlStore.oBookmarkButton =
					new AddBookmarkButton({id: this.createId(oController, "myInbox_ADDBOOKMARK")});
			}

			var oAppData = {
				url : document.URL,
				title : oController._oControlStore.oTitle.getText()
			};
			jQuery.extend(oAppData, oController._oHeaderFooterOptions.oAddBookmarkSettings || {});
			oController._oControlStore.oBookmarkButton.setAppData(oAppData);
			this.supportEnablement(oController, oController._oControlStore.oBookmarkButton,
					oController._oHeaderFooterOptions.oAddBookmarkSettings || {});
			return oController._oControlStore.oBookmarkButton;
		},

		supportEnablement : function(oController, oButton, oSettings) {
			oButton.setEnabled(!oSettings.bDisabled);
			if (oSettings.sId) {
				oController._oControlStore.oButtonListHelper.mButtons[oSettings.sId] = oButton;
			}
		},

		getAdditionalShareButtons : function(oController) {
			var aRet = [];
			if (!oController._oControlStore.shareButtons) {
				oController._oControlStore.shareButtons = new ButtonListHelper(this.oAppImp, 1);
				oController._oControlStore.oButtonListHelper.addButtonListHelper(oController._oControlStore.shareButtons);
			}
			for ( var i = 0; i < oController._oHeaderFooterOptions.additionalShareButtonList.length; i++) {
				var oBtnMeta = {};
				jQuery.extend(oBtnMeta, oController._oHeaderFooterOptions.additionalShareButtonList[i]);
				//additional share buttons shall show the configured icon
				//delete oBtnMeta.sIcon;
				if (this.isUsingStableIds()) {
					this.addIds(oBtnMeta, oController._oHeaderFooterOptions
						.additionalShareButtonList[i].sId, oController, undefined);
				}
				var oBtn = oController._oControlStore.shareButtons.ensureButton(oBtnMeta, "b");
				aRet.push(oBtn);
			}
			return aRet;
		},

		getFooterRightCount : function(oController, sTSize) {
			var iLimit;
//					var iCount = this.getActionsCount(oController);

			switch (sTSize) {
			case "XL" :
				iLimit = this.detailHeaderFooterRules.maxBtnCountXL;
			  break;
			case "L":
				iLimit = this.detailHeaderFooterRules.maxBtnCountL;
			  break;
			case "M":
				iLimit = this.detailHeaderFooterRules.maxBtnCountM;
			  break;
			case "S":
				iLimit = this.detailHeaderFooterRules.maxBtnCountS;
			  break;
			default:
				iLimit = this.detailHeaderFooterRules.maxBtnCountXL;
			}

//						if (iCount <= iLimit + 1) {
//							//SIL: has to be refined: this rule shall be valid only for
//							//generic buttons (sort,group,filter)
//							return iCount;
//						}
			return iLimit;
		},

		getActionsCount : function(oController, bSkipEditButton) {
			var iCount = 0;
			if (oController._oHeaderFooterOptions.buttonList) {
				iCount = oController._oHeaderFooterOptions.buttonList.length;
			}
			if (oController._oHeaderFooterOptions.oEditBtn) {
				if (!bSkipEditButton) {
					// in master view the edit button belongs to the header and must
					// not be count!
					iCount++;
				}
			}
			else {
				if (oController._oHeaderFooterOptions.oPositiveAction) {
					iCount++;
				}
				if (oController._oHeaderFooterOptions.oNegativeAction) {
					iCount++;
				}
			}
			return iCount;
		},

		createSettingsButton : function(oController) {
			var bRet;
			if (oController._oControlStore.oSettingsButton) {
				bRet = false;
			}
			else {
				bRet = true;
			}
			if (oController._oHeaderFooterOptions.aAdditionalSettingButtons) {
				if (!oController._oControlStore.oSettingsButtonListHelper) {
					oController._oControlStore.oSettingsButtonListHelper = new ButtonListHelper(
							this.oAppImp, 0);
					oController._oControlStore.oButtonListHelper
							.addButtonListHelper(oController._oControlStore.oSettingsButtonListHelper);
				}
				var aButtons = [];
				for ( var i = 0; i < oController._oHeaderFooterOptions.aAdditionalSettingButtons.length; i++) {
					var oBtnMeta = {};
					jQuery.extend(oBtnMeta, oController._oHeaderFooterOptions.aAdditionalSettingButtons[i]);
					delete oBtnMeta.sIcon;
					var oButton = oController._oControlStore.oSettingsButtonListHelper.ensureButton(oBtnMeta, "b");
					oButton.setWidth("100%");
					aButtons.push(oButton);
				}
				AppConfiguration.addApplicationSettingsButtons(aButtons);
			}
			return bRet;
		},

		getGenericButtons : function(iFooterRightCount, oController, oButtonListHelper) {
			var aRet = [];
			if (oController._oHeaderFooterOptions.oSortOptions) {
				aRet.push(this.addSortButton(iFooterRightCount, oController, oButtonListHelper));
			}
			if (oController._oHeaderFooterOptions.oFilterOptions) {
				aRet.push(this.addFilterButton(iFooterRightCount, oController, oButtonListHelper));
			}
			if (oController._oHeaderFooterOptions.oGroupOptions) {
				aRet.push(this.addGroupButton(iFooterRightCount, oController, oButtonListHelper));
			}
			return aRet;
		},

		addFilterButton : function(iFooterRightCount, oController, oButtonListHelper) {
			var sButtonText = this.oAppImp.getResourceBundle().getText("XBUT_FILTER"),
				oBtnMeta = {
					bDisabled : oController._oHeaderFooterOptions.oFilterOptions.bDisabled,
					sIcon : "sap-icon://filter",
					sBtnTxt : sButtonText,
					sTooltip :
						oController._oHeaderFooterOptions.oFilterOptions.sTooltip
							|| sButtonText
				}, sType;
			this.addIds(oBtnMeta,
				oController._oHeaderFooterOptions.oFilterOptions.sId, oController,
				"myInbox_FILTER");


			if (oController._oHeaderFooterOptions.oFilterOptions.aFilterItems) {
				oBtnMeta.onChange = jQuery.proxy(function(oKey) {
					oButtonListHelper._updateCurrentSelection("filter", oKey);
					oController._oHeaderFooterOptions.oFilterOptions.onFilterSelected(oKey);
				}, this);
				oBtnMeta.aItems = oController._oHeaderFooterOptions.oFilterOptions.aFilterItems;
				oBtnMeta.sSelectedItemKey = oButtonListHelper._getCurrentSelection("filter",
					oController._oHeaderFooterOptions.oFilterOptions.sSelectedItemKey);
				sType = "s";
			}
			else {
				oBtnMeta.onBtnPressed = jQuery.proxy(function(oEvent) {
					oController._oHeaderFooterOptions.oFilterOptions.onFilterPressed(oEvent);
				}, this);
				sType = "b";
			}
			return oButtonListHelper.ensureButton(oBtnMeta, sType, iFooterRightCount);
		},

		addSortButton : function(iFooterRightCount, oController, oButtonListHelper) {
			var sButtonText = this.oAppImp.getResourceBundle().getText("sort.title"),
				oBtnMeta = {
					bDisabled : oController._oHeaderFooterOptions.oSortOptions.bDisabled,
					sIcon : "sap-icon://sort",
					sBtnTxt : sButtonText,
					sTooltip : oController._oHeaderFooterOptions.oSortOptions.sTooltip
						|| sButtonText
				}, sType;
			this.addIds(oBtnMeta, oController._oHeaderFooterOptions.oSortOptions.sId,
				oController, "myInbox_SORT");

			if (oController._oHeaderFooterOptions.oSortOptions.aSortItems) {
				oBtnMeta.onChange = jQuery.proxy(function(oKey) {
					oButtonListHelper._updateCurrentSelection("sort", oKey);
					oController._oHeaderFooterOptions.oSortOptions.onSortSelected(oKey);
				}, this);
				oBtnMeta.aItems = oController._oHeaderFooterOptions.oSortOptions.aSortItems;
				oBtnMeta.sSelectedItemKey = oButtonListHelper._getCurrentSelection("sort",
					oController._oHeaderFooterOptions.oSortOptions.sSelectedItemKey);
				sType = "s";
			}
			else {
				oBtnMeta.onBtnPressed = jQuery.proxy(function(oEvent) {
					oController._oHeaderFooterOptions.oSortOptions.onSortPressed(oEvent);
				}, this);
				sType = "b";
			}
			return oButtonListHelper.ensureButton(oBtnMeta, sType, iFooterRightCount);
		},

		addGroupButton : function(iFooterRightCount, oController, oButtonListHelper) {
			var sButtonText = this.oAppImp.getResourceBundle().getText("group.dialog.title"),
				oBtnMeta = {
					bDisabled : oController._oHeaderFooterOptions.oGroupOptions.bDisabled,
					sIcon : "sap-icon://group-2",
					sBtnTxt : sButtonText,
					sTooltip : oController._oHeaderFooterOptions.oGroupOptions.sTooltip
						|| sButtonText
				}, sType;
			this.addIds(oBtnMeta, oController._oHeaderFooterOptions.oGroupOptions.sId,
				oController, "myInbox_GROUP");

			if (oController._oHeaderFooterOptions.oGroupOptions.aGroupItems) {
				oBtnMeta.onChange = jQuery.proxy(function(oKey) {
					oButtonListHelper._updateCurrentSelection("group", oKey);
					oController._oHeaderFooterOptions.oGroupOptions.onGroupSelected(oKey);
				}, this);
				oBtnMeta.aItems = oController._oHeaderFooterOptions.oGroupOptions.aGroupItems;
				oBtnMeta.sSelectedItemKey = oButtonListHelper._getCurrentSelection("group",
					oController._oHeaderFooterOptions.oGroupOptions.sSelectedItemKey);
				sType = "s";
			}
			else {
				oBtnMeta.onBtnPressed = jQuery.proxy(function(oEvent) {
					oController._oHeaderFooterOptions.oGroupOptions.onGroupPressed(oEvent);
				}, this);
				sType = "b";
			}
			return oButtonListHelper.ensureButton(oBtnMeta, sType, iFooterRightCount);
		},

		ensureHeader : function(oController, oPage, bGenericBackButton, bSuppressBackButton, sTitleId) {
			if (!oController._oControlStore.oHeaderBar) {
				oController._oControlStore.oHeaderBar = new Bar();
				sTitleId = this.isUsingStableIds() && sTitleId
					? this.createId(oController, sTitleId)
					: undefined;
				oController._oControlStore.oTitle = new Title(sTitleId, {level: TitleLevel.H2});
				oController._oControlStore.oHeaderBar.addContentMiddle(oController._oControlStore.oTitle);
				var oCustHeader = oPage.getCustomHeader();
				if (oCustHeader && oCustHeader.destroy) {
					oCustHeader.destroy();
				}
				oPage.setCustomHeader(oController._oControlStore.oHeaderBar);
			}
			this.setBackButton(oController, oController._oControlStore.oHeaderBar, bGenericBackButton, bSuppressBackButton);
		},

		setAppHeaderBtn : function(oController, oBtnSettings) {
			if (!oController._oControlStore.oHeaderBar) {
				return;
			}
			if (!oController._oControlStore.oHeaderBtn) {
				if (oBtnSettings.sId) {
					oController._oControlStore.oHeaderBtn = new Button(oBtnSettings.sId);
				}
				else {
					oController._oControlStore.oHeaderBtn = new Button();
				}
				oController._oControlStore.oHeaderBar.addContentRight(oController._oControlStore.oHeaderBtn);
			}
			var _oHeaderBtn = oController._oControlStore.oHeaderBtn;
			if (oBtnSettings.sIcon) {
				_oHeaderBtn.setIcon(oBtnSettings.sIcon);
			}
			if (oBtnSettings.onBtnPressed) {
				_oHeaderBtn.attachPress(oBtnSettings.onBtnPressed);
			}
			if (oBtnSettings.sText) {
				_oHeaderBtn.setText(oBtnSettings.sText);
			}
			else if (oBtnSettings.oTextBinding) {
				if (oBtnSettings.oTextBinding.elementPath) {
					if (oBtnSettings.oTextBinding.parameters) {
						_oHeaderBtn.bindElement(oBtnSettings.oTextBinding.elementPath, oBtnSettings.oTextBinding.parameters);
					}
					else {
						_oHeaderBtn.bindElement(oBtnSettings.oTextBinding.elementPath);
					}
				}
				if  (oBtnSettings.oTextBinding.property) {
					_oHeaderBtn.bindProperty("text", oBtnSettings.oTextBinding.property);
				}
			}
			else if (this.oAppImp.bIsPhone && oBtnSettings.i18nPhoneTxt) {
				_oHeaderBtn.setText(this.oAppImp.getResourceBundle().getText(oBtnSettings.i18nPhoneTxt));
			}
			else if (oBtnSettings.i18nTxt) {
				_oHeaderBtn.setText(this.oAppImp.getResourceBundle().getText(oBtnSettings.i18nTxt));
			}
		},
		setBackButton : function(oController, oBar, bGenericBackButton, bSuppressBackButton) {
			if (bSuppressBackButton || (bGenericBackButton && oController._oHeaderFooterOptions.onBack === null)) {
				oController._oControlStore.fBack = null;
			}
			else if (bGenericBackButton && oController._oHeaderFooterOptions.onBack == undefined) {
				if (window.history.length === 0) {
					oController._oControlStore.fBack = null;
				}
				else {
					oController._oControlStore.fBack = function() {
						window.history.back(1);
					};
				}
			}
			else {
				oController._oControlStore.fBack = oController._oHeaderFooterOptions.onBack;
			}
			if (oController._oControlStore.oBackButton) {
				oController._oControlStore.oBackButton.setVisible(!!oController._oControlStore.fBack);
			}
			else if (oController._oControlStore.fBack) {
				oController._oControlStore.oBackButton = new Button({
					id: this.createId(oController, "myInbox_BACK")
				});
				oController._oControlStore.oBackButton.setIcon("sap-icon://nav-back");
				oController._oControlStore.oBackButton.setTooltip(this.oAppImp.getResourceBundle().getText("XBUT_BACK"));
				oController._oControlStore.oBackButton.attachPress(function(oEvent) {
					oController._oControlStore.fBack(oEvent);
				});
				oBar.addContentLeft(oController._oControlStore.oBackButton);
			}
		},

		getGenericCount : function(oController) {
			var iRet = 0;
			if (oController._oHeaderFooterOptions.oSortOptions) {
				iRet++;
			}
			if (oController._oHeaderFooterOptions.oFilterOptions) {
				iRet++;
			}
			if (oController._oHeaderFooterOptions.oGroupOptions) {
				iRet++;
			}
			return iRet;
		},

		/**
		 * Enhances given button metadata object by internal and external IDs based on activation of stable
		 * IDs feature.
		 *
		 * @param {object} oButtonMetaData
		 *    The button metadata that need to be enhanced.
		 * @param {string} sAppSpecificId
		 *    The application specified ID of the control.
		 * @param {object} oController
		 *    The current controller object (is needed to generate the ID)
		 * @param {string} sDefaultStableId
		 *    Default ID if application specific ID is no valid ID or if it is not given at all.
		 * @protected
		 */
		addIds: function (oButtonMetaData, sAppSpecificId, oController,
				sDefaultStableId) {
			var sButtonid = ID.isValid(sAppSpecificId)
				? sAppSpecificId : sDefaultStableId;
			delete oButtonMetaData.sControlId;
			delete oButtonMetaData.sId;

			if (this.isUsingStableIds()) {
				oButtonMetaData.sControlId = this.createId(oController, sButtonid);
				oButtonMetaData.sId = sAppSpecificId || sDefaultStableId;
			}
			else {
				oButtonMetaData.sId = sAppSpecificId;
			}
		},

		/**
		 * Create view relative ID for the given ID if stable IDs are used.
		 * If ID is invalid undefined is returned.
		 * @param {object} oController
		 *    The controller needed to generate the ID.
		 * @param {string} sId
		 *    The ID of the control.
		 * @returns {string}
		 *    The view relative ID or undefined.
		 * @protected
		 */
		createId: function (oController, sId) {
			if (this.isUsingStableIds() && sId && ID.isValid(sId)) {
				return oController.getView().createId(sId);
			}
			return undefined;
		},

		/**
		 * Returns true if application is configured to use stable IDs.
		 * @returns {boolean}
		 *    <code>true</code> if application is using stable IDs.
		 * @protected
		 */
		isUsingStableIds: function () {
			return this.oAppImp.oConfiguration &&
				this.oAppImp.oConfiguration.isUsingStableIds &&
				this.oAppImp.oConfiguration.isUsingStableIds();
		},

		_restoreFocus: function(oButtonListHelper, oThat) {
			var oElementToFocus,
				oFocus = oThat.focusInfo,
				oOverflow = oButtonListHelper.oOverflowButton;

			if (oFocus) {
				if (oFocus.area === "share") {
					// focused element was in share action sheet -> move focus to the share button
					oFocus.area = "right";
					oFocus.pos = 1000;
					oFocus.controlInfo = {
						icon : "sap-icon://action",
						text : "",
						tooltip : oThat.shareText
					};
				}
				oElementToFocus = oButtonListHelper.findFocusedElement(oFocus, oOverflow);
				if (oElementToFocus) {
					setTimeout(function () {
						if (!jQuery(oElementToFocus.$()[0]).is(":visible")) {
							oElementToFocus = oOverflow;
						}
						if (oElementToFocus) {
							oElementToFocus.focus();
							if (this.DEBUG) {
								BaseLog.debug("Restored focus on " + oElementToFocus.getId(),
									this.CLASSNAME);
							}
						}
						oThat.focusInfo = undefined;
					}.bind(this), 100 /* to be sure to set focus after dynamic overflow is complete */);
				}
				else {
					oThat.focusInfo = undefined;
				}
			}
		}

	});

	CommonHeaderFooterHelper.getPageFromController = function(oController) {
		return oController.getView().getContent()[0];
	};

	return CommonHeaderFooterHelper;
});
