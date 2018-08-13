const StromboliRenderError = require('./render-error');
const StromboliBinary = require('./binary');

/**
 * @class
 */
let StromboliRenderResponse = class {
    constructor() {
        /**
         * @type {string[]}
         */
        let dependencies = [];

        /**
         * Set the response dependencies.
         *
         * @param value {string[]}
         */
        this.setDependencies = (value) => {
            dependencies = value;
        };

        /**
         * Returns the response dependencies.
         *
         * @returns {string[]}
         */
        this.getDependencies = () => {
            return dependencies;
        };

        /**
         * Convenient method to check whether a dependency has already been added.
         *
         * @param {string} name
         * @returns {boolean}
         */
        this.hasDependency = (name) => {
            return dependencies.includes(name);
        };

        /**
         * Add a binary to the response.
         *
         * @param value {string}
         */
        this.addDependency = (value) => {
            dependencies.push(value);
        };

        /**
         * @type {StromboliBinary[]}
         */
        let binaries = [];

        /**
         * Add a binary to the response.
         *
         * @param name {string}
         * @param data {Buffer}
         * @param map {*}
         */
        this.addBinary = (name, data, map = null) => {
            binaries.push(new StromboliBinary(name, data, map));
        };

        /**
         * Get the response binaries.
         *
         * @returns {StromboliBinary[]}
         */
        this.getBinaries = () => {
            return binaries;
        };

        /** @type StromboliRenderError **/
        let error = null;

        /**
         * Set the response error.
         *
         * @param file {string}
         * @param message {string}
         */
        this.setError = (file, message) => {
            error = new StromboliRenderError(file, message);
        };

        /**
         * Get the response error.
         *
         * @returns {StromboliRenderError}
         */
        this.getError = () => {
            return error;
        };
    }
};

module.exports = StromboliRenderResponse;