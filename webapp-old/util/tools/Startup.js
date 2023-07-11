/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([],function(){"use strict";if(!cross.fnd.fiori.inbox.util.hasOwnProperty("tools")){cross.fnd.fiori.inbox.util.tools={};}cross.fnd.fiori.inbox.util.tools.Startup={};cross.fnd.fiori.inbox.util.tools.Startup.init=function(i,m){var s=function(){var b=m.byId("fioriContent");if(b){var A=sap.ui.require("cross/fnd/fiori/inbox/util/tools/Application");var a=new A({identity:i,component:m.getOwnerComponent(),oViewHook:b.getId()});a.setIdentity(i);return true;}return false;};if(!s()){jQuery(s);}};return cross.fnd.fiori.inbox.util.tools.Startup;});
