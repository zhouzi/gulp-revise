var gutil = require('gulp-util');

function getLogger (verbose) {
  if (verbose) {
    return function () {
      var messages = Array.prototype.slice.call(arguments);
      messages.forEach(function (message) {
        gutil.log(message);
      });
      gutil.log('');
    };
  }

  return function () {};
}

module.exports = getLogger;
