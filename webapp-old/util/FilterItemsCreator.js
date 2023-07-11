/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/base/Object","sap/m/ViewSettingsFilterItem","sap/m/ViewSettingsItem"],function(B,V,a){"use strict";B.extend("cross.fnd.fiori.inbox.util.FilterItemsCreator",{});cross.fnd.fiori.inbox.util.FilterItemsCreator={createFilterCategory:function(t,m){var i=true;if(arguments.length===2){i=m;}return new V({text:t,multiSelect:i});},createFilterItem:function(k,t,c){var f=new a({text:t,key:k});if(this._findFilterKey(k,c)){f.setSelected(true);}return f;},_findFilterKey:function(f,c){for(var b in c){var d=c[b];for(var i=0;i<d.length;i++){if(d[i]===f){return true;}}}return false;}};return cross.fnd.fiori.inbox.util.FilterItemsCreator;});
