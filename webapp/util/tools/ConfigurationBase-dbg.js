/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/base/ManagedObject",
	"sap/base/util/UriParameters",
	"cross/fnd/fiori/inbox/util/tools/ApplicationFacade",
	"cross/fnd/fiori/inbox/util/tools/ApplicationImplementation",
	"cross/fnd/fiori/inbox/util/tools/Application"
], function (
	ManagedObject,
	SapUriParameters,
	ApplicationFacade,
	ApplicationImplementation,
	Application
) {
	"use strict";

	/**
	 * @class
	 * @name cross.fnd.fiori.inbox.util.tools.ConfigurationBase
	 * @extends sap.ui.base.ManagedObject
	 * @public
	 */

	return ManagedObject.extend("cross.fnd.fiori.inbox.util.tools.ConfigurationBase", {
		metadata : {
			properties : {
				"identifier" : "string"
			},
			publicMethods : ["setApplicationFacade"]
		},

		_setApplicationFacade : function (oApplicationFacade) {
			this.oApplicationFacade = oApplicationFacade;
			this.setApplicationFacade(oApplicationFacade);
		},

		/**
		* Override this method when you want to store a reference to the <code>ApplicationFacade</code> in some place where you can
		* access it. </br>
		* However, it may be useful to have access to the facade e.g. in a class providing formatters.
		* @param {Object} oApplicationFacade the application facade for this App
		* @public
		* @name cross.fnd.fiori.inbox.util.tools.ConfigurationBase#setApplicationFacade
		* @function
		* @memberOf cross.fnd.fiori.inbox.util.tools.ConfigurationBase
		* */
		setApplicationFacade : function (oApplicationFacade) {

		},
		/**
		* @deprecated
		* This Method is deprecated. Use the corresponding method of ApplicationFacade instead.
		* @returns {boolean} true if the application runs on mock data, i.e. was started with URL parameter "responderOn=true"
		* @public
		* @name cross.fnd.fiori.inbox.util.tools.ConfigurationBase#isMock
		* @function
		*/
		// will be removed soon. Use method in ApplicationFacade
		isMock : function () {
			// The "reponder" URL parameter defines if the app shall run with mock
			// data
			var responderOn = SapUriParameters.fromURL(window.location.href).get("responderOn");

			// set the flag for later usage
			return (responderOn === "true");
		},

		/**
		* Override this method when the application wants to use a master list which allows for multi
		* selection.
		* The application needs to implement proper selection handling by itself if multi selection
		* is used.
		*
		* @returns {boolean} true if the application allows to use the master list with multi selection.
		* Default is <code>false</code>.
		* @public
		* @name cross.fnd.fiori.inbox.util.tools.ConfigurationBase#keepMultiSelection
		* @function
		* @memberOf cross.fnd.fiori.inbox.util.tools.ConfigurationBase
		* @see sap.m.ListMode.MultiSelect
		* @since 1.25.1
		*/
		keepMultiSelection : function () {
			return false;
		},

		/**
		* Specifies the list of attributes that identify a list item
		* Needs to be overwritten by the app
		* @returns {array} the list of attributes (strings) of a master list item that identify one entry.
		* @public
		* @name cross.fnd.fiori.inbox.util.tools.ConfigurationBase#getMasterKeyAttributes
		* @function
		*/
		getMasterKeyAttributes : function () {
			return null;
		},

		/**
		* Getter for the service list to be used as source for the Connection Manager
		* Needs to be overwritten by the app
		* @returns {object} the list of ODataModel to instantiate with their corresponding url / mock url
		* @public
		* @name cross.fnd.fiori.inbox.util.tools.ConfigurationBase#getServiceList
		* @function
		*/
		getServiceList : function () {
			return null;
		},

		/**
		* Getter for the list of parameters to be excluded from appending to the URL for the Services
		* Needs to be overwritten by the app if parameters need to be excluded from the service call
		* @returns {array} the list of parameters to be excluded from appending to the URL for the Service
		* @public
		* @name cross.fnd.fiori.inbox.util.tools.ConfigurationBase#getExcludedQueryStringParameters
		* @function
		*/
		getExcludedQueryStringParameters : function () {
			return null;
		},

		/**
		* returns the language key of the detail views title defined in the apps language model
		* Needs to be overwritten by the app in case the default key name doesn't match the apps title key
		* @public
		* @name cross.fnd.fiori.inbox.util.tools.ConfigurationBase#getDetailTitleKey
		* @function
		*/
		getDetailTitleKey : function () {
			return "DETAIL_TITLE";
		},

		/**
		* returns the language key of the empty views default text to be shown in cases where empty view is implicitly
		* displayed
		* @public
		* @name cross.fnd.fiori.inbox.util.tools.ConfigurationBase#getDefaultEmptyMessageKey
		* @function
		*/
		getDefaultEmptyMessageKey : function () {
			return "emptyView.message";
		},

		/**
		* Indicates whether stable IDs should be generated for buttons.
		* Override this method if the application wants to use stable IDs.
		*
		* @returns {boolean} true if the application uses stable IDs.
		* Default is <code>false</code>.
		* @name cross.fnd.fiori.inbox.util.tools.ConfigurationBase#isUsingStableIds
		* @function
		* @memberOf cross.fnd.fiori.inbox.util.tools.ConfigurationBase
		* @since 1.27.1
		* @public
		*/
		isUsingStableIds : function () {
			return false;
		}
	});
});
