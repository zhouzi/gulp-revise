var fs = require('fs');
var path = require('path');
var through = require('through2');
var gutil = require('gulp-util');
var del = require('del');

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

module.exports = write;
