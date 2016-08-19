var through = require('through2');
var isFileSupported = require('./isFileSupported');

function revise () {
  return through.obj(
    function transform (file, encoding, callback) {
      if (file.isNull()) {
        callback(null, file);
        return;
      }

      var error = isFileSupported(file);
      if (error) {
        callback(error);
        return;
      }

      file.beforeRev = file.path;

      this.push(file);
      callback();
    }
  );
}

module.exports = revise;
