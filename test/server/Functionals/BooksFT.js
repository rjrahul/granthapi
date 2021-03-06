"use strict";
/**
 * Created by RJ on 3/16/15.
 *
 * Contains functional tests performed on /religions/:religion/books
 * and /religions/:religion/books/:bookId endpoints
 */
var request = require('supertest');
var MongoClient = require("mongodb").MongoClient;
var Configurer = require("../../../lib/Configurer.js")();
var app = require("../../../app.js");
var configData = require("../../../config/config.json")[process.env.NODE_ENV];
var expect = require("chai").expect;

describe("BooksFT", function () {
    this.timeout(5000);
    var dbSetup = {
        metCol: configData.metCol,
        conCol: configData.conCol,
        dbUrl: ""
    };

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
                "content": "contId1"
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
                    "First chapter",
                    "Second chapter"
                ],
                "content": "contId2"
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
                    "First chapter",
                    "Second chapter"
                ],
                "content": "contId3"
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
                "content": "contId4"
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
                    "First chapter",
                    "Second chapter"
                ],
                "content": "contId5"
            }
        }
    ];

    before("setup functional testing for Books", function (done) {
        dbSetup.dbUrl = Configurer.useConfiguration(configData).mongodbUrl;
        MongoClient.connect(dbSetup.dbUrl, function (err, db) {
            if (err) return done(err);

            db.createCollection(dbSetup.conCol, function (err, col) {
                if (err) return done(err);
                db.collection(dbSetup.metCol, function (err, col) {
                    col.insertMany(books, function (err, result) {
                        db.close();
                        done(err);
                    });
                });
            })
        });
    });

    after("teardown functional setup after all test cases for books", function (done) {
        MongoClient.connect(dbSetup.dbUrl, function (err, db) {
            if (err) return done(err);
            db.dropDatabase(function (err) {
                if (err) return done(err);
                db.close();
                done();
            });
        });
    });

    it("should return all titles in the given religion without the content 1", function (done) {
        var requestReligion = "Jain";
        var expectedResponse = {
            "books": []
        };

        expectedResponse.books = books.filter(function (book) {
            return (book.book.religion === requestReligion);
        }).map(function (book) {
            var newBook = {};
            newBook.bookId = book._id.toString();
            Object.keys(book.book).forEach(function (key) {
                if (key !== 'content') newBook[key] = book.book[key];
            });
            return newBook;
        });

        request(app)
            .get("/religions/" + requestReligion + "/books")
            .expect("Content-Type", /json/)
            .expect(200)
            .expect(expectedResponse, done);
    });

    it("should return all titles in the given religion without the content 2", function (done) {
        var requestReligion = "Hindu";
        var expectedResponse = {
            "books": []
        };

        expectedResponse.books = books.filter(function (book) {
            return (book.book.religion === requestReligion);
        }).map(function (book) {
            var newBook = {};
            newBook.bookId = book._id.toString();
            Object.keys(book.book).forEach(function (key) {
                if (key !== 'content') newBook[key] = book.book[key];
            });
            return newBook;
        });


        request(app)
            .get("/religions/" + requestReligion + "/books")
            .expect("Content-Type", /json/)
            .expect(200)
            .expect(expectedResponse, done);
    });

    it("should create a new title with supplied attributes with one default chapter having no content", function (done) {
        var book = {
            "title": "Title 6",
            "author": "Author 6",
            "pages": "20",
            "language": "hi",
            "published": "2015-03-17"
        };

        //TODO: This will let any extra properties to pass. Need to stop that from happening. Figure out way for doing schema validation.
        request(app)
            .post("/religions/Hindu/books")
            .send(book)
            .expect(201)
            .end(function (err, res) {
                if (err) return done(err);
                expect(res.body).to.be.ok;
                Object.keys(book).forEach(function (key) {
                    expect(res.body).to.have.a.property(key, book[key]);
                });
                expect(res.body).to.have.a.property("bookId");
                expect(res.body).to.have.a.property("religion", "Hindu");
                expect(res.body).to.have.a.property("toc").that.is.an("array").with.deep.property("[0]").to.equal("");

                var expectedChapterResponse = {
                    "books": [JSON.parse(JSON.stringify(book))]
                };
                expectedChapterResponse.books[0].bookId = res.body.bookId;
                expectedChapterResponse.books[0].toc = res.body.toc;
                expectedChapterResponse.books[0].religion = res.body.religion;
                expectedChapterResponse.books[0].chapters = [
                    {
                        "chapterIndex": 1,
                        "text": ""
                    }
                ];

                request(app)
                    .get("/religions/Hindu/books/" + res.body.bookId + "/chapters")
                    .expect(200)
                    .expect(expectedChapterResponse, done);
            });
    });

    it("should return only one specific book with same id without the content", function (done) {
        var requestBook = 0;
        var expectedResponse = {
            "books": []
        };
        expectedResponse.books[0] = JSON.parse(JSON.stringify(books[requestBook].book));
        delete expectedResponse.books[0].content;
        expectedResponse.books[0].bookId = books[requestBook]._id.toString();

        request(app)
            .get("/religions/" + books[requestBook].book.religion + "/books/" + books[requestBook]._id.toString())
            .expect("Content-Type", /json/)
            .expect(200)
            .expect(expectedResponse, done);
    });

    it("should return 404 when incorrect title id is used for retrieve", function (done) {
        request(app)
            .get("/religions/" + books[0].book.religion + "/books/12345")
            .expect(404, done);
    });

    it("should update the attributes of the book for provided id", function (done) {
        var requestBook = 0;
        var expectedResponse = {
            "books": []
        };
        expectedResponse.books[0] = JSON.parse(JSON.stringify(books[requestBook].book));
        delete expectedResponse.books[0].content;

        books[requestBook].book.title = expectedResponse.books[0].title = "Changed title";
        books[requestBook].book.author = expectedResponse.books[0].author = "Changed author";

        request(app)
            .put("/religions/" + books[requestBook].book.religion + "/books/" + books[requestBook]._id.toString())
            .send(expectedResponse.books[0])
            .expect(204)
            .end(function (err, res) {
                if (err) return done(err);

                expectedResponse.books[0].bookId = books[requestBook]._id.toString();
                request(app)
                    .get("/religions/" + expectedResponse.books[0].religion + "/books/" + expectedResponse.books[0].bookId)
                    .expect(200)
                    .expect(expectedResponse, done);
            });
    });

    it("should return 404 when incorrect title id is used for update", function (done) {
        request(app)
            .put("/religions/" + books[0].book.religion + "/books/12345")
            .send("{}")
            .expect(404, done);
    });

    it("should remove the book and its content", function (done) {
        var requestBook = 0;
        request(app)
            .delete("/religions/" + books[requestBook].book.religion + "/books/" + books[requestBook]._id.toString())
            .expect(204)
            .end(function (err, res) {
                if (err) return done(err);

                request(app)
                    .get("/religions/" + books[requestBook].book.religion + "/books/" + books[requestBook]._id.toString())
                    .expect(404)
                    .end(function (err, res) {
                        if (err) return done(err);
                        books.splice(requestBook, 1);
                        done();
                    });
            });
    });

    it("should return 404 when incorrect title id is used for remove", function (done) {
        request(app)
            .delete("/religions/" + books[0].book.religion + "/books/12345")
            .expect(404, done);
    });
});