/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/core/Control"
], function (Control) {
	"use strict";
	return Control.extend("cross.fnd.fiori.inbox.util.InvisibleControl", {
				metadata : {
					properties : {
						/**
						 * Control ID
						 */
						id : {type : "string", group : "Misc", defaultValue : null}
					},
					associations : {

						/**
						 * Association to controls / ids which describe this control (see WAI-ARIA attribute aria-describedby).
						 */
						ariaDescribedBy : {type : "sap.ui.core.Control", multiple : true, singularName : "ariaDescribedBy"},

						/**
						 * Association to controls / ids which label this control (see WAI-ARIA attribute aria-labelledby).
						 */
						ariaLabelledBy : {type : "sap.ui.core.Control", multiple : true, singularName : "ariaLabelledBy"}
					}
				},
				init : function () {
				},
				renderer : function (oRM, oControl) {
					oRM.write("<div");
					oRM.writeAttribute("tabindex","0");
					oRM.writeAttributeEscaped("id", oControl.getId());
					oRM.writeAccessibilityState(oControl);
					oRM.writeControlData(oControl);
					oRM.write(">");
					// oRM.write("Temporary text"); // To show some text on the place of invisible control
					oRM.write("</div>");
				}
	});
});