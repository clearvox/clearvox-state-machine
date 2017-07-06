module.exports = class {

    constructor() {
        this.name = this.constructor.name;
        this.stateMachine = undefined;
    }

    init(stateMachine) {
        this.stateMachine = stateMachine;
    }

    start() {
        throw new Error(`${this.name} does not implement start()`);
    }

    end() {
        console.warn(`${this.name} does not implement end()`);
    }

};
