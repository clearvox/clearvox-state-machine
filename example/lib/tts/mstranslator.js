var querystring = require('querystring');
var http = require('http');
var https = require('https');
var languages = require('./languages');

var tokenHostname = 'api.cognitive.microsoft.com';
var speechHostname = 'speech.platform.bing.com';

function AzureBingSpeach(key) {
    this.key = key;

}

module.exports = AzureBingSpeach;

AzureBingSpeach.prototype = {
    getToken: function(cb) {
        var token = '';

        var req = https.request({
            hostname: tokenHostname,
            port: 443,
            path: '/sts/v1.0/issueToken',
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': this.key
            }
        }, function (res) {
            res.on('data', function (chunk) {
                token += chunk;
            });
            res.on('end', function () {
                cb(token);
            });
        });

        req.on('error', function (data) {
            console.log('TTS Authentication failed', data);
        });

        req.end();
    },
    getLang: function (lang) {
        if (lang === 'en') {
            lang = 'en-US';
        }

        var option;
        for (var i = 0; i < languages.length; i++) {
            if (languages[i].lang.indexOf(lang) === 0) {
                option = languages[i];
                if (option.gender === 'Female') {
                    break;
                }
            }
        }

        if (!option) {
            return this.getLang('en');
        }

        return {
            gender: option.gender,
            lang: option.lang,
            name: option.voice
        }
    },
    requestString: function (options) {
        var lang = this.getLang(options.language);

        return "<speak version='1.0' xml:lang='" + lang.lang + "'>" +
                    "<voice xml:lang='" + lang.lang + "' xml:gender='" + lang.gender + "' name='" + lang.name + "'>" +
                        options.text +
                    "</voice>" +
                "</speak>";
    },
    getFile: function (options, cb) {
        var req = https.request({
            hostname: speechHostname,
            port: 443,
            path: '/synthesize',
            method: 'POST',
            headers: {
                'Content-Type': 'application/ssml+xml',
                'X-Microsoft-OutputFormat': 'riff-16khz-16bit-mono-pcm ',
                'Authorization': 'Bearer ' + options.token,
                'User-Agent': 'ClearVox Nexxt'
            }
        }, function (res) {
            var data = '';
                    var buffers = [];

            res.on('data', function (chunk) {
                if (!Buffer.isBuffer(chunk)) {
                    chunk = new Buffer(chunk);
                }
                buffers.push(chunk);
            });

            res.on('end', function () {
                var index = 0;
                var buffer_length = buffers.reduce(function (sum, e) {
                    return sum += e.length;
                }, 0);
                var body = new Buffer(buffer_length);
                buffers.forEach(function (buf, i) {
                    buf.copy(body, index, 0, buf.length);
                    index += buf.length;
                });
                delete(buffers);
                cb(null, body);
            });
        });

        req.on('error', function (data) {
            cb(data);
        });

        req.end(this.requestString(options));
    },
    speak: function (options, cb) {
        var self = this;

        this.getToken(
            function (token) {
                options.token = token;
                self.getFile(options, cb);
            }
        );
    }
};