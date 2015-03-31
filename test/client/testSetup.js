"use strict";
/**
 * Created by RJ on 3/27/15.
 *
 * Contains test setup for running browser based tests
 */
var express = require("express");
var router = express.Router({mergeParams: true});
var MongoClient = require("mongodb").MongoClient;
var ObjectID = require("mongodb").ObjectID;
var configData = require("../../config/config.json")[process.env.NODE_ENV];
var Configurer = require("../../lib/Configurer.js")();

var dbSetup = {
    metCol: configData.metCol,
    conCol: configData.conCol,
    dbUrl: ""
};

router.get("/", function (req, res, next) {
    var books = [
        {
            "book": {
                "religion": "Jain",
                "title": "Title 1",
                "author": "Author 1",
                "pages": "10",
                "language": "hi",
                "published": "2015-03-16",
                "toc": [
                    "First chapter",
                    "Second chapter"
                ],
                "content": ""
            }
        }, {
            "book": {
                "religion": "Jain",
                "title": "Title 2",
                "author": "Author @",
                "pages": "12",
                "language": "hi",
                "published": "2015-03-16",
                "toc": [
                    "First chap",
                    "Second chap"
                ],
                "content": ""
            }
        }, {
            "book": {
                "religion": "Jain",
                "title": "Title 3",
                "author": "Author 3",
                "pages": "14",
                "language": "hi",
                "published": "2015-03-16",
                "toc": [
                    "Chapter One",
                    "Chapter Two"
                ],
                "content": ""
            }
        }, {
            "book": {
                "religion": "Hindu",
                "title": "Title 4",
                "author": "Author 4",
                "pages": "16",
                "language": "hi",
                "published": "2015-03-16",
                "toc": [
                    "First chapter",
                    "Second chapter"
                ],
                "content": ""
            }
        }, {
            "book": {
                "religion": "Hindu",
                "title": "Title 5",
                "author": "Author 5",
                "pages": "18",
                "language": "hi",
                "published": "2015-03-16",
                "toc": [
                    "Chapter One",
                    "Chapter Two"
                ],
                "content": ""
            }
        }
    ];
    var chapters = [
        {
            "book": {
                "chapters": [
                    {
                        "text": "This is first chapter text"
                    },
                    {
                        "text": "This is second chapter text"
                    }
                ]
            }
        },
        {
            "book": {
                "chapters": [
                    {
                        "text": "This is first chap text"
                    },
                    {
                        "text": "This is second chap text"
                    }
                ]
            }
        },
        {
            "book": {
                "chapters": [
                    {
                        "text": "This is chapter One text"
                    },
                    {
                        "text": "This is chapter two text"
                    }
                ]
            }
        },
        {
            "book": {
                "chapters": [
                    {
                        "text": "This is first chapter text"
                    },
                    {
                        "text": "This is second chapter text"
                    }
                ]
            }
        },
        {
            "book": {
                "chapters": [
                    {
                        "text": "This is chapter one text"
                    },
                    {
                        "text": "This is chapter two text"
                    }
                ]
            }
        }
    ];

    dbSetup.dbUrl = Configurer.useConfiguration(configData).mongodbUrl;
    MongoClient.connect(dbSetup.dbUrl, function (err, db) {
        if (err) return next(err);

        db.collection(dbSetup.conCol, function (err, col) {
            if (err) {
                db.close();
                return next(err);
            }
            col.insertMany(chapters, function (err) {
                if (err) {
                    db.close();
                    return next(err);
                }

                books.forEach(function (obj, index) {
                    obj.book.content = chapters[index]._id.toString();
                });

                db.collection(dbSetup.metCol, function (err, col) {
                    if (err) {
                        db.close();
                        return next(err);
                    }
                    col.insertMany(books, function (err) {
                        db.close();
                        if (err) return next(err);
                        res.end();
                    });
                });
            });
        });
    });
});

router.get("/empty", function (req, res, next) {
    dbSetup.dbUrl = Configurer.useConfiguration(configData).mongodbUrl;
    MongoClient.connect(dbSetup.dbUrl, function (err, db) {
        if (err) return next(err);

        db.createCollection(dbSetup.conCol, function (err, col) {
            if (err) {
                db.close();
                return next(err);
            }
            db.createCollection(dbSetup.metCol, function (err, col) {
                if (err) {
                    db.close();
                    return next(err);
                }
                res.end();
            });
        });
    });
});

router.get("/teardown", function (req, res, next) {
    MongoClient.connect(dbSetup.dbUrl, function (err, db) {
        if (err) return next(err);
        db.dropDatabase(function (err) {
            db.close();
            if (err) return next(err);
            res.end();
        });
    });
});

module.exports = router;