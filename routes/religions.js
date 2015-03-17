"use strict";
/**
 * Created by RJ on 3/15/15.
 *
 * Contains implementation for /religions and /religions/{name} endpoints
 */
var express = require("express");
var router = express.Router();
var Db = require("../lib/Db.js")();
var configData = require("../config/config.json")[process.env.NODE_ENV || "defaults"];

/* GET distinct list of religions. */
router.get("/", function (req, res, next) {
    var params = {
        "collection": configData.metCol,
        "field": "book.religion"
    };
    var response = {
        "religions": []
    };
    Db.distinct(params, function (err, result) {
        if (err) return next(err);
        result.forEach(function (religion) {
            response.religions.push({"name": religion});
        });
        res.send(response);
    });
});

/* Update the religion name with the new value */
router.put("/:religion", function (req, res, next) {
    var params = {
        "collection": configData.metCol,
        "query": {"book.religion": req.params.religion},
        "update": {"book.religion": req.body.name}
    };
    Db.update(params, function (err, result) {
        if (err) return next(err);
        if (result.result.nModified === 0) res.status(404).end();
        res.status(204).end();
    });
});

/* Update the religion name with the new value */
router.delete("/:religion", function (req, res, next) {
    var params = {
        "collection": configData.metCol,
        "remove": {"book.religion": req.params.religion}
    };
    Db.remove(params, function (err, result) {
        if (err) return next(err);
        if (result.result.n === 0) res.status(404).end();
        res.status(204).end();
    });
});
module.exports = router;
