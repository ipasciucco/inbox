/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/base/Object","sap/base/Log","cross/fnd/fiori/inbox/util/tools/ButtonListHelper","sap/m/library","sap/m/ActionSheet","sap/m/Button","sap/m/Bar","sap/m/Title","sap/ui/core/library","sap/ushell/ui/footerbar/JamShareButton","sap/ushell/ui/footerbar/JamDiscussButton","sap/ushell/ui/footerbar/AddBookmarkButton","sap/ui/core/ID","sap/ushell/services/AppConfiguration"],function(U,B,a,l,A,b,c,T,d,J,e,f,I,g){"use strict";var h=l.ButtonType;var P=l.PlacementType;var j=d.TitleLevel;var C=U.extend("cross.fnd.fiori.inbox.util.tools.CommonHeaderFooterHelper",{DEBUG:B.isLoggable(B.Level.DEBUG),CLASSNAME:"cross.fnd.fiori.inbox.util.tools.CommonHeaderFooterHelper",constructor:function(o,i,k){this.oAppImp=o;this.detailHeaderFooterRules=i;this.bAutomaticOverflow=!!k;},startBuild:function(i,O,s,k){var m=i._oControlStore;i._oHeaderFooterOptions=O;var p=i.getPage();if(m){if(!this.focusInfo){this.focusInfo=m.oButtonListHelper.getFocusInfo(m.oShareSheet);if(this.DEBUG){B.debug("Store focus information for "+i.getMetadata().getName(),JSON.stringify(this.focusInfo),this.CLASSNAME);}}i._oControlStore.oButtonListHelper.startBuild(k);}else{i._oControlStore={};if(s){jQuery.extend(i._oControlStore,s);}i._oControlStore.oButtonListHelper=new a(this.oAppImp,20,i._oControlStore.bAllDisabled,this.bAutomaticOverflow,this.createId(i,"myInbox_OVERFLOW"));this.oAppImp.registerExitModule(function(){var K,o;if(i._oControlStore){i._oControlStore.oButtonListHelper.destroy();delete i._oControlStore.oButtonListHelper;for(K in i._oControlStore){o=i._oControlStore[K];if(o&&typeof o.destroy==="function"){o.destroy();}delete i._oControlStore[K];}delete i._oControlStore;}});var F=p.getFooter();if(F&&F.destroy){F.destroy();}p.setFooter(i._oControlStore.oButtonListHelper.oBar);}return p;},endBuild:function(o){var i=o._oControlStore.oButtonListHelper;i.endBuild();this._restoreFocus(i,this);},defineFooterRight:function(o,p,F,k,m){var H=false,s=this.isUsingStableIds(),n;if(this.bAutomaticOverflow){F=10000;}if(o._oHeaderFooterOptions.oEditBtn){n={};jQuery.extend(n,o._oHeaderFooterOptions.oEditBtn);if(s){this.addIds(n,o._oHeaderFooterOptions.oEditBtn.sId,o,"myInbox_EDIT");}n.style=h.Emphasized;o._oControlStore.oButtonListHelper.ensureButton(n,"b",F);H=true;}else{if(o._oHeaderFooterOptions.oPositiveAction){n={};jQuery.extend(n,o._oHeaderFooterOptions.oPositiveAction);if(s){this.addIds(n,o._oHeaderFooterOptions.oPositiveAction.sId,o,"myInbox_POSITIVE");}n.style=h.Accept;o._oControlStore.oButtonListHelper.ensureButton(n,"b",F);H=true;}if(o._oHeaderFooterOptions.oNegativeAction){n={};jQuery.extend(n,o._oHeaderFooterOptions.oNegativeAction);if(s){this.addIds(n,o._oHeaderFooterOptions.oNegativeAction.sId,o,"myInbox_NEGATIVE");}n.style=h.Reject;o._oControlStore.oButtonListHelper.ensureButton(n,"b",F);H=true;}}if(o._oHeaderFooterOptions.buttonList){for(var i=0;i<o._oHeaderFooterOptions.buttonList.length;i++){n={};jQuery.extend(n,o._oHeaderFooterOptions.buttonList[i]);if(s){this.addIds(n,o._oHeaderFooterOptions.buttonList[i].sId,o,undefined);}n.style=h.Default;o._oControlStore.oButtonListHelper.ensureButton(n,"b",F);H=true;}}if(k){var G=this.getGenericButtons(F,o,o._oControlStore.oButtonListHelper);H=H||G.length>0;}if(this.bAutomaticOverflow){o._oControlStore.oButtonListHelper.addOverflowButton();}H=this.defineShareButton(o)||H;return H;},defineShareButton:function(o){var k=this.getShareButtons(o);if(k.length===0){return false;}if(!o._oControlStore.oShareSheet){o._oControlStore.oShareSheet=new A();o._oControlStore.oShareSheet.setShowCancelButton(true);o._oControlStore.oShareSheet.setPlacement(P.Top);}else{o._oControlStore.oShareSheet.removeAllButtons();}this.shareText=this.oAppImp.getResourceBundle().getText("share.tooltip");var m={sIcon:"sap-icon://action",sTooltip:this.shareText,onBtnPressed:function(n){if(o._oHeaderFooterOptions.oJamOptions){if(o._oHeaderFooterOptions.oJamOptions.fGetShareSettings){var s=o._oHeaderFooterOptions.oJamOptions.fGetShareSettings();if(s){o._oControlStore.oJamShareButton.setJamData(s);}}if(o._oHeaderFooterOptions.oJamOptions.fGetDiscussSettings){var D=o._oHeaderFooterOptions.oJamOptions.fGetDiscussSettings();if(D){o._oControlStore.oJamDiscussButton.setJamData(D);}}}o._oControlStore.oShareSheet.openBy(n.getSource());}};if(this.isUsingStableIds()){this.addIds(m,undefined,o,"myInbox_SHARE");}o._oControlStore.oButtonListHelper.ensureButton(m,"b");for(var i=0;i<k.length;i++){o._oControlStore.oShareSheet.addButton(k[i]);}return true;},hasShareButtons:function(o){return o.isMainScreen()||!!(o._oHeaderFooterOptions.oEmailSettings||(o._oHeaderFooterOptions.oJamOptions&&(o._oHeaderFooterOptions.oJamOptions.oShareSettings||o._oHeaderFooterOptions.oJamOptions.fGetShareSettings||o._oHeaderFooterOptions.oJamOptions.oDiscussSettings||o._oHeaderFooterOptions.oJamOptions.fGetDiscussSettings))||o._oHeaderFooterOptions.oAddBookmarkSettings||(o._oHeaderFooterOptions.additionalShareButtonList&&o._oHeaderFooterOptions.additionalShareButtonList.length>0));},getShareButtons:function(o){var r=[];var E=this.getEmailButton(o);var i=this.getJamShareButton(o);var k=this.getJamDiscussButton(o);var m=this.getBookmarkButton(o);if(E){r.push(E);}if(i){r.push(i);}if(k){r.push(k);}if(m){r.push(m);}if(o._oHeaderFooterOptions.additionalShareButtonList){var n=this.getAdditionalShareButtons(o);r=r.concat(n);}return r;},getEmailButton:function(o){var s;if(!o._oHeaderFooterOptions.oEmailSettings){return null;}if(!o._oControlStore.oEmailButton){o._oControlStore.oEmailButton=new b({id:this.createId(o,"myInbox_MAIL")});o._oControlStore.oEmailButton.setIcon("sap-icon://email");o._oControlStore.oEmailButton.setText(this.oAppImp.getResourceBundle().getText("sendEmail.button"));o._oControlStore.oEmailButton.attachPress(function(){if(o._oHeaderFooterOptions.oEmailSettings.fGetMailBody){s=o._oHeaderFooterOptions.oEmailSettings.fGetMailBody();}else{s=null;}sap.m.URLHelper.triggerEmail(o._oHeaderFooterOptions.oEmailSettings.sRecepient,o._oHeaderFooterOptions.oEmailSettings.sSubject,s);});}this.supportEnablement(o,o._oControlStore.oEmailButton,o._oHeaderFooterOptions.oEmailSettings);return o._oControlStore.oEmailButton;},getJamShareButton:function(o){if(!o._oHeaderFooterOptions.oJamOptions||!(o._oHeaderFooterOptions.oJamOptions.oShareSettings||o._oHeaderFooterOptions.oJamOptions.fGetShareSettings)){return null;}if(!o._oControlStore.oJamShareButton){o._oControlStore.oJamShareButton=new J({id:this.createId(o,"myInbox_JAMSHARE")});}if(o._oHeaderFooterOptions.oJamOptions.oShareSettings){o._oControlStore.oJamShareButton.setJamData(o._oHeaderFooterOptions.oJamOptions.oShareSettings);this.supportEnablement(o,o._oControlStore.oJamShareButton,o._oHeaderFooterOptions.oJamOptions.oShareSettings);}return o._oControlStore.oJamShareButton;},getJamDiscussButton:function(o){if(!o._oHeaderFooterOptions.oJamOptions||!(o._oHeaderFooterOptions.oJamOptions.oDiscussSettings||o._oHeaderFooterOptions.oJamOptions.fGetDiscussSettings)){return null;}if(!o._oControlStore.oJamDiscussButton){o._oControlStore.oJamDiscussButton=new e({id:this.createId(o,"myInbox_JAMDISCUSS")});}if(o._oHeaderFooterOptions.oJamOptions.oDiscussSettings){o._oControlStore.oJamDiscussButton.setJamData(o._oHeaderFooterOptions.oJamOptions.oDiscussSettings);this.supportEnablement(o,o._oControlStore.oJamDiscussButton,o._oHeaderFooterOptions.oJamOptions.oDiscussSettings);}return o._oControlStore.oJamDiscussButton;},getBookmarkButton:function(o){if(o._oHeaderFooterOptions.bSuppressBookmarkButton||(!o._oHeaderFooterOptions.oAddBookmarkSettings&&!o.isMainScreen())){return null;}if(!o._oControlStore.oBookmarkButton){o._oControlStore.oBookmarkButton=new f({id:this.createId(o,"myInbox_ADDBOOKMARK")});}var i={url:document.URL,title:o._oControlStore.oTitle.getText()};jQuery.extend(i,o._oHeaderFooterOptions.oAddBookmarkSettings||{});o._oControlStore.oBookmarkButton.setAppData(i);this.supportEnablement(o,o._oControlStore.oBookmarkButton,o._oHeaderFooterOptions.oAddBookmarkSettings||{});return o._oControlStore.oBookmarkButton;},supportEnablement:function(o,i,s){i.setEnabled(!s.bDisabled);if(s.sId){o._oControlStore.oButtonListHelper.mButtons[s.sId]=i;}},getAdditionalShareButtons:function(o){var r=[];if(!o._oControlStore.shareButtons){o._oControlStore.shareButtons=new a(this.oAppImp,1);o._oControlStore.oButtonListHelper.addButtonListHelper(o._oControlStore.shareButtons);}for(var i=0;i<o._oHeaderFooterOptions.additionalShareButtonList.length;i++){var k={};jQuery.extend(k,o._oHeaderFooterOptions.additionalShareButtonList[i]);if(this.isUsingStableIds()){this.addIds(k,o._oHeaderFooterOptions.additionalShareButtonList[i].sId,o,undefined);}var m=o._oControlStore.shareButtons.ensureButton(k,"b");r.push(m);}return r;},getFooterRightCount:function(o,t){var L;switch(t){case"XL":L=this.detailHeaderFooterRules.maxBtnCountXL;break;case"L":L=this.detailHeaderFooterRules.maxBtnCountL;break;case"M":L=this.detailHeaderFooterRules.maxBtnCountM;break;case"S":L=this.detailHeaderFooterRules.maxBtnCountS;break;default:L=this.detailHeaderFooterRules.maxBtnCountXL;}return L;},getActionsCount:function(o,s){var i=0;if(o._oHeaderFooterOptions.buttonList){i=o._oHeaderFooterOptions.buttonList.length;}if(o._oHeaderFooterOptions.oEditBtn){if(!s){i++;}}else{if(o._oHeaderFooterOptions.oPositiveAction){i++;}if(o._oHeaderFooterOptions.oNegativeAction){i++;}}return i;},createSettingsButton:function(o){var r;if(o._oControlStore.oSettingsButton){r=false;}else{r=true;}if(o._oHeaderFooterOptions.aAdditionalSettingButtons){if(!o._oControlStore.oSettingsButtonListHelper){o._oControlStore.oSettingsButtonListHelper=new a(this.oAppImp,0);o._oControlStore.oButtonListHelper.addButtonListHelper(o._oControlStore.oSettingsButtonListHelper);}var k=[];for(var i=0;i<o._oHeaderFooterOptions.aAdditionalSettingButtons.length;i++){var m={};jQuery.extend(m,o._oHeaderFooterOptions.aAdditionalSettingButtons[i]);delete m.sIcon;var n=o._oControlStore.oSettingsButtonListHelper.ensureButton(m,"b");n.setWidth("100%");k.push(n);}g.addApplicationSettingsButtons(k);}return r;},getGenericButtons:function(F,o,i){var r=[];if(o._oHeaderFooterOptions.oSortOptions){r.push(this.addSortButton(F,o,i));}if(o._oHeaderFooterOptions.oFilterOptions){r.push(this.addFilterButton(F,o,i));}if(o._oHeaderFooterOptions.oGroupOptions){r.push(this.addGroupButton(F,o,i));}return r;},addFilterButton:function(F,o,i){var s=this.oAppImp.getResourceBundle().getText("XBUT_FILTER"),k={bDisabled:o._oHeaderFooterOptions.oFilterOptions.bDisabled,sIcon:"sap-icon://filter",sBtnTxt:s,sTooltip:o._oHeaderFooterOptions.oFilterOptions.sTooltip||s},t;this.addIds(k,o._oHeaderFooterOptions.oFilterOptions.sId,o,"myInbox_FILTER");if(o._oHeaderFooterOptions.oFilterOptions.aFilterItems){k.onChange=jQuery.proxy(function(K){i._updateCurrentSelection("filter",K);o._oHeaderFooterOptions.oFilterOptions.onFilterSelected(K);},this);k.aItems=o._oHeaderFooterOptions.oFilterOptions.aFilterItems;k.sSelectedItemKey=i._getCurrentSelection("filter",o._oHeaderFooterOptions.oFilterOptions.sSelectedItemKey);t="s";}else{k.onBtnPressed=jQuery.proxy(function(E){o._oHeaderFooterOptions.oFilterOptions.onFilterPressed(E);},this);t="b";}return i.ensureButton(k,t,F);},addSortButton:function(F,o,i){var s=this.oAppImp.getResourceBundle().getText("sort.title"),k={bDisabled:o._oHeaderFooterOptions.oSortOptions.bDisabled,sIcon:"sap-icon://sort",sBtnTxt:s,sTooltip:o._oHeaderFooterOptions.oSortOptions.sTooltip||s},t;this.addIds(k,o._oHeaderFooterOptions.oSortOptions.sId,o,"myInbox_SORT");if(o._oHeaderFooterOptions.oSortOptions.aSortItems){k.onChange=jQuery.proxy(function(K){i._updateCurrentSelection("sort",K);o._oHeaderFooterOptions.oSortOptions.onSortSelected(K);},this);k.aItems=o._oHeaderFooterOptions.oSortOptions.aSortItems;k.sSelectedItemKey=i._getCurrentSelection("sort",o._oHeaderFooterOptions.oSortOptions.sSelectedItemKey);t="s";}else{k.onBtnPressed=jQuery.proxy(function(E){o._oHeaderFooterOptions.oSortOptions.onSortPressed(E);},this);t="b";}return i.ensureButton(k,t,F);},addGroupButton:function(F,o,i){var s=this.oAppImp.getResourceBundle().getText("group.dialog.title"),k={bDisabled:o._oHeaderFooterOptions.oGroupOptions.bDisabled,sIcon:"sap-icon://group-2",sBtnTxt:s,sTooltip:o._oHeaderFooterOptions.oGroupOptions.sTooltip||s},t;this.addIds(k,o._oHeaderFooterOptions.oGroupOptions.sId,o,"myInbox_GROUP");if(o._oHeaderFooterOptions.oGroupOptions.aGroupItems){k.onChange=jQuery.proxy(function(K){i._updateCurrentSelection("group",K);o._oHeaderFooterOptions.oGroupOptions.onGroupSelected(K);},this);k.aItems=o._oHeaderFooterOptions.oGroupOptions.aGroupItems;k.sSelectedItemKey=i._getCurrentSelection("group",o._oHeaderFooterOptions.oGroupOptions.sSelectedItemKey);t="s";}else{k.onBtnPressed=jQuery.proxy(function(E){o._oHeaderFooterOptions.oGroupOptions.onGroupPressed(E);},this);t="b";}return i.ensureButton(k,t,F);},ensureHeader:function(o,p,G,s,t){if(!o._oControlStore.oHeaderBar){o._oControlStore.oHeaderBar=new c();t=this.isUsingStableIds()&&t?this.createId(o,t):undefined;o._oControlStore.oTitle=new T(t,{level:j.H2});o._oControlStore.oHeaderBar.addContentMiddle(o._oControlStore.oTitle);var i=p.getCustomHeader();if(i&&i.destroy){i.destroy();}p.setCustomHeader(o._oControlStore.oHeaderBar);}this.setBackButton(o,o._oControlStore.oHeaderBar,G,s);},setAppHeaderBtn:function(o,i){if(!o._oControlStore.oHeaderBar){return;}if(!o._oControlStore.oHeaderBtn){if(i.sId){o._oControlStore.oHeaderBtn=new b(i.sId);}else{o._oControlStore.oHeaderBtn=new b();}o._oControlStore.oHeaderBar.addContentRight(o._oControlStore.oHeaderBtn);}var _=o._oControlStore.oHeaderBtn;if(i.sIcon){_.setIcon(i.sIcon);}if(i.onBtnPressed){_.attachPress(i.onBtnPressed);}if(i.sText){_.setText(i.sText);}else if(i.oTextBinding){if(i.oTextBinding.elementPath){if(i.oTextBinding.parameters){_.bindElement(i.oTextBinding.elementPath,i.oTextBinding.parameters);}else{_.bindElement(i.oTextBinding.elementPath);}}if(i.oTextBinding.property){_.bindProperty("text",i.oTextBinding.property);}}else if(this.oAppImp.bIsPhone&&i.i18nPhoneTxt){_.setText(this.oAppImp.getResourceBundle().getText(i.i18nPhoneTxt));}else if(i.i18nTxt){_.setText(this.oAppImp.getResourceBundle().getText(i.i18nTxt));}},setBackButton:function(o,i,G,s){if(s||(G&&o._oHeaderFooterOptions.onBack===null)){o._oControlStore.fBack=null;}else if(G&&o._oHeaderFooterOptions.onBack==undefined){if(window.history.length===0){o._oControlStore.fBack=null;}else{o._oControlStore.fBack=function(){window.history.back(1);};}}else{o._oControlStore.fBack=o._oHeaderFooterOptions.onBack;}if(o._oControlStore.oBackButton){o._oControlStore.oBackButton.setVisible(!!o._oControlStore.fBack);}else if(o._oControlStore.fBack){o._oControlStore.oBackButton=new b({id:this.createId(o,"myInbox_BACK")});o._oControlStore.oBackButton.setIcon("sap-icon://nav-back");o._oControlStore.oBackButton.setTooltip(this.oAppImp.getResourceBundle().getText("XBUT_BACK"));o._oControlStore.oBackButton.attachPress(function(E){o._oControlStore.fBack(E);});i.addContentLeft(o._oControlStore.oBackButton);}},getGenericCount:function(o){var r=0;if(o._oHeaderFooterOptions.oSortOptions){r++;}if(o._oHeaderFooterOptions.oFilterOptions){r++;}if(o._oHeaderFooterOptions.oGroupOptions){r++;}return r;},addIds:function(o,s,i,D){var k=I.isValid(s)?s:D;delete o.sControlId;delete o.sId;if(this.isUsingStableIds()){o.sControlId=this.createId(i,k);o.sId=s||D;}else{o.sId=s;}},createId:function(o,i){if(this.isUsingStableIds()&&i&&I.isValid(i)){return o.getView().createId(i);}return undefined;},isUsingStableIds:function(){return this.oAppImp.oConfiguration&&this.oAppImp.oConfiguration.isUsingStableIds&&this.oAppImp.oConfiguration.isUsingStableIds();},_restoreFocus:function(o,t){var E,F=t.focusInfo,O=o.oOverflowButton;if(F){if(F.area==="share"){F.area="right";F.pos=1000;F.controlInfo={icon:"sap-icon://action",text:"",tooltip:t.shareText};}E=o.findFocusedElement(F,O);if(E){setTimeout(function(){if(!jQuery(E.$()[0]).is(":visible")){E=O;}if(E){E.focus();if(this.DEBUG){B.debug("Restored focus on "+E.getId(),this.CLASSNAME);}}t.focusInfo=undefined;}.bind(this),100);}else{t.focusInfo=undefined;}}}});C.getPageFromController=function(o){return o.getView().getContent()[0];};return C;});
