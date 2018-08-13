const {TwingLoaderFilesystem} = require('twing');
const path = require('path');

class IHEIDLoaderFilesystem extends TwingLoaderFilesystem {
    findTemplate(name, throw_ = true) {
        if (path.isAbsolute(name)) {
            this.cache.set(name, name);
        }

        return super.findTemplate(name, throw_);
    }
};

module.exports = IHEIDLoaderFilesystem;