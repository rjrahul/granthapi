"use strict";
/**
 * Created by RJ on 1/23/15.
 *
 * Class to perform operations on database ...
 */
var Configurer = require("./Configurer.js")();
var MongoClient = require("mongodb").MongoClient;
var logger = require("winston");
var config = require("../config/config.json")[process.env.NODE_ENV];

module.exports = function Db(configFileName) {
    var initialized = false;
    var configuration = Configurer.loadDefaults();

    /* istanbul ignore else */
    if (!initialized) {
        logger.log("info", "initializing db", {"configFileName": configFileName});

        if (configFileName) {
            configuration = Configurer.loadConfigurationFromFile(configFileName);
        } else /* istanbul ignore else: for it cannot be defined */ if (config) {
            configuration = Configurer.useConfiguration(config);
        }

        initialized = !initialized;
    }

    function connectMongo(params, callback) {
        MongoClient.connect(configuration.mongodbUrl, function (err, db) {
            if (err) return callback(err);
            else {
                logger.log("verbose", "connected to mongo");

                db.collection(params.collection, {"strict": true}, function (err, collection) {
                    logger.log("verbose", "found collection", {
                        "mongoDb": params.mongodbUrl,
                        "collection": params.collection
                    });
                    callback(err, db, collection);
                });
            }
        });
    }

    return {
        distinct: function (params, callback) {
            connectMongo(params, function (err, db, collection) {
                if (err) {
                    if (db) db.close();
                    return callback(err);
                }

                logger.log("verbose", "fetching distinct for params", {"params": params});

                collection.distinct(params.field, function (err, result) {
                    logger.log("info", "distinct finished ...initiating callback");

                    db.close();
                    callback(err, result);
                });
            });
        },

        find: function (params, callback) {
            connectMongo(params, function (err, db, collection) {
                if (err) {
                    if (db) db.close();
                    return callback(err);
                }

                logger.log("verbose", "performing find for params", {"params": params});

                collection.find(params.query).toArray(function (err, docs) {
                    logger.log("info", "find finished ...initiating callback");

                    db.close();
                    callback(err, docs);
                });
            });
        },

        project: function (params, callback) {
            connectMongo(params, function (err, db, collection) {
                if (err) {
                    if (db) db.close();
                    return callback(err);
                }

                logger.log("verbose", "performing project for params", {"params": params});

                collection.find(params.query, function (err, cursor) {
                    /* istanbul ignore if */
                    if (err) {
                        db.close();
                        return callback(err);
                    }
                    cursor.project(params.project).toArray(function (err, docs) {
                        logger.log("info", "project finished ...initiating callback");

                        db.close();
                        callback(err, docs);
                    });
                });
            });
        },

        insert: function (params, callback) {
            connectMongo(params, function (err, db, collection) {
                if (err) {
                    if (db) db.close();
                    return callback(err);
                }

                logger.log("verbose", "performing insert for params", {"params": params});

                collection.insertOne(params.insert, function (err, result) {
                    logger.log("info", "insert finished ...initiating callback");

                    db.close();
                    callback(err, result);
                });
            });
        },

        update: function (params, callback) {
            connectMongo(params, function (err, db, collection) {
                if (err) {
                    if (db) db.close();
                    return callback(err);
                }

                logger.log("verbose", "performing update for params", {"params": params});

                collection.updateMany(params.query, {"$set": params.update}, function (err, result) {
                    logger.log("info", "update finished ...initiating callback");

                    db.close();
                    callback(err, result);
                });
            });
        },

        remove: function (params, callback) {
            connectMongo(params, function (err, db, collection) {
                if (err) {
                    if (db) db.close();
                    return callback(err);
                }

                logger.log("verbose", "performing delete for params", {"params": params});

                collection.deleteMany(params.remove, function (err, result) {
                    logger.log("info", "remove finished ...initiating callback");

                    db.close();
                    callback(err, result);
                });
            });
        }
    };
};