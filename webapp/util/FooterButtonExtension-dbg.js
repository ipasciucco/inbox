/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"cross/fnd/fiori/inbox/util/tools/ButtonListHelper",
	"sap/m/library"
	], function(
		ButtonListHelper,
		library
	) {
		"use strict";

		var ButtonType = library.ButtonType;

		cross.fnd.fiori.inbox.util.FooterButtonExtension = (function() {
			return {
				overrideEnsureButton: function() {
					if (!cross.fnd.fiori.inbox.util.tools.ButtonListHelper.prototype.originalEnsureButton) { //This check is needed otherwise call stack is exceeded(stack overflow).
						cross.fnd.fiori.inbox.util.tools.ButtonListHelper.prototype.originalEnsureButton = cross.fnd.fiori.inbox.util.tools.ButtonListHelper.prototype.ensureButton;
						cross.fnd.fiori.inbox.util.tools.ButtonListHelper.prototype.ensureButton = function(oBtnMeta, sType, iMaxCountBeforeOverflow) {
							switch (oBtnMeta.nature) {
								case "POSITIVE":
									oBtnMeta.style = ButtonType.Accept;
									break;
								case "NEGATIVE":
									oBtnMeta.style = ButtonType.Reject;
								default:
							}
							return cross.fnd.fiori.inbox.util.tools.ButtonListHelper.prototype.originalEnsureButton.apply(this, arguments);
						};
					}
				}
			};
		}());
		return cross.fnd.fiori.inbox.util.FooterButtonExtension;
});