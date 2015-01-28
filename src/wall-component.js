var $ = require('streamhub-sdk/jquery');
var inherits = require('inherits');
var View = require('view');
var WallView = require('./wall-view');
var WallHeaderView = require('./wall-header-view');
var wallComponentStyles = require('less!streamhub-wall/styles/wall-component');
var Passthrough = require('stream/passthrough');
var PostContentButton = require('streamhub-input/javascript/content-editor/button');
var packageAttribute = require('./package-attribute');
var ThemeStyler = require('livefyre-theme-styler');
var TSColors = require('livefyre-theme-styler/colors');
var smallTheme = require('streamhub-wall/themes/small');
var mediumTheme = require('streamhub-wall/themes/medium');
var largeTheme = require('streamhub-wall/themes/large');
var uuid = require('node-uuid');
var Collection = require('streamhub-sdk/collection');
var themableCss = require('text!streamhub-wall/styles/theme.css');

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
    opts = this._opts = opts || {};

    this._uuid = uuid();
    this._stylePrefix = ['[lf-wall-uuid="',this._uuid,'"] '].join('');

    View.apply(this, arguments);
    // Be a writable that really just proxies to the wallView
    Passthrough.apply(this, arguments);

    if (opts.collection) {
        this._setCollection(opts.collection);
    }

    this._themeOpts = this._getThemeOpts(opts);
    this._initializeHeaderView(opts);
    this._initializeWallView(opts);

    if (( ! ('autoRender' in opts)) || opts.autoRender) {
        this.render();
    }

    if (this._collection) {
        this._collection.pipe(this._wallView);
    }
};

inherits(WallComponent, Passthrough);
inherits.parasitically(WallComponent, View);

/**
 * Element prefixes that we want to theme.
 * @type {Array.<string>}
 */
var THEMABLE_ELEMENTS = ['post', 'showMore'];

/**
 * Properties that will have colors generated for them.
 * @type {Object}
 */
var THEMABLE_STYLES = {
    dark: {
        activeBackgroundColor: {fn: 'blacken', amt: 5},
        activeBorderColor: {fn: 'blacken', amt: 20},
        activeTextColor: {color: '#fff'},
        backgroundColor: null,
        borderColor: {fn: 'blacken', amt: 15},
        hoverBackgroundColor: null,
        hoverBorderColor: null,
        hoverTextColor: {color: '#fff'},
        textColor: {color: '#fff'}
    },
    light: {
        activeBackgroundColor: {fn: 'lighten', amt: 5},
        activeBorderColor: {fn: 'lighten', amt: 20},
        activeTextColor: {color: '#000'},
        backgroundColor: null,
        borderColor: {fn: 'lighten', amt: 15},
        hoverBackgroundColor: null,
        hoverBorderColor: null,
        hoverTextColor: {color: '#000'},
        textColor: {color: '#000'}
    }
};

/**
 * Apply the provided theme argument to the theme css via the theme styler.
 * @param {Object} theme The themes properties to add.
 * @private
 */
WallComponent.prototype._applyTheme = function (theme) {
    $.extend(this._opts, theme);

    this._themeStyler = this._themeStyler || new ThemeStyler({
        css: themableCss,
        prefix: this._stylePrefix
    });
    this._themeStyler.applyTheme(theme);
};

/**
 * Configure the theme options. Loops through all the themable elements and
 * generates colors for them. If the colors are already specified in the opts
 * argument, they will not be overridden.
 * @param {Object} opts The theme options to update.
 * @private
 */
function configureThemeOpts(opts) {
    var prefix;
    var styles;

    if (!opts.linkColor) {
        return;
    }

    for (var i=0; i<THEMABLE_ELEMENTS.length; i++) {
        prefix = THEMABLE_ELEMENTS[i];
        styles = TSColors.generateColors(prefix, opts.linkColor, THEMABLE_STYLES);
        $.extend(opts, $.extend(styles, opts));
    }
}

/**
 * Get and configure the theme options for the app.
 * @param {Object} opts Config options to use/add to.
 * @return {Object} The theme options.
 * @private
 */
WallComponent.prototype._getThemeOpts = function (opts) {
    opts = opts || {};

    var fontSize = opts.fontSize ? opts.fontSize.toLowerCase() : '';
    var fontSizeOpts = {};
    if (fontSize === 'small') {
        fontSizeOpts = smallTheme;
    } else if (fontSize === 'medium') {
        fontSizeOpts = mediumTheme;
    } else if (fontSize === 'large') {
        fontSizeOpts = largeTheme;
    }

    var theme = $.extend(this._themeOpts || {}, opts);
    configureThemeOpts(theme);

    return $.extend(opts, theme, fontSizeOpts);
};

/**
 * Create a WallHeaderView and assign to this._headerView.
 * @param opts {object} WallComponent configuration options.
 * @private
 */
WallComponent.prototype._initializeHeaderView = function (opts) {
    this._headerView = opts.headerView || new WallHeaderView({
        collection: opts.collection,
        postButton: opts.postButton,
        stylePrefix: this._stylePrefix,
        themeOpts: this._themeOpts
    });
};

/**
 * Create a WallView and assign to this._wallView.
 * Also pipe this WallComponent's writable side and .more to the WallView's
 * @param opts {object} WallComponent configuration options.
 * @private
 */
WallComponent.prototype._initializeWallView = function (opts) {
    this._wallView = opts.wallView || new WallView({
        autoRender: false,
        minContentWidth: opts.minContentWidth,
        columns: opts.columns,
        initial: opts.initial,
        showMore: opts.showMore,
        modal: opts.modal,
        pickColumn: opts.pickColumn
    });

    this.pipe(this._wallView);
    // including more, so that Collection piping works right
    this.more = new Passthrough();
    this.more.pipe(this._wallView.more);
};

/**
 * Given a Collection, return whether it is the same Collection as this
 * WallComponent is currently using
 * @param {Object|Collection} collection Collection to compare to.
 * @private
 */
WallComponent.prototype._isSameCollection = function (collection) {
    var oldCollection = this._collection;
    return oldCollection && collection
        && oldCollection.network === collection.network
        && oldCollection.environment === collection.environment
        && oldCollection.siteId === collection.siteId
        && oldCollection.articleId === collection.articleId;
};

/**
 * Remove any current theme configuration for this Component, returning
 * it to default styles.
 * @private
 */
WallComponent.prototype._removeTheme = function () {
    this._themeStyler.destroy();
};

/**
 * Set internal state as to which collection should be shown in this wall.
 * This will not re-render or recreate subviews. That should be done separately.
 * @param {collection} The collection to set.
 * @private
 */
WallComponent.prototype._setCollection = function (newCollection) {
    var oldCollection = this._collection;

    if (oldCollection && typeof oldCollection.unpipe === 'function') {
        oldCollection.unpipe(this._wallView);
    }

    // If this is not a full streamhub-sdk newCollection object, then make
    // it one
    if (newCollection && typeof newCollection.pipe !== 'function') {
        newCollection = new Collection(newCollection);
    }

    // Actually set internal state
    this._collection = newCollection;
    this._opts.collection = newCollection;
};

/**
 * Restore configuration values back to defaults
 * @private
 */
WallComponent.prototype._unconfigure = function () {
    this._removeTheme();
    this.configure({
        collection: null
    });
};

/**
 * Change configuration after construction
 * @param configOpts {collection} WallComponent configuration object
 */
WallComponent.prototype.configure = function (configOpts) {
    var reconstructWallView = false;
    var reconstructHeaderView = false;
    var newCollection;
    var needRender = false;
    var needCollectionPipeToWallView = false;

    if (!configOpts) {
        this._unconfigure();
        return;
    }

    if (configOpts.linkColor !== this._themeOpts.linkColor) {
        reconstructHeaderView = true;
    }

    this._themeOpts = this._getThemeOpts(configOpts);
    this._applyTheme(this._themeOpts);

    if ('columns' in configOpts) {
        this._opts.columns = configOpts.columns;
        this._wallView.relayout({
            columns: configOpts.columns
        });
    }
    if ('initial' in configOpts) {
        this._opts.initial = configOpts.initial;
        newCollection = this._collection;
        reconstructWallView = true;
    }
    if ('modal' in configOpts) {
        this._opts.modal = configOpts.modal;
        newCollection = this._collection;
        reconstructWallView = true;
    }
    if ('collection' in configOpts) {
        newCollection = configOpts.collection;
        if ( ! this._isSameCollection(newCollection)) {
            this._setCollection(newCollection);
            reconstructWallView = true;
            reconstructHeaderView = true;
        }
    }
    if ('postButton' in configOpts) {
        this._opts.postButton = configOpts.postButton;
        reconstructHeaderView = true;
    }
    if (reconstructWallView) {
        this._wallView.destroy();
        this._initializeWallView(this._opts);
        needRender = true;
        needCollectionPipeToWallView = true;
    }
    if (reconstructHeaderView) {
        this._headerView.destroy();
        this._initializeHeaderView(this._opts);
        needRender = true;
    }
    if (needRender) {
        this.render();
    }
    if (needCollectionPipeToWallView && this._collection) {
        this._collection.pipe(this._wallView);
    }
};

/**
 * The entered view callback
 */
WallComponent.prototype.enteredView = function () {
    this._wallView.relayout();
};

/**
 * Render the WallComponent
 */
WallComponent.prototype.render = function () {
    View.prototype.render.apply(this, arguments);

    if (this._themeOpts) {
        this._applyTheme(this._themeOpts);
    }

    var el = this.el;
    var subviews = [this._headerView, this._wallView];

    // Clear children
    while (el.firstChild) {
        el.removeChild(el.firstChild);
    }

    // append container and subviews
    var container = document.createElement('div');
    $(container).addClass('streamhub-wall-component');
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
 * Public interface to change the Collection currently being rendered by this
 * WallComponent
 * @param collection {object|Collection} Collection to compare to.
 */
WallComponent.prototype.setCollection = function (newCollection) {
    this.configure({ collection: newCollection });
};

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
    this.el.setAttribute('lf-wall-uuid', this._uuid);
};
