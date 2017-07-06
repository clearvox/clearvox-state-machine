const State = require('./State');

// Helper function to extract function parameters
const getParams = (p) => p
    .replace(/[/][/].*$/mg,'') // strip single-line comments
    .replace(/\s+/g, '') // strip white space
    .replace(/[/][*][^/*]*[*][/]/g, '') // strip multi-line comments
    .split('){', 1)[0].replace(/^[^(]*[(]/, '') // extract the parameters
    .replace(/=[^,]+/g, '') // strip any ES6 defaults
    .split(',').filter(Boolean); // split & filter [""]

let state_machines = [];

class StateMachine {

    constructor(args) {
        this.args = args;

        state_machines.push(this);
        this.started = false;
        this.states = {};
        this.firewall = {};
        this.previous_state = null;
        this.current_state = null;
    }

    register(state, firewall) {
        if(this.states.hasOwnProperty(state.name)) {
            throw new Error(`${state.name} already registered`);
        }
        let instance = new state();

        instance.init(this);

        // Inject arguements into the state
        for(const key of Object.keys(this.args)) {
            instance[key] = this.args[key];
        }

        this.firewall[instance.name] = [];

        if(firewall instanceof Array) {
            for (let allowed_state of firewall) {
                let allowed_name;
                if (typeof(allowed_state) === 'string') {
                    allowed_name = allowed_state;
                } else if (typeof(allowed_state) === 'function') {
                    allowed_name = (new allowed_state()).name;
                } else if (allowed_state instanceof State) {
                    allowed_name = allowed_state.name;
                } else {
                    console.log(typeof(allowed_state));
                }

                this.firewall[instance.name].push(allowed_name);
            }
        }

        this.states[instance.name] = instance;
    }

    unregister(state) {
        if (typeof(state) === 'string') {
            delete this.states[state];
        } else {
            delete this.states[this.states.indexOf(state)];
        }
    }
    transition(state) {
        let newState;

        if (typeof(state) === 'string') {
            newState = this.states[state];
        } else if (typeof(state) === 'function') {
            let instance = new state();
            newState = this.states[instance.name];
        } else if (state instanceof State) {
            newState = state;
        }

        if (!newState || !this.states.hasOwnProperty(newState.name)) {
            throw new Error(`State not registered with state machine`);
        }

        let firewall = this.firewall[newState.name];

        if (this.current_state) {

            if ((firewall.length > 0 && firewall.indexOf(this.current_state.name) === -1)) {
                throw new Error(`Transition from ${this.current_state.name} to ${newState.name} not allowed`);
            }

            if(getParams(this.current_state.end.toString()).length > 0) {
                this.current_state.end(() => {

                    this.previous_state = this.current_state;
                    this.current_state = newState;
                    newState.start(this.previous_state);

                });
            } else {
                this.current_state.end();

                this.previous_state = this.current_state;
                this.current_state = newState;
                newState.start(this.previous_state);
            }

        } else {
            if(firewall.length > 0) {
                throw new Error(`Unable to start ${newState.name}, it can only be started from ${firewall.join(', ')}`);
            }

            this.previous_state = this.current_state;
            this.current_state = newState;
            newState.start(this.previous_state);

        }

    }

    start(state) {
        if (this.started) {
            throw new Error('StateMachine already running');
        }

        this.transition(state || Object.values(this.states)[0]);
    }

    stop(cb) {
        if (this.current_state) {
            this.states = {};
            this.current_state.end(() => {});
            this.current_state = null;

            this.args.channel.hangup(() => {
                if(cb) {
                    cb();
                }
            });
        }
    }
}

module.exports = StateMachine;

module.exports.clean = (cb) => {
    if(state_machines.length) {
        for (const instance of state_machines) {
            instance.stop(cb);
            state_machines.splice(state_machines.indexOf(instance), 1);
        }
    } else {
        cb();
    }
};