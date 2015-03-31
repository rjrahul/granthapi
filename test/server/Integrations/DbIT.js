"use strict";
/**
 * Created by RJ on 1/23/15.
 *
 * Contains integration tests performed on mongo connection utility
 */
var expect = require("chai").expect;
var Db = require("../../../lib/Db.js");
var Configurer = require("../../../lib/Configurer.js")();
var fs = require("fs");
var MongoClient = require("mongodb").MongoClient;

describe("DatabaseIT", function () {
    var configDir = "./testconfig";
    var configFile = configDir + "/config.json";
    var dbSetup = {
        dbUsername: "",
        dbPassword: "",
        dbHost: "localhost",
        dbPort: "27017",
        dbName: "testsDb",
        metCol: "testsColl",
        dbUrl: ""
    };
    dbSetup.dbUrl = (Configurer.loadDefaults()).mongodbUrl + dbSetup.dbName;

    function clearDirectories() {
        fs.unlinkSync(configFile);
        fs.rmdirSync(configDir);
    }

    before("setup DbIT before all test cases", function (done) {
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir);
        }
        if (!fs.existsSync(configFile)) {
            fs.writeFileSync(configFile, JSON.stringify({
                mongodbHost: dbSetup.dbHost,
                mongodbPort: dbSetup.dbPort,
                mongodbDatabase: dbSetup.dbName
            }));
        }

        MongoClient.connect(dbSetup.dbUrl, function (err, db) {
            if (err) return done(err);

            db.collection(dbSetup.metCol, function (err, col) {
                col.insert([{a: 1, b: 1}, {a: 1, b: {c: "a"}}, {a: 2, b: 2}, {a: 3, b: {c: "b"}}, {
                    a: 4,
                    b: {c: "c"}
                }, {a: 5, b: ["1", "2", "3"]}]);
                db.close();
                done();
            });
        });
    });

    after("teardown DbIT after all test cases", function (done) {
        clearDirectories();

        MongoClient.connect(dbSetup.dbUrl, function (err, db) {
            if (err) return done(err);
            db.dropDatabase(function (err) {
                if (err) return done(err);
                db.close();
                done();
            });
        });
    });

    describe.skip("#initialize", function () {
        describe.skip("load db configuration from default file location ../config/config.json", function () {
            var oldFileData, dirCreated = false;
            var defaultFileDir = "../config";
            var defaultFileLocation = defaultFileDir + "/config.json";
            before("setup config directory", function () {
                var configFile = JSON.stringify({
                    mongodbHost: "defaultFileHost",
                    mongodbPort: "27017"
                });
                if (fs.existsSync(defaultFileDir)) {
                    if (fs.existsSync(defaultFileDir + defaultFileLocation)) {
                        oldFileData = fs.readFileSync(defaultFileLocation);
                    }
                } else {
                    fs.mkdirSync(defaultFileDir);
                    dirCreated = true;
                }
                fs.writeFileSync(defaultFileLocation, configFile);
            });

            after("clean up config directory", function () {
                if (oldFileData) {
                    fs.writeFileSync(defaultFileLocation, oldFileData);
                } else {
                    fs.unlinkSync(defaultFileLocation);
                    if (dirCreated) fs.rmdirSync(defaultFileDir);
                }
            });

            it("should load db configuration from default file path with a valid mongodbUrl property", function () {
                var db = new Db();
                expect(db.configuration).to.be.ok;
                expect(db.configuration).to.have.a.property("mongodbUrl", "mongodb://defaultFileHost:27017/");
            });

        });

        it("should load db configuration from defaults with a valid mongodbUrl property", function () {
            var db = new Db();
            expect(db.configuration).to.be.ok;
            expect(db.configuration).to.have.a.property("mongodbUrl", "mongodb://localhost:27017/");
        });

        it("should load db configuration from passed file path with a valid mongodbUrl property", function () {
            var db = new Db(configFile);
            expect(db.configuration).to.be.ok;
            expect(db.configuration).to.have.a.property("mongodbUrl", "mongodb://localhost:27017/" + dbSetup.dbName);
        });

        it("should load db configuration from passed file path with a valid mongodbUrl property", function () {
            var db = new Db();
            db.initialize(configFile);
            expect(db.configuration).to.be.ok;
            expect(db.configuration).to.have.a.property("mongodbUrl", "mongodb://localhost:27017/");
        });
    });

    describe.skip("#connectMongo", function () {
        var invalidConfigFile = configDir + "/testconfig.json";
        before("setup config directory", function () {
            fs.writeFileSync(invalidConfigFile, JSON.stringify({
                mongodbHost: "confighost",
                mongodbPort: "27017",
                mongodbDatabase: "granth"
            }));
        });

        after("clean up config directory", function () {
            fs.unlinkSync(invalidConfigFile);
        });

        it.skip("should throw error on unavailable mongo instance", function (done) {
            this.timeout(5000);
            var db = new Db(invalidConfigFile);
            db.connectMongo(null, function (err, db) {
                expect(err).to.be.ok;
                expect(db).to.be.not.ok;
                done();
            });
        });

        it.skip("should have a valid db instance of mongo", function (done) {
            var db = new Db(invalidConfigFile);
            db.connectMongo(function (err, db) {
                expect(err).to.be.not.ok;
                expect(db).to.be.ok;
                done();
            })
        });

        it("should throw error on unavailable mongo collection", function (done) {
            this.timeout(5000);
            var db = new Db(configFile);
            var params = {
                "collection": "nocollection"
            };
            db.connectMongo(params, function (err, db, collection) {
                expect(err).to.be.ok;
                expect(collection).to.be.not.ok;
                db.close();
                done();
            });
        });

        it("should have a valid collection instance of mongo", function (done) {
            var db = new Db(configFile);
            var params = {
                "collection": dbSetup.metCol
            };
            db.connectMongo(params, function (err, db, collection) {
                expect(err).to.be.not.ok;
                expect(collection).to.be.ok;
                db.close();
                done();
            })
        });

    });

    describe("#distinct", function () {
        it("should return distinct values from collection", function (done) {
            this.timeout(4000);
            var db = new Db(configFile);
            var params = {
                "collection": dbSetup.metCol,
                "field": "a"
            };
            db.distinct(params, function (err, result) {
                expect(err).to.be.not.ok;
                expect(result).to.deep.equal([1, 2, 3, 4, 5]);
                done();
            });
        });

        it("should return distinct values for nested field from collection", function (done) {
            var db = new Db(configFile);
            var params = {
                "collection": dbSetup.metCol,
                "field": "b.c"
            };
            db.distinct(params, function (err, result) {
                expect(err).to.be.not.ok;
                expect(result).to.deep.equal(["a", "b", "c"]);
                done();
            });
        });

        it("should return error for invalid collection", function (done) {
            var db = new Db(configFile);
            var params = {
                "collection": "invalid",
                "field": "b.c"
            };
            db.distinct(params, function (err, result) {
                expect(err).to.be.ok;
                expect(result).to.be.not.ok;
                done();
            });
        });
    });

    describe("#find", function () {
        it("should return all documents from database", function (done) {
            var db = new Db(configFile);
            var params = {
                "collection": dbSetup.metCol
            };
            db.find(params, function (err, result) {
                expect(err).to.be.not.ok;
                expect(result).to.have.length.of.at.least(5);
                done();
            });
        });

        it("should return documents from database for a query on top field", function (done) {
            var db = new Db(configFile);
            var params = {
                "collection": dbSetup.metCol,
                "query": {
                    "a": 1
                }
            };
            db.find(params, function (err, result) {
                expect(err).to.be.not.ok;
                expect(result).to.have.length(2);
                result.forEach(function (doc) {
                    expect(doc).to.have.a.property("a", 1);
                });
                done();
            });
        });

        it("should return documents from database for a query on nested fields", function (done) {
            var db = new Db(configFile);
            var params = {
                "collection": dbSetup.metCol,
                "query": {
                    "b.c": "b"
                }
            };
            db.find(params, function (err, result) {
                expect(err).to.be.not.ok;
                expect(result).to.have.length.of.at.least(1);
                result.forEach(function (doc) {
                    expect(doc).to.have.a.deep.property("b.c", "b");
                });
                done();
            });
        });

        it("should return error for invalid collection", function (done) {
            var db = new Db(configFile);
            var params = {
                "collection": "invalid",
                "query": {
                    "b.c": "b"
                }
            };
            db.find(params, function (err, result) {
                expect(err).to.be.ok;
                expect(result).to.be.not.ok;
                done();
            });
        });
    });

    describe("#project", function () {
        it("should execute projection on the documents after search from database", function (done) {
            var db = new Db(configFile);
            var params = {
                "collection": dbSetup.metCol,
                "query": {
                    "a": 5
                },
                "project": {
                    "b": {
                        "$slice": [1, 1]
                    }
                }
            };
            db.project(params, function (err, result) {
                expect(err).to.be.not.ok;
                expect(result).to.have.length.of.at.least(1);
                result.forEach(function (doc) {
                    expect(doc).to.have.a.property("a", 5);
                    expect(doc).to.have.a.deep.property("b[0]", '2');
                });
                done();
            });
        });

        it("should return error for invalid collection", function (done) {
            var db = new Db(configFile);
            var params = {
                "collection": "invalid",
                "query": {
                    "a": 5
                },
                "project": {
                    "b": {
                        "$slice": [1, 1]
                    }
                }
            };
            db.project(params, function (err, result) {
                expect(err).to.be.ok;
                expect(result).to.be.not.ok;
                done();
            });
        });
    });

    describe("#post", function () {
        it("should add a new document to database", function (done) {
            var db = new Db(configFile);
            var params = {
                "collection": dbSetup.metCol,
                "insert": {
                    "a": 6,
                    "b": {
                        "c": "d"
                    }
                }
            };
            db.find(params, function (err, result) {
                var initialRecordCount = result.length;
                db.insert(params, function (err, result) {
                    expect(err).to.be.not.ok;
                    expect(result).to.be.ok;
                    db.find(params, function (err, result) {
                        expect(result.length).to.equal(initialRecordCount + 1);
                        params.query = {"b.c": "d"};
                        db.find(params, function (err, result) {
                            expect(result).to.have.length(1);
                            result.forEach(function (doc) {
                                expect(doc).to.have.a.deep.property("b.c", "d");
                            });
                            done();
                        });
                    });
                });
            });
        });

        it("should return error for invalid collection", function (done) {
            var db = new Db(configFile);
            var params = {
                "collection": "invalid",
                "insert": {
                    "a": 6,
                    "b": {
                        "c": "d"
                    }
                }
            };
            db.insert(params, function (err, result) {
                expect(err).to.be.ok;
                expect(result).to.be.not.ok;
                done();
            });
        });
    });

    describe("#put", function () {
        it("should update the document in database", function (done) {
            var db = new Db(configFile);
            var params = {
                "collection": dbSetup.metCol,
                "insert": {
                    "a": 7,
                    "b": {
                        "c": "e"
                    }
                },
                "update": {
                    "b": {
                        "c": "f"
                    }
                },
                "query": {
                    "a": 7
                }
            };
            db.insert(params, function (err, result) {
                expect(err).to.be.not.ok;
                expect(result).to.be.ok;
                db.update(params, function (err, result) {
                    expect(err).to.be.not.ok;
                    expect(result).to.be.ok;
                    db.find(params, function (err, result) {
                        expect(result).to.have.length(1);
                        result.forEach(function (doc) {
                            expect(doc).to.have.a.deep.property("b.c", "f");
                        });
                        done();
                    });
                });
            });
        });

        it("should return error for invalid collection", function (done) {
            var db = new Db(configFile);
            var params = {
                "collection": "invalid",
                "update": {
                    "b": {
                        "c": "f"
                    }
                },
                "query": {
                    "a": 7
                }
            };
            db.update(params, function (err, result) {
                expect(err).to.be.ok;
                expect(result).to.be.not.ok;
                done();
            });
        });
    });

    describe("#remove", function () {
        it("should remove the document from database", function (done) {
            var db = new Db(configFile);
            var params = {
                "collection": dbSetup.metCol,
                "insert": {
                    "a": 8,
                    "b": {
                        "c": "g"
                    }
                },
                "remove": {
                    "b": {
                        "c": "g"
                    }
                }
            };
            db.find(params, function (err, result) {
                var initialRecordCount = result.length;
                db.insert(params, function (err, result) {
                    expect(err).to.be.not.ok;
                    expect(result).to.be.ok;
                    db.remove(params, function (err, result) {
                        expect(err).to.be.not.ok;
                        expect(result).to.be.ok;
                        db.find(params, function (err, result) {
                            expect(result.length).to.equal(initialRecordCount);
                            done();
                        });
                    });
                });
            });
        });

        it("should return error for invalid collection", function (done) {
            var db = new Db(configFile);
            var params = {
                "collection": "invalid",
                "remove": {
                    "b": {
                        "c": "g"
                    }
                }
            };
            db.remove(params, function (err, result) {
                expect(err).to.be.ok;
                expect(result).to.be.not.ok;
                done();
            });
        });
    });

    describe("error conditions on incorrect db", function () {
        var configDir = "./testc";
        var configFile = configDir + "/testconfig.json";
        before("setup config directory", function () {
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir);
            }
            if (!fs.existsSync(configFile)) {
                fs.writeFileSync(configFile, JSON.stringify({
                    mongodbHost: "localhost",
                    mongodbPort: "27017",
                    mongodbUsername: "invalid",
                    mongodbPassword: "invalid"
                }));
            }
        });

        after("clean up config directory", function () {
            fs.unlinkSync(configFile);
            fs.rmdirSync(configDir);
        });

        it("should throw error on distinct for no databasen", function (done) {
            var db = new Db(configFile);
            var params = {
                "collection": dbSetup.metCol,
                "field": "b.c"
            };
            db.distinct(params, function (err, result) {
                expect(err).to.be.ok;
                expect(result).to.be.not.ok;
                done();
            });
        });

        it("should throw error on find for no database", function (done) {
            var db = new Db(configFile);
            var params = {
                "collection": dbSetup.metCol,
                "query": {
                    "a": 5
                },
                "project": {
                    "b": {
                        "$slice": [1, 1]
                    }
                }
            };
            db.find(params, function (err, result) {
                expect(err).to.be.ok;
                expect(result).to.be.not.ok;
                done();
            });
        });

        it("should throw error on project for no database", function (done) {
            var db = new Db(configFile);
            var params = {
                "collection": dbSetup.metCol,
                "query": {
                    "a": 5
                },
                "project": {
                    "b": {
                        "$slice": [1, 1]
                    }
                }
            };
            db.project(params, function (err, result) {
                expect(err).to.be.ok;
                expect(result).to.be.not.ok;
                done();
            });
        });

        it("should throw error on insert for no database", function (done) {
            var db = new Db(configFile);
            var params = {
                "collection": dbSetup.metCol,
                "insert": {
                    "a": 6,
                    "b": {
                        "c": "d"
                    }
                }
            };
            db.insert(params, function (err, result) {
                expect(err).to.be.ok;
                expect(result).to.be.not.ok;
                done();
            });
        });

        it("should throw error on update for no database", function (done) {
            var db = new Db(configFile);
            var params = {
                "collection": dbSetup.metCol,
                "update": {
                    "b": {
                        "c": "f"
                    }
                },
                "query": {
                    "a": 7
                }
            };
            db.update(params, function (err, result) {
                expect(err).to.be.ok;
                expect(result).to.be.not.ok;
                done();
            });
        });

        it("should throw error on remove for no database", function (done) {
            var db = new Db(configFile);
            var params = {
                "collection": dbSetup.metCol,
                "remove": {
                    "b": {
                        "c": "g"
                    }
                }
            };
            db.remove(params, function (err, result) {
                expect(err).to.be.ok;
                expect(result).to.be.not.ok;
                done();
            });
        });
    });
});