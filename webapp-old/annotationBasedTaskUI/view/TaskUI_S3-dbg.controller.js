/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.require("cross.fnd.fiori.inbox.annotationBasedTaskUI.util.util");
jQuery.sap.require("cross.fnd.fiori.inbox.annotationBasedTaskUI.util.navigationUtil");
jQuery.sap.require("sap.ui.core.mvc.Controller");

sap.ui.core.mvc.Controller.extend("cross.fnd.fiori.inbox.annotationBasedTaskUI.view.TaskUI_S3", {

	onInit: function() {
	},

	/*This method renders Comments Component by calling the required methods in My Inbox using its context
	 * */
	fnRenderCommentsComponent: function() {
		var MyInboxContext = this.getView().getViewData().component.getComponentData().inboxHandle.inboxDetailView;
		if (MyInboxContext && MyInboxContext !== undefined && MyInboxContext !== null) {
			MyInboxContext.createGenericCommentsComponent.call(MyInboxContext, this.getView());
		}
	},

	fnRenderAttachmentsComponent: function(){
		var oView = this.getView();
		var oAttachmentView = oView.byId("attachmentComponent");
		var attachmentHandle = oView.getViewData().component.getComponentData().inboxHandle.attachmentHandle;

		if (!jQuery.isEmptyObject(attachmentHandle)) {
			this.oGenericAttachmentComponent = sap.ui.getCore().createComponent({
				name: "cross.fnd.fiori.inbox.attachment",
				settings: {
					attachmentHandle: attachmentHandle
				}
			});
			var oMyInboxControllerContext = oView.getViewData().component.getComponentData().inboxHandle.inboxDetailView;
			this.oGenericAttachmentComponent.uploadURL(attachmentHandle.uploadUrl);
			oMyInboxControllerContext.oAttachmentComponentView = this.oGenericAttachmentComponent.view;
			oAttachmentView.setPropagateModel(true);
			oAttachmentView.setComponent(this.oGenericAttachmentComponent);
		}
	},
	
	onVendorPress: function(oEvent) {
		var sUrl = oEvent.getSource().getProperty("titleTarget");
		sap.m.URLHelper.redirect(sUrl, false);
	},

	handleTabSelect: function(oControlEvent) {
		var oView = this.getView();
		var sKey = oControlEvent.getParameters().selectedKey;
		var oAttachmentView = oView.byId("attachmentComponent");
		var oCommentsContainer = oView.byId("commentsContainer");
		
		if (oCommentsContainer && sKey === "NOTES") {
			this.fnRenderCommentsComponent();
		}
		if (oAttachmentView && sKey === "ATTACHMENTS") {
			this.fnRenderAttachmentsComponent();
		}
		this.getView().oViewData.component.getComponentData().inboxHandle.tabSelectHandle.fnOnTabSelect(oControlEvent);
	},

	onTableItemPressed: function(oEvent) {
		cross.fnd.fiori.inbox.annotationBasedTaskUI.util.navigationUtil.navigateForward(oEvent, this);
	},

	onShowDataPointDetails: function(oEvent) {
		var oObjStatus = oEvent.getSource();
		var oResponsivePopover = oObjStatus.getDependents().length > 0 && oObjStatus.getDependents()[0];
		if (oResponsivePopover && oResponsivePopover.getMetadata() && oResponsivePopover.getMetadata().getElementName() === "sap.m.ResponsivePopover") {
			oResponsivePopover.openBy(oObjStatus);
		}
	}

});