'use strict';

/******************
 *  Dependencies  *
 ******************/

var browserify = require('browserify');

/*************
 *  Methods  *
 *************/

/**
 * Creates a new bundle and adds it to the collection
 * @param {Object} options Options associated with the bundle
 */
function create(options) {
    var bundle = this.bundle = browserify(options);

    this.bundles.push(bundle);
    return bundle;
}

