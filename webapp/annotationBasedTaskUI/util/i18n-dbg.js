/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/model/resource/ResourceModel"], function(ResourceModel) {
    "use strict";

    return {
        getResourceModel: function() {
            if (!this._resourceModel) {
                this._resourceModel = new ResourceModel({
                    bundleName: "cross.fnd.fiori.inbox.annotationBasedTaskUI.i18n.i18n",
                    locale: sap.ui.getCore().getConfiguration().getLanguage()
                });
            }
            return this._resourceModel;
        },

        getText: function(sIdentifier, aReplacements) {
            var bundle = this.getResourceModel().getResourceBundle();
            return bundle.getText(sIdentifier, aReplacements);
        }
    };
}, true);
