'use strict';

/******************
 *  Dependencies  *
 ******************/

var gulp = require('gulp');
var rename = require('gulp-rename');
var del = require('del');
var transform = require('vinyl-transform');
var trumpet = require('trumpet');
var handlebars = require('gulp-compile-handlebars');
var moduleHelper = require('./scripts/moduleLoaderHelper');
var browserify = require('browserify');
var sassCssStream = require('sass-css-stream');
var uglify = require('uglify-stream');
var data = require('gulp-data');
var fs = require('fs');
var path = require('path');
var Duplex = require('stream').Duplex;

/***************
 *  Variables  *
 ***************/

var isDev = process.env.NODE_ENV === 'development';
var sites = {};

/*************
 *  Streams  *
 *************/

/**
 * Determines scripts to load in to browserify bundle and adds them
 * to the <script> tag in the header of the streamed HTML file
 */
var addScripts = transform(function(file) {
    var tr = trumpet();
    var ws = tr.select('.inline-scripts').createWriteStream();
    var b = browserify({ debug: isDev });

    // Add each script to bundle
    sites[file].scripts.forEach(function(script) {
        b.require('./' + script, { expose: script });
    });

    // Add loader
    b.add('./scripts/applyModules');

    // Add bundled scripts to <script> tag in header
    if (!isDev) { b.bundle().pipe(uglify()).pipe(ws); }
    else { b.bundle().pipe(ws); }

    return tr;
});

/**
 * Determines scripts to load in to browserify bundle and adds them
 * to the <script> tag in the header of the streamed HTML file
 */
var addStyles = transform(function(file) {
    var tr = trumpet();
    var ws = tr.select('.inline-styles').createWriteStream();
    var mainStyle = file.split(path.sep);
    var stream = new Duplex();

    // // Implement read stream
    // stream._read = function noop() {};
    // stream._write = function(buffer) {
    //     this.push(buffer.toString());
    // };

    // // Get path to style
    // mainStyle = mainStyle.slice(0,-1);
    // mainStyle.push('main.scss');
    // mainStyle = mainStyle.join(path.sep);

    // // See if a style already exists
    // if (fs.existsSync(mainStyle)) {
    //     stream = fs.createReadStream().pipe(stream);
    //     stream.on('end', function() {
    //         stream.push('more');
    //     });
    //     stream.pipe(process.stdout);
    // }

    // // Add each style to bundle
    // sites[file].styles.forEach(function(style) {
    //     b.require('./' + script, { expose: script });
    // });

    // // Add loader
    // b.add('./scripts/applyModules');

    // // Add bundled scripts to <script> tag in header
    // if (!isDev) { b.bundle().pipe(uglify()).pipe(ws); }
    // else { b.bundle().pipe(ws); }

    return tr;
});

/***********
 *  Tasks  *
 ***********/

gulp.task('clean', function(cb) {
    del(['dist'], cb);
});

gulp.task('default', ['clean'], function() {
    var options = { helpers: { module: moduleHelper(sites) } };

    return gulp.src('./site/**/*.hbs')
        .pipe(data(function(file) {
            return { indexPath: file.path };
        }))
        .pipe(handlebars({}, options))
        .pipe(addScripts)
        // .pipe(addStyles)
        .pipe(rename({ extname: '.html' }))
        .pipe(gulp.dest('dist'));
});