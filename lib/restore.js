var fs = require('fs');
var path = require('path');
var through = require('through2');

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

module.exports = restore;
