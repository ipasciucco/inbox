/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/core/LayoutData"],
	function(fnLayoutData) {
		"use strict";

		var BarOverflowLayoutData = fnLayoutData.extend("cross.fnd.fiori.inbox.util.tools.BarOverflowLayoutData", {

			metadata : {
				properties : {
					moveToOverflow : {
						type: "boolean",
						defaultValue: true
					},
					stayInOverflow : {
						type: "boolean",
						defaultValue: false
					},
					overflowButton: {
						type: "boolean",
						defaultValue: false
					}
				}
			}

		});


		return BarOverflowLayoutData;

}, /* bExport= */ true);
