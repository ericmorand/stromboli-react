const merge = require('merge');

const Promise = require('promise');

module.exports = class {
    constructor(config) {
        this.config = config || {};
    }

    /**
     *
     * @param renderRequest {StromboliRenderRequest}
     * @returns {Promise}
     */
    process(renderRequest) {
        const sass = require('node-sass');

        if (!renderRequest.getOutput()) {
            renderRequest.setOutput('index.css');
        }

        let response = renderRequest.getResponse();

        let file = renderRequest.getSource();
        let sassConfig = this.getConfig(file);

        sassConfig.outFile = renderRequest.getOutput();
        sassConfig.sourceMap = true;

        return Promise.all([
            this.getDependencies(file).then(
                (dependencies) => {
                    response.setDependencies(dependencies);
                }
            ),
            new Promise((fulfill, reject) => {
                sass.render(sassConfig, (err, sassRenderResult) => { // sass render success
                    let outFile = sassConfig.outFile;

                    if (err) {
                        response.setError(err.file, err.formatted);
                    }

                    response.addBinary(outFile, sassRenderResult ? sassRenderResult.css : new Buffer(''), sassRenderResult ? sassRenderResult.map : null);

                    fulfill();
                })
            })
        ]).then(
            () => {
                return renderRequest;
            }
        );
    }

    getDependencies(file) {
        const SSDeps = require('stylesheet-deps');

        let dependencies = [];

        return new Promise((fulfill, reject) => {
            let depper = new SSDeps({
                syntax: 'scss'
            });

            depper.on('data', (dep) => {
                dependencies.push(dep);
            });

            depper.on('missing', (dep) => {
                dependencies.push(dep);
            });

            depper.on('finish', () => {
                fulfill(dependencies);
            });

            depper.write(file);
            depper.end();
        });
    }

    getConfig(file) {
        return merge.recursive(true, {
            file: file,
            sourceMapEmbed: true
        }, this.config);
    };
};