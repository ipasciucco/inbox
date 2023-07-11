/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/model/Filter","sap/ui/model/FilterOperator","sap/ui/model/Sorter","sap/m/Token","sap/base/Log","cross/fnd/fiori/inbox/util/EmployeeCard","sap/ui/core/Item","sap/m/SearchField","sap/ui/model/json/JSONModel","sap/ui/core/Fragment","sap/ui/Device","sap/ui/comp/library","sap/ui/comp/valuehelpdialog/ValueHelpDialog","sap/ui/thirdparty/jquery"],function(F,a,S,T,B,E,I,b,J,c,D,U,V,q){"use strict";var d=U.valuehelpdialog.ValueHelpRangeOperation;sap.ui.controller("cross.fnd.fiori.inbox.view.S2_FilterBar",{_oDialogPromise:null,onInit:function(){this.getView().setModel(cross.fnd.fiori.inbox.util.tools.Application.getImpl().AppI18nModel,"i18n");this._oTaskListController=this.getView().getViewData().parentController;this._oTableOperations=this.getView().getViewData().oTableOperations;this._tableHelper=this.getView().getViewData().oTableHelper;this._oResourceBundle=this.getView().getModel("i18n").getResourceBundle();this._oFilterBar=this.byId("filterBar");this._tableHelper.setFilterbar(this,this._oFilterBar);this._oTaskListController.setFilterBar(this._oFilterBar);this._addSearchField();this._initializeFilterModel();this._oFilterBar.registerFetchData(this._fetchData);this._oFilterBar.registerApplyData(this._applyData);this._oFilterBar.registerGetFiltersWithValues(this._getFiltersWithValues);this._oFilterBar.fireInitialise();this.sCreatedByUniqueId=this.createId()+"DLG_CREATED_BY";this.oDataManager=cross.fnd.fiori.inbox.util.tools.Application.getImpl().getComponent().getDataManager();this._MAX_CREATED_BY=100;this.oDataManager.oModel.getMetaModel().loaded().then(function(){var n=this.oDataManager.getServiceMetadataNamespace();if(n==="com.sap.bpm.wfs.tcm.metadata"){this.getView().getModel("filter").setProperty("/showValueHelpForCreatedByFilter",false);}}.bind(this));q.when(this._oTaskListController._loadCustomAttributesDeferredForTasks,this._oTaskListController._loadCustomAttributesDeferredForTaskDefs).then(q.proxy(function(){var m=this.byId("taskdefinitionFilter");var t=this._oTaskListController._getTaskDefinitionFiltersForFilterBar();if(t){t=[t];}var e=new S("TaskName");m.bindItems({path:"taskDefinitions>/TaskDefinitionCollection",sorter:e,filters:t,factory:this._taskDefinitionListFactory});this._oFilterBar.setStandardItemText(this._oTaskListController._getScenrio());this._oFilterBar.setPersistencyKey(this._oTaskListController._getScenrioId());this._oFilterBar._initPersonalizationService();var v=this._oFilterBar._oVariantManagement.oVariantPopoverTrigger;var o=this._oResourceBundle.getText("filter.variantManagement.trigger");v.setTooltip(o);this._applyData.call(this._oFilterBar,{filter:[{name:"taskdefinition",selectedKeys:this._oTaskListController._getTaskDefinitionsForFilterBar()}]});this._oFilterBar.fireSearch();},this));},_taskDefinitionListFactory:function(i,C){var e=new I({key:"{taskDefinitions>TaskDefinitionID}",text:"{taskDefinitions>TaskName}"});return e;},onExit:function(){this._customColumns={previousVariantId:undefined};this._customFilters={};},_addSearchField:function(){var s=this._oFilterBar.getBasicSearch();if(!s){this._oBasicSearch=new b({showSearchButton:true,search:[this.onSearchPressed,this]});this._oFilterBar.setBasicSearch(this._oBasicSearch);}},_initializeFilterModel:function(){var v=new J({StatusCollection:[{statusKey:"READY",statusText:this._oResourceBundle.getText("filter.status.new"),rank:"1"},{statusKey:"IN_PROGRESS",statusText:this._oResourceBundle.getText("filter.status.inProgress"),rank:"2"},{statusKey:"RESERVED",statusText:this._oResourceBundle.getText("filter.status.reserved"),rank:"3"},{statusKey:"EXECUTED",statusText:this._oResourceBundle.getText("filter.status.awaitingConfirmation"),rank:"4"}],PriorityCollection:[{priorityKey:"VERY_HIGH",priorityText:this._oResourceBundle.getText("view.Workflow.priorityVeryHigh"),rank:"1"},{priorityKey:"HIGH",priorityText:this._oResourceBundle.getText("view.Workflow.priorityHigh"),rank:"2"},{priorityKey:"MEDIUM",priorityText:this._oResourceBundle.getText("view.Workflow.priorityMedium"),rank:"3"},{priorityKey:"LOW",priorityText:this._oResourceBundle.getText("view.Workflow.priorityLow"),rank:"4"}],DueDateDateDp:{valueFormat:"yyyy/MM/dd"},CreationDateDrs:{delimiter:"-",valueFormat:"yyyy/MM/dd"},showValueHelpForCreatedByFilter:true});v.setDefaultBindingMode("TwoWay");this.getView().setModel(v,"filter");},_setinitialStatusFilters:function(){this._oTableOperations.addFilter(new F({path:"Status",operator:a.EQ,value1:"READY"}),"Status");this._oTableOperations.addFilter(new F({path:"Status",operator:a.EQ,value1:"RESERVED"}),"Status");this._oTableOperations.addFilter(new F({path:"Status",operator:a.EQ,value1:"IN_PROGRESS"}),"Status");this._oTableOperations.addFilter(new F({path:"Status",operator:a.EQ,value1:"EXECUTED"}),"Status");},onChange:function(e){if(this._oTaskListController._loadCustomAttributesDeferredForTasks.state()==="resolved"&&this._oTaskListController._loadCustomAttributesDeferredForTaskDefs.state()==="resolved"){this._onChangeInternal(e);}else{q.when(this._oTaskListController._loadCustomAttributesDeferredForTasks,this._oTaskListController._loadCustomAttributesDeferredForTaskDefs).then(q.proxy(function(){this._onChangeInternal(e);},this));}},_onChangeInternal:function(e){var f=e.getSource().getName();if(f==="taskdefinition"){this._tableHelper.hideCustomAttributeColumns(false);var C=this._oFilterBar.determineControlByName(f);this._tableHelper.showCustomAttributeColumns(C.getSelectedKeys());}this._oFilterBar.fireFilterChange(e);},onFBFilterChange:function(){this._oTableOperations.resetFilters();var f=this._oFilterBar.getAllFilterItems(true);var C;if(f){for(var i=0;i<f.length;i++){C=this._oFilterBar.determineControlByFilterItem(f[i]);this._addFilterFor(C,f[i].getName());}}this._oTableOperations.applyTableOperations();this._oFilterBar._updateToolbarText();},_addFilterFor:function(C,n){if(n==="status"||n==="priority"||n==="taskdefinition"){var k=C.getSelectedKeys();if(k.length>0){var p="Status";if(n==="priority"){p="Priority";}else if(n==="taskdefinition"){p="TaskDefinitionID";}for(var i=0;i<k.length;i++){this._oTableOperations.addFilter(new F({path:p,operator:a.EQ,value1:k[i]}),p);this._oTableOperations.addTDKey(k[i]);}}else if(n==="status"){this._setinitialStatusFilters();}}else if(n==="duedate"){var v=C.getDateValue();if(v){v.setDate(v.getDate());v.setHours(23);v.setMinutes(59);v.setSeconds(59);this._oTableOperations.addFilter(new F({path:"CompletionDeadLine",operator:a.LT,value1:v}),"CompletionDeadLine");this._oTableOperations.addFilter(new F({path:"CompletionDeadLine",operator:a.NE,test:function(y){return(y!=null&&y.toString().trim()!=null);}}),"CompletionDeadLine");}}else if(n==="tasktitle"){var o;if(C.getValue()!==""){o=a.Contains;this._oTableOperations.addFilter(new F({path:"TaskTitle",operator:o,value1:C.getValue()}),"TaskTitle");}var t=C.getTokens();for(var j=0;j<t.length;j++){if(t[j].data().range.exclude){o=a.NE;}else{o=t[j].data().range.operation;}this._oTableOperations.addFilter(new F({path:"TaskTitle",operator:o,value1:t[j].data().range.value1,value2:t[j].data().range.value2}),"TaskTitle");}}else if(n==="creationdate"){var f=C.getDateValue();var s=C.getSecondDateValue();if(f){s.setDate(s.getDate());s.setHours(23);s.setMinutes(59);s.setSeconds(59);this._oTableOperations.addFilter(new F({path:"CreatedOn",operator:a.BT,value1:f,value2:s}),"CreatedOn");}}else if(n==="createdby"){var e=C.getValue();if(e){var g=new F({path:"CreatedBy",operator:a.Contains,value1:e});var h=new F({path:"CreatedByName",operator:a.Contains,value1:e});this._oTableOperations.addFilter(g,"CreatedBy");this._oTableOperations.addFilter(h,"CreatedBy");}var t=C.getTokens();for(var j=0;j<t.length;j++){e=t[j].data().range.value1;var l=new F({path:"CreatedBy",operator:a.EQ,value1:e});this._oTableOperations.addFilter(l,"CreatedBy");}}else if(C.sCustomAttributeType==="Edm.DateTime"){var m=C.getDateValue();var r=C.getSecondDateValue();if(m){r.setDate(r.getDate());r.setHours(23);r.setMinutes(59);r.setSeconds(59);m=m.getTime();r=r.getTime();var u=new F({path:C.getName(),operator:a.BT,value1:m,value2:r,comparator:C.fnCustomAttributeComparator});this._oTableOperations.addFilter(u,C.getName());}}else if(C.sCustomAttributeType==="Edm.Time"){if(C.getDateValue()!=null){var w=C.getDateValue().getTime()-(C.getDateValue().getTimezoneOffset()-(new Date()).getTimezoneOffset())*60000;var u=new F({path:C.getName(),operator:a.EQ,value1:w,comparator:C.fnCustomAttributeComparator});this._oTableOperations.addFilter(u,C.getName());}}else{var o;if(C.getValue()!==""){o=a.Contains;this._oTableOperations.addFilter(new F({path:C.getName(),operator:o,value1:C.getValue()}),C.getName());}var x=C.getTokens();for(var j=0;j<x.length;j++){if(x[j].data().range.exclude){o=a.NE;}else{o=x[j].data().range.operation;}if(C.fnCustomAttributeComparator!=null){this._oTableOperations.addFilter(new F({path:x[j].data().range.keyField,operator:o,value1:x[j].data().range.value1,value2:x[j].data().range.value2,comparator:C.fnCustomAttributeComparator}),x[j].data().range.keyField);}else{this._oTableOperations.addFilter(new F({path:x[j].data().range.keyField,operator:o,value1:x[j].data().range.value1,value2:x[j].data().range.value2}),x[j].data().range.keyField);}}}},onSearchPressed:function(e){this._oTaskListController._oTable.removeSelections();var s=this._oBasicSearch.getValue();this._oTableOperations.setSearchTerm(s.trim());this.onFBFilterChange();this._oTaskListController.byId("taskListPage").setShowFooter(false);},_fetchData:function(){var g;var o;var e=[];var f=this.getFilterGroupItems();for(var i=0;i<f.length;i++){o={};g=null;if(f[i].getGroupName){g=f[i].getGroupName();o.group_name=g;}o.name=f[i].getName();var C=this.determineControlByFilterItem(f[i]);if(C){if(o.name==="status"||o.name==="priority"||o.name==="taskdefinition"){o.selectedKeys=C.getSelectedKeys();}else if(o.name==="duedate"){o.dueDate=C.getDateValue();}else if(o.name==="creationdate"){o.firstDate=C.getDateValue();o.secondDate=C.getSecondDateValue();}else if(C.sCustomAttributeType==="Edm.DateTime"){o.date1=C.getDateValue();o.date2=C.getSecondDateValue();}else if(C.sCustomAttributeType==="Edm.Time"){o.date=C.getDateValue();}else{var t=C.getTokens();var h=[];for(var j=0;j<t.length;j++){h[j]={selected:t[j].getSelected(),key:t[j].getKey(),text:t[j].getText(),data:t[j].data()};}o.tokens=h;o.value=C.getValue();}}e.push(o);}var s=this.getParent().getController()._oTableOperations.getSorter();var k;if(s.length>0){k={path:s[0].sPath,desc:s[0].bDescending};}return{filter:e,sort:k};},_applyData:function(e){var o;if(e instanceof Array){o=e;}else if(e.filter){o=e.filter;}else{o=e;}var g;var f;for(var i=0;i<o.length;i++){g=null;f=o[i];if(f.group_name){g=f.group_name;}var C=this.determineControlByName(f.name,g);if(C){if(f.name==="status"||f.name==="priority"||f.name==="taskdefinition"){C.setSelectedKeys(f.selectedKeys);C.fireSelectionFinish();}else if(f.name==="duedate"){if(f.dueDate){C.setDateValue(new Date(f.dueDate));}else{C.setDateValue(null);}}else if(f.name==="creationdate"){if(f.firstDate&&f.secondDate){C.setDateValue(new Date(f.firstDate));C.setSecondDateValue(new Date(f.secondDate));}else{C.setDateValue(null);C.setSecondDateValue(null);}}else if(C.sCustomAttributeType==="Edm.DateTime"){if(f.date1&&f.date2){C.setDateValue(new Date(f.date1));C.setSecondDateValue(new Date(f.date2));}else{C.setDateValue(null);C.setSecondDateValue(null);}}else if(C.sCustomAttributeType==="Edm.Time"){if(f.date){C.setDateValue(new Date(f.date));}else{C.setDateValue(null);}}else{var t=[];for(var j=0;j<f.tokens.length;j++){t[j]=new T({selected:f.tokens[j].selected,key:f.tokens[j].key,text:f.tokens[j].text}).data(f.tokens[j].data);}C.setTokens(t);C.setValue(f.value);}}}if(!(e instanceof Array)&&e.sort){this.getParent().getController()._oTableOperations.addSorter(new S(e.sort.path,e.sort.desc));}},_getFiltersWithValues:function(){var i;var C;var f=this.getFilterGroupItems();var e=[];var n;for(i=0;i<f.length;i++){n=f[i].getName();C=this.determineControlByFilterItem(f[i]);if(C){if((n==="status"||n==="priority"||n==="taskdefinition")){if(C.getSelectedKeys().length>0){e.push(f[i]);}}else if(n==="duedate"){if(C.getDateValue()){e.push(f[i]);}}else if(n==="creationdate"){if(C.getDateValue()&&C.getSecondDateValue()){e.push(f[i]);}}else if(n==="tasktitle"){if((C.getTokens()&&C.getTokens().length>0)||C.getValue()){e.push(f[i]);}}else if(C.sCustomAttributeType==="Edm.DateTime"){if(C.getDateValue()&&C.getSecondDateValue()){e.push(f[i]);}}else if(C.sCustomAttributeType==="Edm.Time"){if(C.getDateValue()){e.push(f[i]);}}else if((C.getTokens()&&C.getTokens().length>0)||C.getValue()){e.push(f[i]);}}}return e;},onFBVariantLoaded:function(e){var f=e.getSource().getCurrentVariantId();if(f===""){e.getSource().fireSearch(e);return;}},onValueHelpRequest:function(e,o){var s=e.getSource();var f=(s.getName()==="tasktitle")?this._oResourceBundle.getText("filter.taskTitle"):o;var v=new V({title:f,supportRanges:true,supportRangesOnly:true,key:s.getName(),descriptionKey:f,stretch:D.system.phone,ok:function(C){var j=C.getParameter("tokens");s.setTokens(j);s.setValue("");v.close();},cancel:function(C){v.close();},afterClose:function(){v.destroy();}});v.setRangeKeyFields([{label:f,key:s.getName()}]);var t=s.getTokens();if(s.getValue()!==""){var g=new T({key:"range_"+t.length,selected:false,text:"*"+s.getValue()+"*"});g.data({range:{exclude:false,keyField:s.getName(),operation:a.Contains,value1:s.getValue()}});t.push(g);}v.setTokens(t);var h=[];var i=s.getName()==="tasktitle"?"Edm.String":s.data().type;switch(i){case"Edm.Boolean":h.push(d.EQ);break;case"Edm.DateTime":case"Edm.Time":case"Edm.DateTimeOffset":case"Edm.Decimal":case"Edm.Double":case"Edm.Int16":case"Edm.Int32":case"Edm.Int64":case"Edm.Single":h.push(d.BT);h.push(d.EQ);h.push(d.GE);h.push(d.GT);h.push(d.LE);h.push(d.LT);break;case"Edm.String":h.push(d.Contains);h.push(d.StartsWith);h.push(d.EndsWith);h.push(d.EQ);break;default:h.push(d.BT);h.push(d.Contains);h.push(d.StartsWith);h.push(d.EndsWith);h.push(d.EQ);h.push(d.GE);h.push(d.GT);h.push(d.LE);h.push(d.LT);break;}v.setIncludeRangeOperations(h,"text");if(s.$().closest(".sapUiSizeCompact").length>0){v.addStyleClass("sapUiSizeCompact");}else{v.addStyleClass("sapUiSizeCozy");}v.open();},onValueHelpCreatedBy:function(e,o){if(this._oDialogPromise===null){this._oDialogPromise=this._createDialog();this._oDialogPromise.then(function(f){this.getView().addDependent(f);this._setUpAndOpenDialog.call(this);return f;}.bind(this));}else{this._setUpAndOpenDialog();}},onSearchOfCreatedBy:function(e){var s=e.getSource().getValue();this.searchUsers(s);},searchUsers:function(s){var C=c.byId(this.sCreatedByUniqueId,"LST_SEARCH_USERS");if(s==undefined||s.trim().length===0){if(C.getModel("userModel")){C.getModel("userModel").setProperty("/users",[]);}return;}var o=c.byId(this.sCreatedByUniqueId,"LST_SEARCH_USERS");var u=o.getModel("userModel");if(!u){o.setModel(new J(),"userModel");}var O;var t=this;var f=function(r){O=r[0].SAP__Origin;if(O){t._oTaskListController._oTable.setBusyIndicatorDelay(50000);o.setBusyIndicatorDelay(0);o.setBusy(true);o.removeSelections();this.oDataManager.searchUsers(O,s,this._MAX_CREATED_BY,q.proxy(function(r){C.getModel("userModel").setProperty("/users",r);o.setBusy(false);t._oTaskListController._oTable.setBusyIndicatorDelay(0);},this));}};var e=function(g){this.oDataManager.oDataRequestFailed(g);};this.oDataManager.readSystemInfoCollection(q.proxy(f,this),q.proxy(e,this));},putUserTokenIntoCreatedByFilter:function(u){if(u){var C=u.getBindingContext("userModel");var s=C.getProperty("DisplayName");var e=C.getProperty("UniqueName");var f=this.byId("createdbyFilter");var t=f.getTokens();for(var i=0;i<t.length;i++){if(t[i].userUniqueName===e){return;}}var g=new T({key:"range_"+t.length,selected:false,text:s});g.data({range:{exclude:false,keyField:"CreatedBy",operation:a.EQ,value1:e}});t.push(g);f.setTokens(t);}},resetCreatedByValueHelp:function(){var s=c.byId(this.sCreatedByUniqueId,"search_createdby_field");s.setValue("");var o=c.byId(this.sCreatedByUniqueId,"LST_SEARCH_USERS");if(o.getModel("userModel")){o.getModel("userModel").setProperty("/users",{});}},handleCreatedByPopOverOk:function(e){var s=c.byId(this.sCreatedByUniqueId,"LST_SEARCH_USERS");var f=s.getSelectedItems();for(var i=0;i<f.length;i++){this.putUserTokenIntoCreatedByFilter(f[i]);}this.handleCreatedByPopOverCancel(e);},handleCreatedByPopOverCancel:function(e){var f=e.getSource().getParent();this.resetCreatedByValueHelp();if(f){f.close();}},handleLiveChange:function(e){if(e.getSource().getValue()===""){var s=c.byId(this.sCreatedByUniqueId,"LST_SEARCH_USERS");s.removeSelections();if(s.getModel("userModel")){s.getModel("userModel").setProperty("/users",{});}}},handleUserDetailPress:function(e){var s=e.getSource();var p=s.getBindingContextPath();var f=p.substring(7,p.length);var g=s.getParent().getModel("userModel").getData().users[f];if(D.system.tablet&&D.orientation.portrait){E.displayEmployeeCard(e.getSource()._detailIcon,g);}else{E.displayEmployeeCard(e.getSource(),g);}},onClearPressed:function(e){this._oFilterBar.setCurrentVariantId(e.getSource().getCurrentVariantId());this._oTaskListController.byId("taskListPage").setShowFooter(false);},_createDialog:function(){return c.load({id:this.sCreatedByUniqueId,type:"XML",name:"cross.fnd.fiori.inbox.frag.UserPickerDialog",controller:this}).catch(function(){B.error("User Picker Dialog was not created successfully")});},_setUpAndOpenDialog:function(){var s=c.byId(this.sCreatedByUniqueId,"LST_SEARCH_USERS");if(s){s.setMode("MultiSelect");s.setIncludeItemInSelection(true);s.setRememberSelections(false);}this._oDialogPromise.then(function(o){o.open();}.bind(this))}});});
