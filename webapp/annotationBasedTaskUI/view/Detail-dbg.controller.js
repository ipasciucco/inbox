/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.require("sap.ui.model.json.JSONModel");
jQuery.sap.require("sap.ui.model.Binding");
jQuery.sap.require("sap.ui.core.mvc.Controller");
jQuery.sap.require("cross.fnd.fiori.inbox.annotationBasedTaskUI.util.navigationUtil");
jQuery.sap.require("cross.fnd.fiori.inbox.annotationBasedTaskUI.util.i18n");

sap.ui.core.mvc.Controller.extend("cross.fnd.fiori.inbox.annotationBasedTaskUI.view.Detail", {

	onInit: function() {
		var oView = this.getView();
		var detailModel = new sap.ui.model.json.JSONModel();
		var i18nModel = cross.fnd.fiori.inbox.annotationBasedTaskUI.util.i18n.getResourceModel();
		oView.setModel(i18nModel, "i18n");
		oView.setModel(detailModel, "detailModel");
		oView.setModel(new sap.ui.model.json.JSONModel(), "controlModel");
		var binding = new sap.ui.model.Binding(detailModel, "/", detailModel.getContext("/"));
		binding.attachChange(jQuery.proxy(this.onDetailModelChanged, this));
	},

	onNavButtonPress: function(/* oEvent */) {
		this.setHeaderFooterOptions(this.previousHeaderFooterOptions);
		this.getView().getParent().back();

		// Setting the back navigation of the shell UI service fixes the back navigation functionality in phone mode (BCP 1840109092)
		var inboxDetailView = this.getView().oViewData.component.getComponentData().inboxHandle.inboxDetailView;
		var oShellUIService = inboxDetailView.getOwnerComponent().oShellUIService;
		if (oShellUIService && sap.ui.Device.system.phone) {
			oShellUIService.setBackNavigation(jQuery.proxy(inboxDetailView.fnOnNavBackInMobile, inboxDetailView));
		}
	},

	fSetPosition: function(itemIndex) {
		var oView = this.getView();
		var model = oView.getModel("controlModel");
		var collection = model.getProperty("/collection");
		this.setNewHeaderFooterOptions(itemIndex, collection.length);
		oView.bindElement(collection[itemIndex].getBindingContext().getPath());
	},

	onDetailModelChanged: function() {
		var oView = this.getView();
		var detailModel = oView.getModel("detailModel");
		var isReady = detailModel.getProperty("/isReady");
		//the isReady flag must be set when all necessary properties exist
		if (!isReady) {
			return;
		}
		detailModel.setProperty("/isReady", false);
		var controlModel = oView.getModel("controlModel");
		var collection = detailModel.getProperty("/collection");
		var itemIndex = detailModel.getProperty("/itemIndex");
		var collectionName = detailModel.getProperty("/collectionName");

		controlModel.setProperty("/collectionName", collectionName);
		controlModel.setProperty("/collection", collection);
		var currentHeader = oView.oViewData.component.getComponentData().inboxHandle.inboxDetailView.oHeaderFooterOptions;
		this.previousHeaderFooterOptions = jQuery.extend({}, currentHeader);
		this.setNewHeaderFooterOptions(itemIndex, collection.length);
		var bindingPath = collection[itemIndex].getBindingContext().getPath();
		oView.bindElement(bindingPath);
	},
	
	setNewHeaderFooterOptions: function(itemIndex, itemCount) {
		var oNewHeaderFooterOptions = this.createNewHeaderFooterOptions(itemIndex, itemCount);
		this.setHeaderFooterOptions(oNewHeaderFooterOptions);
	},
	
	setHeaderFooterOptions: function(options) {
		var inboxDetailView = this.getView().oViewData.component.getComponentData().inboxHandle.inboxDetailView;
		//since setHeaderFooterOptions method does not update oHeaderFooterOptions and
		//getHeaderFooterOptions method always returns null, we need manually set and get oHeaderFooterOptions
		inboxDetailView.oHeaderFooterOptions = options;
		//actually set the header/footer for displaying, but does not update oHeaderFooterOptions object
		inboxDetailView.setHeaderFooterOptions(options);

		// Setting the back navigation of the shell UI service fixes the back navigation functionality in phone mode (BCP 1840109092)
		var oShellUIService = inboxDetailView.getOwnerComponent().oShellUIService;
		if (oShellUIService && sap.ui.Device.system.phone) {
			oShellUIService.setBackNavigation(options.onBack);
		}
	},
	
	createNewHeaderFooterOptions: function(itemIndex, itemCount) {
		var oView = this.getView();
		var collectionName = oView.getModel("controlModel").getProperty("/collectionName");
		var sOf = oView.getModel("i18n").getResourceBundle().getText("DETAIL_PAGE.TITLE.OF");
		var title = collectionName + " (" + sOf + ")";
		var inboxDetailView = oView.oViewData.component.getComponentData().inboxHandle.inboxDetailView;
		var that = this;
		return jQuery.extend({}, inboxDetailView.oHeaderFooterOptions, {
			onBack: jQuery.proxy(that.onNavButtonPress, that),
			oUpDownOptions: {
				iPosition: itemIndex,
				iCount: itemCount,
				fSetPosition: jQuery.proxy(that.fSetPosition, that),
				sI18NDetailTitle: title,
				sI18NPhoneTitle: title
			},
			oPositiveAction: null,
			oNegativeAction: null,
			buttonList: [],
			oJamOptions: null,
			oEmailSettings: null
		});
	},
	
	onTableItemPressed: function(oEvent) {
		cross.fnd.fiori.inbox.annotationBasedTaskUI.util.navigationUtil.navigateForward(oEvent, this);
	},
	
	onVendorPress: function(oEvent) {
		var sUrl = oEvent.getSource().getProperty("titleTarget");
		sap.m.URLHelper.redirect(sUrl, false);
	}
});
