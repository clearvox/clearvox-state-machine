const State = require('../../').State;
const fs = require('fs');


class OtherState extends State {

    start(from) {
        console.log(`Entering ${this.name} from ${from.name}`);

        console.log(`${this.channel.caller.name} <${this.channel.caller.number}> entered ${from.buffer}`);
    }

    dtmf(digit) {

        switch(digit) {
            case 1:
                this.stateMachine.transition("ThirdState");
                break;
        }

    }

    end(next) {
        console.log(`Leaving ${this.name}`);
        next();
    }

}

module.exports = OtherState;
