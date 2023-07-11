/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/base/Object",
	"cross/fnd/fiori/inbox/util/tools/CommonHeaderFooterHelper",
	"cross/fnd/fiori/inbox/util/tools/ButtonListHelper",
	"sap/ushell/ui/footerbar/JamShareButton",
	"sap/ushell/ui/footerbar/JamDiscussButton",
	"sap/ushell/ui/footerbar/AddBookmarkButton",
	"sap/m/Button",
	"sap/ui/Device"
], function (
	UI5Object,
	CommonHeaderFooterHelper,
	ButtonListHelper,
	JamShareButton,
	JamDiscussButton,
	AddBookmarkButton,
	Button,
	Device
) {
	"use strict";

	return UI5Object.extend("cross.fnd.fiori.inbox.util.tools.FullScreenHeaderFooterHelper", {
		constructor : function (oApplicationImplementation) {
			this.oAppImp = oApplicationImplementation;
			this.oCommonHeaderFooterHelper = new CommonHeaderFooterHelper(
					oApplicationImplementation, undefined, true);
		},

		defineHeaderFooter : function (oController) {
			var oOptions = oController.getHeaderFooterOptions();
			this.setHeaderFooter(oController, oOptions);
		},

		setHeaderFooter : function (oController, oOptions, bKeepModifications) {
			if (!oOptions) {
				return;
			}
			var oPage = this.oCommonHeaderFooterHelper.startBuild(oController, oOptions, { iSettingsPosition : 0 }, bKeepModifications);
			this.oCommonHeaderFooterHelper.createSettingsButton(oController);
			var bHasFooterButtons = this.needsFooter(oController);
			// important to run header before footer, as the addBookmark button relies on the title
			this.defineHeader(oController, oPage, bHasFooterButtons);
			this.defineFooter(oController, oPage, bHasFooterButtons);
			this.oAppImp.oCurController.FullCtrl = oController;
			this.oAppImp.oCurController.MasterCtrl = null;
			this.oAppImp.oCurController.DetailCtrl = null;
			this.oCommonHeaderFooterHelper.endBuild(oController);
		},

		defineFooter : function (oController, oPage, bHasFooterButtons) {
			if (bHasFooterButtons) {
				//var iFooterRightCount = this.getFooterRightCount(oController);
				this.oCommonHeaderFooterHelper.defineFooterRight(oController, oPage, 1000,
						this.oAppImp.bIsPhone, false, /*automaticOverflow*/true);
				if (!this.oAppImp.bIsPhone) {
					if (!oController._oControlStore.oLeftButtonList) {
						oController._oControlStore.oLeftButtonList = new ButtonListHelper(this.oAppImp, 25);
						oController._oControlStore.oLeftButtonList.oBar = oController._oControlStore.oButtonListHelper.oBar;
						oController._oControlStore.oButtonListHelper
								.addButtonListHelper(oController._oControlStore.oLeftButtonList);
					}
					this.oCommonHeaderFooterHelper.getGenericButtons(3, oController,
							oController._oControlStore.oLeftButtonList);
				}
			}
		},

		defineHeader : function (oController, oPage, bHasFooterButtons) {
			var sTitleId = oController._oHeaderFooterOptions.sFullscreenTitleId;
			this.oCommonHeaderFooterHelper.ensureHeader(oController, oPage, true, undefined, sTitleId);
			if (oController._oHeaderFooterOptions.oHeaderBtnSettings) {
				this.oCommonHeaderFooterHelper.setAppHeaderBtn(oController, oController._oHeaderFooterOptions.oHeaderBtnSettings);
			}

			var oBundle = null,
				sTitle = null;
			if (oController._oHeaderFooterOptions.sI18NFullscreenTitle) {
				oBundle = this.oAppImp.getResourceBundle();
				sTitle = oBundle.getText(oController._oHeaderFooterOptions.sI18NFullscreenTitle);
			}
			else if (oController._oHeaderFooterOptions.sFullscreenTitle) {
				sTitle = oController._oHeaderFooterOptions.sFullscreenTitle;
			}
			else {
				oBundle = this.oAppImp.getResourceBundle();
				sTitle = oBundle.getText("FULLSCREEN_TITLE");
			}

			oController._oControlStore.oTitle.setText(sTitle);
			if (oController._oControlStore.oFacetFilterButton) {
				oController._oControlStore.oFacetFilterButton.setVisible(!!oController._oHeaderFooterOptions.onFacetFilter);
			}
			else if (oController._oHeaderFooterOptions.onFacetFilter) {
				oController._oControlStore.oFacetFilterButton = new Button();
				oController._oControlStore.oFacetFilterButton.setIcon("sap-icon://filter");
				oController._oControlStore.oFacetFilterButton.attachPress(function (oEvent) {
					oController._oHeaderFooterOptions.onFacetFilter(oEvent);
				});
				oController._oControlStore.oHeaderBar.addContentRight(oController._oControlStore.oFacetFilterButton);
			}
		},

		needsFooter : function (oController) {
			return oController._oHeaderFooterOptions.onFacetFilter ||
			  this.oCommonHeaderFooterHelper.getGenericCount(oController) > 0 ||
			  this.oCommonHeaderFooterHelper.getActionsCount(oController) > 0 ||
			  this.oCommonHeaderFooterHelper.hasShareButtons(oController);
		},

		getFooterRightCount : function (oController) {

			var iLimit = this.oCommonHeaderFooterHelper.getFooterRightCount(oController, "S");

			var iGenCount = this.oCommonHeaderFooterHelper.getGenericCount(oController);
			var iActCount = this.oCommonHeaderFooterHelper.getActionsCount(oController);

			if (this.oAppImp.bIsPhone && Device.orientation.landscape) {
					if (iActCount === 1 && iGenCount < 4) {
						return iActCount + iGenCount;
					}
					if (iActCount === 0) {
						return iGenCount;
					}
					iLimit = this.oCommonHeaderFooterHelper.getFooterRightCount(oController, "M");
			}
			else if (this.oAppImp.bIsPhone && !Device.orientation.landscape) {
				if (iActCount === 0) {
					return iGenCount;
				}
				iLimit = this.oCommonHeaderFooterHelper.getFooterRightCount(oController, "S");
			}
			else if (this.oAppImp.bIsIPad && !Device.orientation.landscape) {
				iLimit = this.oCommonHeaderFooterHelper.getFooterRightCount(oController, "M");
			}
			else {
				iLimit = this.oCommonHeaderFooterHelper.getFooterRightCount(oController, "XL");
			}
			// avoid that the overflow contains only one generic item
			if (iActCount === iLimit && iGenCount === 1) {
				return iLimit + 1;
			}
			return iLimit;
		}
	});
});
