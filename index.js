var fs = require('fs');
var path = require('path');
var revHash = require('rev-hash');
var through = require('through2');
var gutil = require('gulp-util');
var del = require('del');

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

function write (pth) {
  return through.obj(
    function transform (file, encoding, callback) {
      this.push(file);

      if (!file.beforeRev) {
        callback();
        return;
      }

      var newRevisionName = path.basename(file.path);
      var revisionFile = new gutil.File();
      var revisionFileName = path.basename(file.beforeRev) + '.rev';
      revisionFile.path = path.join(path.dirname(file.path), revisionFileName);
      revisionFile.contents = new Buffer(newRevisionName);
      this.push(revisionFile);

      if (pth == null) {
        callback(new gutil.PluginError('gulp-revision', 'revision.write needs the output path to delete old revisions'));
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

module.exports = revision;
module.exports.write = write;
module.exports.merge = merge;
