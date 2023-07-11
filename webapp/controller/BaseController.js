/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/core/mvc/Controller","sap/ui/core/UIComponent"],function(C,U){"use strict";return C.extend("cross.fnd.fiori.inbox.controller.BaseController",{getRouter:function(){return U.getRouterFor(this);},getModel:function(n){return this.getView().getModel(n);},setModel:function(m,n){return this.getView().setModel(m,n);},getResourceBundle:function(){var r=this.getOwnerComponent().getModel("i18n").getResourceBundle();return r;},addHistoryEntry:(function(){var h=[];return function(e,r){if(r){h=[];}var i=h.some(function(a){return a.intent===e.intent;});if(!i){h.push(e);this.getOwnerComponent().getService("ShellUIService").then(function(s){s.setHierarchy(h);});}};})()});});
