#!/usr/bin/node
const fs     = require('fs');
const crypto = require('crypto');
const exec   = require('child_process').exec;
const soxPath = require('sox-bin');

const Translator = require('./tts/mstranslator');

module.exports = function (text, language, speed, cb) {
    let tts        = new Translator('3012e51ca6c3421297fb04a84b55ae30');

    const options = {
        text:     text,
        language: language || 'en',
        speed:    speed || '1.0',
    };

    const hash = crypto.createHmac('sha256', JSON.stringify(options)).digest('hex');

    // check if folders exists
    const path = __dirname + '/../tmp/';
    const tmpFile  = path +'/' + hash + '.tmp.wav';
    const destFile = path +'/' + hash + '.wav';

    if (!fs.existsSync(path)) {
        fs.mkdirSync(path);
    }

    // check if file exists
    if (!fs.existsSync(destFile)) {
        tts.speak(options, function (err, data) {
            if (err) {
                return false;
            }

            fs.writeFile(tmpFile, data, function (err) {
                if(err) {
                    throw err;
                }

                exec(`"${soxPath}" "${tmpFile}" -r 8000 "${destFile}" tempo ${options.speed}`, function (err, res) {
                    if (err) {
                        throw err;
                    }
                    fs.unlink(tmpFile);
                    if (cb) {
                        cb(destFile);
                    }
                });
            });
        });
    } else {
        if (cb) {
            cb(destFile);
        }
    }

};
