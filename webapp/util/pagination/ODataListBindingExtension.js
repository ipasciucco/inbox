/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/model/odata/CountMode","sap/ui/model/odata/OperationMode","sap/ui/model/odata/v2/ODataListBinding","sap/ui/model/ChangeReason","cross/fnd/fiori/inbox/util/pagination/CustomFilterProcessor","cross/fnd/fiori/inbox/util/pagination/CustomSorterProcessor"],function(C,O,a,b,c,d){"use strict";var o=a.extend("cross.fnd.fiori.inbox.ODataListBindingExtension",{constructor:function(m,p,e,s,f,P){a.apply(this,arguments);this.sPaginationFilters="";this.sFilterParamsOld="";this.aPaginationFilters=[];if(P&&P.doNotLoadNewTasksfterAction){this.doNotLoadNewTasksfterAction=P.doNotLoadNewTasksfterAction;}},_fireChange:function(A){if(A.reason==="change"){if(this.sPath&&this.sPath.indexOf("TaskCollection")>0){this.applyClientSideFilterForStatus();this.applyClientSideSort();}}a.prototype._fireChange.call(this,A);}});o.prototype.createPaginationFilterParams=function(f){if(this.sFilterParams){this.sFilterParams=a.createFilterParams(f);}};o.prototype.createPaginationSortParams=function(s){if(this.sSortParams){this.sSortParams=a.createSortParams(s);}};o.prototype.loadData=function(s,l,p){if(this.sOperationMode===O.Server&&this.doNotLoadNewTasksfterAction&&s&&s>0){this.bGetContextsDataRequestedisSet=true;return;}if(this.sOperationMode===O.Client){if(this.sFilterParams===null){var A=this.aFilters.concat(this.aApplicationFilters);if(A||jQuery.isArray(A)||!A.length===0){this.createFilterParams(A);}}a.prototype.loadData.apply(this,arguments);}else{a.prototype.loadData.apply(this,arguments);}};o.prototype.getContexts=function(s,l,t){if(this.doNotLoadNewTasksfterAction&&this.sOperationMode===O.Server){var g=a.prototype.getContexts.apply(this,arguments);if(this.doNotLoadNewTasksfterAction&&this.bGetContextsDataRequestedisSet&&g&&g.dataRequested){this.bGetContextsDataRequestedisSet=false;g.dataRequested=false;}return g;}else{return a.prototype.getContexts.apply(this,arguments);}};o.prototype.applyClientSideFilterForStatus=function(f,m){var t=this,e,F=this.aFilters.concat(this.aApplicationFilters),g=[];jQuery.each(F,function(i,h){if(typeof h.convert==="function"){g.push(h.convert());}else{g.push(h);}});this.aKeys=c.apply(this.aKeys,g,function(r,p){e=t.oModel.getContext("/"+r);return t.oModel.getProperty(p,e);});if(this.aKeys.length===0){this.iLength=0;}};o.prototype.applyClientSideSort=function(f,m){var t=this,e;this.aKeys=d.apply(this.aKeys,this.aSorters,function(r,p){e=t.oModel.getContext("/"+r);return t.oModel.getProperty(p,e);});};return o;},true);