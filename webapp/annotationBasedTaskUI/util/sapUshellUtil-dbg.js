/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.declare("cross.fnd.fiori.inbox.annotationBasedTaskUI.util.sapUshellUtil");

cross.fnd.fiori.inbox.annotationBasedTaskUI.util.sapUshellUtil = {
	/* */
	// Support for decision on rendering or not an intent-based link.
	/* */
	isSapUshellResourceAvailable: function() {
		return sap.ushell && sap.ushell.Container && sap.ushell.Container.getService;
	},

	getSapUshellService: function(service) {
		return sap.ushell.Container.getService(service);
	},

	/*
	    Function used as formatter helper function. 
	    Based on the incoming oValue it calculates whether to render a link, or not.
	    If infrastructure of sap.ushell is available, and the link is an intent-style link, it must be also configured as intent. Otherwise, it must not. 
	    Regular hyperlinks should be rendered as link regularly.
	    If sap.ushell infrastructure is not available, the link should rendered (e.g. without context of launchpad, or in tests)
	    
	    Returns true in case the link should be rendered, otherwise false
	    
	    Resources related to used API: 
	    https://sapui5.hana.ondemand.com/sdk/#docs/api/symbols/sap.ushell.services.CrossApplicationNavigation.html
	    http://www.sdn.sap.com/irj/scn/go/portal/prtroot/docs/library/uuid/907ae317-cb47-3210-9bba-e1b5e70e5c79?QuickLink=index&overridelayout=true&59575491523067
	*/
	shouldRenderLink: function(oInterface, oValue) {
		if (!oValue) {
			return false;
		}

		var url = oValue.Apply.Parameters[0].Value;
		if (!cross.fnd.fiori.inbox.annotationBasedTaskUI.util.sapUshellUtil.isSapUshellResourceAvailable()) {
			return true;
		}
		var parsingService = cross.fnd.fiori.inbox.annotationBasedTaskUI.util.sapUshellUtil.getSapUshellService("URLParsing");
		if (!parsingService.isIntentUrl(url)) {
			return true;
		}
		var intentName = parsingService.parseShellHash(url);
		var xNavService = cross.fnd.fiori.inbox.annotationBasedTaskUI.util.sapUshellUtil.getSapUshellService(
			"CrossApplicationNavigation");
		var intentNavigationIsConfigured = true;
		xNavService.isNavigationSupported([intentName]).done(function(links) {
			intentNavigationIsConfigured = links[0].supported;
		});
		if (intentNavigationIsConfigured) {
			return true;
		}

		jQuery.sap.log.debug("Link de-activated as intent " + url + " was defined but no intent configuration has been found.");
		return false;
	}
};

cross.fnd.fiori.inbox.annotationBasedTaskUI.util.sapUshellUtil.shouldRenderLink.requiresIContext = true;