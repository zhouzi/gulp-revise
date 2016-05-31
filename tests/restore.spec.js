var assert = require('assert');
var sinon = require('sinon');
var proxyquire = require('proxyquire');
var gutil = require('gulp-util');
var fs = require('fs');
var restore = proxyquire('../lib/restore', { fs: fs });

describe('restore()', function () {
  beforeEach(function () {
    sinon.stub(fs, 'readFile');
  });

  afterEach(function () {
    fs.readFile.restore();
  });

  it('should rename the files according to its .rev', function () {
    var stream = restore('dist');

    stream.on('data', function (file) {
      assert.equal(file.path, 'src/app_123.js');
    });

    stream.write(new gutil.File({
      path: 'src/app.js',
      contents: new Buffer('')
    }));

    fs.readFile.callArgWith(2, null, 'app_123.js');
  });
});
