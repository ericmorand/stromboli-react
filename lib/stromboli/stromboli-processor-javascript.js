const Promise = require('promise');
const Browserify = require('browserify');

module.exports = class {
    constructor(config) {
        this.config = config;
    }

    /**
     *
     * @param renderRequest {StromboliRenderRequest}
     */
    process(renderRequest) {
        let response = renderRequest.getResponse();

        if (!renderRequest.getOutput()) {
            renderRequest.setOutput('index.js');
        }

        let file = renderRequest.getSource();
        let currentFile = null;

        return new Promise((fulfill, reject) => {
            Browserify(file, this.config)
                .on('file', function (file, id, parent) {
                    response.addDependency(file);

                    currentFile = file;
                })
                .bundle((err, buffer) => {
                    if (err) {
                        response.setError(currentFile, err.toString());
                    }

                    response.addBinary(renderRequest.getOutput(), buffer);

                    fulfill();
                })
            ;
        });
    }
};