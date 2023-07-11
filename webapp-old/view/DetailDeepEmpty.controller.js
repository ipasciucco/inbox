/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["cross/fnd/fiori/inbox/controller/BaseController","sap/ui/model/json/JSONModel"],function(B,J){"use strict";return B.extend("cross.fnd.fiori.inbox.view.DetailDeepEmpty",{onInit:function(){var c=cross.fnd.fiori.inbox.util.tools.Application.getImpl().getComponent();var m=c.getModel().sDetailDeepEmptyMessage;if(!m){var i=this.getResourceBundle();m=i.getText("detailDeepEmptyView.noLongerAvailableTaskMessage")+" "+i.getText("detailDeepEmptyView.closingTabMessage");}var M=new J();M.setData({messageStripText:m});this.getView().setModel(M);}});});
