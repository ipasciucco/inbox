/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/base/Object","sap/ui/core/Fragment","sap/base/Log"],function(U,F,B){"use strict";U.extend("cross.fnd.fiori.inbox.util.Resubmit",{});cross.fnd.fiori.inbox.util.Resubmit={_oResubmitFrag:null,open:function(_,c,v){if(!this._oResubmitFrag){this._createResubmitDialogPromise(_,c).then(function(r){this._oResubmitFrag=r;v.addDependent(this._oResubmitFrag);this._setupAndOpenDialog(_);}.bind(this));}else{this._setupAndOpenDialog(_);}},close:function(){cross.fnd.fiori.inbox.util.Resubmit._oResubmitFrag.close();cross.fnd.fiori.inbox.util.Resubmit._oResubmitFrag.destroy(true);cross.fnd.fiori.inbox.util.Resubmit._oResubmitFrag=null;},validateDate:function(){var c=F.byId(this.sResubmitUniqueId,"DATE_RESUBMIT");var s=c.getSelectedDates()[0].getStartDate();var C=new Date();var r=F.byId(this.sResubmitUniqueId,"RESUBMIT_BTN_OK");if(C>s){r.setEnabled(false);c.removeAllSelectedDates();}else{r.setEnabled(true);}},_setupAndOpenDialog:function(_){var c=F.byId(_,"DATE_RESUBMIT");if(c){c.removeAllSelectedDates();c.focusDate(new Date());}this._oResubmitFrag.open();},_createResubmitDialogPromise:function(i,c){return F.load({id:i,name:"cross.fnd.fiori.inbox.frag.Resubmit",controller:c}).catch(function(){B.error("Resubmit dialog was not created successfully");});}};return cross.fnd.fiori.inbox.util.Resubmit;});
