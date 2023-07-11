/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/base/Object","sap/ui/model/Filter","sap/ui/model/FilterOperator","sap/ui/model/json/JSONModel","sap/ui/model/odata/ODataUtils","sap/ui/Device","sap/ui/comp/library","sap/m/Token","cross/fnd/fiori/inbox/util/Utils","cross/fnd/fiori/inbox/model/formatter","cross/fnd/fiori/inbox/util/CustomAttributeComparator"],function(U,F,a,J,O,D,l,T,b,f,C){"use strict";var V=l.valuehelpdialog.ValueHelpRangeOperation;var c=l.valuehelpdialog.ValueHelpDialog;return U.extend("cross.fnd.fiori.inbox.util.FilterBarHelper",{constructor:function(t,o,w,d,e){this._oTableOperations=t;this._oFilterBar=o;this._oWorklistView=w;this._taskListCustomAttributeHelper=d;this._oTableOperationsHelper=e;this._taskListCustomAttributeHelper.setFilterbar(this,this._oFilterBar);},resetFilterBar:function(){this._oTableOperations.resetUserFilters();this._setFilterText();var d=this._oFilterBar.getAllFilterItems(true);if(d){var o;for(var i=0;i<d.length;i++){o=this._oFilterBar.determineControlByFilterItem(d[i]);switch(o.getMetadata().getName()){case"sap.m.MultiComboBox":o.clearSelection();break;case"sap.m.SearchField":o.setValue();break;case"sap.m.DateRangeSelection":o.setValue();break;case"sap.m.DatePicker":o.setValue();break;case"sap.m.MultiInput":o.destroyTokens();break;default:o.setValue();}}}},manageTaskTypeFilters:function(t){var w=this._oWorklistView.getController().getModel("worklistView");if(t&&(t.length>0)){if(t.length===1){w.setProperty("/caFilteringInfoVisible",false);w.setProperty("/caShowCustomFilters",true);}else{w.setProperty("/caFilteringInfoVisible",true);w.setProperty("/caShowCustomFilters",false);this._taskListCustomAttributeHelper.destroyCustomFilters();}this._oTableOperations.setURLParameter("$expand","CustomAttributeData");this._taskListCustomAttributeHelper.showCustomAttributeColumns(t);}else{w.setProperty("/caFilteringInfoVisible",false);this._taskListCustomAttributeHelper.hideCustomAttributeColumns();this._oTableOperations.removeURLParameter("$expand");}},manageTaskTypeSorters:function(t){var r=false;var s=this._oTableOperations.getSorters();if(t&&(t.length!==1)&&b.checkIfFirstSorterIsCustomAttribute(s)){r=true;}else if(b.checkIfFirstSorterIsCustomAttribute(s)){var d=this._taskListCustomAttributeHelper.getCustomAttributeList();r=true;for(var k=0;k<d.length;k++){if(s[0].sPath===d[k].Name){r=false;break;}}}if(r){this._oTableOperationsHelper.resetSortDialog();}},getTaskDefsFromFilterKeys:function(t){var d=[];for(var i=0;i<t.length;i++){var e=t[i].split("___")[2];d.push(e);}return d.length?d:null;},prepareSearch:function(o){var q=o.getProperty("value");var w=this._oWorklistView.getController();if(q&&q.length>0){var s="";if(w._aCustomStringAttributes.length>0){s=", "+w._aCustomStringAttributes.join(", ");}w.getModel("worklistView").setProperty("/tableNoDataText",w.getResourceBundle().getText("worklistNoDataWithSearchTextCustomAttributes")+s);this._oTableOperations.setURLParameter("searchText",q);}else{this._oTableOperations.removeURLParameter("searchText");}w._bApplyingFilters=true;},applyFilters:function(e){this._oTableOperations.resetUserFilters();var t=this._oFilterBar.determineControlByName("taskDefinition");var d=this.getTaskDefsFromFilterKeys(t.getSelectedKeys());this.manageTaskTypeFilters(d);this.manageTaskTypeSorters(d);var g=[];var o;var h=this._oFilterBar.getAllFilterItems(true);if(h&&(h.length>0)){var s;for(var i=0;i<h.length;i++){o=this._oFilterBar.determineControlByFilterItem(h[i]);if(o.getMetadata().getName()==="sap.m.SearchField"){this.prepareSearch(o);}else{s=this._addFilterFor(o,h[i].getName());if(s){g.push(h[i].getLabel());}}}}this._oWorklistView.getController()._bApplyingFilters=true;this._oTableOperations.applyTableOperations();this._setFilterText(g);},_setFilterText:function(d){var e="";if(d&&(d.length>0)){e=this._oWorklistView.getController().getResourceBundle().getText("filter.filteredBy.text",[d.length])+d.join(", ");}this._oFilterModel.setProperty("/filteredByText",e);},_addFilterFor:function(o,n){if(n==="search"){return;}var s="";var d;var t=o.sCustomAttributeType?C.fnMapDataTypes(o.sCustomAttributeType):"";if(n==="status"||n==="priority"||n==="taskDefinition"){s=this._prepareTableFilteringForTtPrSt(o);}else if(n==="duedate"){s=this._prepareTableFilteringForDueBy(o);}else if(n==="creationdate"){s=this._prepareTableFilteringForCreationDate(o);}else if(t==="Edm.DateTime"){var e=o.getDateValue();var g=o.getSecondDateValue();if(e){g.setDate(g.getDate());g.setHours(23);g.setMinutes(59);g.setSeconds(59);e=O.formatValue(e,t);g=O.formatValue(g,t);d=new F({path:o.getName(),operator:a.BT,value1:e,value2:g,comparator:o.fnCustomAttributeComparator});this._oTableOperations.addUserFilter(d,o.getName());}}else if(t==="Edm.Time"){if(o.getDateValue()!==null){var h=o.getDateValue().getTime()-(o.getDateValue().getTimezoneOffset()-(new Date()).getTimezoneOffset())*60000;d=new F({path:o.getName(),operator:a.EQ,value1:h,comparator:o.fnCustomAttributeComparator});this._oTableOperations.addUserFilter(d,o.getName());}}else{var v;if(o.getValue()!==""){v=a.Contains;this._oTableOperations.addUserFilter(new F({path:o.getName(),operator:v,value1:o.getValue()}),o.getName());}var i=o.getTokens();for(var j=0;j<i.length;j++){if(i[j].data().range.exclude){v=a.NE;}else{v=i[j].data().range.operation;}if(o.fnCustomAttributeComparator!==null){this._oTableOperations.addUserFilter(new F({path:i[j].data().range.keyField,operator:v,value1:i[j].data().range.value1,value2:i[j].data().range.value2,comparator:o.fnCustomAttributeComparator}),i[j].data().range.keyField);}else{this._oTableOperations.addUserFilter(new F({path:i[j].data().range.keyField,operator:v,value1:i[j].data().range.value1,value2:i[j].data().range.value2}),i[j].data().range.keyField);}}}return s;},_prepareTableFilteringForCreationDate:function(o){var d=o.getDateValue();var s=o.getSecondDateValue();var v="";if(d){s.setDate(s.getDate());s.setHours(23);s.setMinutes(59);s.setSeconds(59);this._oTableOperations.addUserFilter(new F({path:"CreatedOn",operator:a.BT,value1:d,value2:s}),"CreatedOn");v=f.formatDate(d)+"-"+f.formatDate(s);}return v;},_prepareTableFilteringForDueBy:function(o){var d=o.getDateValue();var v="";if(d){d.setDate(d.getDate());d.setHours(23);d.setMinutes(59);d.setSeconds(59);this._oTableOperations.addUserFilter(new F({path:"CompletionDeadLine",operator:a.LT,value1:d}),"CompletionDeadLine");this._oTableOperations.addUserFilter(new F({path:"CompletionDeadLine",operator:a.NE,test:function(e){return(e!=null&&e.toString().trim()!=null);}}),"CompletionDeadLine");v=f.formatDate(d);}return v;},_prepareTableFilteringForTtPrSt:function(o){var k=o.getSelectedKeys();k.forEach(function(e){var S=e.split("___"),p=S[0],g=S[1],v=S[2],h=S[3],j;if(p==="TaskDefinitionID"&&v==="Others"){var t=this._oWorklistView.getModel("taskTypesModel").getData();var m=t.length-1;var n=t[m].TaskDefinitionIds;for(var i=0;i<n.length;i++){v=n[i];j=new F(p,g,v,h);}}else{j=new F(p,g,v,h);}this._oTableOperations.addUserFilter(j,p);}.bind(this));var d=o.getSelectedItems();var s=[];for(var i=0;i<d.length;i++){s.push(d[i].getText());}return s.join();},getFilterModel:function(){if(!this._oFilterModel){this._oFilterModel=new J({StatusCollection:[{statusKey:"Status___EQ___READY",statusText:this._oWorklistView.getController().getResourceBundle().getText("FilterItem_StatusReadyAsOpen"),rank:"1"},{statusKey:"Status___EQ___IN_PROGRESS",statusText:this._oWorklistView.getController().getResourceBundle().getText("FilterItem_StatusInProgress"),rank:"2"},{statusKey:"Status___EQ___RESERVED",statusText:this._oWorklistView.getController().getResourceBundle().getText("FilterItem_StatusReserved"),rank:"3"}],PriorityCollection:[{priorityKey:"Priority___EQ___VERY_HIGH",priorityText:this._oWorklistView.getController().getResourceBundle().getText("FilterItem_VeryHighPriority"),rank:"1"},{priorityKey:"Priority___EQ___HIGH",priorityText:this._oWorklistView.getController().getResourceBundle().getText("FilterItem_HighPriority"),rank:"2"},{priorityKey:"Priority___EQ___MEDIUM",priorityText:this._oWorklistView.getController().getResourceBundle().getText("FilterItem_MediumPriority"),rank:"3"},{priorityKey:"Priority___EQ___LOW",priorityText:this._oWorklistView.getController().getResourceBundle().getText("FilterItem_LowPriority"),rank:"4"}],CreationDateDrs:{delimiter:"-"},filteredByText:"",filterTextLabelVisible:false});this._oFilterModel.setDefaultBindingMode("TwoWay");}return this._oFilterModel;},onValueHelpRequest:function(e,d){var s=e.getSource();var g=d;var v=new c({title:g,supportRanges:true,supportRangesOnly:true,key:s.getName(),descriptionKey:g,stretch:D.system.phone,ok:function(j){var k=j.getParameter("tokens");s.setTokens(k);s.setValue("");v.close();},cancel:function(j){v.close();},afterClose:function(){v.destroy();}});v.setRangeKeyFields([{label:g,key:s.getName()}]);var t=s.getTokens();if(s.getValue()!==""){var h=new T({key:"range_"+t.length,selected:false,text:"*"+s.getValue()+"*"});h.data({range:{exclude:false,keyField:s.getName(),operation:a.Contains,value1:s.getValue()}});t.push(h);}v.setTokens(t);var o=[];var i=s.data().type;switch(i){case"Edm.Boolean":o.push(V.EQ);break;case"Edm.DateTime":case"Edm.Time":case"Edm.DateTimeOffset":case"Edm.Decimal":case"Edm.Double":case"Edm.Int16":case"Edm.Int32":case"Edm.Int64":case"Edm.Single":o.push(V.BT);o.push(V.EQ);o.push(V.GE);o.push(V.GT);o.push(V.LE);o.push(V.LT);break;case"Edm.String":o.push(V.EQ);break;default:o.push(V.BT);o.push(V.Contains);o.push(V.StartsWith);o.push(V.EndsWith);o.push(V.EQ);o.push(V.GE);o.push(V.GT);o.push(V.LE);o.push(V.LT);break;}v.setIncludeRangeOperations(o,"text");if(s.$().closest(".sapUiSizeCompact").length>0){v.addStyleClass("sapUiSizeCompact");}else{v.addStyleClass("sapUiSizeCozy");}v.open();}});});