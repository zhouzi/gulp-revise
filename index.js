var fs = require('fs');
var path = require('path');
var revHash = require('rev-hash');
var through = require('through2');
var gutil = require('gulp-util');
var del = require('del');

function rename (name, suffix) {
  var dir = path.dirname(name);
  var ext = path.extname(name);
  var fileName = path.basename(name, ext);

  return path.join(dir, fileName + '_' + suffix + ext);
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

function write (pth) {
  return through.obj(
    function transform (file, encoding, callback) {
      this.push(file);

      if (!file.beforeRev) {
        callback();
        return;
      }

      if (pth == null) {
        callback(new gutil.PluginError('gulp-revision', 'required argument "dest path" for revision.write() is missing'));
        return;
      }

      var revisionFileName = path.basename(file.beforeRev) + '.rev';
      var newRevisionName = path.basename(file.path);

      this.push(new gutil.File({ path: revisionFileName, contents: new Buffer(newRevisionName) }));

      var outputDir = path.join(process.cwd(), pth);
      var pathToRevision = path.join(outputDir, revisionFileName);
      fs.readFile(pathToRevision, 'utf8', function (err, currentVersion) {
        if (err) {
          callback();
          return;
        }

        if (newRevisionName == currentVersion) {
          callback();
          return;
        }

        del([
          path.join(outputDir, currentVersion),
          path.join(outputDir, currentVersion + '.map')
        ]).then(function () {
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
