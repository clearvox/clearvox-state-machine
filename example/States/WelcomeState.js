const State = require('../../').State;

class WelcomeState extends State {

    constructor() {
        super();
        this.disableDTMF = false;
    }

    start() {
        this.buffer = '';
        console.log(`Entering ${this.name}`);

        this.audio.pushSound("agent-user", () => {
            console.log('Played');
        });

    }

    dtmf(digit) {

        this.audio.stop();

        if(digit === '#') {
            this.stateMachine.transition("OtherState");
        } else {
            this.buffer += digit;
        }

    }

    end(next) {
        console.log(`Leaving ${this.name}`);
        next();
    }

}

module.exports = WelcomeState;
