"use strict";
/**
 * Created by RJ on 3/16/15.
 *
 * Contains functional tests performed on /religions/:religion/books
 * and /religions/:religion/books/:bookId endpoints
 */
var request = require('supertest');
var MongoClient = require("mongodb").MongoClient;
var Configurer = require("../../lib/Configurer.js")();
var app = require("../../app.js");
var configData = require("../../config/config.json")[process.env.NODE_ENV];
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

            db.collection(dbSetup.metCol, function (err, col) {
                col.insertMany(books, function (err, result) {
                    db.close();
                    done(err);
                });
            });
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
            return (book.book.religion === religion);
        }).map(function (book) {
            var newBook = {};
            newBook.bookId = book._id;
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
            return (book.book.religion === religion);
        }).map(function (book) {
            var newBook = {};
            newBook.bookId = book._id;
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
            .expect("Content-Type", /json/)
            .expect(201)
            .end(function (err, res) {
                if (err) return done(err);
                expect(res.body).to.be.ok;
                Object.keys(book).forEach(function (key) {
                    expect(res.body).to.have.a.property(key, book[key]);
                });
                expect(res.body).to.have.a.property("bookId");
                expect(res.body).to.have.a.property("toc", [""]);
                expect(res.body).to.have.a.proeprty("religion", "Hindu");

                //TODO: change based on chapters response
                var expectedChapterResponse = {
                    "chapters": [
                        {
                            "content": ""
                        }
                    ]
                };

                request(app)
                    .get("/religions/Hindu/books/" + res.body.bookId + "/chapters")
                    .expect(200)
                    .expect(expectedChapterResponse, done);
            });
    });

    it("should return only one specific book with same id without the content", function (done) {
        var expectedResponse = {
            "books": []
        };
        expectedResponse.books[0] = JSON.parse(JSON.stringify(books[0].book));
        delete expectedResponse.books[0].content;
        expectedResponse.books[0].bookId = books[0]._id;

        request(app)
            .get("/religions/" + books[0].religion + "/books/" + books[0]._id)
            .expect("Content-Type", /json/)
            .expect(200)
            .expect(expectedResponse, done);
    });

    it("should return 404 when incorrect title id is used for retrieve", function (done) {
        request(app)
            .get("/religions/" + books[0].religion + "/books/12345")
            .expect(404, done);
    });

    it("should update the attributes of the book for provided id", function (done) {
        var expectedResponse = {
            "books": []
        };
        expectedResponse.books[0] = JSON.parse(JSON.stringify(books[0].book));
        delete expectedResponse.books[0].content;

        books[0].book.title = expectedResponse.title = "Changed title";
        books[0].book.author = expectedResponse.author = "Changed author";

        request(app)
            .put("/religions/" + books[0].religion + "/books/" + books[0]._id)
            .send(expectedResponse.books[0])
            .expect("Content-Type", /json/)
            .expect(204)
            .end(function (err, res) {
                if (err) return done(err);

                expectedResponse.books[0].bookId = books[0]._id;
                request(app)
                    .get("/religions/" + expectedResponse.books[0].religion + "/books/" + expectedResponse.books[0].bookId)
                    .expect(200)
                    .expect(expectedResponse, done);
            });
    });

    it("should return 404 when incorrect title id is used for update", function (done) {
        request(app)
            .put("/religions/" + books[0].religion + "/books/12345")
            .send("{}")
            .expect(404, done);
    });

    it("should remove the book and its content", function (done) {
        request(app)
            .delete("/religions/" + books[0].religion + "/books/" + books[0]._id)
            .expect(204)
            .end(function (err, res) {
                if (err) return done(err);

                request(app)
                    .get("/religions/" + books[0].religion + "/books/" + books[0]._id)
                    .expect(404)
                    .end(function (err, res) {
                        if (err) return done(err);
                        books.splice(0, 1);
                    });
            });
    });

    it("should return 404 when incorrect title id is used for remove", function (done) {
        request(app)
            .delete("/religions/" + books[0].religion + "/books/12345")
            .expect(404, done);
    });
});