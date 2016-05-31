var assert = require('assert');
var gutil = require('gulp-util');
var revise = require('../lib/revise');

describe('revise()', function () {
  it('should revision the files', function () {
    var stream = revise();

    stream.on('data', function (file) {
      assert.equal(file.path, 'src/app_d41d8cd98f.js');
      assert.equal(file.beforeRev, 'src/app.js');
    });

    stream.write(new gutil.File({
      path: 'src/app.js',
      contents: new Buffer('')
    }));
  });

  it('should throw an error if sourcemaps are created before the revision', function () {
    var stream = revise();

    stream.on('error', function (err) {
      assert.equal(err.message, 'sourcemaps must be created after the revision');
    });

    stream.write(new gutil.File({
      path: 'src/app.js.map',
      contents: new Buffer('')
    }));
  });

  it('should work with files that have dots in their name', function () {
    var stream = revise();

    stream.on('data', function (file) {
      assert.equal(file.path, 'src/app.min_d41d8cd98f.js');
      assert.equal(file.beforeRev, 'src/app.min.js');
    });

    stream.write(new gutil.File({
      path: 'src/app.min.js',
      contents: new Buffer('')
    }));
  });

  it('should work with directories that have dots in their name', function () {
    var stream = revise();

    stream.on('data', function (file) {
      assert.equal(file.path, 'website.io/app_d41d8cd98f.js');
      assert.equal(file.beforeRev, 'website.io/app.js');
    });

    stream.write(new gutil.File({
      path: 'website.io/app.js',
      contents: new Buffer('')
    }));
  });
});
