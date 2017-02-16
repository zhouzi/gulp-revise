var path = require('path');
var through = require('through2');
var gutil = require('gulp-util');

function merge (basePath) {
  if (basePath == null) {
    basePath = process.cwd();
  }

  var manifest = {};

  return through.obj(
    function transform (file, encoding, callback) {
      var dir = path.relative(basePath, path.dirname(file.path));
      var fileName = path.basename(file.path, '.rev');
      manifest[path.join(dir, fileName)] = path.join(dir, file.contents.toString());
      callback();
    },
    function flush (callback) {
      var file = new gutil.File();
      file.contents = new Buffer(JSON.stringify(manifest, null, 2));
      file.path = 'rev-manifest.json';
      this.push(file);
      callback();
    }
  );
}

module.exports = merge;
