"use strict";
/**
 * Created by RJ on 3/15/15.
 *
 * Contains implementation for /religions and /religions/:religion endpoints
 */
var express = require("express");
var router = express.Router();
var logger = require("winston");
var Db = require("../lib/Db.js")();
var configData = require("../config/config.json")[process.env.NODE_ENV] || /* istanbul ignore next: this is only for production */ require("../config/config.json")["defaults"];

console.log(configData);
/* GET distinct list of religions. */
router.get("/", function (req, res, next) {
    var params = {
        "collection": configData.metCol,
        "field": "book.religion"
    };
    var response = {
        "religions": []
    };

    logger.log("verbose", "...initiating db call for fetching distinct religions");
    Db.distinct(params, function (err, result) {
        /* istanbul ignore if: safety net */
        if (err) return next(err);
        result.forEach(function (religion) {
            response.religions.push({"name": religion});
        });

        logger.log("info", "fetched %d number of religions for fetch distinct religions", result.length);
        res.json(response);
    });
});

/* PUT all books in religion into another religion */
router.put("/:religion", function (req, res, next) {
    var params = {
        "collection": configData.metCol,
        "query": {
            "book.religion": req.params.religion
        },
        "update": {
            "book.religion": req.body.name
        }
    };

    logger.log("verbose", "parameters set ...initiating db call for updating books in religion", {"religion": req.params.religion});
    Db.update(params, function (err, result) {
        /* istanbul ignore if: safety net */
        if (err) return next(err);
        /* istanbul ignore if: safety net */
        if (result.modifiedCount === 0) return next();

        logger.log("info", "updated %d books for religion", result.modifiedCount, {"religion": req.params.religion});
        res.status(204).end();
    });
});

/* DELETE all books for a religion */
router.delete("/:religion", function (req, res, next) {
    var params = {
        "collection": configData.metCol,
        "remove": {
            "book.religion": req.params.religion
        }
    };

    logger.log("verbose", "parameters set ...initiating db call for deleting books in religion", {"religion": req.params.religion});
    Db.remove(params, function (err, result) {
        /* istanbul ignore if: safety net */
        if (err) return next(err);
        /* istanbul ignore if: safety net */
        if (result.deletedCount === 0) return next();

        logger.log("info", "deleted %d books for religion", result.deletedCount, {"religion": req.params.religion});
        res.status(204).end();
    });
});
module.exports = router;
