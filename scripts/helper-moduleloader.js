'use strict';

/**
 * The module loader helper is a Handlebars helper. It permits the use of
 * templating tags such as {{module "path/to/module"}}. These tags are replaced
 * with templated module markup (from a module's .hbs file). Data may be passed to
 * a module in a variety of ways (applied in this order):
 *
 * 1.) A defaults.json file in the module's folder
 * 2.) A reference to a file in the data= attribute of the tag, 
 *     {{module "path/to/module" data="path/to/data"}}
 * 3.) Individual data overrides in the tag,
 *     {{module "path/to/module" val1="lime" val2=5}}
 */

/******************
 *  Dependencies  *
 ******************/

var fs = require('fs');
var extend = require('extend');
var path = require('path');
var handlebars = require('handlebars');
var cheerio = require('cheerio');

/************
 *  Helper  *
 ************/

module.exports = function(sites) {
    return function (modulePath, options) {
        var defaults, stylePath, templatePath, content, html, template, doc, scripts, styles;
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

        // Get default data and combine
        if (files.indexOf('defaults.json') >= 0) {
            defaults = fs.readFileSync(path.join(modulePath, 'defaults.json'));
            defaults = JSON.parse(defaults);
            data = extend(defaults, data);
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

            // Return templated html
            return new handlebars.SafeString(doc.html());
        }

        // Error if no handlebars file found
        else { throw new Error('No .hbs file found for module ' + moduleName); }
    };
};