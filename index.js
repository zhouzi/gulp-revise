var fs = require('fs');
var path = require('path');
var revHash = require('rev-hash');
var through = require('through2');
var gutil = require('gulp-util');

// we need to implement a custom rename function
// to deal with file names such as scripts.js.map
// where the usual path.ext would return ".map"
function rename (name, suffix) {
  var dir = path.dirname(name);
  var fileName = path.basename(name);
  var partials = fileName.split('.');
  var root = partials[0];
  var exts = partials.slice(1).map(function (ext) { return '.' + ext; }).join('');

  return path.join(dir, root + '_' + suffix + exts);
}

function revision () {
  return through.obj(
    function transform (file, encoding, callback) {
      if (path.extname(file.path) == '.map') {
        callback(new gutil.PluginError('gulp-revision', 'sourcemaps must be created after the revision'));
        return;
      }

      var hash = revHash(file.contents);

      file.beforeRev = file.path;
      file.path = rename(file.path, hash);
      this.push(file);
      callback();
    }
  );
}

function write () {
  return through.obj(
    function transform (file, encoding, callback) {
      this.push(file);

      if (!file.beforeRev) {
        callback();
        return;
      }

      if (path.extname(file.path) == '.map') {
        callback();
        return;
      }

      var originalName = path.basename(file.beforeRev);
      var revisionDir = path.dirname(file.path);
      var revisionPath = path.join(revisionDir, originalName + '.rev');
      var newRevisionName = path.basename(file.path);

      var revisionFile = new gutil.File();
      revisionFile.path = revisionPath;
      revisionFile.contents = new Buffer(newRevisionName);
      this.push(revisionFile);

      fs.readFile(revisionPath, 'utf8', function (err, oldRevisionName) {
        if (err) {
          // the revision file doesn't exist
          callback();
          return;
        }

        if (newRevisionName == oldRevisionName) {
          // if the old file name is the same as the new one
          // then we shouldn't delete it
          callback();
          return;
        }

        var oldRevisionPath = path.join(revisionDir, oldRevisionName);
        fs.unlink(oldRevisionPath, function () {
          callback();
        });
      });
    }
  );
}

function merge () {
  var manifest = {};

  return through.obj(
    function transform (file, encoding, callback) {
      var fileName = path.basename(file.path, '.rev');
      manifest[fileName] = file.contents.toString();
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

module.exports = revision;
module.exports.write = write;
module.exports.merge = merge;
