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

function revise () {
  return through.obj(
    function transform (file, encoding, callback) {
      if (file.isNull()) {
        callback(null, file);
        return;
      }

      if (file.isStream()) {
        callback(new gutil.PluginError('gulp-revise', 'streams are not supported'));
        return;
      }

      if (path.extname(file.path) == '.map') {
        callback(new gutil.PluginError('gulp-revise', 'sourcemaps must be created after the revision'));
        return;
      }

      var hash = revHash(file.contents);

      file.beforeRev = file.path;
      file.path = rename(file.path, hash);

      if (file.sourceMap) {
        file.sourceMap.file = file.relative;
      }

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

      var revisionFileName = path.basename(file.beforeRev) + '.rev';
      var newRevisionName = path.basename(file.path);

      this.push(new gutil.File({
        cwd: file.cwd,
        base: file.base,
        path: path.join(file.base, path.dirname(file.relative), revisionFileName),
        contents: new Buffer(newRevisionName)
      }));

      if (pth == null) {
        callback(new gutil.PluginError('gulp-revise', 'required argument "dest path" for revise.write() is missing'));
        return;
      }

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

function restore (pth) {
  return through.obj(
    function transform (file, encoding, callback) {
      var outputDir = path.join(process.cwd(), pth);
      var revisionFileName = path.basename(file.path) + '.rev';
      var pathToRevision = path.join(outputDir, revisionFileName);

      fs.readFile(pathToRevision, 'utf8', function (err, currentVersion) {
        if (err) {
          this.push(file);
          callback();
          return;
        }

        file.path = path.join(path.dirname(file.path), currentVersion);
        this.push(file);
        callback();
      }.bind(this));
    }
  );
}

module.exports = revise;
module.exports.write = write;
module.exports.merge = merge;
module.exports.restore = restore;
