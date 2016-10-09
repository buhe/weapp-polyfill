var exports = module.exports = {};(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.weappPolyfill = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var localStorage = require('./localstorage.js');
var XMLHttpRequest = require('./xmlhttprequest.js');
var WebSocket = require('./websocket.js');

module.exports = {
    polyfill(target = this) {
        if (typeof target !== 'object') {
            throw new Error('polyfill target is not an Object');
        }
        Object.assign(target, {
            localStorage,
            XMLHttpRequest,
            WebSocket,
            Object,
        });
        // window.localStorage is readonly
        if (target.localStorage !== localStorage) {
            target.wxStorage = localStorage;
        }
    }
}

},{"./localstorage.js":2,"./websocket.js":7,"./xmlhttprequest.js":8}],2:[function(require,module,exports){
class Storage {
    getItem(key) {
        return wx.getStorageSync(key);
    }

    setItem(key, value) {
        return wx.setStorageSync(key, value);
    }

    removeItem(key) {
        return this.setItem(key, '');
    }

    clear() {
        return wx.clearStorageSync();
    }
}

module.exports = new Storage();
},{}],3:[function(require,module,exports){
/**
 * @author Toru Nagashima
 * @copyright 2015 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */

"use strict";

/**
 * Creates a unique key.
 *
 * @param {string} name - A name to create.
 * @returns {symbol|string}
 * @private
 */
var createUniqueKey = exports.createUniqueKey = (typeof Symbol !== "undefined" ?
    Symbol :
    function createUniqueKey(name) {
        return "[[" + name + "_" + Math.random().toFixed(8).slice(2) + "]]";
    });

/**
 * The key of listeners.
 *
 * @type {symbol|string}
 * @private
 */
exports.LISTENERS = createUniqueKey("listeners");

/**
 * A value of kind for listeners which are registered in the capturing phase.
 *
 * @type {number}
 * @private
 */
exports.CAPTURE = 1;

/**
 * A value of kind for listeners which are registered in the bubbling phase.
 *
 * @type {number}
 * @private
 */
exports.BUBBLE = 2;

/**
 * A value of kind for listeners which are registered as an attribute.
 *
 * @type {number}
 * @private
 */
exports.ATTRIBUTE = 3;

/**
 * @typedef object ListenerNode
 * @property {function} listener - A listener function.
 * @property {number} kind - The kind of the listener.
 * @property {ListenerNode|null} next - The next node.
 *      If this node is the last, this is `null`.
 */

/**
 * Creates a node of singly linked list for a list of listeners.
 *
 * @param {function} listener - A listener function.
 * @param {number} kind - The kind of the listener.
 * @returns {ListenerNode} The created listener node.
 */
exports.newNode = function newNode(listener, kind) {
    return {listener: listener, kind: kind, next: null};
};

},{}],4:[function(require,module,exports){
/**
 * @author Toru Nagashima
 * @copyright 2015 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */

"use strict";

//-----------------------------------------------------------------------------
// Requirements
//-----------------------------------------------------------------------------

var Commons = require("./commons");
var LISTENERS = Commons.LISTENERS;
var ATTRIBUTE = Commons.ATTRIBUTE;
var newNode = Commons.newNode;

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

/**
 * Gets a specified attribute listener from a given EventTarget object.
 *
 * @param {EventTarget} eventTarget - An EventTarget object to get.
 * @param {string} type - An event type to get.
 * @returns {function|null} The found attribute listener.
 */
function getAttributeListener(eventTarget, type) {
    var node = eventTarget[LISTENERS][type];
    while (node != null) {
        if (node.kind === ATTRIBUTE) {
            return node.listener;
        }
        node = node.next;
    }
    return null;
}

/**
 * Sets a specified attribute listener to a given EventTarget object.
 *
 * @param {EventTarget} eventTarget - An EventTarget object to set.
 * @param {string} type - An event type to set.
 * @param {function|null} listener - A listener to be set.
 * @returns {void}
 */
function setAttributeListener(eventTarget, type, listener) {
    if (typeof listener !== "function" && typeof listener !== "object") {
        listener = null; // eslint-disable-line no-param-reassign
    }

    var prev = null;
    var node = eventTarget[LISTENERS][type];
    while (node != null) {
        if (node.kind === ATTRIBUTE) {
            // Remove old value.
            if (prev == null) {
                eventTarget[LISTENERS][type] = node.next;
            }
            else {
                prev.next = node.next;
            }
        }
        else {
            prev = node;
        }

        node = node.next;
    }

    // Add new value.
    if (listener != null) {
        if (prev == null) {
            eventTarget[LISTENERS][type] = newNode(listener, ATTRIBUTE);
        }
        else {
            prev.next = newNode(listener, ATTRIBUTE);
        }
    }
}

//-----------------------------------------------------------------------------
// Public Interface
//-----------------------------------------------------------------------------

/**
 * Defines an `EventTarget` implementation which has `onfoobar` attributes.
 *
 * @param {EventTarget} EventTargetBase - A base implementation of EventTarget.
 * @param {string[]} types - A list of event types which are defined as attribute listeners.
 * @returns {EventTarget} The defined `EventTarget` implementation which has attribute listeners.
 */
exports.defineCustomEventTarget = function(EventTargetBase, types) {
    function EventTarget() {
        EventTargetBase.call(this);
    }

    var descripter = {
        constructor: {
            value: EventTarget,
            configurable: true,
            writable: true
        }
    };

    types.forEach(function(type) {
        descripter["on" + type] = {
            get: function() { return getAttributeListener(this, type); },
            set: function(listener) { setAttributeListener(this, type, listener); },
            configurable: true,
            enumerable: true
        };
    });

    EventTarget.prototype = Object.create(EventTargetBase.prototype, descripter);

    return EventTarget;
};

},{"./commons":3}],5:[function(require,module,exports){
/**
 * @author Toru Nagashima
 * @copyright 2015 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */

"use strict";

//-----------------------------------------------------------------------------
// Requirements
//-----------------------------------------------------------------------------

var Commons = require("./commons");
var CustomEventTarget = require("./custom-event-target");
var EventWrapper = require("./event-wrapper");
var LISTENERS = Commons.LISTENERS;
var CAPTURE = Commons.CAPTURE;
var BUBBLE = Commons.BUBBLE;
var ATTRIBUTE = Commons.ATTRIBUTE;
var newNode = Commons.newNode;
var defineCustomEventTarget = CustomEventTarget.defineCustomEventTarget;
var createEventWrapper = EventWrapper.createEventWrapper;
var STOP_IMMEDIATE_PROPAGATION_FLAG =
    EventWrapper.STOP_IMMEDIATE_PROPAGATION_FLAG;

//-----------------------------------------------------------------------------
// Constants
//-----------------------------------------------------------------------------

/**
 * A flag which shows there is the native `EventTarget` interface object.
 *
 * @type {boolean}
 * @private
 */
var HAS_EVENTTARGET_INTERFACE = (
    typeof window !== "undefined" &&
    typeof window.EventTarget !== "undefined"
);

//-----------------------------------------------------------------------------
// Public Interface
//-----------------------------------------------------------------------------

/**
 * An implementation for `EventTarget` interface.
 *
 * @constructor
 * @public
 */
var EventTarget = module.exports = function EventTarget() {
    if (this instanceof EventTarget) {
        // this[LISTENERS] is a Map.
        // Its key is event type.
        // Its value is ListenerNode object or null.
        //
        // interface ListenerNode {
        //     var listener: Function
        //     var kind: CAPTURE|BUBBLE|ATTRIBUTE
        //     var next: ListenerNode|null
        // }
        Object.defineProperty(this, LISTENERS, {value: Object.create(null)});
    }
    else if (arguments.length === 1 && Array.isArray(arguments[0])) {
        return defineCustomEventTarget(EventTarget, arguments[0]);
    }
    else if (arguments.length > 0) {
        var types = Array(arguments.length);
        for (var i = 0; i < arguments.length; ++i) {
            types[i] = arguments[i];
        }

        // To use to extend with attribute listener properties.
        // e.g.
        //     class MyCustomObject extends EventTarget("message", "error") {
        //         //...
        //     }
        return defineCustomEventTarget(EventTarget, types);
    }
    else {
        throw new TypeError("Cannot call a class as a function");
    }
};

EventTarget.prototype = Object.create(
    (HAS_EVENTTARGET_INTERFACE ? window.EventTarget : Object).prototype,
    {
        constructor: {
            value: EventTarget,
            writable: true,
            configurable: true
        },

        addEventListener: {
            value: function addEventListener(type, listener, capture) {
                if (listener == null) {
                    return false;
                }
                if (typeof listener !== "function" && typeof listener !== "object") {
                    throw new TypeError("\"listener\" is not an object.");
                }

                var kind = (capture ? CAPTURE : BUBBLE);
                var node = this[LISTENERS][type];
                if (node == null) {
                    this[LISTENERS][type] = newNode(listener, kind);
                    return true;
                }

                var prev = null;
                while (node != null) {
                    if (node.listener === listener && node.kind === kind) {
                        // Should ignore a duplicated listener.
                        return false;
                    }
                    prev = node;
                    node = node.next;
                }

                prev.next = newNode(listener, kind);
                return true;
            },
            configurable: true,
            writable: true
        },

        removeEventListener: {
            value: function removeEventListener(type, listener, capture) {
                if (listener == null) {
                    return false;
                }

                var kind = (capture ? CAPTURE : BUBBLE);
                var prev = null;
                var node = this[LISTENERS][type];
                while (node != null) {
                    if (node.listener === listener && node.kind === kind) {
                        if (prev == null) {
                            this[LISTENERS][type] = node.next;
                        }
                        else {
                            prev.next = node.next;
                        }
                        return true;
                    }

                    prev = node;
                    node = node.next;
                }

                return false;
            },
            configurable: true,
            writable: true
        },

        dispatchEvent: {
            value: function dispatchEvent(event) {
                // If listeners aren't registered, terminate.
                var node = this[LISTENERS][event.type];
                if (node == null) {
                    return true;
                }

                // Since we cannot rewrite several properties, so wrap object.
                var wrapped = createEventWrapper(event, this);

                // This doesn't process capturing phase and bubbling phase.
                // This isn't participating in a tree.
                while (node != null) {
                    if (typeof node.listener === "function") {
                        node.listener.call(this, wrapped);
                    }
                    else if (node.kind !== ATTRIBUTE && typeof node.listener.handleEvent === "function") {
                        node.listener.handleEvent(wrapped);
                    }

                    if (wrapped[STOP_IMMEDIATE_PROPAGATION_FLAG]) {
                        break;
                    }
                    node = node.next;
                }

                return !wrapped.defaultPrevented;
            },
            configurable: true,
            writable: true
        }
    }
);

},{"./commons":3,"./custom-event-target":4,"./event-wrapper":6}],6:[function(require,module,exports){
/**
 * @author Toru Nagashima
 * @copyright 2015 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */

"use strict";

//-----------------------------------------------------------------------------
// Requirements
//-----------------------------------------------------------------------------

var createUniqueKey = require("./commons").createUniqueKey;

//-----------------------------------------------------------------------------
// Constsnts
//-----------------------------------------------------------------------------

/**
 * The key of the flag which is turned on by `stopImmediatePropagation` method.
 *
 * @type {symbol|string}
 * @private
 */
var STOP_IMMEDIATE_PROPAGATION_FLAG =
    createUniqueKey("stop_immediate_propagation_flag");

/**
 * The key of the flag which is turned on by `preventDefault` method.
 *
 * @type {symbol|string}
 * @private
 */
var CANCELED_FLAG = createUniqueKey("canceled_flag");

/**
 * The key of the original event object.
 *
 * @type {symbol|string}
 * @private
 */
var ORIGINAL_EVENT = createUniqueKey("original_event");

/**
 * Method definitions for the event wrapper.
 *
 * @type {object}
 * @private
 */
var wrapperPrototypeDefinition = Object.freeze({
    stopPropagation: Object.freeze({
        value: function stopPropagation() {
            var e = this[ORIGINAL_EVENT];
            if (typeof e.stopPropagation === "function") {
                e.stopPropagation();
            }
        },
        writable: true,
        configurable: true
    }),

    stopImmediatePropagation: Object.freeze({
        value: function stopImmediatePropagation() {
            this[STOP_IMMEDIATE_PROPAGATION_FLAG] = true;

            var e = this[ORIGINAL_EVENT];
            if (typeof e.stopImmediatePropagation === "function") {
                e.stopImmediatePropagation();
            }
        },
        writable: true,
        configurable: true
    }),

    preventDefault: Object.freeze({
        value: function preventDefault() {
            if (this.cancelable === true) {
                this[CANCELED_FLAG] = true;
            }

            var e = this[ORIGINAL_EVENT];
            if (typeof e.preventDefault === "function") {
                e.preventDefault();
            }
        },
        writable: true,
        configurable: true
    }),

    defaultPrevented: Object.freeze({
        get: function defaultPrevented() { return this[CANCELED_FLAG]; },
        enumerable: true,
        configurable: true
    })
});

//-----------------------------------------------------------------------------
// Public Interface
//-----------------------------------------------------------------------------

exports.STOP_IMMEDIATE_PROPAGATION_FLAG = STOP_IMMEDIATE_PROPAGATION_FLAG;

/**
 * Creates an event wrapper.
 *
 * We cannot modify several properties of `Event` object, so we need to create the wrapper.
 * Plus, this wrapper supports non `Event` objects.
 *
 * @param {Event|{type: string}} event - An original event to create the wrapper.
 * @param {EventTarget} eventTarget - The event target of the event.
 * @returns {Event} The created wrapper. This object is implemented `Event` interface.
 * @private
 */
exports.createEventWrapper = function createEventWrapper(event, eventTarget) {
    var timeStamp = (
        typeof event.timeStamp === "number" ? event.timeStamp : Date.now()
    );
    var propertyDefinition = {
        type: {value: event.type, enumerable: true},
        target: {value: eventTarget, enumerable: true},
        currentTarget: {value: eventTarget, enumerable: true},
        eventPhase: {value: 2, enumerable: true},
        bubbles: {value: Boolean(event.bubbles), enumerable: true},
        cancelable: {value: Boolean(event.cancelable), enumerable: true},
        timeStamp: {value: timeStamp, enumerable: true},
        isTrusted: {value: false, enumerable: true}
    };
    propertyDefinition[STOP_IMMEDIATE_PROPAGATION_FLAG] = {value: false, writable: true};
    propertyDefinition[CANCELED_FLAG] = {value: false, writable: true};
    propertyDefinition[ORIGINAL_EVENT] = {value: event};

    // For CustomEvent.
    if (typeof event.detail !== "undefined") {
        propertyDefinition.detail = {value: event.detail, enumerable: true};
    }

    return Object.create(
        Object.create(event, wrapperPrototypeDefinition),
        propertyDefinition
    );
};

},{"./commons":3}],7:[function(require,module,exports){
const EventTarget = require('event-target-shim');

const CONNECTING = 0;
const OPEN = 1;
const CLOSING = 2;
const CLOSED = 3;

const EVENTS = [
    'open',
    'error',
    'message',
    'close',
];

let instance;

wx.onSocketOpen(function (event) {
    if (instance) {
        instance._readyState = OPEN;
        instance.dispatchEvent({
            type: 'open'
        });
    }
});
wx.onSocketError(function (event) {
    if (instance) {
        instance._readyState = CLOSED;
        instance.dispatchEvent(event);
    }
});
wx.onSocketMessage(function (event) {
    if (instance) {
        var {
            data,
            origin,
            ports,
            source,
        } = event;
        instance.dispatchEvent({
            data,
            origin,
            ports,
            source,
            type: 'message',
        });
    }
});
wx.onSocketClose(function (event) {
    if (instance) {
        instance._readyState = CLOSED;
        var {
            code,
            reason,
            wasClean,
        } = event;
        instance.dispatchEvent({
            code,
            reason,
            wasClean,
            type: 'close',
        });
        instance = null;
    }
});

class WebSocket extends EventTarget {
    constructor(url, protocal) {
        if (!url) {
            throw new TypeError('Failed to construct \'WebSocket\': url required');
        }
        if (protocal) {
            throw new Error('subprotocal not supported in weapp');
        }
        super(EVENTS);
        this._url = url;
        this._protocal = ''; // default value according to specs
        this._readyState = CONNECTING;
        if (instance) {
            // instance._removeEventListeners();
            instance.dispatchEvent({
                type: 'close'
            });
        }
        instance = this;
        wx.connectSocket({
            url
        });
        // this._addEventListeners();
    }

    get url() {
        return this._url;
    }
    get protocal() {
        return this._protocal;
    }
    get readyState() {
        return this._readyState;
    }

    close() {
        if (this.readyState === CONNECTING) {
            console.warn('close WebSocket which is connecting might not work');
        }
        // this._removeEventListeners();
        wx.closeSocket();
    }

    send(data) {
        if (this.readyState !== OPEN) {
            throw new Error('INVALID_STATE_ERR');
        }

        if (typeof data !== 'string') {
            throw new TypeError('only string typed data are supported');
        }

        wx.sendSocketMessage({
            data
        });
    }

    // _addEventListeners() {
    // }

    // _removeEventListeners() {
    //   // no wx API for this
    // }
}

Object.assign(WebSocket, {
    CONNECTING,
    OPEN,
    CLOSING,
    CLOSED,
});

module.exports = WebSocket;

},{"event-target-shim":5}],8:[function(require,module,exports){
const EventTarget = require('event-target-shim');

const UNSENT = 0;
const OPENED = 1;
const HEADERS_RECEIVED = 2;
const LOADING = 3;
const DONE = 4;

const REQUEST_EVENTS = [
  'abort',
  'error',
  'load',
  'loadstart',
  'progress',
  'timeout',
  'loadend',
  'readystatechange'
];

class XMLHttpRequestEventTarget extends EventTarget {}

class XMLHttpRequest extends XMLHttpRequestEventTarget {

    constructor() {
        super(REQUEST_EVENTS);
        this.readyState = UNSET;
        this._headers = {};
    }

    abort() {
        throw new Error('not supported in weapp');
    }
    getAllResponseHeaders() {
        throw new Error('not supported in weapp');
    }
    getResponseHeader() {
        throw new Error('not supported in weapp');
    }
    overrideMimeType() {
        throw new Error('not supported in weapp');
    }
    open(method, url, async = true) {
        if (this.readyState !== UNSENT) {
            throw new Error('request is already opened');
        }
        if (!async) {
            throw new Error('sync request is not supported');
        }
        this._method = method;
        this._url = url;
        this.readyState = OPENED;
        this.dispatchEvent({type: 'readystatechange'});
    }
    setRequestHeader(header, value) {
        if (this.readyState !== OPENED) {
            throw new Error('request is not opened');
        }
        this._headers[header.toLowerCase()] = value;
    }
    send(data) {
        if (this.readyState !== OPENED) {
            throw new Error('request is not opened');
        }
        wx.request({
            url: this._url,
            data: data,
            header: this._headers,
            success: (response) => {
                this.status = response.statusCode;
                let text = response.data;
                if (typeof text !== string) {
                    text = JSON.stringify(text);
                }
                this.responseText = this.response = text;
                this.readyState = DONE;
                this.dispatchEvent({type: 'readystatechange'});
            },
            fail: (error) => {
                this.dispatchEvent({type: 'error'});
            }
        })
    }
}

Object.assign(XMLHttpRequest, {
    UNSENT,
    OPENED,
    HEADERS_RECEIVED,
    LOADING,
    DONE,
});

module.exports = XMLHttpRequest;

},{"event-target-shim":5}]},{},[1])(1)
});