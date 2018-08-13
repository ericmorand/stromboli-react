const Processor = require('./stromboli/stromboli-processor-twig');
const secureFilters = require('secure-filters');

const util = require('util');

class IHEIDProcessor extends Processor {
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

                    binary.setData(new Buffer(`<!DOCTYPE html><html><head></head><body><pre><code>${secureFilters.html(util.format(response.getError().getMessage()))}</code></pre></body></html>`));
                }
            }
        )
    }
}

module.exports = IHEIDProcessor;