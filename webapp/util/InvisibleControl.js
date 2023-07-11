/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/core/Control"],function(C){"use strict";return C.extend("cross.fnd.fiori.inbox.util.InvisibleControl",{metadata:{properties:{id:{type:"string",group:"Misc",defaultValue:null}},associations:{ariaDescribedBy:{type:"sap.ui.core.Control",multiple:true,singularName:"ariaDescribedBy"},ariaLabelledBy:{type:"sap.ui.core.Control",multiple:true,singularName:"ariaLabelledBy"}}},init:function(){},renderer:function(r,c){r.write("<div");r.writeAttribute("tabindex","0");r.writeAttributeEscaped("id",c.getId());r.writeAccessibilityState(c);r.writeControlData(c);r.write(">");r.write("</div>");}});});
