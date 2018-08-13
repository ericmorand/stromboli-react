/**
 * @class
 */
let StromboliComponent = class {
    /**
     * @param name {string}
     * @param path {string}
     */
    constructor(name, path) {
        /**
         * Returns the component name.
         *
         * @returns {string}
         */
        this.getName = () => {
            return name;
        };

        /**
         * Returns the component path.
         *
         * @returns {string}
         */
        this.getPath = () => {
            return path;
        };

        /**
         * @type {Map<*, StromboliRenderResponse>}
         */
        let renderResponses = new Map();

        /**
         * Set the component render responses
         *
         * @param responses {Map<*, StromboliRenderResponse>}
         */
        this.setRenderResponses = (responses) => {
            renderResponses = responses;
        };

        /**
         * Add a render response to the component.
         *
         * @param key {*}
         * @param response {StromboliRenderResponse}
         */
        this.addRenderResponse = (key, response) => {
            renderResponses.set(key, response);
        };

        /**
         * Return the component render responses.
         *
         * @returns {Map<*, StromboliRenderResponse>}
         */
        this.getRenderResponses = () => {
            return renderResponses;
        };
    }
};

module.exports = StromboliComponent;