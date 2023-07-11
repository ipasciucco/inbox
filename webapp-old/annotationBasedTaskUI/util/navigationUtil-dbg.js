/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.declare("cross.fnd.fiori.inbox.annotationBasedTaskUI.util.navigationUtil");

cross.fnd.fiori.inbox.annotationBasedTaskUI.util.navigationUtil = {
	
	navigateForward: function(oEvent, controller) {
		var view = controller.getView();
		var container = view.getParent();
		var pressedItem = oEvent.getParameter("listItem");
		var bindingPath = pressedItem.getBindingContext().getPath();
		var detailViewId = bindingPath.match(/\w*\b/)[0];
		// bugfix recursive navigation on same entity type
		detailViewId = view.getId() + "_" + detailViewId;
		var detailView = container.getPage(detailViewId);
		if (!detailView) {
			detailView = this.createNewDetailView(detailViewId, bindingPath, controller);
			detailView.setModel(controller.getView().getModel());
			container.addPage(detailView);
		}
		var table = oEvent.getSource();
		var detailModel = detailView.getModel("detailModel");
		var titleText = table.getHeaderToolbar().getContent()[0].getText();
		detailModel.setProperty("/collectionName", titleText.substring(0, titleText.lastIndexOf("(")).trim());
		detailModel.setProperty("/itemIndex", table.indexOfItem(pressedItem));
		detailModel.setProperty("/collection", table.getItems());
		detailModel.setProperty("/isReady", true);
		container.to(detailViewId);
	},

	createNewDetailView: function(viewId, bindingPath, controller) {
		var view = controller.getView();
		var metaModel = view.getModel().getMetaModel();
		return sap.ui.view(viewId, {
			preprocessors: {
				xml: {
					bindingContexts: {
						meta: metaModel.getMetaContext(bindingPath)
					},
					models: {
						meta: metaModel
					}
				}
			},
			type: sap.ui.core.mvc.ViewType.XML,
			viewName: "cross.fnd.fiori.inbox.annotationBasedTaskUI.view.Detail",
			viewData: view.oViewData
		});
	}
};