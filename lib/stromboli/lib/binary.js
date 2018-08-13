/**
 * @class
 */
let StromboliBinary = class {
    /**
     * @param name {string}
     * @param data {Buffer}
     * @param map {Buffer}
     */
    constructor(name, data, map) {
        /**
         * Get the binary name.
         *
         * @returns {string}
         */
        this.getName = () => {
            return name;
        };

        /**
         * Get the binary data.
         *
         * @returns {Buffer}
         */
        this.getData = () => {
            return data;
        };

        /**
         *
         * @param value {Buffer}
         */
        this.setData = (value) => {
            data = value;
        };

        /**
         * Return the binary source map.
         *
         * @returns {Buffer}
         */
        this.getMap = () => {
            return map;
        };
    }
};

module.exports = StromboliBinary;