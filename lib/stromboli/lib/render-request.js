const StromboliRenderResponse = require('./render-response');

/**
 * @class
 */
let StromboliRenderRequest = class {
    /**
     * @param source {string}
     */
    constructor(source) {
        /**
         * Returns the request source.
         *
         * @returns {string}
         */
        this.getSource = () => {
            return source;
        };

        /**
         * @type {string}
         */
        let output;

        /**
         * Returns the request output path.
         *
         * @returns {string}
         */
        this.getOutput = () => {
            return output;
        };

        /**
         * Set the request output path.
         *
         * @param value
         */
        this.setOutput = (value) => {
            output = value;
        };

        /**
         * @type {StromboliRenderResponse}
         */
        let response = new StromboliRenderResponse();

        /**
         * Returns the request response.
         *
         * @returns {StromboliRenderResponse}
         */
        this.getResponse = () => {
            return response;
        }
    }
};

module.exports = StromboliRenderRequest;