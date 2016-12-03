var fs = require('fs');
var path = require('path');
var through = require('through2');
var gutil = require('gulp-util');
var del = require('del');
var getLogger = require('./getLogger');

function write (pth, verbose) {
  var log = getLogger(verbose);

  return through.obj(
    function transform (file, encoding, callback) {
      this.push(file);

      if (!file.beforeRev) {
        log('File wasn\'t revised, went through:', file.path);
        callback();
        return;
      }

      var revisionFileName = path.basename(file.beforeRev) + '.rev';
      var newRevisionName = path.basename(file.path);
      var revisionFilePath = path.join(file.base, path.dirname(file.relative), revisionFileName);

      this.push(new gutil.File({
        cwd: file.cwd,
        base: file.base,
        path: revisionFilePath,
        contents: new Buffer(newRevisionName)
      }));

      log(
        'Created a .rev file for:',
        'cwd:      ' + file.cwd,
        'base:     ' + file.base,
        'relative: ' + file.relative,
        'path:     ' + file.path
      );

      log(
        '.rev file pushed with path:',
        revisionFilePath
      );

      if (pth == null) {
        callback(new gutil.PluginError('gulp-revise', 'required argument "dest path" for revise.write() is missing'));
        return;
      }

      var outputDir = path.join(process.cwd(), pth);
      var pathToRevision = path.join(outputDir, revisionFileName);

      log(
        'Now looking for current .rev in:',
        pathToRevision
      );

      fs.readFile(pathToRevision, 'utf8', function (err, currentVersion) {
        if (err) {
          log(
            'Failed to read current .rev in:',
            pathToRevision
          );

          callback();
          return;
        }

        if (newRevisionName == currentVersion) {
          log(
            '.rev did not change in:',
            pathToRevision
          );

          callback();
          return;
        }

        var currentVersionPath = path.join(outputDir, currentVersion);
        var currentVersionMapPath = currentVersionPath + '.map';

        log(
          'Now deleting old revision:',
          currentVersionPath,
          currentVersionMapPath
        );

        del([
          currentVersionPath,
          currentVersionMapPath
        ]).then(function () {
          callback();
        });
      });
    }
  );
}

module.exports = write;
