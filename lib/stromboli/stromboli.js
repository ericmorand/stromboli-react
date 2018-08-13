const StromboliPlugin = require('./lib/plugin');
const StromboliComponent = require('./lib/component');
const StromboliRenderResponse = require('./lib/render-response');
const StromboliRenderRequest = require('./lib/render-request');

const fs = require('fs');
const path = require('path');
const finder = require('fs-finder');

// promise support
const Promise = require('promise');
const fsStat = Promise.denodeify(fs.stat);

// log support
const LOG_LEVEL_SILENT = 0;
const LOG_LEVEL_ERROR = 1;
const LOG_LEVEL_WARN = 2;
const LOG_LEVEL_HTTP = 3;
const LOG_LEVEL_INFO = 4;
const LOG_LEVEL_VERBOSE = 5;
const LOG_LEVEL_SILLY = 6;

const logLevels = {
    'silent': LOG_LEVEL_SILENT,
    'error': LOG_LEVEL_ERROR,
    'warn': LOG_LEVEL_WARN,
    'http': LOG_LEVEL_HTTP,
    'info': LOG_LEVEL_INFO,
    'verbose': LOG_LEVEL_VERBOSE,
    'silly': LOG_LEVEL_SILLY
};

module.exports = class {
    constructor() {
        this.setLogLevel(process.env.npm_config_loglevel);
        this.logger = require('log-util');
    }

    /**
     *
     * @param config {Object}
     * @returns Promise<StromboliComponent[]>
     */
    start(config) {
        this.debug('CONFIG', config);

        let plugins = null;
        let components = null;

        return Promise.all([
            this.getPlugins(config).then(
                (results) => {
                    plugins = results;
                }
            ),
            this.getComponents(config.componentRoot, config.componentManifest).then(
                (results) => {
                    components = results;
                }
            )
        ]).then(
            () => {
                return Promise.all(components.map((component) => {
                    return this.buildComponent(component, plugins).then(
                        (component) => {
                            return component;
                        }
                    );
                })).then(
                    (components) => {
                        this.info('<', components.length, 'COMPONENTS RENDERED');

                        return Array.prototype.concat.apply([], components);
                    }
                );
            }
        );
    };

    /**
     *
     * @param config
     * @returns {Promise<[StromboliPlugin]>}
     */
    getPlugins(config) {
        this.info('> FETCHING PLUGINS');

        return Promise.all(Object.keys(config.plugins).map((key) => {
            let plugin = config.plugins[key];

            return new StromboliPlugin(key, plugin.entry, plugin.output, plugin.processors);
        })).then(
            (plugins) => {
                this.info('<', plugins.length, 'PLUGINS FETCHED');
                this.debug(plugins);

                return plugins;
            }
        )
    };

    /**
     *
     * @param directory {string}
     * @param componentManifest {string}
     * @returns {Promise<[StromboliComponent]>}
     */
    getComponents(directory, componentManifest) {
        this.info('> FETCHING COMPONENTS');

        return new Promise((fulfill, reject) => {
            finder.from(directory).findFiles(componentManifest, (files) => {
                    let components = [];

                    for (let file of files) {
                        let manifest = require(file);
                        let component = new StromboliComponent(manifest.name, path.dirname(file));

                        components.push(component);
                    }

                    fulfill(components);
                }
            );
        }).then(
            (components) => {
                this.info('<', components.length, 'COMPONENTS FETCHED');
                this.debug(components);

                return components;
            }
        );
    };

    /**
     * @param component {StromboliComponent}
     * @param plugins {StromboliPlugin[]}
     */
    buildComponent(component, plugins) {
        let responses = new Map();

        return Promise.all(plugins.map((plugin) => {
            return this.pluginRenderComponent(plugin, component).then(
                function(renderResponse) {
                    responses.set(plugin.getName(), renderResponse);
                }
            );
        })).then(() => {
            component.setRenderResponses(responses);

            return component;
        });
    };

    /**
     * Render the component passed as parameter with the plugin passed as parameter and resolve with the render request.
     *
     * @param plugin {StromboliPlugin}
     * @param component {StromboliComponent}
     * @returns {Promise<StromboliRenderResponse>}
     */
    pluginRenderComponent(plugin, component) {
        let beginDate = new Date();

        this.info('> COMPONENT', component.getName(), 'IS ABOUT TO BE RENDERED BY PLUGIN', plugin.getName());

        let entry = path.resolve(path.join(component.getPath(), plugin.getEntry()));
        let renderRequest = new StromboliRenderRequest(entry);
        let renderResponse = renderRequest.getResponse();

        let _renderDone = () => {
            let err = renderResponse.getError();

            if (err) {
                // we log the error for convenience
                if (err.getMessage()) {
                    this.error(err.getMessage());
                }
                else {
                    this.error(err);
                }
            }

            // deduplicate response dependencies
            let dependencies = new Set();

            let addDependency = (dependency) => {
                if (!dependencies.has(dependency)) {
                    dependencies.add(dependency);
                }
            };

            for (let dependency of renderResponse.getDependencies()) {
                addDependency(dependency);
            }

            renderResponse.setDependencies([...dependencies]);

            let endDate = new Date();

            this.info('< COMPONENT', component.getName(), 'HAS BEEN RENDERED BY PLUGIN', plugin.getName(), 'IN', endDate - beginDate + 'MS');
            this.debug(component);

            return renderResponse;
        };

        return this.exists(entry).then(
            async () => {
                for (let processor of plugin.getProcessors()) {
                    await processor.process(renderRequest);
                }

                return _renderDone();
            },
            () => {
                return _renderDone();
            }
        );
    };

    setLogLevel(logLevel) {
        this.logLevel = logLevels[logLevel];
    };

    warn() {
        if (this.logLevel >= LOG_LEVEL_WARN) {
            this.logger.warn.apply(this.logger, arguments);
        }
    };

    info() {
        if (this.logLevel >= LOG_LEVEL_INFO) {
            this.logger.info.apply(this.logger, arguments);
        }
    };

    debug() {
        if (this.logLevel >= LOG_LEVEL_VERBOSE) {
            this.logger.debug.apply(this.logger, arguments);
        }
    };

    error() {
        this.logger.error.apply(this.logger, arguments);
    };

    /**
     *
     * @param path {String}
     * @returns {Promise}
     */
    exists(path) {
        return fsStat(path).then(
            () => {
                return path;
            },
            (e) => {
                return Promise.reject(e);
            }
        )
    };
};
