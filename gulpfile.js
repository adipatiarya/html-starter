import { series, src, dest, parallel, watch } from 'gulp';
import include from 'gulp-file-include';
import * as browserSync from 'browser-sync';
import * as del from 'del';
import dartSass from 'sass';
import gulpSass from 'gulp-sass';
import sourcemaps from 'gulp-sourcemaps';
import autoPrefixer from 'gulp-autoprefixer';
import CleanCSS from 'gulp-clean-css';
import rename from 'gulp-rename';
import imagemin, { mozjpeg, gifsicle, optipng } from './vendors/gulp-imagemin/index.js';

const path = {
  baseSrc: 'src/', // source directory
  baseDist: 'dist/', // build directory
  baseDistAssets: 'dist/assets/', // build assets directory
  baseSrcAssets: 'src/assets/', // source assets directory
};

const sass = gulpSass(dartSass);

const initBrowserSync = function (done) {
  const startPath = '/index.html';
  browserSync.init({
    startPath: startPath,
    server: {
      baseDir: path.baseDist,
      middleware: [
        function (req, res, next) {
          req.method = 'GET';
          next();
        },
      ],
    },
  });
  done();
};

const watchFiles = () => {
  watch(
    path.baseSrc + '**/*.html',
    series(html, (done) => {
      browserSync.reload();
      done();
    })
  );

  watch(
    path.baseSrcAssets + 'scss/**/*.scss',
    series(
      scss,
      series(html, (done) => {
        browserSync.reload();
        done();
      })
    )
  );
};
const scss = function () {
  const out = path.baseDistAssets + 'css/';
  return src(path.baseSrcAssets + 'scss/**/*.scss')
    .pipe(sourcemaps.init())
    .pipe(sass.sync().on('error', sass.logError)) // scss to css
    .pipe(
      autoPrefixer({
        overrideBrowserslist: ['last 2 versions'],
      })
    )
    .pipe(dest(out))
    .pipe(CleanCSS())
    .pipe(rename({ suffix: '.min' }))
    .pipe(sourcemaps.write('./'))
    .pipe(dest(out));
};

const clean = function (done) {
  del.deleteSync(path.baseDist, done());
};
const icons = () => {
  return src(`${path.baseSrcAssets}/icons/**/*`, { encoding: false }).pipe(
    dest(`${path.baseDistAssets}/icons`)
  );
};

const images = function () {
  var out = path.baseDistAssets + 'images';
  return src(path.baseSrcAssets + 'images/**/*', { encoding: false })
    .pipe(
      imagemin([
        gifsicle({ interlaced: true }),
        mozjpeg({ quality: 75, progressive: true }),
        optipng({ optimizationLevel: 5 }),
      ])
    )
    .pipe(dest(out));
};

const html = () =>
  src(path.baseSrc + '/*.html')
    .pipe(include('@@'))
    .pipe(dest(path.baseDist));

export const build = series(clean, html, parallel(scss, images, icons));
export default series(html, parallel(scss, images, icons), parallel(watchFiles, initBrowserSync));
