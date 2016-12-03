var path = require('path');
var assert = require('assert');
var sinon = require('sinon');
var gutil = require('gulp-util');
var proxyquire = require('proxyquire');
var fs = require('fs');
var del = sinon.stub().returns(Promise.resolve());
var write = proxyquire('../lib/write', { fs: fs, del: del });
var verbose = true;

describe('write()', function () {
  beforeEach(function () {
    sinon.stub(fs, 'readFile');
  });

  afterEach(function () {
    fs.readFile.restore();
    del.reset();
  });

  it('should throw an error if output path is missing', function () {
    var stream = write(null, verbose);

    stream.on('error', function (err) {
      assert.equal(err.message, 'required argument "dest path" for revise.write() is missing');
    });

    var file = new gutil.File({
      path: path.join(__dirname, 'src/app_d41d8cd98f.js'),
      contents: new Buffer('')
    });

    file.beforeRev = path.join(__dirname, 'src/app.js');

    stream.write(file);
  });

  it('should push the original file and create the .rev', function () {
    var stream = write('dist', verbose);
    var pushedOriginalFile = false;
    var filePath = path.join(__dirname, 'src/app_d41d8cd98f.js');
    var revFilePath = path.join(path.dirname(filePath), 'app.js.rev');
    var beforeRev = path.join(path.dirname(filePath), 'app.js');

    stream.on('data', function (file) {
      if (pushedOriginalFile) {
        assert.equal(file.path, revFilePath);
        assert.equal(file.contents.toString(), 'app_d41d8cd98f.js');
        return;
      }

      pushedOriginalFile = true;
      assert.equal(file.path, filePath);
    });

    var file = new gutil.File({
      path: filePath,
      contents: new Buffer('')
    });

    file.beforeRev = beforeRev;

    stream.write(file);
  });

  it('should ignore files that miss the beforeRev prop', function () {
    var stream = write('dist', verbose);
    var spy = sinon.stub();

    stream.on('data', spy);

    stream.write(new gutil.File({
      path: path.join(__dirname, 'src/app.js'),
      contents: new Buffer('')
    }));

    assert.equal(spy.callCount, 1);
  });

  it('should read the existing revision', function () {
    var stream = write('dist', verbose);

    var file = new gutil.File({
      path: path.join(__dirname, 'src/app_d41d8cd98f.js'),
      contents: new Buffer('')
    });

    file.beforeRev = path.join(__dirname, 'src/app.js');
    stream.write(file);

    assert.equal(fs.readFile.callCount, 1);
    assert.equal(fs.readFile.firstCall.args[0], path.join(__dirname, '../dist', 'app.js.rev'));
  });

  it('should delete the old revision', function () {
    var stream = write('dist', verbose);

    var file = new gutil.File({
      path: path.join(__dirname, 'src/app_d41d8cd98f.js'),
      contents: new Buffer('')
    });

    file.beforeRev = path.join(__dirname, 'src/app.js');
    stream.write(file);

    fs.readFile.callArgWith(2, null, 'app_abcdef.js');

    assert.equal(del.callCount, 1);
    assert.deepEqual(del.firstCall.args, [
      [
        path.join(__dirname, '../dist', 'app_abcdef.js'),
        path.join(__dirname, '../dist', 'app_abcdef.js.map')
      ]
    ]);
  });

  it('should not delete the old revision if it\'s the same as the new one', function () {
    var stream = write('dist', verbose);

    var file = new gutil.File({
      path: path.join(__dirname, 'src/app_d41d8cd98f.js'),
      contents: new Buffer('')
    });

    file.beforeRev = path.join(__dirname, 'src/app.js');
    stream.write(file);

    fs.readFile.callArgWith(2, null, 'app_d41d8cd98f.js');

    assert.equal(del.callCount, 0);
  });
});
