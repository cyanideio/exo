'use strict'

module.exports = function(config, RestNative) {
    const RestfulModel = require('../restful/model.js')(RestNative);
    class ConfigModel extends RestfulModel {
        get resource_name() {
            return config.resource_name;
        }

        get host() {
            return config.host;
        }
    }
    return ConfigModel;
}
