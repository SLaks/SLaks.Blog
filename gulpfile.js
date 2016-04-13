/// <reference path="typings/node/node.d.ts"/>	
var path = require('path');

var gulp = require('gulp');

var watch = require('gulp-watch');
var batch = require('gulp-batch');
var plumber = require('gulp-plumber');
var rename = require("gulp-rename");

var less = require('gulp-less');
var cleanCSS = require('gulp-clean-css');
var autoprefixer = require('gulp-autoprefixer');
var sourcemaps = require('gulp-sourcemaps');

gulp.task('default', function () {
	return gulp.src(['./css/[^_]*.less'])
		.pipe(plumber({
			errorHandler: function (error) {
				gutil.log(
					gutil.colors.cyan('Plumber') + gutil.colors.red(' caught an unhandled error:\n'),
					error.toString()
				);
				this.emit('end');
			}
		}))
		.pipe(sourcemaps.init())
		.pipe(less())
		.pipe(autoprefixer())
		.pipe(sourcemaps.write('./', { includeContent: false }))
		.pipe(gulp.dest('./css'))

        .pipe(rename({suffix: '.min'}))
        .pipe(cleanCSS())
		.pipe(sourcemaps.write('./', { includeContent: false }))
		.pipe(gulp.dest('./css'));
});

gulp.task('watch', function () {
	watch('./css/*.less', batch(function (events, done) {
		gulp.start('default', done);
	}));
});