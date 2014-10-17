var inherits = require('inherits');
var View = require('view');
var WallView = require('./wall-view');
var WallHeaderView = require('./wall-header-view');
var wallComponentStyles = require('less!streamhub-wall/styles/wall-component');
var Passthrough = require('stream/passthrough');
var PostContentButton = require('streamhub-input/javascript/content-editor/button');
var packageAttribute = require('./package-attribute');

/**
 * LiveMediaWall Component
 * It has a wall-view and a streamhub-input
 * @constructor
 * @param [opts] options
 * @param [opts.postButton=false] Whether to show a postButton or not, or what
 *     kind of postButton (see ./post-buttons)
 * @param [opts.el] {HTMLElement} The element to render in
 * @param [opts.collection] {streamhub-sdk/collection} The StreamHub Collection
 *     to show off in this wall and support uploads to (if auth integration)
 * @param [opts.headerView] {View} A view to use as the header above the wall,
 *     else a wall-header-view will be created for you
 * @param [opts.wallView] {View} A view to use as the main feature, else a
 *     wall-view will be created for you
 * @param [opts.initial] The initial number of items to show in the wall,
 *     if you don't provide your own opts.wallView
 * @param [opts.showMore] The number of items to add to the wall when 'show
 *     more' is clicked, if you don't provide your own opts.wallView
 * @param [opts.modal] A modal instance to use when items in the wall are clicked,
 *     or false if you want it disabled. Used if you don't provide opts.wallView
 * @param [opts.autoRender=true] Whether to automatically render on construction
 */
var WallComponent = module.exports = function (opts) {
    View.apply(this, arguments);

    opts = opts || {};
    this._headerView = opts.headerView || new WallHeaderView({
        postButton: opts.postButton
    });
    this._wallView = opts.wallView || new WallView({
        autoRender: false,
        minContentWidth: opts.minContentWidth,
        columns: opts.columns,
        initial: opts.initial,
        showMore: opts.showMore,
        modal: opts.modal,
        pickColumn: opts.pickColumn
    });

    // Be a writable that really just proxies to the wallView
    Passthrough.apply(this, arguments);
    this.pipe(this._wallView);
    // including more, so that Collection piping works right
    this.more = new Passthrough();
    this.more.pipe(this._wallView.more);

    if (opts.collection) {
        this.setCollection(opts.collection);
    }
    if (( ! ('autoRender' in opts)) || opts.autoRender) {
        this.render();
    }
};

inherits(WallComponent, Passthrough);
inherits.parasitically(WallComponent, View);

/**
 * Set the HTMLElement that this View renders in
 * @override
 * @param el {HTMLElement}
 */
WallComponent.prototype.setElement = function (el) {
    if (this.el) {
        packageAttribute.undecorate(this.el);
    }
    View.prototype.setElement.apply(this, arguments);
    packageAttribute.decorate(this.el);
};

/**
 * Sets up postMessage listener on window and sends a registration
 * message to the permalink-hub running inside of Livefyre.js. On
 * message from the hub it will perform its default permalink
 * behavior.
 * @private
 */
WallComponent.prototype._initPermalink = function() {
    var name = 'media-wall-' + ('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    }));
    var msgEvent = window.addEventListener ? 'message' : 'onmessage';
    var addEvent = window.addEventListener || window.attachEvent;

    var onPostMessage = function(event) {
        var msg = null;

        if (typeof event.data === 'object') {
            msg = event.data;
        } else {
            try {
                msg = JSON.parse(event.data);
            } catch(e) {
                return;
            }
        }

        if (msg.to !== name || !msg.data || msg.action !== 'put') {
            return;
        }

        this._wallView.scrollToPermalink(msg.data.contentId);
    };

    var sendRegistration = function(collectionId) {
        var msg = {
            from: name,
            to: 'permalink',
            action: 'post',
            data: {
                name: name,
                collectionId: collectionId
            }
        };
        window.postMessage(JSON.stringify(msg),'*');
    };

    var self = this;
    addEvent(msgEvent, function(event) {
        onPostMessage.call(self, event);
    }, false);
    sendRegistration(this._collection.id);
};


/**
 * Render the WallComponent
 */
WallComponent.prototype.render = function () {
    View.prototype.render.apply(this, arguments);
    
    var el = this.el;
    var subviews = [this._headerView, this._wallView];

    // Clear children
    while (el.firstChild) {
        el.removeChild(el.firstChild);
    }

    // append container and subviews
    var container = document.createElement('div');
    container.className += ' streamhub-wall-component';
    var frag = document.createDocumentFragment();

    subviews.forEach(function (view) {
        container.appendChild(view.el);
    });

    frag.appendChild(container);
    el.appendChild(frag);

    // then render them
    subviews.forEach(function (view) {
        view.render();
    });

    return el;
};

/**
 * Set the Collection shown in this WallComponent
 * @param {collection}
 */
WallComponent.prototype.setCollection = function (collection) {
    if (this._collection) {
        this._collection.unpipe(this._wallView)
    }
    this._collection = collection;
    this._collection.pipe(this._wallView);
    this._headerView.setCollection(collection);

    if (!this._collection.id) {
        var self = this;
        this._collection.once('_initFromBootstrap', function(){
            self._initPermalink();
        });
    }
};

