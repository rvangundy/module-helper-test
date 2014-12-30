'use strict';

/******************
 *  Dependencies  *
 ******************/

var fs = require('fs');
var path = require('path');
var handlebars = require('handlebars');
var cheerio = require('cheerio');

/************
 *  Helper  *
 ************/

module.exports = function (modulePath, options) {
    var stylePath, templatePath, content, html, template, doc, first;
    var moduleName = modulePath.split(path.sep).pop();
    var hash = options.hash;
    var data = hash ? hash.data : null;
    var files = fs.readdirSync(modulePath);

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
    if (files.indexOf(moduleName + '.hbs') >= 0) {
        templatePath = path.join(modulePath, moduleName + '.hbs');
        content = fs.readFileSync(templatePath);
        template = handlebars.compile(content.toString());
        html = template(data);
        doc = cheerio.load(html);
        first = doc('div');

        // Add path to style
        if (files.indexOf(moduleName + '.scss') >= 0) {
            stylePath = encodeURIComponent(path.join(modulePath, moduleName + '.scss'));
            first.attr('data-style', stylePath);
        }

        // Add path to module
        if (files.indexOf('index.js') >= 0) {
            modulePath = encodeURIComponent(modulePath);
            first.attr('data-module', modulePath);
        }

        return new handlebars.SafeString(doc.html());
    }
};