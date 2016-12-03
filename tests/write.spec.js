var path = require('path');
var assert = require('assert');
var sinon = require('sinon');
var gutil = require('gulp-util');
var proxyquire = require('proxyquire');
var fs = require('fs');
var del = sinon.stub().returns(Promise.resolve());
var write = proxyquire('../lib/write', { fs: fs, del: del });
var verbose = true;
var dirname = path.join(__dirname, '../');

describe('write()', function () {
  var fakeFileName;
  var fakeFilePath;

  beforeEach(function () {
    sinon.stub(fs, 'readFile');

    fakeFileName = 'app_d41d8cd98f.js';
    fakeFilePath = path.join('src', fakeFileName);
  });

  afterEach(function () {
    fs.readFile.restore();
    del.reset();
  });

  describe('with an invalid configuration', function () {
    it('should throw an error if output path is missing', function () {
      var stream = write(null, verbose);

      stream.on('error', function (err) {
        assert.equal(err.message, 'required argument "dest path" for revise.write() is missing');
      });

      stream.write(createFile(fakeFilePath));
    });
  });

  describe('with a valid configuration', function () {
    var stream;

    beforeEach(function () {
      stream = write('dist', verbose);
    });

    it('should push the original file and create the .rev', function () {
      var file = createFile(fakeFilePath);
      var filePath = file.path;
      var fileDir = path.dirname(filePath);
      var revFilePath = path.join(fileDir, 'app.js.rev');
      var pushedOriginalFile = false;

      stream.on('data', function (file) {
        if (pushedOriginalFile) {
          assert.equal(file.path, revFilePath);
          assert.equal(file.contents.toString(), fakeFileName);
          return;
        }

        pushedOriginalFile = true;
        assert.equal(file.path, filePath);
      });

      stream.write(file);
    });

    it('should ignore files that miss the beforeRev prop', function () {
      var spy = sinon.stub();

      stream.on('data', spy);
      stream.write(createFile('src/app.js', true));

      assert.equal(spy.callCount, 1);
    });

    it('should read the existing revision', function () {
      stream.write(createFile(fakeFilePath));

      assert.equal(fs.readFile.callCount, 1);
      assert.equal(fs.readFile.firstCall.args[0], path.join(dirname, 'dist', 'app.js.rev'));
    });

    it('should delete the old revision', function () {
      stream.write(createFile(fakeFilePath));
      fs.readFile.callArgWith(2, null, 'app_abcdef.js');

      assert.equal(del.callCount, 1);
      assert.deepEqual(del.firstCall.args, [
        [
          path.join(dirname, 'dist', 'app_abcdef.js'),
          path.join(dirname, 'dist', 'app_abcdef.js.map')
        ]
      ]);
    });

    it('should not delete the old revision if it\'s the same as the new one', function () {
      stream.write(createFile(fakeFilePath));
      fs.readFile.callArgWith(2, null, fakeFileName);

      assert.equal(del.callCount, 0);
    });

    describe('with sub directories', function () {
      it('should read the existing revision', function () {
        stream.write(createFile(fakeFilePath, false, 'webapp'));

        assert.equal(fs.readFile.callCount, 1);
        assert.equal(fs.readFile.firstCall.args[0], path.join(dirname, 'dist/webapp', 'app.js.rev'));
      });

      it('should delete the old revision', function () {
        stream.write(createFile(fakeFilePath, false, 'webapp'));
        fs.readFile.callArgWith(2, null, 'app_abcdef.js');

        assert.equal(del.callCount, 1);
        assert.deepEqual(del.firstCall.args, [
          [
            path.join(dirname, 'dist/webapp', 'app_abcdef.js'),
            path.join(dirname, 'dist/webapp', 'app_abcdef.js.map')
          ]
        ]);
      });
    });
  });
});

function createFile (pth, omitBeforeRev, subfolder) {
  var fullPath = path.join(dirname, pth);
  var pathDir = path.dirname(fullPath);

  if (subfolder) {
    fullPath = path.join(pathDir, subfolder, path.basename(fullPath));
  }

  var file = new gutil.File({
    cwd: dirname,
    base: pathDir,
    path: fullPath,
    contents: new Buffer('')
  });

  if (!omitBeforeRev) {
    file.beforeRev = fullPath.substr(0, fullPath.lastIndexOf('_')) + path.extname(fullPath);
  }

  return file;
}
