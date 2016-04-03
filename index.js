var fs = require('fs');
var path = require('path');
var Transform = require('stream').Transform;
var revHash = require('rev-hash');

// we need to implement a custom rename function
// to deal with file names such as scripts.js.map
// where the usual path.ext would return ".map"
function rename (name, suffix) {
  var dir = path.dirname(name);
  var fileName = path.basename(name);
  var partials = fileName.split('.');
  var root = partials[0];
  var exts = '.' + partials.slice(1).join('.');

  return path.join(dir, root + '_' + suffix + exts);
}

module.exports = function revision () {
  var stream = new Transform({ objectMode: true });
  var files = {};
  var sourcemaps = {};

  stream._transform = function (originalFile, encoding, callback) {
    // we need to backup the original file's name
    // to create the revision file
    var originalFileName = path.basename(originalFile.path);

    var hash;
    var isSourceMap = path.extname(originalFileName) == '.map';

    if (isSourceMap) {
      var correspondingFile = JSON.parse(originalFile.contents.toString()).file;

      if (files.hasOwnProperty(correspondingFile)) {
        hash = files[correspondingFile];
      } else {
        sourcemaps[correspondingFile] = originalFile;
        callback();
        return;
      }
    }

    if (hash == null) {
      hash = revHash(originalFile.contents);
    }

    originalFile.path = rename(originalFile.path, hash);
    this.push(originalFile);

    if (isSourceMap) {
      callback();
      return;
    }

    if (sourcemaps.hasOwnProperty(originalFileName)) {
      var sourcemap = sourcemaps[originalFileName];
      sourcemap.path = rename(sourcemap.path, hash);
      this.push(sourcemap);
    } else {
      files[originalFileName] = hash;
    }

    // the original file's path property is mutated
    // after it has been pushed so it now holds its new path
    var newPathToOriginalFile = path.dirname(originalFile.path);
    var pathToRevision = path.join(newPathToOriginalFile, originalFileName + '.rev');

    var newOriginalFileName = path.basename(originalFile.path);

    // by cloning the original file
    // we do not have to pull the vinyl package
    // and set each of the file's property manually
    // e.g: https://github.com/floridoo/gulp-sourcemaps/blob/master/index.js#L318
    var revisionFile = originalFile.clone({ contents: false });

    revisionFile.contents = new Buffer(newOriginalFileName);
    revisionFile.path = pathToRevision;
    this.push(revisionFile);

    fs.readFile(pathToRevision, 'utf8', function (err, oldFileName) {
      if (err) {
        // the revision file doesn't exist
        callback();
        return;
      }

      if (newOriginalFileName == oldFileName) {
        // if the old file name is the same as the new one
        // then we shouldn't delete it
        callback();
        return;
      }

      var dir = path.dirname(pathToRevision);
      var pathToFile = path.join(dir, oldFileName);
      fs.unlink(pathToFile, function () { callback(); });
    });
  };

  return stream;
};
