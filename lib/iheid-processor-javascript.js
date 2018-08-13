const Processor = require('./stromboli/stromboli-processor-javascript');
const secureFilters = require('secure-filters');

module.exports = class extends Processor {
    /**
     *
     * @param renderRequest {StromboliRenderRequest}
     * @returns {Promise}
     */
    process(renderRequest) {
        let response = renderRequest.getResponse();

        return super.process(renderRequest).then(
            () => {
                if (response.getError()) {
                    let binary = response.getBinaries()[0];

                    binary.setData(new Buffer(`console.error("${secureFilters.js(response.getError().getMessage())}");`));
                }
            }
        )
    }
};
