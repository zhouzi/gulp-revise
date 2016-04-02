var gulp = require('gulp');
var revision = require('../index');

gulp.task('default', function () {
  return gulp
    .src('scripts.js')
    .pipe(revision())
    .pipe(gulp.dest('dist'))
  ;
});
