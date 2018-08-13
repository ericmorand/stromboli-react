const fs = require('fs-extra');
const path = require('path');

const Promise = require('promise');
const fsStat = Promise.denodeify(fs.stat);
const {TwingEnvironment} = require('twing');

class Processor {
    /**
     * @param config {Object}
     */
    constructor(config) {
        this.config = config || {};

        /**
         *
         * @param path {String}
         * @returns {Promise}
         */
        this.exists = (path) => {
            return fsStat(path).then(
                () => {
                    return path;
                },
                (e) => {
                    return Promise.reject(e);
                }
            )
        }
    }

    /**
     *
     * @param renderRequest {StromboliRenderRequest}
     * @returns {Promise}
     */
    process(renderRequest) {
        let response = renderRequest.getResponse();

        if (!renderRequest.getOutput()) {
            renderRequest.setOutput('index.html');
        }

        let file = renderRequest.getSource();

        let twing = new TwingEnvironment(this.config.loader, this.config.options);

        let extensions = this.config.extensions;

        if (extensions) {
            for (let extension of extensions) {
                twing.addExtension(extension);
            }
        }

        // retrieve data dependencies and render the template
        return this.getDataDependencies(this.getDataPath(file)).then(
            (dependencies) => {
                response.setDependencies(dependencies);

                return this.getData(file).then(
                    (data) => {
                        if (data === null) {
                            data = {};
                        }

                        return new Promise((fulfill, reject) => {
                            try {
                                let onTemplate = (name) => {
                                    if (!response.hasDependency(name)) {
                                        response.addDependency(twing.getLoader().findTemplate(name));
                                    }
                                };

                                twing.on('template', onTemplate);

                                let render = twing.render(file, data);

                                twing.removeListener('template', onTemplate);

                                fulfill(render);
                            }
                            catch (err) {
                                console.error(err)

                                response.setError(err.sourcePath, `Error in "${err.sourcePath}" at line ${err.lineno}: ${err.rawMessage}`);

                                fulfill('');
                            }
                        })
                    },
                    (err) => {
                        response.setError(err.file, err.message);

                        return '';
                    }
                )
            }
        ).then(
            (binary) => {
                response.addBinary(renderRequest.getOutput(), new Buffer(binary));
            }
        );
    }

    getDataPath(file) {
        return path.join(path.dirname(file), path.basename(file) + '.data.js');
    }

    /**
     *
     * @param file
     * @returns {Promise.<{}>}
     */
    getData(file) {
        let dataFile = this.getDataPath(file);

        return this.exists(dataFile).then(
            () => {
                return new Promise((fulfill, reject) => {
                    let data;

                    let deleteRequireCache = (id) => {
                        let files = require.cache[id];

                        if (typeof files !== 'undefined') {
                            for (let i in files.children) {
                                deleteRequireCache(files.children[i].id);
                            }

                            delete require.cache[id];
                        }
                    };

                    deleteRequireCache(dataFile);

                    try {
                        data = require(dataFile)();
                    }
                    catch (err) {
                        reject({
                            file: dataFile,
                            message: err
                        });
                    }

                    return Promise.resolve(data).then(
                        (data) => {
                            fulfill(data);
                        }
                    );
                });
            },
            () => {
                return null;
            }
        );
    }

    getDataDependencies(file) {
        return new Promise((fulfill, reject) => {
            const ModuleDeps = require('module-deps');

            let depper = ModuleDeps({ignoreMissing: true});

            let dependencies = [];

            let updateDependencies = (dep) => {
                if (dependencies.indexOf(dep) < 0) {
                    dependencies.push(dep);
                }
            };

            depper.on('file', (file) => {
                updateDependencies(file);
            });

            depper.on('data', (data) => {
                let file = data.id;

                updateDependencies(file);
            });

            depper.on('missing', (id, parent) => {
                if (path.extname(id).length === 0) {
                    let candidates = [
                        `${id}.js`,
                        `${id}/index.js`
                    ];

                    for (let candidate of candidates) {
                        dependencies.push(path.resolve(parent.basedir, candidate));
                    }
                }
                else {
                    dependencies.push(path.resolve(parent.basedir, id));
                }
            });

            depper.on('end', () => {
                fulfill(dependencies);
            });

            depper.on('error', (err) => {
                fulfill(dependencies);
            });

            depper.end({
                file: file,
                entry: true
            });
        })
    };
}

module.exports = Processor;