var gulp = require('gulp');
var revision = require('../index');
var sourcemaps = require('gulp-sourcemaps');

gulp.task('default', function () {
  return gulp
    .src('scripts.js')
    .pipe(sourcemaps.init())
    .pipe(revision())
    .pipe(sourcemaps.write('.'))
    .pipe(revision.write())
    .pipe(gulp.dest('dist'))
  ;
});

gulp.task('merge', function () {
  return gulp
    .src('dist/*.rev')
    .pipe(revision.merge())
    .pipe(gulp.dest('dist'))
  ;
});
