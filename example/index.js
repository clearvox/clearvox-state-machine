// Authentication Application
const ari = require('ari-client');
const Audio = require('./lib/Audio');

const StateMachine = require('../');

const WelcomeState = require('./States/WelcomeState');
const OtherState = require('./States/OtherState');
const ThirdState = require('./States/ThirdState');

ari.connect('http://127.0.0.1:8088', 'USERNAME', 'PASSWORD', (event, client) => {

    client.on('StasisStart', (event, channel) => {

        channel.answer();

        let stateMachine = new StateMachine({channel: channel, client: client, audio: new Audio(channel, client)});

        stateMachine.register(WelcomeState);
        stateMachine.register(OtherState, [WelcomeState]);
        stateMachine.register(ThirdState, [OtherState]);

        stateMachine.start(WelcomeState);

        channel.on('ChannelDtmfReceived', (event, _channel) => {
            if (_channel.id !== channel.id) {
                return;
            }

            if(typeof(stateMachine.current_state.dtmf) === 'function') {
                stateMachine.current_state.dtmf(parseInt(event.digit) || event.digit);
            } else {
                console.warn(`${stateMachine.current_state} does not implement dtmf(digit)`);
            }

        });

        channel.on('StasisEnd', () => stateMachine.stop(() => stateMachine = null));

    });

    client.start('test');


});


