'use strict';

const fs = require('fs-extra');
const path = require('path');
const url = require('url');

const Promise = require('promise');
const fsOutputFile = Promise.denodeify(fs.outputFile);
const fsReadFile = Promise.denodeify(fs.readFile);

/**
 *
 * @param renderReponse {StromboliRenderResponse}
 * @param output {string}
 */
let writeRenderResponse = function (renderReponse, output, includeDependencies = true) {
    let promises = [];

    let result = {
        dependencies: [],
        binaries: []
    };

    if (includeDependencies) {
        for (let dependency of renderReponse.getDependencies()) {
            let fromUrl = url.parse(dependency);
            let from = fromUrl.pathname;

            let toUrl = url.parse(path.join(output, path.relative(path.resolve('.'), dependency)));
            let to = toUrl.pathname;

            promises.push(fsReadFile(from).then(
                (data) => {
                    return fsOutputFile(to, data).then(
                        () => {
                            result.dependencies.push(to);

                            return to;
                        }
                    )
                },
                (err) => {
                    return true;
                })
            );
        }
    }

    for (let binary of renderReponse.getBinaries()) {
        let data = binary.getData();
        let to = path.join(output, binary.getName());

        promises.push(fsOutputFile(to, data).then(
            () => {
                result.binaries.push(to);

                return to;
            },
            (err) => {
                return true;
            }
        ));
    }

    return Promise.all(promises).then(
        () => {
            return result;
        }
    );
};

/**
 *
 * @param components {StromboliComponent[]}
 * @param output {string}
 * @returns {Promise<*>}
 */
let writeComponents = function (components, output = '.', includeDependencies = true) {
    return Promise.all(components.map((component) => {
        let promises = [];

        for (let [plugin, renderResponse] of component.getRenderResponses()) {
            promises.push(writeRenderResponse(renderResponse, path.join(output, component.getName()), includeDependencies));
        }

        return Promise.all(promises);
    }))
};

module.exports = {
    writeRenderResponse: writeRenderResponse,
    writeComponents: writeComponents
};
