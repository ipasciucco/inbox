/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/core/format/FileSizeFormat","sap/ui/core/format/DateFormat"],function(F,D){"use strict";cross.fnd.fiori.inbox.attachment=(function(){return{getRelativeMediaSrc:function(m,l,M){if(l&&l.length>0&&M==="text/uri-list"){return l;}else{var u="";if(m&&typeof m==="string"){var L=document.createElement("a");L.href=m;u=(L.pathname.charAt(0)==="/")?L.pathname:"/"+L.pathname;}if(this.getModel instanceof Function){var s=this.getModel("detail").getData().sServiceUrl;if(!s){var c=new cross.fnd.fiori.inbox.Configuration();s=c.getServiceList()[0].serviceUrl;}if(s&&s.length>0){var i=u.indexOf("AttachmentCollection");if(i>=0){if(s.endsWith("/")){u=s+u.slice(i,u.length);}else{u=s+u.slice(i-1,u.length);}}}}return u;}},formatFileSize:function(v,l,m){if(l&&l.length>0&&m==="text/uri-list"){return"";}else if(jQuery.isNumeric(v)){return F.getInstance({maxFractionDigits:1,maxIntegerDigits:3}).format(v);}else{return v;}},getRelativeSapIcon:function(l,m){var u="";if(l&&l.length>0&&m==="text/uri-list"){u="sap-icon://chain-link";}return u;},formatAttachmentCreatedAtDate:function(d){var r=d;if(typeof d==="string"||d instanceof String){var s=d;if(d.indexOf("Date(")!==-1){var e=d.substring(d.indexOf("(")+1,d.indexOf(")"));s=parseInt(e,10);}r=new Date(s);}var f={style:"medium"};var l=sap.ui.getCore().getConfiguration().getLocale();var o=(l)?D.getDateTimeInstance(f,l):D.getDateTimeInstance(f);return o.format(r,false);},formatFileName:function(f,l,m){if(m==="text/uri-list"){return l;}else{return f;}}};}());return cross.fnd.fiori.inbox.attachment;});