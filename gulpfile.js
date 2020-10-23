let project_folder = require("path").basename(__dirname);
// let project_folder = "result";
let source_folder = '#src';
let fs = require('fs');

let path = {
    build: {
        html: project_folder + "/",
        css: project_folder + "/css/",
        js: project_folder + "/js/",
        img: project_folder + "/img/",
        fonts: project_folder + "/fonts/",
    },
    src: {
        html: [source_folder + "/*.html", "!" + source_folder + "/_*.html"],
        css: source_folder + "/scss/style.scss",
        js: source_folder + "/js/script.js",
        img: source_folder + "/img/**/*.{jpg,png,svg,gif,ico,webp}",
        fonts: source_folder + "/fonts/*.ttf",
    },
    watch: {
        html: source_folder + "/**/*.html",
        css: source_folder + "/scss/**/*.scss",
        js: source_folder + "/js/**/*.js",
        img: source_folder + "/img/**/*.{jpg,png,svg,gif,ico,webp}"
    },
    clean: "./" + project_folder + "/"

}

let {
    src,
    dest
} = require('gulp'),
    gulp = require('gulp'),
    browsersync = require("browser-sync").create(),
    fileinclude = require("gulp-file-include"),
    del = require("del"),
    scss = require("gulp-sass"),
    autoprefixer = require("gulp-autoprefixer"),
    group_media = require("gulp-group-css-media-queries"),
    clean_css = require("gulp-clean-css"),
    rename = require("gulp-rename"),
    uglify = require("gulp-uglify-es").default,
    imagemin = require("gulp-imagemin"),
    webp = require("gulp-webp"),
    concat = require("gulp-concat"),
    babel = require("gulp-babel"), //переводит js-файлы в формат, понятный даже тупому ослику(IE). Если точнее, конвертирует javascript стандарта ES6 в ES5
    webphtml = require("gulp-webp-html"),
    recompress = require("imagemin-jpeg-recompress"),
    svgSprite = require("gulp-svg-sprite"),
    ttf2woff = require("gulp-ttf2woff"),
    ttf2woff2 = require("gulp-ttf2woff2"),
    fonter = require("gulp-fonter"),
    pngquant = require("imagemin-pngquant"),
    sourcemaps = require("gulp-sourcemaps"); //рисует карту слитого воедино файла, чтобы было понятно, что из какого файла бралось

function browserSync(params) {
    browsersync.init({
        server: {
            baseDir: "./" + project_folder + "/"
        },
        port: 3000,
        notify: false
    })
}

function html() {
    return src(path.src.html)
        .pipe(fileinclude())
        .pipe(webphtml())
        .pipe(dest(path.build.html))
        .pipe(browsersync.stream())
}


function cssLibs() {
    //библиотека из css-стилей плагинов
    return src([
            'node_modules/slick-carousel/slick/slick.css',
            "node_modules/normalize.css/normalize.css"
        ])
        .pipe(sourcemaps.init())
        .pipe(concat("libs.css")) //склеиваем их в один файл с указанным именем
        .pipe(
            autoprefixer({
                overrideBrowserslist: ["last 5 versions"],
                cascade: true
            })
        )
        .pipe(dest(path.build.css)) //кидаем несжатый файл в директорию результата
        .pipe(clean_css({
            compatibility: "ie8",
            level: {
                1: {
                    specialComments: 0,
                    removeEmpty: true,
                    removeWhitespace: true,
                },
                2: {
                    mergeMedia: true,
                    removeEmpty: true,
                    removeDuplicateFontRules: true,
                    removeDuplicateMediaBlocks: true,
                    removeDuplicateRules: true,
                    removeUnusedAtRules: true,
                },
            },
        }))
        .pipe(
            rename({
                extname: ".min.css"
            })
        )
        .pipe(sourcemaps.write('.'))
        .pipe(dest(path.build.css)) //кидаем готовый файл в директорию
}

//Функция обработки стилей
function css() {
    return src(path.src.css)
        .pipe(sourcemaps.init()) //инициализируем sourcemaps, чтобы он начинал записывать, что из какого файла берётся
        .pipe(
            scss({
                //формирование развернутого (не сжатого) css файла
                outputStyle: "expanded"
            })
        )
        .pipe(
            autoprefixer({
                overrideBrowserslist: ["last 5 versions"],
                cascade: true
            })
        )
        .pipe(
            group_media()
        )
        .pipe(dest(path.build.css)) //выгрузка
        .pipe(clean_css({
            compatibility: "ie8",
            level: {
                1: {
                    specialComments: 0,
                    removeEmpty: true,
                    removeWhitespace: true,
                },
                2: {
                    mergeMedia: true,
                    removeEmpty: true,
                    removeDuplicateFontRules: true,
                    removeDuplicateMediaBlocks: true,
                    removeDuplicateRules: true,
                    removeUnusedAtRules: true,
                },
            },
        }))
        .pipe(
            rename({
                extname: ".min.css"
            })
        )
        .pipe(sourcemaps.write('.')) //записываем карту в итоговый файл
        .pipe(dest(path.build.css))
        .pipe(browsersync.stream())
}

function jsLibs() {
    return src([
            //подключаем разные js в общую библиотеку.
            'node_modules/slick-carousel/slick/slick.js'
        ])
        //pipe - функция, внутри которой мы пишем команды для gulp
        .pipe(concat("libs.js"))
        .pipe(dest(path.build.js)) //выгрузка несжатого
        .pipe(
            uglify() // сжимаем
        )
        .pipe(
            rename({
                extname: ".min.js"
            })
        )
        .pipe(dest(path.build.js)) //выгрузка сжатого
        .pipe(browsersync.stream())
}

function js() {
    return src(path.src.js)
        //сборка файлов через fileinclude
        .pipe(fileinclude())
        //pipe - функция, внутри которой мы пишем команды для gulp
        .pipe(babel())
        .pipe(sourcemaps.init())
        .pipe(dest(path.build.js)) //выгрузка
        .pipe(
            uglify()
        )
        .pipe(
            rename({
                extname: ".min.js"
            })
        )
        .pipe(sourcemaps.write('.'))
        .pipe(dest(path.build.js))
        .pipe(browsersync.stream())
}


function images() {
    return src(path.src.img)
        .pipe(
            webp({
                quality: 70
            })
        )
        .pipe(dest(path.build.img)) //выгрузка
        .pipe(src(path.src.img))  //обращение к исходникам
        .pipe(
            imagemin(
                [
                    recompress({
                        //Настройки сжатия изображений. Сейчас всё настроено так, что сжатие почти незаметно для глаза на обычных экранах. Можете покрутить настройки, но за результат не отвечаю.
                        loops: 4, //количество прогонок изображения
                        min: 80, //минимальное качество в процентах
                        max: 100, //максимальное качество в процентах
                        quality: "high", //тут всё говорит само за себя, если хоть капельку понимаешь английский
                        use: [pngquant()],
                    }),
                    imagemin.gifsicle(), //тут и ниже всякие плагины для обработки разных типов изображений
                    imagemin.optipng(),
                    imagemin.svgo(),
                ],
                {
                    progressive: true,
                    svgoPlugins: [{removeViewBox: false}],
                    interlaced: true,
                    optimizationLevel: 3 // 0 to 7
                }
            ),
        )
        .pipe(dest(path.build.img))
        .pipe(browsersync.stream());
}


function fonts() {
    src(path.src.fonts)
        .pipe(ttf2woff())
        .pipe(dest(path.build.fonts));
    return src(path.src.fonts)
        .pipe(ttf2woff2())
        .pipe(dest(path.build.fonts));
};

gulp.task('otf2ttf', function () {
    return src([source_folder + '/fonts/*.otf'])
        .pipe(fonter({
            formats: ['ttf']
        }))
        .pipe(dest(source_folder + '/fonts/'));
})


const svgSprites = () => {
    return gulp.src([source_folder + '/images/svgSprite/*.svg'])
        .pipe(svgSprite({
            mode: {
                stack: {
                    //куда будет выводиться готовый собранный файл
                    sprite: "../svgSprite.svg", //sprite file name
                    //создание html файла с примером иконок
                    example: true
                }
            },
        }))
        .pipe(dest(path.build.img)); //выгрузка
}

function fontsStyle(params) {

    let file_content = fs.readFileSync(source_folder + '/scss/fonts.scss');
    if (file_content == '') {
        fs.writeFile(source_folder + '/scss/fonts.scss', '', cb);
        return fs.readdir(path.build.fonts, function (err, items) {
            if (items) {
                let c_fontname;
                for (var i = 0; i < items.length; i++) {
                    let fontname = items[i].split('.');
                    fontname = fontname[0];
                    if (c_fontname != fontname) {
                        fs.appendFile(source_folder + '/scss/fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
                    }
                    c_fontname = fontname;
                }
            }
        })
    }
}

function cb() {

}

function watchFile(params) {
    gulp.watch([path.watch.html], html);
    gulp.watch([path.watch.css], css);
    gulp.watch([path.watch.js], js);
    gulp.watch([path.watch.img], images);
}

function clean(params) {
    return del(path.clean);
}

let build = gulp.series(clean, gulp.parallel(jsLibs, js, cssLibs, css, html, images, svgSprites, fonts), fontsStyle);
//сценарий выполнения watch
let watch = gulp.parallel(build, watchFile, browserSync);

//подружим gulp с новыми переменными, чтобы он их понимал и работал с ними

exports.fontsStyle = fontsStyle;
exports.svgSprites = svgSprites;
exports.fonts = fonts;
exports.images = images;
exports.js = js;
exports.jsLibs = jsLibs;
exports.css = css;
exports.cssLibs = cssLibs;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;