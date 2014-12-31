'use strict';

/******************
 *  Dependencies  *
 ******************/

// Node
var fs = require('fs');
var path = require('path');

// Build
var gulp = require('gulp');
var rename = require('gulp-rename');
var copy = require('gulp-copy');
var del = require('del');
var runSequence = require('run-sequence');
var transform = require('vinyl-transform');
var data = require('gulp-data');

// HTML
var hbsfy = require('hbsfy');
var handlebars = require('gulp-compile-handlebars');
var trumpet = require('trumpet');

// Scripts
var browserify = require('browserify');
var uglify = require('uglify-stream');
var debowerify = require('debowerify');
var installify = require('installify');

// Style
var sass = require('node-sass');

// Modules
var moduleHelper = require('./scripts/helper-moduleloader');

/***************
 *  Variables  *
 ***************/

var isDev = process.env.NODE_ENV === 'development';
var sites = {};

/*************
 *  Scripts  *
 *************/

/**
 * Determines scripts to load in to browserify bundle and adds them
 * to the <script> tag in the header of the streamed HTML file
 */
var addScripts = transform(function(file) {
    var tr = trumpet();
    var ws = tr.select('.inline-scripts').createWriteStream();
    var b = browserify({ debug: isDev });
    var mainScript = file.split(path.sep);

    // Get path to index.js
    mainScript = mainScript.slice(0,-1);
    mainScript.push('index.js');
    mainScript = mainScript.join(path.sep);

    // Add transforms
    b.transform(hbsfy);
    b.transform(debowerify);
    b.transform(installify);

    // Add each script to bundle
    sites[file].scripts.forEach(function(script) {
        b.require('./' + script, { expose: script });
    });

    // Add main scripts to bundle
    fs.exists(mainScript, function(exists) {

        // Add module loader
        b.add('./scripts/client-runmodules');
        
        // Append module to top-level scss file
        if (exists) { b.add(mainScript); }

        // Add bundled scripts to <script> tag in header
        if (!isDev) { b.bundle().pipe(uglify()).pipe(ws); }
        else { b.bundle().pipe(ws); }
    });

    return tr;
});

/************
 *  Styles  *
 ************/

/**
 * Determines styles to load in to browserify bundle and adds them
 * to the <style> tag in the header of the streamed HTML file
 */
var addStyles = transform(function(file) {
    var indexFolder;
    var tr = trumpet();
    var ws = tr.select('.inline-styles').createWriteStream();
    var mainStyle = file.split(path.sep);

    // Get path to main.scss
    mainStyle = mainStyle.slice(0,-1);
    indexFolder = mainStyle.join(path.sep).replace(path.join(__dirname, 'site'), '');
    mainStyle.push('main.scss');
    mainStyle = mainStyle.join(path.sep);

    function renderSass(main) {
        // Add @import directives to main sass file
        sites[file].styles.forEach(function(style) {
            main += '@import "' + path.join(__dirname, style) + '";' + '\n';
        });

        sass.render({

            // Data
            file: mainStyle,
            data: main,
            outFile: path.join(indexFolder, 'main.css'),

            // Source mapping
            omitSourceMapUrl: !isDev,
            sourceMap: isDev,
            sourceComments: isDev,

            // Compression
            outputStyle: isDev ? 'nested' : 'compressed',
            
            // Success
            success: function(result) {
                var map = JSON.stringify(result.map);

                // Create css map
                if (isDev) {
                    fs.mkdir(path.join(__dirname, '.cssmap', indexFolder), function() {
                        fs.writeFile(path.join(__dirname, '.cssmap', indexFolder, 'main.css.map'), map, function(err) {
                            if (err) { throw err; }
                        });
                    });
                }

                // Write CSS to <style> tag
                ws.end(result.css);
            },

            // Error handling
            error: function(error) {
                console.log(error.message);
                console.log(error.code);
                console.log(error.line);
                console.log(error.column);
            }
        });
    }

    // Generate the main scss file
    fs.exists(mainStyle, function(exists) {

        // Append module to top-level scss file
        if (exists) {
            fs.readFile(mainStyle, function(err, data) {
                renderSass(data.toString() + '\n');
            });
        }

        // Generate includes-only
        else { renderSass(''); }
    });

    return tr;
});

/***********
 *  Tasks  *
 ***********/

gulp.task('clean', function(cb) {
    del(['dist', '.tmp', '.cssmap'], cb);
});

gulp.task('cssmaps', function() {
    gulp.src('./.cssmap/**/*.map')
        .pipe(copy('./dist', { prefix: 1 }));
});

gulp.task('default', ['clean'], function() {
    var options = { helpers: { module: moduleHelper(sites) } };

    return gulp.src('./site/**/*.hbs')
        .pipe(data(function(file) {
            return { indexPath: file.path };
        }))
        .pipe(handlebars({}, options))
        .pipe(addScripts)
        .pipe(addStyles)
        .pipe(rename({ extname: '.html' }))
        .pipe(gulp.dest('dist'));
});

gulp.task('debug', function() {
    isDev = true;
    runSequence('default', 'cssmaps');
});