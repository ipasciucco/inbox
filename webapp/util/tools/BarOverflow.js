/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/base/Object","cross/fnd/fiori/inbox/util/tools/BarOverflowLayoutData","sap/ui/core/ResizeHandler"],function(u,b,r){"use strict";var B=u.extend("cross.fnd.fiori.inbox.util.tools.BarOverflow",{constructor:function(o,a,R){u.apply(this,arguments);this._oBar=o;this._oActionSheet=a;this._previousBarWidth=0;this._bActionSheetGotCleared=false;this._bInitialized=false;this._fnResized=R;this._oEventDelegate={onAfterRendering:this._attachResize,onBeforeRendering:this._detachResize};if(o.getDomRef()){this._handleSizeChange();}o.addEventDelegate(this._oEventDelegate,this);},buttonTextChanged:function(){if(this._iTimeout){return;}var t=this;this._iTimeout=setTimeout(function(){t._handleSizeChange(true);t._iTimeout=null;},0);},_detachResize:function(){if(this._sResizeListenerId===undefined){return;}r.deregister(this._sResizeListenerId);this._sResizeListenerId=undefined;},_attachResize:function(){if(!this._oBar.getDomRef()){return;}if(this._sResizeListenerId!==undefined){return;}this._handleSizeChange();this._sResizeListenerId=r.register(this._oBar.getDomRef(),jQuery.proxy(this._handleSizeChange,this));},_initialize:function(){var a=this._oBar.getContentRight();this._bInitialized=true;this._oControlOrder={};a.forEach(function(c,i){this._oControlOrder[c.sId]={index:i};},this);this._oActionSheet.getButtons().forEach(function(c,i){this._oControlOrder[c.sId]={index:i+a.length};},this);},_clearActionSheet:function(){this._bActionSheetGotCleared=true;if(this._fnResized){this._fnResized();}},_calculateLeftWidth:function(){var l=this._oBar._$LeftBar,w=0,L;if(l){L=l.css("width");l.css({width:"",visibility:"hidden"});w=l.outerWidth(true);l.css({width:L,visibility:""});}return w;},_handleSizeChange:function(c){var i=this._oBar.$().width()-this._calculateLeftWidth();if(!this._bInitialized){this._initialize();}if(this._previousBarWidth===i&&!c&&!this._bActionSheetGotCleared){return;}this._bActionSheetGotCleared=false;if(this._oActionSheet.getButtons().length){this._clearActionSheet();return;}this._previousBarWidth=i;if(!this._oBar.getContentRight().length){return;}this._moveControlsToOverflow(i);},_calculateOverflowData:function(i){var a=0,o=null,c=[];this._oBar.getContentRight().forEach(function(C){var I=false,w=C.$().outerWidth(true),d={stayInOverflow:false,isOverflowButton:I,moveToOverflow:true,control:C,width:w};var l=C.getLayoutData();if(l instanceof b){I=l.getOverflowButton();d.stayInOverflow=l.getStayInOverflow();d.isOverflowButton=I;if(!I){d.moveToOverflow=l.getMoveToOverflow();}else{if(!w){w=48;d.width=w;}o=d;d.moveToOverflow=false;}}var s=C.getMetadata().getName();if(s!=="sap.m.Button"&&s!=="sap.m.Select"){d.moveToOverflow=false;}c.push(d);a+=w;},this);var O=a-i;return{buttonInfos:c,overflowInPx:O,overflowButtonInfo:o};},_moveControlsToOverflow:function(i){var o=this._calculateOverflowData(i),a=o.buttonInfos,O=o.overflowInPx,h=false,c=o.overflowButtonInfo,s=[],d=[];a=a.filter(function(e){if(!e.stayInOverflow){return true;}h=true;O-=e.width;s.push(e.control);return false;},this);if(c){if(!h&&(O-c.width<=0)){O-=c.width;}}a.reverse();a.some(function(e){var H=O<=0;if(H){return H;}if(e.moveToOverflow){O-=e.width;d.push(e.control);}});d.reverse();d=d.concat(s);if(d.length>0){if(this._fnResized){this._fnResized(d);}}else if(this._oActionSheet.isOpen()){this._oActionSheet.close();}},destroy:function(){if(this._oActionSheet.isOpen()){this._oActionSheet.close();}u.apply(this,arguments);this._oBar.removeEventDelegate(this._oEventDelegate,this);this._detachResize();}});return B;},true);
