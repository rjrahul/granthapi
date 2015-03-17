"use strict";
/**
 * Created by RJ on 1/23/15.
 *
 * Class to perform operations on database ...
 */
var Configurer = require("./Configurer.js")();
var MongoClient = require("mongodb").MongoClient;
var config = require("../config/config.json")[process.env.NODE_ENV];

module.exports = function Db(configFileName) {
    var initialized = false;
    var configuration = {};

    if (!initialized) {
        if (configFileName) {
            configuration = Configurer.loadConfigurationFromFile(configFileName);
        } else {
            if (config) {
                configuration = Configurer.useConfiguration(config);
            } else {
                configuration = Configurer.loadDefaults();
            }
        }

        initialized = !initialized;
    }

    function connectMongo(params, callback) {
        MongoClient.connect(configuration.mongodbUrl, function (err, db) {
            if (err) return callback(err);
            else {
                db.collection(params.collection, {"strict": true}, function (err, collection) {
                    if (err) return callback(err, db);
                    else {
                        callback(err, db, collection);
                    }
                });
            }
        });
    }

    return {
        distinct: function (params, callback) {
            connectMongo(params, function (err, db, collection) {
                if (err) {
                    db.close();
                    return callback(err);
                }
                collection.distinct(params.field, function (err, result) {
                    db.close();
                    callback(err, result);
                });
            });
        },

        find: function (params, callback) {
            connectMongo(params, function (err, db, collection) {
                if (err) {
                    db.close();
                    return callback(err);
                }
                collection.find(params.query).toArray(function (err, docs) {
                    db.close();
                    callback(err, docs);
                });
            });
        },

        insert: function (params, callback) {
            connectMongo(params, function (err, db, collection) {
                if (err) {
                    db.close();
                    return callback(err);
                }
                collection.insertOne(params.insert, function (err, result) {
                    db.close();
                    callback(err, result);
                });
            });
        },

        update: function (params, callback) {
            connectMongo(params, function (err, db, collection) {
                if (err) {
                    db.close();
                    return callback(err);
                }
                collection.updateMany(params.query, {"$set": params.update}, function (err, result) {
                    db.close();
                    callback(err, result);
                });
            });
        },

        remove: function (params, callback) {
            connectMongo(params, function (err, db, collection) {
                if (err) {
                    db.close();
                    return callback(err);
                }
                collection.deleteMany(params.remove, function (err, result) {
                    db.close();
                    callback(err, result);
                });
            });
        }
    };
};