/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/base/Object","sap/ui/model/odata/v2/ODataModel","cross/fnd/fiori/inbox/util/pagination/ODataListBindingExtension"],function(U,O,a){"use strict";return U.extend("cross.fnd.fiori.inbox.ODataExtension",{overrideBindList:function(d){if(d){d.bindList=function(p,c,s,f,P){var b=new a(this,p,c,s,f,P);return b;};}return this;},overrideProcessSuccess:function(d){if(d){d._processSuccess=function(r,R,s,g,c,e){var u,b;u=r.requestUri;b=u.replace(this.sServiceUrl,"");if(!b.startsWith("/")){b="/"+b;}b=this._normalizePath(b);if("/Forward"===b&&R.data){R.data.Status="Forwarded";}O.prototype._processSuccess.apply(this,arguments);var f=parseFloat(sap.ui.version);if(!isNaN(f)&&f<=1.40&&u.indexOf("TaskCollection")>-1&&u.indexOf("$expand")>-1){try{var E=decodeURIComponent(u.substring(u.indexOf("$expand"))).split("&");var h=E[0].substring(E[0].indexOf("=")+1).split(",");var m=cross.fnd.fiori.inbox.util.tools.Application.getImpl().oCurController.MasterCtrl;var k=m._oMasterListBinding;var C=k._getContexts(k.iLastStartIndex,k.iLastLength,k.iLastThreshold);for(var i=0;i<C.length;i++){if(C[i].sPath===b){if(JSON.stringify(C[i].getObject())!==k.aLastContextData[i]){var o=jQuery.extend(true,{},C[i].getObject());for(var j=0;j<h.length;j++){delete o[h[j]];}if(JSON.stringify(o)===k.aLastContextData[i]){k.aLastContextData[i]=JSON.stringify(C[i].getObject());}}break;}}}catch(l){}}};}return this;},overrideImportData:function(d){if(d){d._doNotoverwriteNullPropertyValue=true;d._importData=function(D,c){var t=this,l,k,r,e;if(D.results){l=[];jQuery.each(D.results,function(i,b){var k=t._importData(b,c);if(k){l.push(k);}});return l;}else{k=this._getKey(D);if(!k){return k;}e=this.oData[k];if(!e){e=D;this.oData[k]=e;}jQuery.each(D,function(n,p){if(p&&(p.__metadata&&p.__metadata.uri||p.results)&&!p.__deferred){r=t._importData(p,c);if(Array.isArray(r)){e[n]={__list:r};}else{e[n]={__ref:r};}}else if(!p||!p.__deferred){if(t._doNotoverwriteNullPropertyValue){if(p!=null){if(n==="CompletionDeadLine"&&!e.IsOverdue){if(p-(new Date())<0){e.IsOverdue=true;}}e[n]=p;}}else{e[n]=p;}}});c[k]=true;return k;}};}return this;}});});
