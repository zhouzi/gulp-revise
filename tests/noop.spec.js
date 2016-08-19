var path = require('path');
var assert = require('assert');
var gutil = require('gulp-util');
var noop = require('../lib/noop');

describe('noop()', function () {
  it('should add a beforeRev prop', function () {
    var stream = noop();

    stream.on('data', function (file) {
      assert.equal(file.path, 'src/app.js');
      assert.equal(file.beforeRev, 'src/app.js');
    });

    stream.write(new gutil.File({
      path: 'src/app.js',
      contents: new Buffer('')
    }));
  });
});
