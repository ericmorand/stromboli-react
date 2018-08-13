/**
 * @class
 */
let StromboliRenderError = class {
    /**
     * @param file {string}
     * @param message {string}
     */
    constructor(file, message) {
        /**
         * Returns the file where the error happened.
         *
         * @returns {string}
         */
        this.getFile = () => {
            return file;
        };

        /**
         * Returns the error message.
         *
         * @returns {string}
         */
        this.getMessage = () => {
            return message;
        };
    }
};

module.exports = StromboliRenderError;