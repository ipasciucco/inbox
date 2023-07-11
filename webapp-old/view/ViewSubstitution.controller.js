/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["cross/fnd/fiori/inbox/util/Substitution","cross/fnd/fiori/inbox/util/DataManager","cross/fnd/fiori/inbox/controller/BaseController","cross/fnd/fiori/inbox/util/ConfirmationDialogManager","cross/fnd/fiori/inbox/util/EmployeeCard","sap/ui/thirdparty/jquery","sap/ui/core/format/DateFormat","sap/ui/model/json/JSONModel","sap/ui/core/Fragment","sap/ui/model/Filter","sap/ui/Device","cross/fnd/fiori/inbox/util/tools/CommonHeaderFooterHelper","cross/fnd/fiori/inbox/util/Conversions","sap/m/MessageToast","sap/m/Dialog","sap/m/Text","sap/m/Button"],function(S,D,B,C,E,q,c,J,F,d,e,f,g,M,h,T,l){"use strict";return B.extend("cross.fnd.fiori.inbox.view.ViewSubstitution",{_MAX_AGENT:100,extHookAddFooterButtonsForSubs:null,oConfirmationDialogManager:C,onInit:function(){this.sDialogHeight="550px";this.sAddSubUniqueId=this.createId()+"DLG_ADD_SUBST";this.oFormatToDisplay=c.getDateInstance({pattern:"dd MMM yyyy"});this.i18nBundle=cross.fnd.fiori.inbox.util.tools.Application.getImpl().getResourceBundle();var o=cross.fnd.fiori.inbox.util.tools.Application.getImpl().getComponent();this.oDataManager=o.getDataManager();if(!this.oDataManager){var O=this.getView().getModel();this.oDataManager=new D(this);this.oDataManager.setModel(O);o.setDataManager(this.oDataManager);}o.getEventBus().subscribe("cross.fnd.fiori.inbox.dataManager","showReleaseLoader",q.proxy(this.onShowReleaseLoader,this));o.getEventBus().subscribe("cross.fnd.fiori.inbox.dataManager","showLoaderInDialogs",q.proxy(this.onShowLoaderInDialogs,this));this.oHeaderFooterOptions={sI18NFullscreenTitle:"substn.title",bSuppressBookmarkButton:true};this.oFooterBtnList={};this.oFooterBtnList.AddSubstituteBtn={sI18nBtnTxt:"substn.create.substitute_button",onBtnPressed:q.proxy(this.onOpenAddSubstituteDialog,this)};this.oFooterBtnList.resendBtn={sI18nBtnTxt:"substn.resynchronize.resend_button",onBtnPressed:q.proxy((function(){this.showDialogForResynchronize();}),this)};this.oFooterBtnList.deleteRuleBtn={sI18nBtnTxt:"substn.delete.delete_button",onBtnPressed:q.proxy((function(){this.handleDelete();}),this)};this.oAppImp=cross.fnd.fiori.inbox.util.tools.Application.getImpl();this.showInitialFooterButtons();this.oRouter=this.getOwnerComponent().getRouter();this.oRouter.attachRouteMatched(this.handleNavToSubstitution,this);},onShowReleaseLoader:function(s,a,v){this.getView().setBusyIndicatorDelay(1000);this.getView().setBusy(v.bValue);},onShowLoaderInDialogs:function(s,a,v){var o=this.getSubstituteFrag();if(o){o.setBusyIndicatorDelay(1000).setBusy(v.bValue);}},handleNavToSubstitution:function(o){if(o.getParameter("name")==="substitution"){if(!this.oDataManager.oModel.getServiceMetadata()){this.oDataManager.oModel.attachMetadataLoaded(q.proxy(function(){this.refreshData();},this));}else{this.refreshData();}}},groupBy:function(m){var a={};m.forEach(function(r){var b=JSON.stringify(r.User);a[b]=a[b]||[];a[b].push(r);});return Object.keys(a).map(function(b){return a[b];});},sortAndGroupSubstitutionData:function(s){var A=[];var I=[];q.each(s,function(a,r){if(r.bActive){A.push(r);}else{I.push(r);}});A.sort(function(a,b){return a.FullName.toLocaleLowerCase().localeCompare(b.FullName.toLocaleLowerCase());});I.sort(function(a,b){return a.FullName.toLocaleLowerCase().localeCompare(b.FullName.toLocaleLowerCase());});s=A.concat(I);var j=this.groupBy(s);var o=j[0];for(var i=1;i<j.length;i++){o=q.merge(o,j[i]);}return o;},findActiveSystems:function(s,a){var b=[];var i=[];var j;q.each(a,function(k,o){j=false;q.each(s.aKeys,function(K,m){if(o.SAP__Origin===m.SAP__Origin){b.push(o.SAP__Origin);j=true;return false;}});if(!j){i.push(o.SAP__Origin);}});s.aSystemsWithoutRule=i;s.bExistInAllSystem=(i.length<1);},handleIconTabBarSelect:function(o){var t=this.byId("substitutionRules");t.removeSelections();var b=t.getBinding("items");var a={};var s=this.getView().getModel("substitutionTypeModel");this.showInitialFooterButtons();if(o.getSource().getSelectedKey()==="UNPLANNED"){this.sDialogHeight="145px";if(!s){s=new J({data:{bPlanned:false}});}s.oData.data.bPlanned=false;a=new d("Mode","EQ","TAKE_OVER");b.filter([a]);}else{this.sDialogHeight="550px";if(!s){s=new J({data:{bPlanned:true}});}s.oData.data.bPlanned=true;a=new d("Mode","EQ","RECEIVE_TASKS");b.filter([a]);}s.checkUpdate(false);},refreshData:function(){var s=function(o,a,b){var j=[];var k=[];var m=S.getEndOfCurrentDate();q.each(o.results,function(i,r){if(!S.isRuleOutdated(r.EndDate)){var N=true;q.each(j,function(t,w){var x=typeof r.EndDate==="undefined"?new Date(null):new Date(r.EndDate);var y=typeof w.EndDate==="undefined"?new Date(null):new Date(w.EndDate);if(r.User.toUpperCase()===w.User.toUpperCase()&&r.BeginDate.getDate()===w.BeginDate.getDate()&&r.BeginDate.getMonth()===w.BeginDate.getMonth()&&r.BeginDate.getFullYear()===w.BeginDate.getFullYear()&&x.getDate()===y.getDate()&&x.getMonth()===y.getMonth()&&x.getFullYear()===y.getFullYear()&&r.Profile===w.Profile&&r.ProfileText===w.ProfileText){w.aKeys.push({SubstitutionRuleId:r.SubstitutionRuleID,SAP__Origin:r.SAP__Origin});N=false;return false;}});if(N){j.push({User:r.User.toUpperCase(),BeginDate:r.BeginDate,EndDate:r.EndDate,Profile:r.Profile,ProfileText:r.ProfileText,FullName:r.FullName,SupportsDeleteSubstitutionRule:r.SupportsDeleteSubstitutionRule,Mode:r.Mode,bActive:r.BeginDate<=m,aKeys:[{SubstitutionRuleId:r.SubstitutionRuleID,SAP__Origin:r.SAP__Origin}]});}}});if(j.length>0){k=this.sortAndGroupSubstitutionData(j);q.each(k,q.proxy(function(r,t){if(t.Profile===""&&t.ProfileText===""){this.findActiveSystems(t,b);}else{var w=[];q.each(a,function(i,P){if(P.Profile===t.Profile&&P.ProfileText===t.ProfileText){w.push({SAP__Origin:P.SAP__Origin});}});this.findActiveSystems(t,w);}},this));}var v=this.getView();var u=false;var V=e.system.phone?true:false;var n={};if(v.getModel("substitutionTypeModel")){u=!v.getModel("substitutionTypeModel").oData.data.bPlanned;}this.oModel2=new J({modelData:k});this.oDataManager.oModel.getMetaModel().loaded().then(function(){if(!this.oDataManager.oServiceMetaModel){this.oDataManager.oServiceMetaModel=this.oDataManager.oModel.getMetaModel();}var i=this.oDataManager.oServiceMetaModel.getODataEntitySet("SubstitutionProfileCollection")!==null;this.oModel2.setProperty("/bTaskGroupColumnVisible",i);}.bind(this));v.setModel(this.oModel2,"substitution");var p=this.byId("substitutionRules").getBinding("items");if(u){p.filter([new d("Mode","EQ","TAKE_OVER")]);n=new J({data:{bPlanned:false}});}else{p.filter([new d("Mode","EQ","RECEIVE_TASKS")]);n=new J({data:{bPlanned:true}});}n.setProperty("/bPhone",V);v.setModel(n,"substitutionTypeModel");this.substituteStatusModel=new J();this.setSubstituteStatusData();v.setModel(this.substituteStatusModel,"userDetails");this.substituteStatusModel.checkUpdate(true);this.showInitialFooterButtons();};this.oDataManager.readSubstitutionData(q.proxy(s,this));},refreshFooterOptions:function(){this._oHeaderFooterOptions=q.extend(this._oHeaderFooterOptions,this.oHeaderFooterOptions);this.setHeaderFooterOptions(this._oHeaderFooterOptions);},setHeaderFooterOptions:function(o){this.oAppImp.oFHFHelper.setHeaderFooter(this,o);},getPage:function(){return f.getPageFromController(this);},setSubstituteStatusData:function(){var u={};q.each(this.oModel2.oData["modelData"],q.proxy(function(i,s){if(s.Mode=="RECEIVE_TASKS"){if(u[s.User]!==undefined){if(!u[s.User].bActive){u[s.User].bActive=s.bActive;}}else{u[s.User]={bActive:s.bActive};}}},this));S.setUserInfo(u);this.substituteStatusModel.setData(u);},showInitialFooterButtons:function(){this.oHeaderFooterOptions=q.extend(this.oHeaderFooterOptions,{buttonList:[this.oFooterBtnList.AddSubstituteBtn]});this.refreshFooterOptions();},onEmployeeProfileLaunch:function(o){var b=o.getSource().getBindingContext("substitution");var s=this.oModel2.getProperty("aKeys",b)[0].SAP__Origin;var u=this.oModel2.getProperty("User",b);var a=g.getSelectedControl(o);this.oDataManager.readUserInfo(s,u,q.proxy(E.displayEmployeeCard,this,a));},refreshOnSubstitutionRuleSuccess:function(s,a){if(a.length===0){setTimeout(function(){M.show(this.i18nBundle.getText("substn.create.success"));}.bind(this),500);}this.refreshData();},createSubstituionRuleEntry:function(b){var s={};s.BeginDate="\/Date("+(this.oModel2.getProperty("BeginDate",b)).getTime()+")\/";s.EndDate="\/Date("+(this.oModel2.getProperty("EndDate",b)).getTime()+")\/";s.User=this.oModel2.getProperty("User",b);s.Mode=this.oModel2.getProperty("Mode",b);s.Profile=this.oModel2.getProperty("Profile",b);s.ProfileText=this.oModel2.getProperty("ProfileText",b);s.IsEnabled=true;return s;},showDialogForResynchronize:function(){var b=this.oFooterBtnList.BindingContext;var t=this;this.oConfirmationDialogManager.showDecisionDialog({showNote:false,title:t.i18nBundle.getText("substn.resynchronize.title"),question:t.i18nBundle.getText("substn.resynchronize.question"),confirmButtonLabel:t.i18nBundle.getText("XBUT_OK"),noteMandatory:false,confirmActionHandler:q.proxy(function(o,r){this.showInitialFooterButtons();var s=this.oModel2.getProperty("aSystemsWithoutRule",b);var a=this.createSubstituionRuleEntry(o);this.oDataManager._createSubstitutionRule(a,s,this.refreshOnSubstitutionRuleSuccess.bind(this));},this,b)});},updateFooterBtnList:function(s,b){var a=[];a=s?[this.oFooterBtnList.AddSubstituteBtn,this.oFooterBtnList.deleteRuleBtn,this.oFooterBtnList.resendBtn]:[this.oFooterBtnList.AddSubstituteBtn,this.oFooterBtnList.deleteRuleBtn];if(this.extHookAddFooterButtonsForSubs){this.extHookAddFooterButtonsForSubs(a);}this.oHeaderFooterOptions=q.extend(this.oHeaderFooterOptions,{buttonList:a});this.refreshFooterOptions();},handleLiveChange:function(o){if(o.getSource().getValue()===""){var s=F.byId(this.sAddSubUniqueId,"LST_SEARCH_USERS");if(s.getModel("userModel")){s.getModel("userModel").setProperty("/users",{});}}},handleRuleSelection:function(o){var b=o.getParameter("listItem").getBindingContext("substitution");this.oFooterBtnList.BindingContext=b;var i=!q.isEmptyObject(this.oModel2.getProperty("aSystemsWithoutRule",b));this.updateFooterBtnList(i,b);},handleDelete:function(o){var t=this.byId("substitutionRules");this.oConfirmationDialogManager.showDecisionDialog({question:this.i18nBundle.getText("substn.delete.question"),title:this.i18nBundle.getText("substn.delete.title"),confirmButtonLabel:this.i18nBundle.getText("XBUT_OK"),noteMandatory:false,confirmActionHandler:q.proxy(function(r){var b=this.oFooterBtnList.BindingContext;var R=this.oModel2.getProperty("aKeys",b);var s=R.length>1?this.successMassDelete:this.successDelete;this.oDataManager.deleteSubstitution(R,q.proxy(s,this,b));t.removeSelections();},this)});},successMassDelete:function(o,s,a){if(a.length===0){this.successDelete(o);}else if(s.length>0){var p=o.getPath().split("/");var r=[];for(var i=s.length-1;i>=0;i--){r=this.oModel2.oData[p[1]][p[2]].aKeys.splice(s[i],1);this.oModel2.oData[p[1]][p[2]].aSystemsWithoutRule.push(r[0].SAP__Origin);}this.oModel2.oData[p[1]][p[2]].bExistInAllSystem=false;this.oModel2.checkUpdate(false);}},successDelete:function(o){var p=o.getPath().split("/");this.oModel2.oData[p[1]].splice(p[2],1);if(this.oModel2.oData[p[1]].length>0){this.oModel2.oData[p[1]]=this.sortAndGroupSubstitutionData(this.oModel2.oData[p[1]]);}this.oModel2.checkUpdate(false);this.setSubstituteStatusData();this.substituteStatusModel.checkUpdate(true);M.show(this.i18nBundle.getText("substn.delete.success"));this.showInitialFooterButtons();},onOpenAddSubstituteDialog:function(o){this.getSubstituteFrag().open();if(!this.oDataManager.userSearch){this.resetDataWhenUserSearchIsOff();}},_initializeAddSubstitueDelegates:function(o){var t=this;this._addEventDelegateToPage(F.byId(this.sAddSubUniqueId,"detail_substitutes"),{onBeforeShow:q.proxy(function(){this._setSaveVisibility(false);},t)});this._addEventDelegateToPage(F.byId(this.sAddSubUniqueId,"detail_profiles"),{onBeforeShow:q.proxy(function(){this._setSaveVisibility(false);},t)});},_addEventDelegateToPage:function(p,o){p.addEventDelegate(o,this);},navToSearchForSubstitutes:function(o){var s=F.byId(this.sAddSubUniqueId,"LST_SEARCH_USERS");var u=s.getModel("userModel");if(!u){s.setModel(new J(),"userModel");}},onSearchOfSubstitutes:function(o){var s=o.getSource().getValue();this.searchUsers(s);},searchUsers:function(s){if(s===""){this.resetAddSubstituteForm();return;}this.navToSearchForSubstitutes(this);var o;var a=function(r){o=r[0].SAP__Origin;};this.oDataManager.readSystemInfoCollection(a,q.proxy(a,this.searchUsers));if(o){this.oDataManager.searchUsers(o,s,this._MAX_AGENT,q.proxy(function(r){var b=F.byId(this.sAddSubUniqueId,"LST_SEARCH_USERS");b.getModel("userModel").setProperty("/users",r);},this));}},navToGetProfiles:function(o,p){var P=F.byId(this.sAddSubUniqueId,"LST_PROFILES");var s=F.byId(this.sAddSubUniqueId,"LST_USR_DATA");var a=F.byId(this.sAddSubUniqueId,"LST_ALL_TOPICS");var b=p.DisplayName;var m=p.Company;var I=g.getRelativeMediaSrc(p.__metadata.media_src);var n=P.getModel("profiles");P.removeSelections();a.removeSelections();s.setModel(new J(),"userDataModel");var r=s.getModel("userDataModel");r.setProperty("/displayName",b);r.setProperty("/company",m);r.setProperty("/media_src",I);r.setProperty("/parameters",p);if(!n){P.setModel(new J(),"profiles");}this.oDataManager.readSubstitutionProfiles(q.proxy(function(R){var u={};q.each(R,function(i,j){var w={};w.Profile=j.Profile;w.ProfileText=j.ProfileText;u[j.Profile+" - "+j.ProfileText]=w;});var v=[];var k=0;q.each(u,function(j,i){v[k++]=i;});var P=F.byId(this.sAddSubUniqueId,"LST_PROFILES");P.getModel("profiles").setProperty("/profiles",v);},this));var N=F.byId(this.sAddSubUniqueId,"NAV_ADD_SUBST");var t=F.byId(this.sAddSubUniqueId,"detail_profiles");N.to(t);},handleCreateSubstitutionPopOverCancel:function(o){this.getSubstituteFrag().close();},handleUserSelectionChange:function(o){var L=o.getSource();var p=this.getUserNavigationParameters(L);this.navToGetProfiles(o,p);},getUserNavigationParameters:function(L){var b=L.getBindingContext("userModel");return b.getObject();},geProfileNavigationParameters:function(L){var b=L.getBindingContext("profiles");return{Profile:b.getProperty("Profile"),ProfileText:b.getProperty("ProfileText")};},handleUserDetailPress:function(o){var L=o.getSource();var p=this.getUserNavigationParameters(L);E.displayEmployeeCard(L,p);},onNavBack:function(o,p){F.byId(this.sAddSubUniqueId,"NAV_ADD_SUBST").back(p);var L=F.byId(this.sAddSubUniqueId,"LST_PROFILES");var a=F.byId(this.sAddSubUniqueId,"LST_ALL_TOPICS");L.removeSelections();a.removeSelections();},navToSubstitutionPeriod:function(o,p){this._setSaveVisibility(true);var s=this.getSubstituteFrag().getModel("substitutionTypeModel").oData.data.bPlanned;var L=o.getParameter("listItem");var u=F.byId(this.sAddSubUniqueId,"LST_USR_DATA");var t=L.getProperty("title");var a=F.byId(this.sAddSubUniqueId,"date_selection");var b=F.byId(this.sAddSubUniqueId,"selectionCalendar");var n=F.byId(this.sAddSubUniqueId,"NAV_ADD_SUBST");b.removeAllSelectedDates();u.getModel("userDataModel").setProperty("/profileTitle",t);a.setModel(u.getModel("userDataModel"),"userDataModel");var i=a.getModel("userDataModel");if(p){i.setProperty("/profileParameters",p);}else{a.getModel("userDataModel").setProperty("/profileParameters","");}if(!i.getProperty("/period"))i.setProperty("/period",this.i18nBundle.getText("substn.create.default_date"));if(!s){this._setSaveVisibility(true);var j=c.getDateInstance({pattern:"yyyyMMdd"});var k={startDate:j.format(new Date())};i.setProperty("/selectedDates",k);return;}b.focusDate(new Date());n.to(a);},onSelectProfile:function(o){var L=o.getParameter("listItem");var p=this.geProfileNavigationParameters(L);var a=F.byId(this.sAddSubUniqueId,"LST_ALL_TOPICS");a.removeSelections();this.navToSubstitutionPeriod(o,p);},onSelectAllTopics:function(o){var p=F.byId(this.sAddSubUniqueId,"LST_PROFILES");p.removeSelections();this.navToSubstitutionPeriod(o);},onChangeRange:function(o){var t=this;var a=c.getDateInstance({pattern:"yyyyMMdd"});var s=o.getSource().getSelectedDates();var b=F.byId(this.sAddSubUniqueId,"selectionCalendar");var i=(s[0].getStartDate());var j=F.byId(this.sAddSubUniqueId,"date_selection");var k=new Date();var m=a.format((k));var n=a.format(i);var p=t.oFormatToDisplay.format(i);var r=(s[0].getEndDate());var u=null;if(r!=null){u=a.format(r);var v=t.oFormatToDisplay.format(r);if(n<m||u<m){b.removeAllSelectedDates();n=m;u=null;j.getModel("userDataModel").setProperty("/period",t.i18nBundle.getText("substn.dateSelection.from")+" "+"");return;};j.getModel("userDataModel").setProperty("/period",t.i18nBundle.getText("substn.dateSelection.from")+" "+p+" "+t.i18nBundle.getText("substn.dateSelection.to")+" "+v);}else if(n<m){n=m;b.removeAllSelectedDates();}else{j.getModel("userDataModel").setProperty("/period",t.i18nBundle.getText("substn.dateSelection.from")+" "+p+"");}s={startDate:n,endDate:u};j.getModel("userDataModel").setProperty("/selectedDates",s);},validateUnplannedSubstitute:function(u,p){var b=true;var s=this.getView().getModel("substitution").oData.modelData;q.each(s,function(i,o){if(o.User.toUpperCase()===u.toUpperCase()&&o.Mode==="TAKE_OVER"){if(o.ProfileText===""||o.ProfileText.toUpperCase()==="ALL"||!(p)||p.toUpperCase()==="ALL"||o.Profile===p){b=false;return;}}});return b;},showValidationFailedDialog:function(){var t=this;var s=t.i18nBundle.getText("dialog.substn.create.unplanned.substitute");var a=new h({title:t.i18nBundle.getText("substn.dialog.create.unplanned.substitute"),type:"Message",content:new T({text:s}),beginButton:new l({text:t.i18nBundle.getText("XBUT_OK"),press:function(){a.close();}}),afterClose:function(){a.destroy();}});a.open();},handleCreateSubstitutionPopOverSave:function(o){var a={};var s="";if(this.oDataManager.userSearch){var u=sap.ui.core.Fragment.byId(this.sAddSubUniqueId,"LST_USR_DATA");if(this.oDataManager.checkPropertyExistsInMetadata("FullName","SubstitutionRule")){a.FullName=u.getModel("userDataModel").getProperty("/parameters").DisplayName;}a.User=u.getModel("userDataModel").getProperty("/parameters").UniqueName;s=u.getModel("userDataModel").getProperty("/parameters");}else{a.User=this.getView().getModel("userIdModel").getProperty("/userID");}var b=F.byId(this.sAddSubUniqueId,"date_selection");var i=b.getModel("userDataModel").getProperty("/selectedDates");var j=c.getDateInstance({pattern:"yyyyMMdd"});var k;var t;if(i){k=i.startDate;t=i.endDate;}else{k=j.format(new Date());}var U=!this.getSubstituteFrag().getModel("substitutionTypeModel").oData.data.bPlanned;var m;var n=t;var p=k;if(n){m=j.parse(n);m.setHours(23,59,59,59);}else{var r=new Date();var v=r.getFullYear()+50;r.setUTCFullYear(v);r.setUTCMonth(11);r.setUTCDate(31);r.setUTCHours(23);r.setUTCMinutes(59);r.setUTCSeconds(59);r.setUTCMilliseconds(0);m=r;}a.EndDate="\/Date("+m.getTime()+")\/";if(p){var w=j.parse(p);w.setHours(0,0,0,0);a.BeginDate="\/Date("+w.getTime()+")\/";}var P=b.getModel("userDataModel").getProperty("/profileParameters");if(s&&P){if(this.oDataManager.checkPropertyExistsInMetadata("Profile","SubstitutionRule")){a.Profile=b.getModel("userDataModel").getProperty("/profileParameters").Profile;}if(this.oDataManager.checkPropertyExistsInMetadata("ProfileText","SubstitutionRule")){a.ProfileText=b.getModel("userDataModel").getProperty("/profileParameters").ProfileText;}}if(U){a.Mode="TAKE_OVER";a.IsEnabled=false;}else{a.Mode="RECEIVE_TASKS";a.IsEnabled=true;}if(a.Mode==="TAKE_OVER"&&!this.validateUnplannedSubstitute(a.User,a.Profile)){this.handleCreateSubstitutionPopOverCancel();this.showValidationFailedDialog();}var x=this._getProvidersForAddSubstitute(a.Profile,a.ProfileText);if(x.length>0&&((a.Mode==="RECEIVE_TASKS")||(a.Mode==="TAKE_OVER"&&this.validateUnplannedSubstitute(a.User,a.Profile)))){this.oDataManager._createSubstitutionRule(a,x,this.createSubstitutionSuccess.bind(this));this.getSubstituteFrag().close();}},createSubstitutionSuccess:function(s,a){if(a.length===0){setTimeout(function(){M.show(this.i18nBundle.getText("substn.create.success"));}.bind(this),500);}this.refreshData();},_getProvidersForAddSubstitute:function(p,P){var s=[];var a=null;if(P){a=function(r){q.each(r,function(i,b){if(b.Profile===p&&b.ProfileText===P){s.push(b.SAP__Origin);}});};this.oDataManager.readSubstitutionProfiles(a,q.proxy(a,this._getProvidersForAddSubstitute));}else{a=function(o){q.each(o,function(i,b){s.push(b.SAP__Origin);});};this.oDataManager.readSystemInfoCollection(a,q.proxy(a,this._getProvidersForAddSubstitute));}return s;},onBeforeCloseDialog:function(o){this.resetAddSubstituteForm();},resetAddSubstituteForm:function(){var s=F.byId(this.sAddSubUniqueId,"SEARCH_SUBSTITUTE");this.getSubstituteFrag().getModel("selectedSubstituteModel").setProperty("/selectedSubstitute",{});this.getSubstituteFrag().getModel("selectedProfileModel").setProperty("/selectedProfile",{});var u=F.byId(this.sAddSubUniqueId,"LST_SEARCH_USERS").getModel("userModel");if(u){u.setProperty("/users",{});}s.setValue("");F.byId(this.sAddSubUniqueId,"NAV_ADD_SUBST").backToTop();},_changeDetailIconForUserList:function(){var s=F.byId(this.sAddSubUniqueId,"LST_SEARCH_USERS");s.bindProperty("showNoData",{path:"userModel>/users",formatter:function(u){return true;}});},_setSaveVisibility:function(v){F.byId(this.sAddSubUniqueId,"BTN_SAVE").setVisible(v);},getSubstituteFrag:function(){if(!this._oAddSubstituteFrag){if(this.oDataManager.userSearch){this._oAddSubstituteFrag=sap.ui.xmlfragment(this.sAddSubUniqueId,"cross.fnd.fiori.inbox.frag.AddSubstitute",this);this._initializeAddSubstitueDelegates();this._changeDetailIconForUserList();this._oAddSubstituteFrag.setModel(new sap.ui.model.json.JSONModel(),"selectedSubstituteModel");this._oAddSubstituteFrag.setModel(new sap.ui.model.json.JSONModel(),"selectedProfileModel");}else{this._oAddSubstituteFrag=sap.ui.xmlfragment(this.sAddSubUniqueId,"cross.fnd.fiori.inbox.frag.AddSubstituteUserID",this);}this.getView().addDependent(this._oAddSubstituteFrag);}if(!this.oDataManager.userSearch){this._oAddSubstituteFrag.setContentHeight(this.sDialogHeight);}return this._oAddSubstituteFrag;},resetDataWhenUserSearchIsOff:function(){if(!this.userIdModel){this.userIdModel=new sap.ui.model.json.JSONModel();this.getView().setModel(this.userIdModel,"userIdModel");}this._setSaveBtnEnabled(false);this.getView().getModel("userIdModel").setProperty("/userID","");var s=this.getSubstituteFrag().getModel("substitutionTypeModel").oData.data.bPlanned;var o=sap.ui.core.Fragment.byId(this.sAddSubUniqueId,"date_selection");var a=sap.ui.core.Fragment.byId(this.sAddSubUniqueId,"selectionCalendar");a.removeAllSelectedDates();var b=new sap.ui.model.json.JSONModel();b.setProperty("/profileParameters","");b.setProperty("/period",this.i18nBundle.getText("substn.create.default_date"));o.setModel(b,"userDataModel");if(!s){var i=sap.ui.core.format.DateFormat.getDateInstance({pattern:"yyyyMMdd"});var j={startDate:i.format(new Date())};b.setProperty("/selectedDates",j);return;}a.focusDate(new Date());},_setSaveBtnEnabled:function(v){sap.ui.core.Fragment.byId(this.sAddSubUniqueId,"BTN_SAVE").setEnabled(v);},getSubstUserInput:function(){return sap.ui.core.Fragment.byId(this.sAddSubUniqueId,"ENTER_SUBST_INPUT_ID");},onChangeSubstIdInput:function(){this._setSaveBtnEnabled(!!this.getSubstUserInput().getValue().trim());}});});