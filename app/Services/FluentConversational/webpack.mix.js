let mix = require('laravel-mix');

mix.setPublicPath('public');

mix
    .js('src/assets/js/form/main.js', 'public/js/conversationalForm.js')
