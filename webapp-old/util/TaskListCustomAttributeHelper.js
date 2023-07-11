/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/base/Object","sap/m/Column","sap/ui/base/DataType","cross/fnd/fiori/inbox/util/CustomAttributeComparator","sap/ui/Device","sap/m/Label","sap/m/TimePicker","sap/m/library","sap/m/Text","sap/m/DateRangeSelection","sap/ui/comp/filterbar/FilterItem","sap/m/MultiInput"],function(U,C,D,a,b,L,T,l,c,d,F,M){"use strict";var P=l.PopinDisplay;return U.extend("cross.fnd.fiori.inbox.util.TaskListCustomAttributeHelper",{constructor:function(o,v,t,g,s,e){this._oView=v;this._oController=o;this._oTable=t;this._oGrouping=g;this._oSorting=s;this._oTableOperations=e;this._customColumns={};this._customFilters={};this._visibleCustomColumns=[];this._visibleCustomFilters=[];},showCustomAttributeColumns:function(t){var e=this._getCustomAttributes(t);var f,g;for(var i=0;i<e.length;i++){f=this._addColumn(e[i]);if(f===null){continue;}this._oTableOperations.addSearchableField(encodeURIComponent(e[i].Name));this._visibleCustomColumns.push({name:e[i].Name,columnObj:f});g=this._addCustomFilterItem(e[i]);g.setVisible(true);this._visibleCustomFilters.push(g);this._oGrouping.showCustomGroupItem(e[i].Name);this._oSorting.showCustomSortItem(e[i].Name);}if(sap.ushell.Container){this._oController._oTablePersoController.refresh();}if(e.length>0&&!b.system.phone){this._oController.byId("statusColumn").setWidth("7%");this._oController.byId("priorityColumn").setWidth("7%");this._oController.byId("createdByColumn").setWidth("10%");this._oController.byId("createdOnColumn").setWidth("9%");this._oController.byId("dueDateColumn").setWidth("9%");}this._oTable.bindItems(this._oTable.getBindingInfo("items"));this._oTableOperations.setSortChanged(true);this._oTableOperations.setFilterChanged(true);this._oTableOperations.applyTableOperations();this._oTable.getBinding("items").refresh();},hideCustomAttributeColumns:function(r){var e,f;if(this._visibleCustomColumns.length>0&&!b.system.phone){this._oController.byId("statusColumn").setWidth("");this._oController.byId("priorityColumn").setWidth("");this._oController.byId("createdByColumn").setWidth("");this._oController.byId("createdOnColumn").setWidth("");this._oController.byId("dueDateColumn").setWidth("");}while(this._visibleCustomColumns.length){e=this._visibleCustomColumns.pop();this._oTable.removeColumn(e.columnObj.column);this._oTableOperations.removeSearchableField(encodeURIComponent(e.name));var t=this._oTable.getBindingInfo("items").template;t.removeCell(e.columnObj.cell);f=this._visibleCustomFilters.pop();var o=this._oFilterBar.determineControlByName(f.getName());if(typeof o.setTokens==="function")o.setTokens([]);o.setValue("");f.setVisible(false);this._oGrouping.hideCustomGroupItem(e.name);this._oSorting.hideCustomSortItem(e.name);}if(r){if(sap.ushell.Container){this._oController._oTablePersoController.refresh();}this._oTable.bindItems(this._oTable.getBindingInfo("items"));this._oTableOperations.setSortChanged(true);this._oTableOperations.setFilterChanged(true);this._oTableOperations.applyTableOperations();this._oTable.getBinding("items").refresh();}},setFilterbar:function(f,e){this._filterbarController=f;this._oFilterBar=e;},destroy:function(){var e;var k;for(k in this._customColumns){e=this._customColumns[k];e.column.destroy();e.cell.destroy();}for(k in this._customFilters){this._customFilters[k].destroy();}this._oGrouping.destroy();this._oSorting.destroy();},getVisibleCustomFilters:function(){return this._visibleCustomFilters;},_getCustomAttributes:function(t){var e=[];var m=[];var f=this._oView.getModel("taskDefinitions");for(var i=0;i<t.length;i++){e=f.getProperty("/Columns/"+t[i].toUpperCase());if(e){if(i===0){m=m.concat(e);}else{var g=false;for(var j=0;j<e.length;j++){for(var k=0;k<m.length;k++){if(e[j].Name===m[k].Name){g=true;break;}}if(!g){m.push(e[j]);}else{g=false;}}}}}return m;},_addColumn:function(e){var i=["CustomNumberValue","CustomNumberUnitValue","CustomObjectAttributeValue","CustomCreatedBy"];if(i.indexOf(e.Name)===-1){var f=this._customColumns[e.Name];if(!f){f=this._addCustomAttributeColumn(e);this._customColumns[e.Name]=f;}this._oTable.addColumn(f.column);var t=this._oTable.getBindingInfo("items").template;t.addCell(f.cell);return f;}else{return null;}},_addCustomFilterItem:function(e){var f=this._customFilters[e.Name];if(!f){f=this._addCustomFilter(e);this._customFilters[e.Name]=f;}return f;},_genSafeId:function(e,f,A,s){var g=A?A:"AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz0123456789_-.:";var h=(decodeURIComponent(e.TaskDefinitionID)+e.Name).replace(/\//g,"");var t=D.getType("sap.ui.core.ID");if(!t.isValid(h)){for(var i=0;i<h.length;i++){if(g.indexOf(h[i])<0){h=h.replace(new RegExp(h[i],"g"),h[i].charCodeAt(0));}}if((h.length>0)&&f){var j=s?s:"_AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz";if(j.indexOf(h[0])<0){h="a"+h;}}}return h;},_addCustomAttributeColumn:function(e){var i=this._genSafeId(e,true);var o=new C(i+"Column",{header:new L(i+"Lbl",{text:e.Label}),popinDisplay:P.Inline,minScreenWidth:"Tablet",demandPopin:true});var f=new c(i+"Txt",{text:"{parts:[{path:'taskList>"+encodeURIComponent(e.Name)+"'}], formatter:'cross.fnd.fiori.inbox.Conversions.fnCustomAttributeFormatter'}"});f.data({Type:e.Type});this._oGrouping.addCustomGroupItem(i,e.Name,e.Label);this._oSorting.addCustomSortItem(i,e.Name,e.Label);return{cell:f,column:o};},_addCustomFilter:function(e){var i=this._genSafeId(e,true);var t=e.Type;if(t!=null&&t.indexOf("Edm.")!==0){t=a.fnMapBPMTypes(t);}var f,o;if(t==="Edm.DateTime"){o=new d(i+"Filter",{name:encodeURIComponent(e.Name),delimiter:"-",change:[this._filterbarController.onChange,this._filterbarController]});o.sCustomAttributeType=t;o.fnCustomAttributeComparator=a.getCustomAttributeComparator(t);f=new F(i+"FI",{label:e.Label,name:encodeURIComponent(e.Name),partOfCurrentVariant:true,control:o});}else if(t==="Edm.Time"){o=new T(i+"Filter",{name:encodeURIComponent(e.Name),change:[this._filterbarController.onChange,this._filterbarController]});o.sCustomAttributeType=t;o.fnCustomAttributeComparator=a.getCustomAttributeComparator(t);f=new F(i+"FI",{label:e.Label,name:encodeURIComponent(e.Name),partOfCurrentVariant:true,control:o});}else{o=new M(i+"Filter",{name:encodeURIComponent(e.Name),valueHelpRequest:[e.Label,this._filterbarController.onValueHelpRequest],valueHelpOnly:false,change:[this._filterbarController.onChange,this._filterbarController],tokenChange:[this._filterbarController.onChange,this._filterbarController]}).data({type:t});o.sCustomAttributeType=t;o.fnCustomAttributeComparator=a.getCustomAttributeComparator(t);f=new F(i+"FI",{label:e.Label,name:encodeURIComponent(e.Name),partOfCurrentVariant:true,control:o});}this._oFilterBar.addFilterItem(f);return f;}});});
