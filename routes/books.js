"use strict";
/**
 * Created by RJ on 3/15/15.
 *
 * Contains implementation for /religions/:religion/books and
 * /religions/:religion/books/:bookId endpoints
 */
var express = require("express");
var logger = require("winston");
var router = express.Router({mergeParams: true});
var Db = require("../lib/Db.js")();
var configData = require("../config/config.json")[process.env.NODE_ENV || /* istanbul ignore next: this is only a safety net */ "defaults"];
var ObjectID = require("mongodb").ObjectID;

var excludedBookKeys = ["content", "bookId"];

function formatBooksArrayToResponseStructure(result) {
    return result.map(function (bookObj) {
        var newBook = {};

        newBook.bookId = bookObj._id.toString();
        logger.log("verbose", "formatting book with id", {"bookId": newBook.bookId});

        Object.keys(bookObj.book).filter(function (key) {
            return excludedBookKeys.indexOf(key) < 0;
        }).forEach(function (key) {
            newBook[key] = bookObj.book[key];
        });

        return newBook;
    });
}

function cleanReqKeysToBookAndChapterKeys(req, book, chapterBook) {
    Object.keys(req.body).forEach(function (key) {
        book[key] = JSON.parse(JSON.stringify(req.body[key]));
    });
    /* istanbul ignore else: for that is already covered */
    if (!book.toc || /* istanbul ignore next */ !book.toc.length) {
        book.toc = [""];
        logger.log("verbose", "No toc received");
    }
    book.toc.forEach(function () {
        chapterBook.chapters.push({"text": ""});
    });
}

router.param('bookId', function (req, res, next, bookId) {
    try {
        req.bookOid = new ObjectID(bookId);
        next();
    } catch (e) {
        logger.log("info", "invalid book id received", {"bookId": bookId});
        return next("route");
    }
});

/* GET all books. */
router.get("/", function (req, res, next) {
    var params = {
        "collection": configData.metCol,
        "query": {
            "book.religion": req.params.religion
        }
    };
    var response = {
        "books": []
    };

    logger.log("verbose", "...initiating db call for fetch all books");
    Db.find(params, function (err, result) {
        /* istanbul ignore if: safety net */
        if (err) return next(err);

        logger.log("info", "fetched %d number of books for fetch all books", result.length);
        response.books = formatBooksArrayToResponseStructure(result);
        res.json(response);
    });
});

/* POST a new book */
router.post("/", function (req, res, next) {
    var bookParams = {
        "collection": configData.metCol,
        "insert": {
            "book": {
                "religion": req.params.religion
            }
        }
    }
    var chaptersParams = {
        "collection": configData.conCol,
        "insert": {
            "book": {
                "chapters": []
            }
        }
    };

    cleanReqKeysToBookAndChapterKeys(req, bookParams.insert.book, chaptersParams.insert.book);
    logger.log("verbose", "parameters cleaned ...initiating db call for creating new content");

    Db.insert(chaptersParams, function (err, result) {
        /* istanbul ignore if: safety net */
        if (err) return next(err);
        /* istanbul ignore if: safety net */
        if (result.insertedCount === 0) return next(new Error("Could not insert book"));
        bookParams.insert.book.content = chaptersParams.insert._id.toString();
        logger.log("verbose", "Content successfully created ...initiating db call for creating new book", {"contentId": bookParams.insert.book.content});

        Db.insert(bookParams, function (err, result) {
            /* istanbul ignore if: safety net */
            if (err) return next(err);
            /* istanbul ignore if: safety net */
            if (result.insertedCount === 0) return next(new Error("Could not insert book"));

            var response = formatBooksArrayToResponseStructure(result.ops);
            logger.log("info", "created a new book with following data", {
                "bookId": response[0].bookId,
                "contentId": bookParams.insert.book.content
            });

            res.status(201).send(response[0]);
        });
    });
});

/* GET a specific book with id */
router.get("/:bookId", function (req, res, next) {
    var params = {
        "collection": configData.metCol,
        "query": {
            "book.religion": req.params.religion,
            "_id": req.bookOid
        }
    };
    var response = {
        "books": []
    };

    logger.log("verbose", "...initiating db call for fetching specific book", {"bookId": req.params.bookId});
    Db.find(params, function (err, result) {
        /* istanbul ignore if: safety net */
        if (err) return next(err);
        if (result.length == 0) return next();

        logger.log("info", "fetched specific book", {"bookId": req.params.bookId});
        response.books = formatBooksArrayToResponseStructure(result);
        res.json(response);
    });
});

/* PUT a specific book with id */
router.put("/:bookId", function (req, res, next) {
    var params = {
        "collection": configData.metCol,
        "query": {
            "book.religion": req.params.religion,
            "_id": req.bookOid
        },
        "update": {}
    };
    Object.keys(req.body).filter(function (key) {
        return excludedBookKeys.indexOf(key) < 0;
    }).forEach(function (key) {
        params.update["book." + key] = req.body[key];
    });

    logger.log("verbose", "parameters set ...initiating db call for updating specific book", {"bookId": req.params.bookId});
    Db.update(params, function (err, result) {
        /* istanbul ignore if: safety net */
        if (err) return next(err);
        /* istanbul ignore if: safety net */
        if (result.modifiedCount === 0) return next();

        logger.log("info", "book updated", {"bookId": req.params.bookId});
        res.status(204).end();
    });
});

/* DELETE a book */
router.delete("/:bookId", function (req, res, next) {
    var params = {
        "collection": configData.metCol,
        "remove": {
            "book.religion": req.params.religion,
            "_id": req.bookOid
        }
    };
    logger.log("verbose", "parameters set ...initiating db call for removing a book", {"bookId": req.params.bookId});
    Db.remove(params, function (err, result) {
        /* istanbul ignore if: safety net */
        if (err) return next(err);
        /* istanbul ignore if: safety net */
        if (result.deletedCount === 0) return next();

        logger.log("info", "book deleted", {"bookId": req.params.bookId});
        res.status(204).end();
    });
});

module.exports = router;
