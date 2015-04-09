/**
 * Created by RJ on 1/19/15.
 *
 * Class to load configurations
 */
var fs = require('fs');
var logger = require("winston");

module.exports = function Configurer() {
    var defaultDatabaseConfiguration = {
        mongodbHost: "localhost",
        mongodbPort: "27017",
        mongodbUsername: "",
        mongodbPassword: "",
        mongodbDatabase: ""
    };

    function createMongoDbUrl(properties) {
        logger.log("verbose", "creating mongodb url for properties", {"properties": properties});

        var mongodbUrl = properties.mongodbUrl;
        if (!mongodbUrl) {
            mongodbUrl = "mongodb://";
            if (properties.mongodbUsername && properties.mongodbPassword) {
                mongodbUrl += properties.mongodbUsername + ":" + properties.mongodbPassword + "@";
            }
            mongodbUrl += properties.mongodbHost + ":" + properties.mongodbPort + "/";
        }
        if (properties.mongodbDatabase) mongodbUrl += properties.mongodbDatabase;

        return mongodbUrl;
    }

    return {
        loadDefaults: function () {
            var properties = {
                mongodbHost: process.env.OPENSHIFT_MONGODB_DB_HOST || defaultDatabaseConfiguration.mongodbHost,
                mongodbPort: process.env.OPENSHIFT_MONGODB_DB_PORT || defaultDatabaseConfiguration.mongodbPort,
                mongodbUsername: process.env.OPENSHIFT_MONGODB_DB_USERNAME || defaultDatabaseConfiguration.mongodbUsername,
                mongodbPassword: process.env.OPENSHIFT_MONGODB_DB_PASSWORD || defaultDatabaseConfiguration.mongodbPassword,
                mongodbDatabase: process.env.OPENSHIFT_APP_NAME || defaultDatabaseConfiguration.mongodbDatabase,
                mongodbUrl: process.env.OPENSHIFT_MONGODB_DB_URL
            };
            properties.mongodbUrl = createMongoDbUrl(properties);

            logger.log("info", "loaded defaults for mongodb");
            return properties;
        },

        loadConfigurationFromFile: function (fileName) {
            var fileData = JSON.parse(fs.readFileSync(fileName, {encoding: 'utf-8'}));
            var properties = {
                mongodbHost: fileData.mongodbHost || "",
                mongodbPort: fileData.mongodbPort || "",
                mongodbUsername: fileData.mongodbUsername || "",
                mongodbPassword: fileData.mongodbPassword || "",
                mongodbDatabase: fileData.mongodbDatabase || ""
            };
            properties.mongodbUrl = fileData.mongodbUrl || createMongoDbUrl(properties);

            logger.log("info", "loaded from configuration file", {"filename": fileName});
            return properties;
        },

        useConfiguration: function (conf) {
            var properties = {
                mongodbHost: conf.mongodbHost || "",
                mongodbPort: conf.mongodbPort || "",
                mongodbUsername: conf.mongodbUsername || "",
                mongodbPassword: conf.mongodbPassword || "",
                mongodbDatabase: conf.mongodbDatabase || ""
            };
            properties.mongodbUrl = conf.mongodbUrl || createMongoDbUrl(properties);

            logger.log("info", "loaded from configuration", {"conf": conf});
            return properties;
        }
    };
};
