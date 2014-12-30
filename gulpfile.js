'use strict';

/******************
 *  Dependencies  *
 ******************/

var gulp = require('gulp');
var rename = require('gulp-rename');
var del = require('del');
var handlebars = require('gulp-compile-handlebars');
var moduleHelper = require('./scripts/moduleLoaderHelper');

gulp.task('clean', function(cb) {
    del(['dist'], cb);
});

gulp.task('default', ['clean'], function() {
    var options = {
        helpers: { module: moduleHelper }
    };

    gulp.src('./site/**/*.hbs')
        .pipe(handlebars({}, options))
        .pipe(rename({ extname: '.html' }))
        .pipe(gulp.dest('dist'));
});