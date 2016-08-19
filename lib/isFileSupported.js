var path = require('path');
var gutil = require('gulp-util');

function isFileSupported (file) {
  if (file.isStream()) {
    return new gutil.PluginError('gulp-revise', 'streams are not supported');
  }

  if (path.extname(file.path) == '.map') {
    return new gutil.PluginError('gulp-revise', 'sourcemaps must be created after the revision');
  }

  return null;
}

module.exports = isFileSupported;
