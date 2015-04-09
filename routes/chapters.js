"use strict";
/**
 * Created by RJ on 3/15/15.
 *
 * Contains implementation for /religions/:religion/books/:bookId/chapters and
 * /religions/:religion/books/:bookId/chapters/:chapterIndex endpoints
 */
var express = require("express");
var router = express.Router({mergeParams: true});
var logger = require("winston");
var Db = require("../lib/Db.js")();
var configData = require("../config/config.json")[process.env.NODE_ENV] || /* istanbul ignore next: this is only for production */ require("../config/config.json")["defaults"];
var ObjectID = require("mongodb").ObjectID;

var excludedBookKeys = ["content"];

router.use(function (req, res, next) {
    try {
        req.bookOid = new ObjectID(req.params.bookId);
        next();
    } catch (e) {
        logger.log("info", "invalid book id received", {"bookId": req.params.bookId});
        return next("route");
    }
}, function (req, res, next) {
    var bookParams = {
        "collection": configData.metCol,
        "query": {
            "book.religion": req.params.religion,
            "_id": req.bookOid
        }
    };

    logger.log("verbose", "...intitiating db call for fetching book", {"bookId": req.params.bookId});
    Db.find(bookParams, function (err, result) {
        /* istanbul ignore if: safety net */
        if (err) return next(err);
        if (result.length === 0) return next("route");

        res.books = result.map(function (bookObj) {
            var newBook = {
                "bookId": bookObj._id.toString(),
                "chapters": []
            };

            Object.keys(bookObj.book).filter(function (key) {
                return excludedBookKeys.indexOf(key) < 0;
            }).forEach(function (key) {
                newBook[key] = bookObj.book[key];
            });

            return newBook;
        });

        logger.log("info", "received book with content", {
            "bookId": req.params.bookId,
            "chaptersId": result[0].book.content
        });
        logger.log("info", result[0]);
        req.chaptersOid = new ObjectID(result[0].book.content);
        next();
    });
});

router.param("chapterIndex", function (req, res, next) {
    if (!res.books || !res.books.length || res.books[0].toc.length < req.params.chapterIndex) {
        logger.log("info", "invalid chapter index for book received", {
            "bookId": req.params.bookId,
            "chapterIndex": req.params.chapterIndex
        });

        return next("route");
    }
    next();
});

/* GET all chapters */
router.get('/', function (req, res, next) {
    var chaptersParams = {
        "collection": configData.conCol,
        "query": {
            "_id": req.chaptersOid
        }
    };
    var response = {
        "books": res.books
    };

    logger.log("verbose", "...initiating db call for fetch all chapters for book", {"bookId": req.params.bookId});
    Db.find(chaptersParams, function (err, result) {
        /* istanbul ignore if: safety net */
        if (err) return next(err);
        result[0].book.chapters.forEach(function (chapter, index) {
            var newChapter = JSON.parse(JSON.stringify(chapter));
            newChapter.chapterIndex = index + 1;
            response.books[0].chapters.push(newChapter);
        });

        logger.log("info", "fetched %d chapters for book", result[0].book.chapters.length, {"bookId": req.params.bookId});
        res.json(response);
    });
});

/* GET chapter with specific index */
router.get('/:chapterIndex', function (req, res, next) {
    var chaptersParams = {
        "collection": configData.conCol,
        "query": {
            "_id": req.chaptersOid
        },
        "project": {
            "book.chapters": {
                "$slice": [req.params.chapterIndex - 1, 1]
            }
        }
    };
    var response = {
        "books": res.books
    };

    logger.log("verbose", "...initiating db call for fetch one chapter for book", {
        "bookId": req.params.bookId,
        "chapterIndex": req.params.chapterIndex
    });

    Db.project(chaptersParams, function (err, result) {
        /* istanbul ignore if: safety net */
        if (err) return next(err);
        result[0].book.chapters.forEach(function (chapter) {
            var newChapter = JSON.parse(JSON.stringify(chapter));
            newChapter.chapterIndex = req.params.chapterIndex;
            response.books[0].chapters.push(newChapter);
        });

        logger.log("info", "fetched chapter for book", {
            "bookId": req.params.bookId,
            "chapterIndex": req.params.chapterIndex
        });
        res.json(response);
    });
});

/* PUT chapter contents on specific index */
router.put('/:chapterIndex', function (req, res, next) {
    var chaptersParams = {
        "collection": configData.conCol,
        "query": {
            "_id": req.chaptersOid
        },
        "update": {}
    };
    chaptersParams.update["book.chapters." + (req.params.chapterIndex - 1) + ".text"] = req.body.text;

    logger.log("verbose", "parameters set ...initiating db call for updating a chapter for book", {
        "bookId": req.params.bookId,
        "chapterIndex": req.params.chapterIndex
    });

    Db.update(chaptersParams, function (err, result) {
        /* istanbul ignore if: safety net */
        if (err) return next(err);
        /* istanbul ignore if: safety net */
        if (result.modifiedCount === 0) return next();

        logger.log("info", "updated chapter for book", {
            "bookId": req.params.bookId,
            "chapterIndex": req.params.chapterIndex
        });
        res.status(204).end();
    });
});

/* DELETE chapter contents on specific index and corresponding TOC */
router.delete('/:chapterIndex', function (req, res, next) {
        res.books[0].toc.splice(req.params.chapterIndex - 1, 1);
        if (res.books[0].toc.length === 0) {
            logger.log("info", "deleting last chapter of the book", {"bookId": req.params.bookId});

            res.books[0].toc = [""];
        }
        next();
    },
    function (req, res, next) {
        var bookParams = {
            "collection": configData.metCol,
            "query": {
                "book.religion": req.params.religion,
                "_id": req.bookOid
            },
            "update": {
                "book.toc": res.books[0].toc
            }
        };
        var chaptersParams = {
            "collection": configData.conCol,
            "query": {
                "_id": req.chaptersOid
            }
        };

        logger.log("verbose", "parameters set ...initiating db call for fetching all chapter before deleting", {
            "bookId": req.params.bookId,
            "chapterIndex": req.params.chapterIndex
        });

        Db.find(chaptersParams, function (err, chapters) {
            /* istanbul ignore if: safety net */
            if (err) return next(err);
            /* istanbul ignore if: safety net */
            if (chapters.length === 0) return next();
            chapters[0].book.chapters.splice(req.params.chapterIndex - 1, 1);
            if (chapters[0].book.chapters.length === 0) chapters[0].book.chapters.push({"text": ""});

            chaptersParams.update = {
                "book.chapters": chapters[0].book.chapters
            }

            logger.log("verbose", "retrieved all chapters ...initiating db call for deleting respective toc", {
                "bookId": req.params.bookId,
                "chapterIndex": req.params.chapterIndex
            });

            Db.update(bookParams, function (err, result) {
                /* istanbul ignore if: safety net */
                if (err) return next(err);
                /* istanbul ignore if: safety net */
                if (result.modifiedCount === 0) return next(new Error("Unable to perform the update"));

                logger.log("verbose", "toc list updated ...initiating db call for deleting chapter", {
                    "bookId": req.params.bookId,
                    "chapterIndex": req.params.chapterIndex
                });

                Db.update(chaptersParams, function (err, result) {
                    /* istanbul ignore if: safety net */
                    if (err) return next(err);
                    /* istanbul ignore if: safety net */
                    if (result.modifiedCount === 0) return next(new Error("Unable to perform the update"));

                    logger.log("info", "chapter removed from book", {
                        "bookId": req.params.bookId,
                        "chapterIndex": req.params.chapterIndex
                    });
                    res.status(204).end();
                });
            });
        });
    });

module.exports = router;
