/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/base/Object","sap/ui/model/Sorter","sap/ui/core/Fragment","sap/base/Log","sap/m/ViewSettingsItem","cross/fnd/fiori/inbox/util/Conversions","sap/ui/core/format/DateFormat"],function(U,S,F,B,V,C,D){"use strict";return U.extend("cross.fnd.fiori.inbox.util.TaskListGroupingHelper",{_oResourceBundle:null,_oTableOperations:null,_oView:null,_oGroupDialogPromise:null,_oCustomGroupItems:{},constructor:function(t,v){this._oResourceBundle=v.getController().getResourceBundle();this._oTableOperations=t;this._oView=v;},addCustomGroupItem:function(i,k,t){var e=encodeURIComponent(k);var g=new V(i+"Grouper",{key:e,text:t});this._getGroupingDialog().then(function(G){G.addGroupItem(g);});this._oCustomGroupItems[k]=g;this._oGroupFunctions[e]=function(K,l){return{key:l.getProperty(K),text:l.getProperty(K)};};},hideCustomGroupItem:function(k){var g=this._oCustomGroupItems[k];if(g){this._getGroupingDialog().then(function(G){G.removeGroupItem(g);});}},showCustomGroupItem:function(k){var g=this._oCustomGroupItems[k];if(g){this._getGroupingDialog().then(function(G){G.addGroupItem(g);});}},destroy:function(){for(var k in this._oCustomGroupItems){this._oCustomGroupItems[k].destroy();}},openGroupingDialog:function(){this._getGroupingDialog().then(function(g){g.open();});},onGroupingDialogConfirmed:function(e){var p=e.getParameters(),s,f,g;if(p.groupItem&&p.groupItem.getKey()!==""){s=p.groupItem.getKey();f=s;g=p.groupDescending;if(s==="PriorityNumber"){g=!p.groupDescending;}this._oTableOperations.setGrouping(new S(s,g,(this._oGroupFunctions[f].bind(this,f))));}else{this._oTableOperations.removeGrouping();}this._oTableOperations.applyTableOperations();},_getGroupingDialog:function(){if(this._oGroupDialogPromise!==null){return this._oGroupDialogPromise}this._oGroupDialogPromise=F.load({name:"cross.fnd.fiori.inbox.frag.TaskGroupingDialog",controller:this}).then(function(g){this._oView.getController().attachControl(g);return g;}.bind(this)).catch(function(){B.error("Task Grouping dialog was not created successfully")});return this._oGroupDialogPromise;},_getNameGrouper:function(l,f,k){var t=l+": "+f;return{key:k,text:t};},_oGroupFunctions:{TaskDefinitionID:function(k,l){var a=l.getProperty("TaskDefinitionID");var f=l.getProperty("TaskDefinitionName");return this._getNameGrouper(this._oResourceBundle.getText("group.taskType"),f,a);},Status:function(k,l){var a=l.getProperty("Status");var f=C.formatterStatus.call(this._oView,l.getProperty("SAP__Origin"),a);return this._getNameGrouper(this._oResourceBundle.getText("group.status"),f,a);},PriorityNumber:function(k,l){var a=l.getProperty("Priority");var f=C.formatterPriority.call(this._oView,l.getProperty("SAP__Origin"),a);return this._getNameGrouper(this._oResourceBundle.getText("group.priority"),f,a);},CompletionDeadLine:function(k,l){var d=l.getProperty("CompletionDeadLine");var f=this._oResourceBundle.getText("group.duedate.none");if(d!==null){var a=D.getDateInstance({pattern:"dd/MM/yyyy",relative:true,relativeScale:"auto"},sap.ui.getCore().getConfiguration().getLocale());f=a.format(new Date(d));}return this._getNameGrouper(this._oResourceBundle.getText("filter.dueDate"),f,f);},CreatedOn:function(k,l){var c=l.getProperty("CreatedOn");var d=D.getDateInstance({pattern:"dd/MM/yyyy",relative:true,relativeScale:"auto"},sap.ui.getCore().getConfiguration().getLocale());var f=d.format(new Date(c));return this._getNameGrouper(this._oResourceBundle.getText("view.Information.createdOn"),f,f);},CreatedBy:function(k,l){var c=l.getProperty("CreatedByName");return this._getNameGrouper(this._oResourceBundle.getText("multi.summary.createdBy"),c,c);}}});});