const State = require('../../').State;

class ThirdState extends State {

    start(from) {
        console.log(`Entering ${this.name} from ${from.name}`);
    }

    dtmf(digit) {

        switch(digit) {
            case 1:
                this.stateMachine.transition("WelcomeState");
                break;
        }

    }

    end(next) {
        console.log(`Leaving ${this.name}`);
        next();
    }

}

module.exports = ThirdState;
