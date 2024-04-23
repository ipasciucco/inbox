/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.require("cross.fnd.fiori.inbox.annotationBasedTaskUI.util.util");
jQuery.sap.require("cross.fnd.fiori.inbox.annotationBasedTaskUI.util.navigationUtil");

sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
	"use strict";

	return Controller.extend("cross.fnd.fiori.inbox.annotationBasedTaskUI.view.TaskUI_S3", {

		onInit: function () {
			var oModel = new JSONModel();

			var oData = {};

			oData.items = [{
				"objetoCosPri": "Contabilidad", "objetoCosPri2": "Contabilidad (103011)",
				"categoria": "Centro de coste", "cuentaMayor": "INSUMOS COMPUTACION.",
				"cuentaMayor2": "INSUMOS COMPUTACION. (87503000)",
				"distribucion": "100", "cantidadSolicitada": "1 C/U"
			}]


			// Establece los datos en el modelo
			oModel.setData(oData);

			// Obtiene una referencia a la vista
			var oView = this.getView();

			// Establece el modelo en la vista
			oView.setModel(oModel, "tablaModel");

			sap.ui.getCore().getEventBus().subscribe(
                "Channel2",
                "Event2",
                this.setInboxData,
                this
            );

			sap.ui.getCore().getEventBus().subscribe(
                "Channel3",
                "Event3",
                this.setVisibleTable,
                this
            );
			var oModel2 = new JSONModel({valorBooleano: false});
			oView.setModel(oModel2, "visible");
		},

		/*This method renders Comments Component by calling the required methods in My Inbox using its context
		 * */
		fnRenderCommentsComponent: function () {
			var MyInboxContext = this.getView().getViewData().component.getComponentData().inboxHandle.inboxDetailView;
			if (MyInboxContext && MyInboxContext !== undefined && MyInboxContext !== null) {
				MyInboxContext.createGenericCommentsComponent.call(MyInboxContext, this.getView());
			}
		},

		fnRenderAttachmentsComponent: function () {
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

		onVendorPress: function (oEvent) {
			var sUrl = oEvent.getSource().getProperty("titleTarget");
			sap.m.URLHelper.redirect(sUrl, false);
		},

		handleTabSelect: function (oControlEvent) {
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

		onTableItemPressed: function (oEvent) {
			cross.fnd.fiori.inbox.annotationBasedTaskUI.util.navigationUtil.navigateForward(oEvent, this);
		},

		onShowDataPointDetails: function (oEvent) {
			var oObjStatus = oEvent.getSource();
			var oResponsivePopover = oObjStatus.getDependents().length > 0 && oObjStatus.getDependents()[0];
			if (oResponsivePopover && oResponsivePopover.getMetadata() && oResponsivePopover.getMetadata().getElementName() === "sap.m.ResponsivePopover") {
				oResponsivePopover.openBy(oObjStatus);
			}
		},

		setInboxData: function (sChannelId, sEventId, sData) {
			var oModel = new JSONModel();
			var oData = {};

			if (sData === "Solic. pedido 1010933303 00010") {
				oData.items = [
					{
						"objetoCosPri": "Administración Servicio Jurídico", "objetoCosPri2": "Administración Servicio Jurídico (103005)",
						"categoria": "Centro de coste", "cuentaMayor": "SS NORMALES DEL MES",
						"cuentaMayor2": "SS NORMALES DEL MES (86201000)",
						"distribucion": "100", "cantidadSolicitada": "1 C/U"
					}
				];
			} else if (sData === "Solic. pedido 1010933182 00010") {
				oData.items = [
					{
						"objetoCosPri": "Cumplimiento", "objetoCosPri2": "Cumplimiento (103029)",
						"categoria": "Centro de coste", "cuentaMayor": "SS NORMALES DEL MES",
						"cuentaMayor2": "SS NORMALES DEL MES (86201000)",
						"distribucion": "100", "cantidadSolicitada": "1 C/U"
					}
				];
			} else {
				oData.items = [{
					"objetoCosPri": "Contabilidad", "objetoCosPri2": "Contabilidad (103011)",
					"categoria": "Centro de coste", "cuentaMayor": "INSUMOS COMPUTACION.",
					"cuentaMayor2": "INSUMOS COMPUTACION. (87503000)",
					"distribucion": "100", "cantidadSolicitada": "1 C/U"
				}]
			}
			oModel.setData(oData);

			var oView = this.getView();

			oView.setModel(oModel, "tablaModel");
		},

		setVisibleTable: function (sChannelId, sEventId, sData) {
			var oView = this.getView();

			var oModel2 = new JSONModel({valorBooleano: sData.visible});
			oView.setModel(oModel2, "visible");
		}

	});
});