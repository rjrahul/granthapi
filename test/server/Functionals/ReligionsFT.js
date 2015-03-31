"use strict";
/**
 * Created by RJ on 3/15/15.
 *
 * Contains functional tests performed on /religions and /religions/:religion endpoints
 */
var request = require('supertest');
var MongoClient = require("mongodb").MongoClient;
var Configurer = require("../../../lib/Configurer.js")();
var app = require("../../../app.js");
var configData = require("../../../config/config.json")[process.env.NODE_ENV];
var expect = require("chai").expect;

describe("ReligionsFT - empty db", function () {
    this.timeout(5000);
    var dbSetup = {
        metCol: configData.metCol,
        conCol: configData.conCol,
        dbUrl: ""
    };

    before("setup functional testing for Religions - empty DB", function (done) {
        dbSetup.dbUrl = Configurer.useConfiguration(configData).mongodbUrl;
        MongoClient.connect(dbSetup.dbUrl, function (err, db) {
            if (err) return done(err);

            db.createCollection(dbSetup.metCol, function (err) {
                db.close();
                done(err);
            });
        });
    });

    after("teardown functional setup after religions - empty db", function (done) {
        MongoClient.connect(dbSetup.dbUrl, function (err, db) {
            if (err) return done(err);
            db.dropDatabase(function (err) {
                db.close();
                done(err);
            });
        });
    });

    it("should return set of distinct religions", function (done) {
        var expectedBody = {
            "religions": []
        };

        request(app)
            .get("/religions")
            .expect("Content-Type", /json/)
            .expect(200)
            .expect(expectedBody, done);
    });
});

describe("ReligionsFT", function () {
    this.timeout(5000);
    var dbSetup = {
        metCol: configData.metCol,
        conCol: configData.conCol,
        dbUrl: ""
    };

    before("setup functional testing for Religions", function (done) {
        dbSetup.dbUrl = Configurer.useConfiguration(configData).mongodbUrl;
        MongoClient.connect(dbSetup.dbUrl, function (err, db) {
            if (err) return done(err);

            db.collection(dbSetup.metCol, function (err, col) {
                col.insertMany([
                    {
                        "book": {
                            "religion": "Jain"
                        }
                    }, {
                        "book": {
                            "religion": "Jain"
                        }
                    }, {
                        "book": {
                            "religion": "Jain"
                        }
                    }, {
                        "book": {
                            "religion": "Hindu"
                        }
                    }, {
                        "book": {
                            "religion": "Hindu"
                        }
                    }
                ], function (err, result) {
                    db.close();
                    done(err);
                });
            });
        });
    });

    after("teardown functional setup after all test cases for religions", function (done) {
        MongoClient.connect(dbSetup.dbUrl, function (err, db) {
            if (err) return done(err);
            db.dropDatabase(function (err) {
                db.close();
                done(err);
            });
        });
    });

    it("should return set of distinct religions", function (done) {
        var expectedBody = {
            "religions": [
                {
                    "name": "Jain"
                },
                {
                    "name": "Hindu"
                }
            ]
        };

        request(app)
            .get("/religions")
            .expect("Content-Type", /json/)
            .expect(200)
            .expect(expectedBody, done);
    });

    it("should update all the records with new value", function (done) {
        var expectedBody = {
            "religions": [
                {
                    "name": "Jain"
                },
                {
                    "name": "Sikh"
                }
            ]
        };

        request(app)
            .put("/religions/Hindu")
            .send({"name": "Sikh"})
            .expect(204)
            .end(function (err, res) {
                if (err) return done(err);
                request(app)
                    .get("/religions")
                    .expect("Content-Type", /json/)
                    .expect(200, expectedBody, done);
            });

    });

    it("should return 404 status to put when religion not found", function (done) {
        request(app)
            .put("/religions/Hind")
            .send({"name": "Sikh"})
            .expect(404, done);
    });

    it("should remove all the records with given value", function (done) {
        request(app)
            .delete("/religions/Jain")
            .expect(204)
            .end(function (err, res) {
                if (err) return done(err);
                request(app)
                    .get("/religions")
                    .expect("Content-Type", /json/)
                    .expect(200)
                    .end(function (err, res) {
                        if (err) return done(err);
                        expect(JSON.stringify(res.body)).to.not.contain(/Jain/);
                        done();
                    });
            });
    });

    it("should return 404 status to remove when religion not found", function (done) {
        request(app)
            .delete("/religions/Hind")
            .expect(404, done);
    });

    it.skip("should not have extra http methods implemented on /religions", function (done) {
        var implementedMethods = ["get"];

        //TODO: need a way to test all HTTP methods using supertest
        done();
    });

    it.skip("should not have extra http methods implemented on /religions/Hind", function (done) {
        var implementedMethods = ["put", "delete"];

        //TODO: need a way to test all HTTP methods using supertest
        done();
    });
});