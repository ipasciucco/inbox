/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([], function() {
	"use strict";

	if (!cross.fnd.fiori.inbox.util.hasOwnProperty("tools")) {
		cross.fnd.fiori.inbox.util.tools = {};
	}

	cross.fnd.fiori.inbox.util.tools.Startup = {};

	cross.fnd.fiori.inbox.util.tools.Startup.init = function(sIdentity, oMainCtr) {

		var fStartApplication = function() {
			var oBody = oMainCtr.byId("fioriContent");
			if (oBody) {
				// oBody.setAttribute("id", "content");
				var Application = sap.ui.require("cross/fnd/fiori/inbox/util/tools/Application");

				var app = new Application({
					identity : sIdentity,
					component: oMainCtr.getOwnerComponent(),
					oViewHook : oBody.getId()
				});
				app.setIdentity(sIdentity);

				return true;
			}

			return false;
		};

		if (!fStartApplication()) {
			jQuery(fStartApplication);
		}
	};

	return cross.fnd.fiori.inbox.util.tools.Startup;
});
