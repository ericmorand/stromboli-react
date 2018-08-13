const babel = require("babel-core");

module.exports = class {
    /**
     *
     * @param renderRequest {StromboliRenderRequest}
     */
    process(renderRequest) {
        let response = renderRequest.getResponse();
        let binaries = response.getBinaries();

        for (let binary of binaries) {
            let transformedBinary = babel.transform(binary.getData(), {
                presets: [
                    ['env', {
                        targets: {
                            browsers: [
                                'Explorer 11'
                            ]
                        }
                    }]
                ]
            });

            binary.setData(transformedBinary.code);
        }

        return Promise.resolve(renderRequest);
    }
};