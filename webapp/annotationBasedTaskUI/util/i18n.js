/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/model/resource/ResourceModel"],function(R){"use strict";return{getResourceModel:function(){if(!this._resourceModel){this._resourceModel=new R({bundleName:"cross.fnd.fiori.inbox.annotationBasedTaskUI.i18n.i18n",locale:sap.ui.getCore().getConfiguration().getLanguage()});}return this._resourceModel;},getText:function(i,r){var b=this.getResourceModel().getResourceBundle();return b.getText(i,r);}};},true);
