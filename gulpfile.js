const { src, dest, series, watch } = require('gulp');
const autoprefixer = require('gulp-autoprefixer');
const cleanCSS = require('gulp-clean-css');
const del = require('del');
const browserSync = require('browser-sync').create();
const sass = require('sass');
const gulpSass = require('gulp-sass');
const fileInclude = require('gulp-file-include');
const rev = require('gulp-rev');
const revRewrite = require('gulp-rev-rewrite');
const revDel = require('gulp-rev-delete-original');
const gulpif = require('gulp-if');
const notify = require('gulp-notify');
const image = require('gulp-imagemin');
const { readFileSync } = require('fs');
const mainSass = gulpSass(sass);
const plumber = require('gulp-plumber');
const puppeteer = require('puppeteer');
const tap = require('gulp-tap');
const path = require('path');
const merge = require('merge-stream');
const zip = require('gulp-zip');
const fs = require('fs');

// paths
const projectName = 'UA_LRP_Anthelios_Correct_Aestet';

const srcFolder = './src';
const buildFolder = './app';
const paths = {
	srcImgFolder: `${srcFolder}/images`,
	buildImgFolder: `${buildFolder}/shared/images`,
	srcScss: `${srcFolder}/scss/**/*.scss`,
	buildCssFolder: `${buildFolder}/shared/css`,
	srcMainJs: `${srcFolder}/js/*.js`,
	buildJsFolder: `${buildFolder}/shared/js`,
	srcPartialsFolder: `${srcFolder}/partials`,
	srcSlidesFolder: `${srcFolder}/slides`,
	fontsFolder: `${srcFolder}/fonts`,
	buildFontsFolder: `${buildFolder}/shared/fonts`,
};

let isProd = false; // dev by default

const clean = () => {
	return del([buildFolder]);
};

// scss styles
const styles = () => {
	return src(paths.srcScss, { sourcemaps: !isProd })
		.pipe(
			plumber(
				notify.onError({
					title: 'SCSS',
					message: 'Error: <%= error.message %>',
				})
			)
		)
		.pipe(mainSass())
		.pipe(
			autoprefixer({
				cascade: false,
				grid: true,
				overrideBrowserslist: ['last 5 versions'],
			})
		)
		.pipe(gulpif(isProd, cleanCSS({ level: { 1: { specialComments: 0 } }, format: 'keep-breaks' })))
		.pipe(dest(paths.buildCssFolder, { sourcemaps: '.' }))
		.pipe(browserSync.stream());
};

const customScripts = () => {
	return src(paths.srcMainJs).pipe(dest(paths.buildJsFolder)).pipe(browserSync.stream());
};

const resources = () => {
	return src(`${paths.fontsFolder}/**`).pipe(dest(paths.buildFontsFolder));
};

const images = () => {
	return (
		src([`${paths.srcImgFolder}/**/**.{jpg,jpeg,png,svg}`])
			// .pipe(
			// 	gulpif(
			// 		isProd,
			// 		image([
			// 			image.mozjpeg({
			// 				quality: 80,
			// 				progressive: true,
			// 			}),
			// 			image.optipng({
			// 				optimizationLevel: 2,
			// 			}),
			// 		])
			// 	)
			// )
			.pipe(dest(paths.buildImgFolder))
	);
};

const htmlInclude = () => {
	return src([`${srcFolder}/*.html`])
		.pipe(
			fileInclude({
				prefix: '@@',
				basepath: '@file',
			})
		)
		.pipe(dest(buildFolder))
		.pipe(browserSync.stream());
};

const watchFiles = () => {
	browserSync.init({
		server: {
			baseDir: `${buildFolder}`,
		},
	});

	watch(paths.srcScss, styles);
	watch(paths.srcMainJs, customScripts);
	watch(`${paths.srcPartialsFolder}/*.html`, htmlInclude);
	watch(`${paths.srcSlidesFolder}/*.html`, htmlInclude);
	watch(`${srcFolder}/*.html`, htmlInclude);
	watch(`${paths.fontsFolder}/**`, resources);
	watch(`${paths.srcImgFolder}/**/**.{jpg,jpeg,png,svg}`, images);
};

function getFolders(dir) {
	return fs.readdirSync(dir).filter(function (file) {
		return fs.statSync(path.join(dir, file)).isDirectory();
	});
}

const zipFiles = (done) => {
	del.sync([`${buildFolder}/*.zip`]);
	var folders = getFolders(buildFolder);

	var tasks = folders.map(function (folder) {
		return src(`./app/${folder}/**/*.*`, {})
			.pipe(
				plumber(
					notify.onError({
						title: 'ZIP',
						message: 'Error: <%= error.message %>',
					})
				)
			)
			.pipe(zip(`${folder.toUpperCase()}_${projectName}.zip`))
			.pipe(dest(buildFolder));
	});
	merge(tasks);
	done();
};

const folders = () => {
	var slideCount = 0;
	return src('./app/*.html').pipe(
		tap(async (file) => {
			slideCount++;
			if (!fs.existsSync(file.basename)) {
				const slFolder = './app/' + 'S' + slideCount;
				fs.mkdirSync(slFolder);
			}
		})
	);
};

const buildHtml = () => {
	var slideCount = 0;
	return src('./app/*.html').pipe(
		dest(function (file) {
			slideCount++;
			const slideNumber = file.basename.replace(/\D/g, '');
			const slFolder = './app/' + 'S' + slideNumber;
			file.basename = 'index.html';
			return slFolder;
		})
	);
};

async function timeout(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

const screen = () => {
	return src(['./app/*.html']).pipe(
		tap(async (file) => {
			let browser;
			try {
				browser = await puppeteer.launch({ headless: true });
				const page = await browser.newPage();
				await page.setViewport({
					width: 1024,
					height: 768,
					deviceScaleFactor: 1,
				});
				await page.goto('file://' + file.path, { waitUntil: 'networkidle2' });
				await timeout(5000);
				await page.screenshot({ path: './app/S' + file.basename.slice(6, 7) + '/thumb.png' });
			} catch (err) {
				console.log(err.message);
			} finally {
				if (browser) {
					browser.close();
				}
			}
		})
	);
};

const toProd = (done) => {
	isProd = true;
	done();
};

const cache = () => {
	return src(`${buildFolder}/**/*.{css,js,svg,png,jpg,jpeg,webp,woff2}`, {
		base: buildFolder,
	})
		.pipe(rev())
		.pipe(revDel())
		.pipe(dest(buildFolder))
		.pipe(rev.manifest('rev.json'))
		.pipe(dest(buildFolder));
};

const rewrite = () => {
	const manifest = readFileSync('app/rev.json');
	src(`${paths.buildCssFolder}/*.css`)
		.pipe(
			revRewrite({
				manifest,
			})
		)
		.pipe(dest(paths.buildCssFolder));
	return src(`${buildFolder}/**/*.html`)
		.pipe(
			revRewrite({
				manifest,
			})
		)
		.pipe(dest(buildFolder));
};

exports.default = series(clean, htmlInclude, customScripts, styles, resources, images, watchFiles);

exports.build = series(toProd, clean, htmlInclude, customScripts, resources, styles, images, screen, folders, buildHtml);

exports.cache = series(cache, rewrite);

exports.zip = zipFiles;
