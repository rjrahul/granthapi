"use strict";
/**
 * Created by RJ on 1/19/15.
 *
 * Contains integration tests performed on configuration loader
 */
var expect = require("chai").expect;
var Configurer = require("../../../lib/Configurer.js")();

describe("ConfigurationUT", function () {
    describe.skip("#createMongoDbUrl", function () {
        it("should create mongoDbUrl without username and password", function () {
            var mongoDbUrl = Configurer.createMongoDbUrl({
                "mongodbHost": "localhost",
                "mongodbPort": "27017"
            });
            expect(mongoDbUrl).to.equal("mongodb://localhost:27017/");
        });

        it("should create mongoDbUrl with username and password when password is null", function () {
            var mongoDbUrl = Configurer.createMongoDbUrl({
                "mongodbHost": "localhost",
                "mongodbPort": "27017",
                "mongodbUsername": "test"
            });
            expect(mongoDbUrl).to.equal("mongodb://localhost:27017/");
        });

        it("should create mongoDbUrl with username and password when user is null", function () {
            var mongoDbUrl = Configurer.createMongoDbUrl({
                "mongodbHost": "localhost",
                "mongodbPort": "27017",
                "mongodbPassword": "test"
            });
            expect(mongoDbUrl).to.equal("mongodb://localhost:27017/");
        });

        it("should create mongoDbUrl with username and password", function () {
            var mongoDbUrl = Configurer.createMongoDbUrl({
                "mongodbHost": "localhost",
                "mongodbPort": "27017",
                "mongodbUsername": "test",
                "mongodbPassword": "test"
            });
            expect(mongoDbUrl).to.equal("mongodb://test:test@localhost:27017/");
        });

        it("should create mongoDbUrl with username and password", function () {
            var mongoDbUrl = Configurer.createMongoDbUrl({
                "mongodbHost": "localhost",
                "mongodbPort": "27017",
                "mongodbUsername": "test",
                "mongodbPassword": "test",
                "mongodbDatabase": "granth"
            });
            expect(mongoDbUrl).to.equal("mongodb://test:test@localhost:27017/granth");
        })
    });

    describe("#loadDefaults()", function () {
        describe("Load defaults", function () {
            it("should have valid default mongodb properties", function () {
                var configuration = Configurer.loadDefaults();
                expect(configuration).to.be.ok;
                expect(configuration).to.have.a.property("mongodbHost", "localhost");
                expect(configuration).to.have.a.property("mongodbPort", "27017");
                expect(configuration).to.have.a.property("mongodbUsername", "");
                expect(configuration).to.have.a.property("mongodbPassword", "");
                expect(configuration).to.have.a.property("mongodbDatabase", "");
                expect(configuration).to.have.a.property("mongodbUrl", "mongodb://localhost:27017/");
            });
        });

        describe.skip("Load from process environment", function () {
            var oldValue = '';
            before("setup process variables", function () {
                if (process.env.OPENSHIFT_APP_NAME) {
                    oldValue = process.env.OPENSHIFT_APP_NAME;
                }
                process.env.OPENSHIFT_APP_NAME = "granths";
            });

            after("clean up process variable", function () {
                process.env.OPENSHIFT_APP_NAME = oldValue;
            });

            it("should have properties from process env", function () {
                var configuration = Configurer.loadDefaults();
                expect(configuration).to.be.ok;
                expect(configuration).to.have.a.property("mongodbUrl", "mongodb://localhost:27017/granths");
            });
        });

    });

    describe("#useConfiguration()", function () {
        describe("Create configuration from passed values", function () {
            it("should have valid default mongodb properties", function () {
                var conf = {
                    "mongodbHost": "localhost",
                    "mongodbPort": "27017"
                };
                var configuration = Configurer.useConfiguration(conf);
                expect(configuration).to.be.ok;
                expect(configuration).to.have.a.property("mongodbHost", "localhost");
                expect(configuration).to.have.a.property("mongodbPort", "27017");
                expect(configuration).to.have.a.property("mongodbUsername", "");
                expect(configuration).to.have.a.property("mongodbPassword", "");
                expect(configuration).to.have.a.property("mongodbDatabase", "");
                expect(configuration).to.have.a.property("mongodbUrl", "mongodb://localhost:27017/");
            });

            it("should have mongodb properties populated with a URL formed (invalid URL)", function () {
                var conf = {
                    "mongodbUsername": "user",
                    "mongodbPassword": "password",
                    "mongodbDatabase": "db"
                };
                var configuration = Configurer.useConfiguration(conf);
                expect(configuration).to.be.ok;
                expect(configuration).to.have.a.property("mongodbHost", "");
                expect(configuration).to.have.a.property("mongodbPort", "");
                expect(configuration).to.have.a.property("mongodbUsername", "user");
                expect(configuration).to.have.a.property("mongodbPassword", "password");
                expect(configuration).to.have.a.property("mongodbDatabase", "db");
                expect(configuration).to.have.a.property("mongodbUrl", "mongodb://user:password@:/db");
            });
        });
    });
});
