const __ = require('./language');
const tts = require('./generatetts');

module.exports = class {

    constructor(channel, client) {
        this.channel = channel;
        this.client = client;
        this.queue = [];
        this.playing = false;
    }

    pushSound(soundfile, cb) {
        this.queue.push({
            path: soundfile,
            cb: cb
        });
        this.play();
    }

    pushTTS(text, args, cb) {
        this.queue.push({
            text: text,
            args: args || {},
            cb: cb || null,
        });
        this.play();
    }

    clear() {
        this.queue = [];
        this.queue.length = 0;
    }

    stop() {
        this.clear();
        this.stopPlayback();
    }

    play() {
        if (this.queue.length > 0 && !this.playing) {
            this.playing = true;

            let toPlay = this.queue.shift();

            if (toPlay.hasOwnProperty('text')) {
                let trans = __(toPlay.text, toPlay.args, this.channel.locale);

                console.log(trans.text);

                tts(trans.text, trans.language || 'en', '1.0', (file) => {
                    file = file.replace('.wav', '');
                    this.startPlayback("sound:" + file, (event, playback) => {
                        if (toPlay.cb) {
                            toPlay.cb(this.queue.length === 0);
                        }
                        this.playing = false;
                        this.play(); // play next in queue
                    });
                });
            } else if (toPlay.hasOwnProperty('path')) {

                console.log(toPlay.path);

                this.startPlayback("sound:" + toPlay.path, (event, playback) => {
                    if (toPlay.cb) {
                        toPlay.cb();
                    }
                    this.playing = false;
                    this.play();
                });
            }
        }

    }


    startPlayback(sound, callback) {
        this.playback = new this.client.Playback();

        this.playback.once('PlaybackFinished', function (event, playback) {
            if (callback) {
                callback(event, playback);
            }
        });

        this.channel.play({media: sound}, this.playback)
            .catch(e => console.error(e));
    }

    stopPlayback() {
        if(this.playback) {
            this.playback.stop()
                .catch(e => {
                });
        }
    }

};
