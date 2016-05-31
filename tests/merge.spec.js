var assert = require('assert');
var gutil = require('gulp-util');
var merge = require('../lib/merge');

describe('merge()', function () {
  it('should merge .rev files', function () {
    var stream = merge();

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
