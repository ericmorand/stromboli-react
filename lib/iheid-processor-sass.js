const path = require('path');
const Promise = require('promise');
const Processor = require('./stromboli/stromboli-processor-sass');
const sass = require('node-sass');
const secureFilters = require('secure-filters');

/**
 * Special SASS plugin that prevents multiple imports of the same index file and add cache busting to assets
 */
module.exports = class extends Processor {
    constructor(config) {
        super(config);

        this.registry = new Map();
    }

    getConfig(file) {
        let config = super.getConfig(file);

        config.functions = config.functions || {};
        config.functions['url($url)'] = (url) => {
            let t = new Date().getTime();

            url = `${url.getValue()}?${t}`;

            return sass.types.String(`url(${url})`);
        };

        config.importer.push((url, prev, done) => {
            if (!this.registry.has(file)) {
                this.registry.set(file, new Set());
            }

            let fileRegistry = this.registry.get(file);

            if (!path.extname(url)) {
                url += '.scss';
            }

            let resolvedUrl = path.resolve(path.dirname(prev), url);

            if (fileRegistry.has(resolvedUrl)) {
                done({
                    contents: ''
                });
            }
            else {
                fileRegistry.add(resolvedUrl);

                done();
            }
        });

        return config;
    }

    /**
     *
     * @param renderRequest {StromboliRenderRequest}
     * @returns {Promise}
     */
    process(renderRequest) {
        let response = renderRequest.getResponse();

        return super.process(renderRequest).then(
            () => {
                this.registry.delete(renderRequest.getSource());

                if (response.getError()) {
                    let binary = response.getBinaries()[0];

                    binary.setData(new Buffer(`html:before {
    content: "${secureFilters.css(response.getError().getMessage())}"; 
    white-space: pre; 
    font-family: monospace; 
    color: red;
}`));
                }
            }
        )
    }
};
