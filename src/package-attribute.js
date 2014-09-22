var packageJson = require('json!streamhub-wall/../package.json');
var packageAttribute = 'data-lf-package';
var bind = require('mout/function/bind');
var trim = require('mout/string/trim');
var packageAttributeValue = packageName(packageJson);

exports.attribute = packageAttribute;
exports.value = packageAttributeValue;

/**
 * Decorate an HTMLElement with the proper package attribute
 * for streamhub-wall e.g.
 * data-lf-package="streamhub-wall#3.0.0"
 */
exports.decorate = function (el) {
    var currentVal = trim(el.getAttribute(packageAttribute) || '');
    var currentPackageAttrs = currentVal.split(' ');
    var newVal;
    // Add this package attribute value if it's not already there
    if (currentPackageAttrs.indexOf(packageAttributeValue) === -1) {
        currentPackageAttrs.push(packageAttributeValue);
        newVal = currentPackageAttrs.join(' ');
        el.setAttribute(packageAttribute, newVal);
    }
};

/**
 * Remove the package attribute from an HTMLElement
 */
exports.undecorate = function (el) {
    var currentVal = el.getAttribute(packageAttribute) || '';
    var newVal = currentVal.replace(packageAttributeValue, '');
    el.setAttribute(packageAttribute, newVal);
};

/**
 * Decorate a streamhub-sdk/modal instance so that whenever it is shown,
 * the package attribute is added to its parentNode, and when it is hidden,
 * the attribute is removed
 */
exports.decorateModal = function modalWithPackageSelector(modal) {
    modal.$el.on('showing', bind(setHasPackageAttribute, {}, [modal, true]));
    modal.$el.on('hiding', bind(setHasPackageAttribute, {}, [modal, false]));
    return modal;
};

function setHasPackageAttribute(modal, shouldHaveAttr) {
    exports[shouldHaveAttr ? 'decorate' : 'undecorate'](modal.parentNode);
}

function packageName(packageJson) {
    return packageJson.name + '#' + packageJson.version;
}
