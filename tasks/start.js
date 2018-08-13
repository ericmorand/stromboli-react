const Stromboli = require('../lib/stromboli/stromboli');
const fs = require('fs-extra');
const path = require('path');
const merge = require('merge');
const Url = require('url');

const writer = require('../lib/writer');
const BrowserSync = require('browser-sync');
const Gaze = require('gaze').Gaze;
const logger = require('eazy-logger').Logger();

const EventEmitter = require('events').EventEmitter;

EventEmitter.defaultMaxListeners = 0;

let namespace = null;
let builder = new Stromboli();

if (process.argv[2]) {
    namespace = process.argv[2];
}

let watchers = new Map();

async function start(namespace) {
    let componentManifest = 'component.json';

    if (!namespace) {
        let fuzzy = require('fuzzy');
        let inquirer = require('inquirer');
        let components = await builder.getComponents('test', componentManifest);
        let choices = components.map(function (component) {
            return component.getName();
        });

        inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));

        let searchNamespaces = (answers, input) => {
            input = input || '';

            return new Promise((resolve, reject) => {
                let results = fuzzy.filter(input, choices);

                resolve(results.map(function (result) {
                    return result.string;
                }));
            });
        };

        namespace = (await inquirer.prompt({
            type: 'autocomplete',
            name: 'namespace',
            message: 'Which namespace do you want to start?',
            choices: choices,
            pageSize: 10,
            source: searchNamespaces,
            validate: function (val) {
                return val ? true : 'Type something!';
            }
        })).namespace;
    }

    let config = require('../config/start');

    config.componentRoot = path.join(config.componentRoot, namespace);

    /**
     *
     * @param plugin {StromboliPlugin}
     * @param component {StromboliComponent}
     */
    let buildComponent = async function (plugin, component) {
        // close watcher
        let watcher;
        let componentWatchers;

        if (watchers.has(component)) {
            componentWatchers = watchers.get(component);
        }

        if (componentWatchers) {
            if (componentWatchers.has(plugin)) {
                watcher = componentWatchers.get(plugin);
            }
        }

        if (watcher) {
            watcher.close();
        }

        let renderResponse = await builder.pluginRenderComponent(plugin, component);

        component.addRenderResponse(plugin.getName(), renderResponse);

        await writer.writeRenderResponse(renderResponse, path.join('www', component.getName()));

        let files = renderResponse.getDependencies();

        files = files.map(function (file) {
            let url = Url.parse(file);

            return url.pathname;
        });

        builder.debug('Watched files:', files);

        watcher = new Gaze(files).on('all', async function (type, file) {
            await buildComponent(plugin, component);

            let bs = BrowserSync.has(component.getName()) ? BrowserSync.get(component.getName()) : null;

            if (bs) {
                for (let binary of renderResponse.getBinaries()) {
                    builder.info('Reloading', binary.getName());

                    bs.reload(binary.getName());
                }
            }
        });

        if (!watchers.has(component)) {
            watchers.set(component, new Map());
        }

        componentWatchers = watchers.get(component);

        componentWatchers.set(plugin, watcher);
    };

    let plugins = await builder.getPlugins(config);
    let components = await builder.getComponents(config.componentRoot, config.componentManifest);

    components.sort(function (a, b) {
        return a.name <= b.name ? -1 : 1;
    });

    for (let component of components) {
        for (let plugin of plugins) {
            await buildComponent(plugin, component);
        }

        let browserSync = BrowserSync.create(component.getName());
        let browserSyncConfig = {
            server: path.join('www', component.getName()),
            ui: false,
            open: false,
            notify: false,
            logLevel: 'silent'
        };

        await new Promise(function (fulfill, reject) {
            browserSync.init(browserSyncConfig, function (err, bs) {
                component.urls = bs.options.get("urls");

                fulfill(component);
            });
        });
    }

    let maxLength = 0;

    for (let component of components) {
        let name = component.getName();
        let localURL = component.urls.get('local');
        let message = name + localURL;

        maxLength = Math.max(maxLength, message.length);
    }

    maxLength += 2;

    logger.unprefixed('info', '{bold: Access URLs:}');
    logger.unprefixed('info', '{grey: %s}', '-'.repeat(maxLength));

    for (let component of components) {
        logger.unprefixed('info', ' %s: {bold:%s}', component.urls.get('local'), component.getName());
    }

    logger.unprefixed('info', '{grey: %s}', '-'.repeat(maxLength));
}

start(namespace).then(
    function() {
    },
    function(err) {
        console.error(err);
    }
);