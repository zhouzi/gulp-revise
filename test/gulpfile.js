var gulp = require('gulp');
var revision = require('../index');
var sourcemaps = require('gulp-sourcemaps');

gulp.task('default', function () {
  return gulp
    .src('scripts.js')
    .pipe(sourcemaps.init())
    .pipe(sourcemaps.write('.'))
    .pipe(revision())
    .pipe(gulp.dest('dist'))
  ;
});
