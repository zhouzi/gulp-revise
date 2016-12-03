var gutil = require('gulp-util');

function getLogger (verbose) {
  if (verbose) {
    var log = function () {
      var messages = Array.prototype.slice.call(arguments);
      messages.forEach(function (message) {
        gutil.log(message);
      });
      gutil.log('');
    };

    log.error = function () {
      var messages = Array.prototype.slice.call(arguments).map(function (message) {
        return gutil.colors.red(message);
      });
      log.apply(null, messages);
    };

    return log;
  }

  var noop = function () {};
  noop.error = noop;
  return noop;
}

module.exports = getLogger;
