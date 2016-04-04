var path = require('path');
var assert = require('assert');
var sinon = require('sinon');
var gutil = require('gulp-util');
var proxyquire = require('proxyquire');
var fs = sinon.stub(require('fs'), 'readFile');
var del = sinon.stub().returns(Promise.resolve());
var revision = proxyquire('./index', { fs: fs, del: del });

describe('revision()', function () {
  it('should revision the files', function () {
    var stream = revision();

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
    var stream = revision();

    stream.on('error', function (err) {
      assert.equal(err.message, 'sourcemaps must be created after the revision');
    });

    stream.write(new gutil.File({
      path: 'src/app.js.map',
      contents: new Buffer('')
    }));
  });

  it('should work with files that have dots in their name', function () {
    var stream = revision();

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
    var stream = revision();

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

describe('revision.write()', function () {
  afterEach(function () {
    fs.readFile.reset();
    del.reset();
  });

  it('should throw an error if output path is missing', function () {
    var stream = revision.write();

    stream.on('error', function (err) {
      assert.equal(err.message, 'revision.write needs the output path to delete old revisions');
    });

    var file = new gutil.File({
      path: 'src/app_d41d8cd98f.js',
      contents: new Buffer('')
    });

    file.beforeRev = 'src/app.js';

    stream.write(file);
  });

  it('should push the original file and create the .rev', function () {
    var stream = revision.write('dist');
    var pushedOriginalFile = false;

    stream.on('data', function (file) {
      if (pushedOriginalFile) {
        assert.equal(file.path, 'src/app.js.rev');
        assert.equal(file.contents.toString(), 'app_d41d8cd98f.js');
        return;
      }

      pushedOriginalFile = true;
      assert.equal(file.path, 'src/app_d41d8cd98f.js');
    });

    var file = new gutil.File({
      path: 'src/app_d41d8cd98f.js',
      contents: new Buffer('')
    });

    file.beforeRev = 'src/app.js';

    stream.write(file);
  });

  it('should ignore files that miss the beforeRev prop', function () {
    var stream = revision.write('dist');
    var spy = sinon.stub();

    stream.on('data', spy);

    stream.write(new gutil.File({
      path: 'src/app.js',
      contents: new Buffer('')
    }));

    assert.equal(spy.callCount, 1);
  });

  it('should read the existing revision', function () {
    var stream = revision.write('dist');

    var file = new gutil.File({
      path: 'src/app_d41d8cd98f.js',
      contents: new Buffer('')
    });

    file.beforeRev = 'src/app.js';
    stream.write(file);

    assert.equal(fs.readFile.callCount, 1);
    assert.equal(fs.readFile.firstCall.args[0], path.join(__dirname, 'dist', 'app.js.rev'));
  });

  it('should delete the old revision', function () {
    var stream = revision.write('dist');

    var file = new gutil.File({
      path: 'src/app_d41d8cd98f.js',
      contents: new Buffer('')
    });

    file.beforeRev = 'src/app.js';
    stream.write(file);

    fs.readFile.callArgWith(2, null, 'app_abcdef.js');

    assert.equal(del.callCount, 1);
    assert.deepEqual(del.firstCall.args, [
      [
        path.join(__dirname, 'dist', 'app_abcdef.js'),
        path.join(__dirname, 'dist', 'app_abcdef.js.map')
      ]
    ]);
  });

  it('should not delete the old revision if it\'s the same as the new one', function () {
    var stream = revision.write('dist');

    var file = new gutil.File({
      path: 'src/app_d41d8cd98f.js',
      contents: new Buffer('')
    });

    file.beforeRev = 'src/app.js';
    stream.write(file);

    fs.readFile.callArgWith(2, null, 'app_d41d8cd98f.js');

    assert.equal(del.callCount, 0);
  });
});

describe('revision.merge()', function () {
  it('should merge .rev files', function () {
    var stream = revision.merge();

    stream.on('data', function (file) {
      assert.equal(file.path, 'rev-manifest.json');

      assert.deepEqual({
        'vendors.js': 'vendors_123.js',
        'app.js': 'app_456.js'
      }, JSON.parse(file.contents.toString()));
    });

    stream.write(new gutil.File({
      path: 'dist/vendors.js.rev',
      contents: new Buffer('vendors_123.js')
    }));

    stream.write(new gutil.File({
      path: 'dist/app.js.rev',
      contents: new Buffer('app_456.js')
    }));

    stream.end();
  })
});
