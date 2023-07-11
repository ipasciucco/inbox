/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/m/Button",
	"sap/ui/base/Object",
	"cross/fnd/fiori/inbox/util/tools/CommonHeaderFooterHelper"
], function(Button, UI5Object, CommonHeaderFooterHelper) {
	"use strict";

	return UI5Object.extend("cross.fnd.fiori.inbox.util.tools.DetailHeaderFooterHelper", {
		constructor : function (oApplicationImplementation) {
			this.oAppImp = oApplicationImplementation;
			this.oCommonHeaderFooterHelper = new CommonHeaderFooterHelper(oApplicationImplementation, undefined, true);
		},

		defineDetailHeaderFooter : function (oController) {
			var oOptions = oController.getHeaderFooterOptions();
			this.setHeaderFooter(oController, oOptions);
		},

		setHeaderFooter : function (oController, oOptions, bKeepModifications) {
			if (!oOptions) {
				return;
			}
			var oPage = this.oCommonHeaderFooterHelper.startBuild(oController, oOptions, null, bKeepModifications);
			// important to run header before footer, as the addBookmark button relies on the title
			this.defineHeader(oController, oPage);
			this.defineFooter(oController, oPage);

			this.oAppImp.oCurController.DetailCtrl = oController;
			this.oAppImp.oCurController.FullCtrl = null;

			this.oCommonHeaderFooterHelper.endBuild(oController);
		},

		defineFooter : function (oController, oPage) {
			var bHasButton = this.oCommonHeaderFooterHelper.defineFooterRight(
				oController, oPage, 1000, false, true, /*automaticOverflow*/true
			);

			// note that isMainScreen() may return "X"
			oPage.setShowFooter(bHasButton || !!oController.isMainScreen());
		},

		defineHeader : function (oController, oPage) {
			var bSuppressBackButton = !this.oAppImp.bIsPhone && (oController.isMainScreen() == true),
				sTitleId = oController._oHeaderFooterOptions.sDetailTitleId;
			this.oCommonHeaderFooterHelper.ensureHeader(oController, oPage, this.oAppImp.bIsPhone, bSuppressBackButton, sTitleId);
			if (oController._oHeaderFooterOptions.oHeaderBtnSettings) {
				this.oCommonHeaderFooterHelper.setAppHeaderBtn(oController, oController._oHeaderFooterOptions.oHeaderBtnSettings);
			}

			var sTitle = null;
			if (oController._oHeaderFooterOptions.oUpDownOptions) {
				this.setUpDownButtons(oController, oController._oHeaderFooterOptions.oUpDownOptions.iPosition, oController._oHeaderFooterOptions.oUpDownOptions.iCount);
				var aPars = this.getPositionPars(oController);
				var oBundle = null,
					sKey = null;
				if (this.oAppImp.bIsPhone) {
					if (oController._oHeaderFooterOptions.oUpDownOptions.sI18NPhoneTitle) {
						oBundle = this.oAppImp.getResourceBundle();
						sKey = oController._oHeaderFooterOptions.oUpDownOptions.sI18NPhoneTitle;
					}
					else {
						oBundle = this.oAppImp.getUiLibResourceBundle();
						sKey = "ITEM_TITLE_PHONE";
					}
				}
				else if (oController._oHeaderFooterOptions.oUpDownOptions.sI18NDetailTitle) {
					oBundle = this.oAppImp.getResourceBundle();
					sKey = oController._oHeaderFooterOptions.oUpDownOptions.sI18NDetailTitle;
				}
				else {
					oBundle = this.oAppImp.getUiLibResourceBundle();
					sKey = "ITEM_TITLE";
				}

				sTitle = oBundle.getText(sKey, aPars);
			}
			else {
				this.setUpDownButtons(oController, 0, 0);
				var oBundle = null;
				if (oController._oHeaderFooterOptions.sI18NDetailTitle) {
					oBundle = this.oAppImp.getResourceBundle();
					sTitle = oBundle.getText(oController._oHeaderFooterOptions.sI18NDetailTitle);
				}
				else if (oController._oHeaderFooterOptions.sDetailTitle) {
					sTitle = oController._oHeaderFooterOptions.sDetailTitle;
				}
				else {
					oBundle = this.oAppImp.getResourceBundle();
					sTitle = oBundle.getText("DETAIL_TITLE");
				}
			}
			oController._oControlStore.oTitle.setText(sTitle);
		},

		setUpDownButtons : function (oController, iPos, iCount) {
			if (iCount <= 1) {
				if (oController._oControlStore.oUpButton) {
					oController._oControlStore.oUpButton.setVisible(false);
					oController._oControlStore.oDownButton.setVisible(false);
				}
			}
			else {
				if (!oController._oControlStore.oUpButton) {
					var fMoveUpDown = function (delta) {
						oController._oHeaderFooterOptions.oUpDownOptions.fSetPosition(oController._oHeaderFooterOptions.oUpDownOptions.iPosition + delta);
					};
					oController._oControlStore.oUpButton = new Button();
					oController._oControlStore.oUpButton.setIcon("sap-icon://down");
					oController._oControlStore.oUpButton.attachPress(function () {
						fMoveUpDown(1);
					});
					oController._oControlStore.oHeaderBar.addContentRight(oController._oControlStore.oUpButton);
					oController._oControlStore.oDownButton = new Button();
					oController._oControlStore.oDownButton.setIcon("sap-icon://up");
					oController._oControlStore.oDownButton.attachPress(function () {
						fMoveUpDown(-1);
					});
					oController._oControlStore.oHeaderBar.addContentRight(oController._oControlStore.oDownButton);
				}
				oController._oControlStore.oUpButton.setVisible(true);
				oController._oControlStore.oDownButton.setVisible(true);
				oController._oControlStore.oUpButton.setEnabled(iPos < iCount - 1);
				oController._oControlStore.oDownButton.setEnabled(iPos > 0);
			}
		},

		getPositionPars : function (oController) {
			if (oController._oHeaderFooterOptions) {
				var aRet = [oController._oHeaderFooterOptions.oUpDownOptions.iPosition + 1, oController._oHeaderFooterOptions.oUpDownOptions.iCount];
				if (oController._oHeaderFooterOptions.oUpDownOptions.oParent) {
					aRet = aRet.concat(this.getPositionPars(oController._oHeaderFooterOptions.oUpDownOptions.oParent));
				}
				return aRet;
			}
			return [];
		}
	});
});
