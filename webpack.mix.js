let mix = require('laravel-mix');
const exec = require('child_process').exec;

mix.setPublicPath('public');
mix.setResourceRoot('../');

if (!mix.inProduction()) {
    mix.webpackConfig({
        devtool: 'source-map'
    }).sourceMaps(false);
}

mix
    .js('resources/assets/public/fluentform-advanced.js', `public/js/fluentform-advanced.js`)
    .js('resources/assets/public/form-submission.js', `public/js/form-submission.js`)
    .sass('resources/assets/public/scss/fluent-forms-public.scss', `public/css/fluent-forms-public.css`)
    .sass('resources/assets/public/scss/fluentform-public-default.scss', `public/css/fluentform-public-default.css`)
    .sass('resources/assets/preview/preview.scss', `public/css/preview.css`)
    .sass('resources/assets/elementor/fluent-forms-elementor-widget.scss', `public/css/fluent-forms-elementor-widget.css`);

mix.then(() => {
    exec('rtlcss ./public/css/fluent-forms-public.css ./public/css/fluent-forms-public-rtl.css', (error) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        }
    });

    exec('rtlcss ./public/css/fluentform-public-default.css ./public/css/fluentform-public-default-rtl.css', (error) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        }
    });
});


mix.copyDirectory('resources/assets/libs', 'public/libs');
mix.copyDirectory('resources/img', 'public/img');
