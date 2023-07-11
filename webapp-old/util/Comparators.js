/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/base/Object"],function(U){"use strict";return{fnPriorityComparator:function(a,b){if(a==b){return 0;}if(b==null||isNaN(b)){return-1;}if(a==null||isNaN(a)){return 1;}if(a<b){return-1;}if(a>b){return 1;}return 0;},fnNameComparator:function(a,b){if(a.TaskDefinitionName.toUpperCase()<b.TaskDefinitionName.toUpperCase()){return-1;}if(a.TaskDefinitionName.toUpperCase()>b.TaskDefinitionName.toUpperCase()){return 1;}return 0;},fnResponseOptionsComparator:function(a,b){if(isNaN(a.iDisplayOrderPriority)){a.iDisplayOrderPriority=3500;}if(isNaN(b.iDisplayOrderPriority)){b.iDisplayOrderPriority=3500;}return a.iDisplayOrderPriority-b.iDisplayOrderPriority;}};});
