/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/base/Object"],function(B){"use strict";B.extend("cross.fnd.fiori.inbox.util.IDHelper",{});cross.fnd.fiori.inbox.util.IDHelper=(function(){var O=sap.ui.require("sap/base/util/ObjectPath");var _="cross.fnd.fiori.inbox";return{generateID:function(s){var i;if(s&&typeof s==="string"){i=_.concat(".").concat(s);}else{i=_;}return i;},getNamespace:function(){var n=O.get(_);if(!n){n=O.create(_);}return n;}};}());return cross.fnd.fiori.inbox.util.IDHelper;});
