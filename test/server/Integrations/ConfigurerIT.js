"use strict";
/**
 * Created by RJ on 1/19/15.
 *
 * Contains unit tests performed on configuration loader
 */
var expect = require("chai").expect;
var Configurer = require("../../../lib/Configurer.js")();
var fs = require("fs");

describe("ConfigurationIT", function () {
    describe("#loadConfigurationFromFile - load valids", function () {
        var configDir = "./testconfig";
        var configFile = configDir + "/testconfig.json";
        before("setup config directory", function () {
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir);
            }
            if (!fs.existsSync(configFile)) {
                fs.writeFileSync(configFile, JSON.stringify({
                    mongodbHost: "localhost",
                    mongodbPort: "27017"
                }));
            }
        });

        after("clean up config directory", function () {
            fs.unlinkSync(configFile);
            fs.rmdirSync(configDir);
        });

        it("should throw error on no file present", function () {
            expect(function () {
                Configurer.loadConfigurationFromFile("./config/noconfig.json");
            }).to.throw(/no such file or directory/);
        });

        it("should not throw error on reading valid config file", function () {
            expect(function () {
                Configurer.loadConfigurationFromFile(configFile);
            }).to.not.throw(Error);
        });

        it("should return mongoHost, mongoPort and mongoDb property", function () {
            var configuration = Configurer.loadConfigurationFromFile(configFile);
            expect(configuration).to.have.a.property("mongodbHost", "localhost");
            expect(configuration).to.have.a.property("mongodbPort", "27017");
            expect(configuration).to.have.a.property("mongodbUrl", "mongodb://localhost:27017/");
        });
    });

    describe("#loadConfigurationFromFile - to cover statements", function () {
        var configDir = "./testconfig";
        var configFile = configDir + "/testconfig.json";
        before("setup config directory", function () {
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir);
            }
            if (!fs.existsSync(configFile)) {
                fs.writeFileSync(configFile, JSON.stringify({
                    mongodbUsername: "user",
                    mongodbPassword: "password"
                }));
            }
        });

        after("clean up config directory", function () {
            fs.unlinkSync(configFile);
            fs.rmdirSync(configDir);
        });

        it("should return mongoHost, mongoPort and mongoDb property", function () {
            var configuration = Configurer.loadConfigurationFromFile(configFile);
            expect(configuration).to.have.a.property("mongodbUsername", "user");
            expect(configuration).to.have.a.property("mongodbPassword", "password");
            expect(configuration).to.have.a.property("mongodbUrl", "mongodb://user:password@:/");
        });
    });
});