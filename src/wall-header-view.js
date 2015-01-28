var auth = require('auth');
var inherits = require('inherits');
var View = require('view');
var Passthrough = require('stream/passthrough');
var ContentEditorButton = require('streamhub-input').ContentEditorButton;
var UploadButton = require('streamhub-input').UploadButton;
var packageAttribute = require('./package-attribute');
var ModalView = require('streamhub-sdk/modal');
var postButtons = require('streamhub-wall/post-buttons');

/**
 * Header of LiveMediaWall.
 * It has a streamhub-input button iff auth.hasDelegate();
 * @constructor
 */
var WallHeaderView = module.exports = function (opts) {
    View.apply(this, arguments);
    opts = opts || {};
    this._rendered = false;
    this._postButton = opts.postButton ?
        this._createPostButton(opts.postButton) : null;
    if (opts.collection) {
        this.setCollection(opts.collection);
    }
};

inherits(WallHeaderView, View);

WallHeaderView.prototype.elTag = 'menu';

WallHeaderView.prototype.template = function () { return ''; };

/**
 * Render the WallHeaderView
 */
WallHeaderView.prototype.render = function () {
    View.prototype.render.apply(this, arguments);
    if ( ! this._postButton || ! this._collection) {
        return;
    }
    renderPostButton.call(this, true);
    this._rendered = true;
};

function renderPostButton(show) {
    var postButtonEl = this._postButton.el;
    if (show) {
        this._postButton.render();
        this.el.appendChild(postButtonEl);
    } else {
        this.el.removeChild(postButtonEl);
    }
}

/**
 * Set the Collection that the post button will pipe into
 */
WallHeaderView.prototype.setCollection = function (collection) {
    var postButton = this._postButton;
    if (this._collection && this._postButton) {
        postButton.unpipe(this._collection);
    }
    this._collection = collection;
    if (this._postButton && collection) {
        postButton.pipe(collection);
    }
    if (this._rendered) {
        this.render();
    }
};

/**
 * Get the editor button styles into a format that the button expects.
 * @param {Object} opts The object that contains the button styles.
 * @return {Object} The adapted button styles.
 */
function getEditorButtonStyles(opts) {
    return {
        activeBackgroundColor: opts.postActiveBackgroundColor,
        activeBorderColor: opts.postActiveBorderColor,
        activeTextColor: opts.postActiveTextColor,
        backgroundColor: opts.postBackgroundColor,
        borderColor: opts.postBorderColor,
        hoverBackgroundColor: opts.postHoverBackgroundColor,
        hoverBorderColor: opts.postHoverBorderColor,
        hoverTextColor: opts.postHoverTextColor,
        textColor: opts.postTextColor
    };
}

/**
 * Create the Button that will let the user post content into the
 * right Collection
 * @param kind - 'content', 'contentWithPhotos', 'photo', true, or falsy
 */
WallHeaderView.prototype._createPostButton = function (kind) {
    var mediaEnabled;
    var button;
    var self = this;

    switch (kind) {
        case postButtons.photo:
            button = new UploadButton({
                modal: createModal(),
                stylePrefix: this.opts.stylePrefix,
                styles: getEditorButtonStyles(this.opts.themeOpts)
            });
            break;
        case postButtons.content:
            button = createEditorButton(false);
            break;
        case postButtons.contentWithPhotos:
        case true:
            button = createEditorButton(true);
            break;
    }

    // Create a Modal that will add the streamhub-wall#vN attribute
    // to its parent when it is shown, so that our css rules can be namespaced
    // nicely
    function createModal() {
        var modal = new ModalView();
        packageAttribute.decorateModal(modal);
        return modal;
    }

    // Create an editor button with or without media enabled. This also grabs
    // theme options from the opts object provided to this class so the button
    // can be styled appropriately.
    function createEditorButton(mediaEnabled) {
        return new ContentEditorButton({
            mediaEnabled: mediaEnabled,
            modal: createModal(),
            input: createInput(mediaEnabled),
            stylePrefix: self.opts.stylePrefix,
            styles: getEditorButtonStyles(self.opts.themeOpts)
        });
    }

    // Create a custom ContentEditor input whose UploadButton will launch
    // a modal that has the right packageAttribute on its parent
    function createInput(mediaEnabled) {
        var input = ContentEditorButton.prototype.createInput.call(this, {
            mediaEnabled: mediaEnabled
        });
        // patch .createUploadButton to create one that uses a modal
        // with streamhub-wall packageAttribute
        var ogCreateUploadButton = input.createUploadButton;
        input.createUploadButton = function (opts) {
            opts = opts || {};
            opts.modal = createModal();
            var uploadButton = ogCreateUploadButton.call(this, opts);
            return uploadButton;
        };
        return input;
    }
    return button;
};
