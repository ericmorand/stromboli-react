const Rebaser = require('css-source-map-rebase');
const through = require('through2');
const Readable = require('stream').Readable;
const path = require('path');
const url = require('url');

module.exports = class {
    /**
     *
     * @param renderRequest {StromboliRenderRequest}
     */
    process(renderRequest) {
        let response = renderRequest.getResponse();
        let binaries = response.getBinaries();
        let promises = [];

        for (let binary of binaries) {
            let map = binary.getMap();

            if (map) {
                promises.push(new Promise(function (fulfill, reject) {
                    let processedData = new Buffer('');

                    let rebaser = new Rebaser({
                        map: map.toString()
                    });

                    rebaser.on('rebase', function (rebased) {
                        let rebasedUrl = url.parse(rebased);

                        response.addDependency(path.resolve(rebasedUrl.pathname));
                    });

                    let stream = new Readable();

                    stream
                        .pipe(rebaser)
                        .pipe(through(function (chunk, enc, cb) {
                            processedData = Buffer.concat([processedData, chunk]);

                            cb();
                        }))
                        .on('finish', function () {
                            binary.setData(processedData);

                            fulfill();
                        })
                    ;

                    stream.push(binary.getData());

                    stream.push(null);
                }));
            }
        }

        return Promise.all(promises).then(
            function () {
                return renderRequest;
            }
        )
    }
};