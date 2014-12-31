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

module.exports = function(sites) {
    return function (modulePath, options) {
        var stylePath, templatePath, content, html, template, doc, scripts, styles;
        var moduleName = modulePath.split(path.sep).pop();
        var hash = options.hash;
        var data = hash ? hash.data : null;
        var files = fs.readdirSync(modulePath);
        var site = sites[this.indexPath] = sites[this.indexPath] || {
            styles: [],
            scripts: []
        };

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

            // Add path to style
            if (files.indexOf(moduleName + '.scss') >= 0) {
                styles = site.styles;
                stylePath = path.join(modulePath, moduleName + '.scss');
                if (styles.indexOf(stylePath) < 0) { styles.push(stylePath); }
            }

            // Add path to module
            if (files.indexOf('index.js') >= 0) {
                scripts = site.scripts;
                if (scripts.indexOf(modulePath) < 0) { scripts.push(modulePath); }
                doc(':root').attr('data-module', modulePath);
            }

            return new handlebars.SafeString(doc.html());
        }
    };
};