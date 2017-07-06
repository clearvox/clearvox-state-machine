const fs = require('fs');
const path = require('path');

module.exports = (trans, args, locale = 'en', fallbackLocale = 'en') => {
    let main, fallback, text, language;

    let mainPath = path.normalize(`${__dirname}/../locale/${locale}.json`);
    let fallbackPath = path.normalize(`${__dirname}/../locale/${fallbackLocale}.json`);

    if (fs.existsSync(mainPath)) {
        delete require.cache[require.resolve(mainPath)];
        main = require(mainPath);
    }
    if (fs.existsSync(fallbackPath)) {
        delete require.cache[require.resolve(fallbackPath)];
        fallback = require(fallbackPath);
    }

    if (!main && !fallback) {
        return {
            text: trans,
            language: locale
        }
    }

    const _path = trans.split('.');

    // @todo[idea]: add conditional parser
    // eg: (=number>1?s)
    // check if number > 1
    // add s

    function applyArgs(text) {
        for (let i in args) {
            if (!args.hasOwnProperty(i)) continue;
            text = text.replace(new RegExp(`:${i}`, 'g'), args[i]) || text;
        }
        return text;
    }

    try {
        text = _path.reduce((o, i) => o[i], main);
        language = locale;
    } catch (e) {
        console.error(e);
        try {
            text = _path.reduce((o, i) => o[i], fallback);
            language = fallbackLocale;
        } catch (err) {
            console.error(err);
            text = trans;
            language = fallbackLocale;
        }
    }

    if(!text) {
        text = trans;
        language = locale;
    }

    return {
        text: applyArgs(text),
        language: language
    };
};
