/**
 * @class
 */
let StromboliPlugin = class {
    /**
     * @param name {string}
     * @param entry {string}
     * @param output {string}
     * @param processors {*}
     */
    constructor(name, entry, output, processors = []) {
        this.getName = () => {
            return name;
        };

        /**
         * Returns the plugin entry.
         *
         * @returns {string}
         */
        this.getEntry = () => {
            return entry;
        };

        /**
         * Returns the plugin output.
         *
         * @returns {string}
         */
        this.getOutput = () => {
            return output;
        };

        /**
         * Returns the plugin processors.
         *
         * @returns {*}
         */
        this.getProcessors = () => {
            return processors;
        };
    }
};

module.exports = StromboliPlugin;