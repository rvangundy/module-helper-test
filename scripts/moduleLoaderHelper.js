'use strict';

/******************
 *  Dependencies  *
 ******************/

var fs = require('fs');
var path = require('path');
var handlebars = require('handlebars');

// var site = require('./site');

/************
 *  Helper  *
 ************/

module.exports = function(modulePath, options) {
    var templatePath, content, template;
    var moduleName = modulePath.split(path.sep).pop();
    var hash = options.hash;
    var data = hash ? hash.data : null;

    // Remove data from options hash
    if (data) {
        delete hash.data;
        data = fs.readFileSync(data);
        data = JSON.parse(data);
    } else {
        data = {};
    }

    // Override data properties from hash
    if (hash) {
        for (var i in hash) {
            data[i] = hash[i];
        }
    }

    // Get path to template file
    templatePath = path.join(modulePath, moduleName + '.hbs');

    if (fs.existsSync(templatePath)) {
        content = fs.readFileSync(templatePath);
        template = handlebars.compile(content.toString());
        return new handlebars.SafeString(template(data));
    }
};