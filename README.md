# gulp-revise

Opinionated, straight to the point assets revisioning.

* [Example](#example)
* [Documentation](#documentation)
* [Change Log](#change-log)

*Mostly inspired by [gulp-rev](https://github.com/sindresorhus/gulp-rev).*

## Example

```
dist/
    app.js.rev
    app_273c2cin3f.js
    app_273c2cin3f.js.map
    vendors.js.rev
    vendors_d41d8cd98f.js
    vendors_d41d8cd98f.js.map
src/
    app.js
    vendors.js
gulpfile.js
```

**gulpfile.js**

```javascript
var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var revise = require('gulp-revise');

gulp.task('default', function () {
  return gulp
    .src('src/*.js')
    .pipe(sourcemaps.init())
    .pipe(uglify())
    .pipe(revise())
    .pipe(sourcemaps.write('.'))
    .pipe(revise.write('dist'))
    .pipe(gulp.dest('dist'))
  ;
});
```

**app.js.rev**

```
app_273c2cin3f.js
```

**vendors.js.rev**

```
vendors_d41d8cd98f.js
```

## Documentation

### revise()

Adds the `_hash` suffix to the files in the stream (`hash` being the md5 of the file's content).

### revise.write(path)

For each files that have been revised, creates a `.rev` file that contains the file's name.
e.g `app.js` is renamed to `app_273c2cin3f.js` so the `app.js.rev` contains `app_273c2cin3f.js`.

#### path

The path to look for existing `.rev` file so it can delete old revisions.
Should be the same as the one passed to `gulp.dest()`.

Note: also delete the corresponding `.map` files.

### revise.merge()

Merge the `.rev` files in the stream to create a `rev-manifest.json` file, e.g:

```javascript
var gulp = require('gulp');
var revise = require('gulp-revise');

gulp.task('merge', function () {
  return gulp
    .src('dist/*.rev')
    .pipe(revise.merge())
    .pipe(gulp.dest(''));
});
```

`rev-manifest.json` looks like this:

```json
{
  "app.js": "app_273c2cin3f.js",
  "vendors.js": "vendors_d41d8cd98f"
}
```

## Change Log

### v0.0.4 - 2016-04-12

* Fixed an issue regarding the generation of source maps.

### v0.0.3 - 2016-04-05

* Update documentation.

### v0.0.2 - 2016-04-04

* Update documentation and related links.

### v0.0.1 - 2016-04-04

*First release.*
