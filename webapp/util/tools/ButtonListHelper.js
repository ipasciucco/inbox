/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["cross/fnd/fiori/inbox/util/tools/BarOverflow","cross/fnd/fiori/inbox/util/tools/BarOverflowLayoutData","sap/ui/base/Object","sap/ui/core/Item","sap/ca/ui/dialog/Dialog","sap/base/Log","sap/m/Bar","sap/m/ActionSheet","sap/m/Button","sap/m/Select","sap/m/library"],function(B,a,U,I,D,b,c,A,d,S,l){"use strict";var e=b.isLoggable(b.Level.DEBUG);var C="cross.fnd.fiori.inbox.util.tools.ButtonListHelper";var f=l.ButtonType;var P=l.PlacementType;var g=l.SelectType;return U.extend("cross.fnd.fiori.inbox.util.tools.ButtonListHelper",{constructor:function(o,m,h,i,O){this.oApplicationImplementation=o;this.bAutomaticOverflow=i;this.sOverflowId=O;this.oOverflowButton=undefined;this.iMode=m;if(this.iMode==20){this.oBar=new c();}else if(this.iMode>=10){this.oActionSheet=new A();this.oActionSheet.setPlacement(P.Top);this.oActionSheet.setShowCancelButton(true);}this.aButtons=[];this.bAllDisabled=h;this.startBuild();if(this.iMode==25){this.sDirection="Left";}else{this.sDirection="Right";}this.mSelections={};},addButtonListHelper:function(o){if(this.oChild){this.oChild.addButtonListHelper(o);}else{this.oChild=o;o.bAllDisabled=this.bAllDisabled;delete o.oModifications;}},findFocusedElement:function(F){var h,E;if(!F){return undefined;}if(F.area==="left"){h=this.oBar&&this.oBar.getContentLeft()||[];E=this._findMatchingElement(h,F.controlInfo);}else if(F.area==="right"){h=this.oBar&&this.oBar.getContentRight()||[];E=this._findMatchingElement(h,F.controlInfo);}else if(F.area==="overflow"){h=this.oBar&&this.oBar.getContentRight()||[];E=this._findMatchingElement(h,F.controlInfo);if(!E&&this.oOverflowList&&this.oOverflowList.oActionSheet){E=this._findMatchingElement(this.oOverflowList.oActionSheet.getButtons()||[],F.controlInfo);}}if(E){return E;}if(h.length>0){E=this._getNextVisibleElement(h,Math.min(F.pos,h.length-1));if(E){return E;}}if(F.area==="left"){h=this.oBar&&this.oBar.getContentRight()||[];return this._getNextVisibleElement(h,0);}else{h=this.oBar&&this.oBar.getContentLeft()||[];return this._getNextVisibleElement(h,Math.max(0,h.length-1));}},getFocusInfo:function(s){var o=this.oBar,F=sap.ui.getCore().getCurrentFocusedControlId(),h;if(this._focusInfo){h=this._focusInfo;this._focusInfo=undefined;return h;}if(!F){return undefined;}if(this.oOverflowList){h=this.oOverflowList.getFocusInfo();if(h){h.area="overflow";return h;}}return o&&this._getFocusInfoForId(F,o.getContentLeft()||[],"left")||o&&this._getFocusInfoForId(F,o.getContentRight()||[],"right")||s&&this._getFocusInfoForId(F,s.getButtons()||[],"share")||this.oActionSheet&&this._getFocusInfoForId(F,this.oActionSheet.getButtons()||[],"action")||this.oClient&&this.oClient.getFocusInfo();},startBuild:function(k){this.mButtons={};this.aCallBacks=[];this.oPositions={iActive:0,iControlPosition:0};this.bHasOverflow=false;if(this.oChild){this.oChild.startBuild(true);}if(this.oOverflowList){this.oOverflowList.startBuild(true);}if(!k){this.oModifications={mChangedEnablements:{},mChangedTexts:{}};}this.aButtons=[];if(this.oActionSheet){this.oActionSheet.destroyButtons();}if(this.oBar){this.oBar.destroyContentRight();this.oBar.destroyContentLeft();}if(this.oBarOverflow){this.oBarOverflow.destroy();delete this.oBarOverflow;}if(this.oOverflowList){this.oOverflowList.destroy();delete this.oOverflowList;}},endBuild:function(){var s;for(var i=this.oPositions.iActive;i<this.aButtons.length;i++){var o=this.aButtons[i];if(o.oButton){o.oButton.setVisible(false);}if(o.oSelect){o.oSelect.setVisible(false);}}if(this.oChild){this.oChild.endBuild();}if(this.oOverflowList){this.oOverflowList.endBuild();}this.bIsOverflowReplaced=false;if(this.oModifications){for(s in this.oModifications.mChangedEnablements){this.setBtnEnabled(s,this.oModifications.mChangedEnablements[s],true);}for(s in this.oModifications.mChangedTexts){this.setBtnText(s,this.oModifications.mChangedTexts[s],true);}}if(this.oBarOverflow){this.oBarOverflow.buttonTextChanged();}},destroy:function(){for(var i=0;i<this.aButtons.length;i++){var o=this.aButtons[i];if(o.oButton){o.oButton.destroy(true);}if(o.oSelect){o.oSelect.destroy(true);}}if(this.oBar){this.oBar.destroy();delete this.oBar;}if(this.oActionSheet){this.oActionSheet.destroy();delete this.oActionSheet;}if(this.oChild){this.oChild.destroy();delete this.oChild;}if(this.oBarOverflow){this.oBarOverflow.destroy();delete this.oBarOverflow;}if(this.oOverflowList){this.oOverflowList.destroy();delete this.oOverflowList;}},addOverflowButton:function(){var o,O,t=this;if(!this.oOverflowList){this.oOverflowList=new cross.fnd.fiori.inbox.util.tools.ButtonListHelper(this.oApplicationImplementation,10);this.oOverflowList.bAllDisabled=this.bAllDisabled;this.oOverflowList.oBarList=this;}this.iOverflowPosition=this.oPositions.iActive;O=this.ensureButton(this._getOverflowMeta(this),"b");this.oOverflowButton=O;this.oOverflowList.oOverflowButton=O;O.setEnabled(true);O.setLayoutData(new a({moveToOverflow:false,stayInOverflow:false,overflowButton:true}));o=this.oOverflowList.oActionSheet;if(this.bAutomaticOverflow&&!this.oBarOverflow){O.setVisible(false);this.oBarOverflow=new B(this.oBar,o,this._resized.bind(t));}return o;},ensureButton:function(o,t,m){var h;if(m&&this.oPositions.iActive>=m){if(!this.bHasOverflow){this.addOverflowButton();this.bHasOverflow=true;}return this.oOverflowList.ensureButton(o,t);}var i=this.oPositions.iActive;if(i===this.aButtons.length){this.aButtons.push({});}h=this.ensureControlAtPosition(o,t,i,this.oPositions);if(this.bAutomaticOverflow){h.setLayoutData(new a());if(!m){h.getLayoutData().setMoveToOverflow(false);}}return h;},setBtnEnabled:function(i,E,n){if(this.bAllDisabled){return;}var o=this.mButtons[i],h;if(o){o.setEnabled(E);if(o.getMetadata().getName()==="sap.m.Select"){h=this._findControlObject(this.aButtons,o);o=h.oButton;if(o){o.setEnabled(E);}}}else{if(this.oChild){this.oChild.setBtnEnabled(i,E,true);}if(this.oOverflowList){this.oOverflowList.setBtnEnabled(i,E,true);}}if(!n){this.oModifications.mChangedEnablements[i]=E;}},ensureControlAtPosition:function(o,t,h,p){var j=this.aButtons[h],T,s,k,r;if(t==="b"||this.iMode<20){if(j.oSelect){p.iControlPosition=this.oBar["indexOfContent"+this.sDirection](j.oSelect);j.oSelect.setVisible(false);}if(j.oButton){j.oButton.setVisible(true);if(this.oBar){k=this.oBar["indexOfContent"+this.sDirection](j.oButton);if(k>p.iControlPosition){p.iControlPosition=k;}}}else{j.oButton=new d({id:o.sControlId});j.oButton.attachPress(jQuery.proxy(function(E){if(this.aCallBacks[h]){this.aCallBacks[h](E);}},this));p.iControlPosition++;if(this.iMode>=20){this.oBar["insertContent"+this.sDirection](j.oButton,p.iControlPosition);}else if(this.iMode>=10){this.oActionSheet.addButton(j.oButton);}else if(this.iMode==5){this.oBar.insertContentLeft(j.oButton,p.iControlPosition);}}T=this._getText(o,this.oApplicationImplementation);s=T;if(!(this.iMode<20||!o.sIcon)){j.oButton._sTooltip=o.sTooltip||T;j.oButton.setTooltip(j.oButton._sTooltip);T="";}else if(o.sTooltip&&o.sTooltip!==T){j.oButton._sTooltip=o.sTooltip;j.oButton.setTooltip(j.oButton._sTooltip);}j.oButton._sTextInActionSheet=s;j.oButton._sTextInBar=T;if(T!==j.oButton.getText()){j.oButton.setText(T);}j.oButton._sTypeInActionSheet=f.Default;if(this.iMode==20){if(j.oButton.getType()!=o.style){j.oButton.setType(o.style);j.oButton._sTypeInBar=o.style;}}if(t==="b"){this.aCallBacks[h]=o.onBtnPressed;}else{this.aCallBacks[h]=this.getSelectReplacement(o);}r=j.oButton;}else{if(j.oButton){p.iControlPosition=this.oBar["indexOfContent"+this.sDirection](j.oButton);j.oButton.setVisible(false);}if(j.oSelect){j.oSelect.setVisible(true);k=this.oBar["indexOfContent"+this.sDirection](j.oSelect);if(k>p.iControlPosition){p.iControlPosition=k;}var m=j.oSelect.getSelectedKey();j.oSelect.destroyItems();j.oSelect.setSelectedKey(m);}else{j.oSelect=new S({id:o.sControlId?o.sControlId+"_SELECT":undefined});j.oSelect.setType(g.IconOnly);j.oSelect.setAutoAdjustWidth(true);j.oSelect.setTooltip(o.sTooltip);p.iControlPosition++;this.oBar["insertContent"+this.sDirection](j.oSelect,p.iControlPosition);j.oSelect.attachChange(jQuery.proxy(function(E){var K=E.getSource().getSelectedKey();if(this.aCallBacks[h]){this.aCallBacks[h](K);}},this));if(this.bAutomaticOverflow&&!j.oButton){j.oButton=new d();j.oButton.setText(this._getText(o,this.oApplicationImplementation));if(o.sIcon){j.oButton.setIcon(o.sIcon);}j.oButton.attachPress(jQuery.proxy(function(E){var u=this.getSelectReplacement(o);if(u){u(E);}},this));j.oButton.setEnabled(!o.bDisabled&&!this.bAllDisabled);}}if(o.sSelectedItemKey){j.oSelect.setSelectedItem(o.sSelectedItemKey);}for(var i=0;i<o.aItems.length;i++){var n=o.aItems[i],q;if(!n.id&&o.sControlId){n.id=j.oSelect.getId()+"_"+i;}q=new I(n);j.oSelect.addItem(q);}if(o.sSelectedItemKey){j.oSelect.setSelectedKey(o.sSelectedItemKey);}this.aCallBacks[h]=o.onChange;r=j.oSelect;}if(o.sIcon!=r.getIcon()){r.setIcon(o.sIcon);}if(o.sId){this.mButtons[o.sId]=r;}r.setEnabled(!o.bDisabled&&!this.bAllDisabled);p.iActive++;return r;},getSelectReplacement:function(o){var s=o.sSelectedItemKey,t=this;return function(E){var h=[];var j=0;for(var i=0;i<o.aItems.length;i++){h.push({itemContent:o.aItems[i].text});if(o.aItems[i].key===s){j=i;}}s=o.aItems[j].key;D.selectItem.open({title:E.getSource().getText(),items:h,defaultIndex:j},function(r){var k=t.oActionSheet&&t.oActionSheet.getButtons()||[],F,m=t._findMatchingElement(k,{icon:o.sIcon,text:o.sBtnTxt,tooltip:o.sTooltip});if(e){b.debug("Closed item selection for "+o.sBtnTxt,C);}if(t.oOverflowButton){if(m&&t.oBarList){F=t._getFocusInfoForId(m.getId(),k,"overflow");if(F){F.pos=1000;t.oBarList._focusInfo=F;if(e){b.debug("Save focus information",JSON.stringify(F),C);}}}t.oOverflowButton.focus();}if(r.selectedIndex>=0){var n=o.aItems[r.selectedIndex].key;if(n!==s){s=n;o.sSelectedItemKey=s;o.onChange(s);}}});};},revertOverflowReplacement:function(){if(this.bIsOverflowReplaced){this.ensureControlAtPosition(this._getOverflowMeta(this),"b",this.iOverflowPosition,{});this.bIsOverflowReplaced=false;}},setBtnText:function(i,t,n){var o=this.mButtons[i],h;if(o){if(o.getMetadata().getName()==="sap.m.Select"){o.setTooltip(t);o._sTooltip=t;h=this._findControlObject(this.aButtons,o);o=h.oButton;}if(o){o.setText(t);o.setTooltip("");o._sTooltip="";if(o._sTextInBar){o._sTextInBar=t;}if(o._sTextInActionSheet){o._sTextInActionSheet=t;}if(this.oBarOverflow){this.oBarOverflow.buttonTextChanged();}}}else{if(this.oChild){this.oChild.setBtnText(i,t,true);}if(this.oOverflowList){this.oOverflowList.setBtnText(i,t,true);}}if(!n){this.oModifications.mChangedTexts[i]=t;}},_getCurrentSelection:function(t,s){if(!this.mSelections[t]){this.mSelections[t]=s;}return this.mSelections[t];},_updateCurrentSelection:function(t,s){this.mSelections[t]=s;},_getOverflowMeta:function(o){return{sIcon:"sap-icon://overflow",sControlId:o.sOverflowId,sTooltip:o.oApplicationImplementation.getResourceBundle().getText("more.tooltip"),onBtnPressed:function(h){o.oOverflowList.oActionSheet.openBy(h.getSource());}};},_findControlObject:function(h,o){var i,O;for(i=h.length-1;i>=0;i-=1){O=h[i];if(O.oButton===o||O.oSelect===o){return O;}}return null;},_findMatchingElement:function(h,o){var j,i,m,s=o.id,k,t,T;for(i=0,m=h.length;i<m;i++){j=h[i];if(s===j.getId()){return j;}if(o.icon===j.getIcon()){k=j.getMetadata().getName()==="sap.m.Button";T=j.getTooltip()||j._sTooltip||(k?j.getText():undefined);t=k?j.getText()||j._sTextInActionSheet:o.text;if(o.tooltip===T&&o.text===t){return j;}}}},_getFocusInfoForId:function(F,h,s){var o,i,j,m;for(i=0,m=h.length;i<m;i++){o=h[i];if(o.getId()===F){j=o.getMetadata().getName()==="sap.m.Button";return{area:s,pos:i,controlInfo:{icon:o.getIcon(),id:o.getId(),text:(j?o.getText():"")||o._sTextInActionSheet,tooltip:o.getTooltip()||o._sTooltip||(j?o.getText():"")}};}}},_getIndexOfOverflow:function(h){var i,o,L;for(i=h.length-1;i>=0;i-=1){o=h[i];L=o.getLayoutData();if(L instanceof a&&L.getOverflowButton()){return i;}}},_getNextVisibleElement:function(h,s){var i=s,m=h.length,r;while(i<m){r=h[i];if(r.getVisible()){return r;}i++;}i=s-1;while(i>=0){r=h[i];if(r.getVisible()){return r;}i--;}return undefined;},_getText:function(o,h){return o.sI18nBtnTxt?h.AppI18nModel.getResourceBundle().getText(o.sI18nBtnTxt):o.sBtnTxt;},_resized:function(h){var o=this.oBar,j=false,k=this.oOverflowList.oActionSheet,m,i,n,p,q;if(h===undefined){m=k.getButtons();p=this._getIndexOfOverflow(this.oBar.getContentRight());for(i=0;i<m.length;i+=1){n=this._findControlObject(this.aButtons,m[i]);if(n.oSelect){q=n.oSelect;q.setVisible(true);if(n.oButton){n.oButton.setVisible(false);}k.removeButton(m[i]);}else{q=n.oButton;if(q._sTextInBar!==undefined){q.setText(q._sTextInBar);}if(q._sTypeInBar!==undefined){q.setType(q._sTypeInBar);}if(q._sTooltip!==undefined){q.setTooltip(q._sTooltip);}}o.insertContentRight(q,p);p++;}o.getContentRight()[p].setVisible(false);if(k.isOpen()){k.attachEventOnce("afterClose",function(){k.$().remove();});}else{k.$().remove();}}else{h.forEach(function(q){n=this._findControlObject(this.aButtons,q);if(!n){b.error("Unsupported control - "+q.toString());}if(n.oSelect){o.removeContentRight(n.oSelect);}if(n.oButton){q=n.oButton;if(q._sTextInActionSheet!==undefined){q.setText(q._sTextInActionSheet);if(q._sTextInActionSheet===q._sTooltip){q.setTooltip("");}}if(q._sTypeInActionSheet!==undefined){q.setType(q._sTypeInActionSheet);}q.setVisible(true);if(n.oSelect){n.oSelect.setVisible(false);}k.addButton(q);j=true;}else{b.error("No button representation for control - "+q.toString());}},this);if(j){o.getContentRight()[this._getIndexOfOverflow(this.oBar.getContentRight())].setVisible(true);}}}});});