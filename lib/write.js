var fs = require('fs');
var path = require('path');
var through = require('through2');
var gutil = require('gulp-util');
var del = require('del');

function write () {
  return through.obj(
    function transform (file, encoding, callback) {
      this.push(file);

      if (!file.beforeRev) {
        callback();
        return;
      }

      var revisionFileName = path.basename(file.beforeRev) + '.rev';
      var newRevisionName = path.basename(file.path);
      var outputDir = path.join(file.base, path.dirname(file.relative));

      this.push(new gutil.File({
        cwd: file.cwd,
        base: file.base,
        path: path.join(outputDir, revisionFileName),
        contents: new Buffer(newRevisionName)
      }));

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
