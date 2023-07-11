/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/Device",
	"sap/ui/core/UIComponent"
], function(UI5Object, Device, UIComponent) {
	"use strict";
	return UI5Object.extend("cross.fnd.fiori.inbox.ComponentCache", {
		constructor: function(iCacheSize) {
			UI5Object.prototype.constructor.call(this);
			var _iCompCacheMaxSize= 0;
			var _oCompCache = {};
			var _iCachedCompCount = 0;
			var iCacheSz;
			if (jQuery.isNumeric(iCacheSize)) {
				iCacheSz = parseInt(iCacheSize, 10);
				iCacheSz = iCacheSz > 0 ? iCacheSz : undefined;
			}
			else {
				iCacheSz = undefined;
			}
			if (Device.system.desktop) {
				_iCompCacheMaxSize = (iCacheSz) ? iCacheSz : 20;
			}
			else {
				_iCompCacheMaxSize = (iCacheSz) ? iCacheSz : 3;
			}

			//destroy all cached content except the sPreservedKey if given
			this.destroyCacheContent = function(sPreservedKey) {
				for (var sKey in _oCompCache) {
					if (sKey !== sPreservedKey) {
						_oCompCache[sKey].destroy();
						delete _oCompCache[sKey];
						_iCachedCompCount--;
					}
				}
			};

			this.getComponentByKey = function(sKey) {
				return _oCompCache[sKey];
			};

			this.getComponentById = function(sId) {
				var sKey;
				for (sKey in _oCompCache) {
					if (_oCompCache[sKey].getId() === sId) {
						return _oCompCache[sKey];
					}
				}

				// return null;  // consistent-return
			};

			this.cacheComponent = function(sKey, oComp) {
				if (oComp instanceof UIComponent) {
					if (_oCompCache.hasOwnProperty(sKey)) {
						return;
					}
					if (_iCachedCompCount >= _iCompCacheMaxSize) {
						// Evict one entry to make room
						var sKeyToEvict = Object.keys(_oCompCache)[0];
						_oCompCache[sKeyToEvict].destroy();
						delete _oCompCache[sKeyToEvict];
						_iCachedCompCount--;
					}
					_oCompCache[sKey]=oComp;
					_iCachedCompCount++;
				}
				else {
					throw "Cannot cache object: Type mismatch.";
				}
			};
		}
	});
});