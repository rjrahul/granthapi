"use strict";
/**
 * Created by RJ on 3/16/15.
 *
 * Contains functional tests performed on /religions/:religion/books/:bookId/chapters
 * and /religions/:religion/books/:bookId/chapters/:chapter endpoints
 */
var request = require('supertest');
var MongoClient = require("mongodb").MongoClient;
var Configurer = require("../../lib/Configurer.js")();
var app = require("../../app.js");
var configData = require("../../config/config.json")[process.env.NODE_ENV];

describe("ChaptersFT", function () {
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
        }
    ];

    before("setup functional testing for Books", function (done) {
        dbSetup.dbUrl = Configurer.useConfiguration(configData).mongodbUrl;
        MongoClient.connect(dbSetup.dbUrl, function (err, db) {
            if (err) return done(err);

            db.collection(dbSetup.conCol, function (err, col) {
                col.insertMany(chapters, function (err) {
                    if (err) return done(err);

                    books[0].book.content = chapters[0]._id;
                    db.collection(dbSetup.metCol, function (err, col) {
                        col.insertMany(books, function (err) {
                            db.close();
                            done(err);
                        });
                    });
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

    it("should return content of all the chapters for the specified book id. It should also return book attributes", function (done) {
        var expectedResponse = {
            "books": []
        };
        expectedResponse.books[0] = JSON.parse(JSON.stringify(books[0].book));
        delete expectedResponse.books[0].content;
        expectedResponse.books[0].bookId = books[0]._id;

        expectedResponse.books[0].chapters = chapters[0].book.chapters.map(function (chapter, index) {
            var newChapter = {};
            newChapter.chapterIndex = index + 1;
            Object.keys(chapter).forEach(function (key) {
                newChapter[key] = chapter[key];
            });
            return newChapter;
        });

        request(app)
            .get("/religions/" + books[0].religion + "/books/" + books[0]._id + "/chapters")
            .expect("Content-Type", /json/)
            .expect(200)
            .expect(expectedResponse, done);
    });

    it("should return contents of only the specified chapter with index", function (done) {
        var requestChapterIndex = 0;
        var expectedResponse = {
            "books": []
        };
        expectedResponse.books[0] = JSON.parse(JSON.stringify(books[0].book));
        delete expectedResponse.books[0].content;
        expectedResponse.books[0].bookId = books[0]._id;

        expectedResponse.books[0].chapters = [
            {
                "chapterIndex": requestChapterIndex + 1
            }
        ];
        Object.keys(chapters[0].book.chapters[requestChapterIndex]).forEach(function (key) {
            var expectedChapter = expectedResponse.books[0].chapters[0];
            var originalChapter = chapters[0].book.chapters[requestChapterIndex];
            expectedChapter[key] = originalChapter[key];
        });

        request(app)
            .get("/religions/" + books[0].religion + "/books/" + books[0]._id + "/chapters/" + (requestChapterIndex + 1))
            .expect("Content-Type", /json/)
            .expect(200)
            .expect(expectedResponse, done);
    });

    it("should return 404 when chapter index not present in retrieve", function (done) {
        request(app)
            .get("/religions/" + books[0].religion + "/books/" + books[0]._id + "/chapters/12345")
            .expect(404, done);
    });

    it("should update the content of the chapter for index sent", function (done) {
        var requestChapterIndex = 0;
        var expectedResponse = {
            "books": []
        };
        expectedResponse.books[0] = JSON.parse(JSON.stringify(books[0].book));
        delete expectedResponse.books[0].content;
        expectedResponse.books[0].bookId = books[0]._id;

        expectedResponse.books[0].chapters = [
            {
                "chapterIndex": requestChapterIndex + 1,
                "text": "This is updated chapter text"
            }
        ];
        chapters[0].book.chapters[requestChapterIndex].text = "This is updated chapter text";

        request(app)
            .put("/religions/" + books[0].religion + "/books/" + books[0]._id + "/chapters/" + (requestChapterIndex + 1))
            .send(expectedResponse.books[0].chapters[0])
            .expect(204)
            .end(function (err) {
                if (err) return done(err);
                request(app)
                    .get("/religions/" + books[0].religion + "/books/" + books[0]._id + "/chapters/" + (requestChapterIndex + 1))
                    .expect("Content-Type", /json/)
                    .expect(200)
                    .expect(expectedResponse, done);
            });
    });

    it("should return 404 when chapter index not present in update", function (done) {
        request(app)
            .put("/religions/" + books[0].religion + "/books/" + books[0]._id + "/chapters/12345")
            .send("{}")
            .expect(404, done);
    });

    it("should remove the chapter and its corresponding TOC line from the book", function (done) {
        var requestChapterIndex = 0;
        var expectedResponse = {
            "books": []
        };
        expectedResponse.books[0] = JSON.parse(JSON.stringify(books[0].book));
        delete expectedResponse.books[0].content;
        expectedResponse.books[0].bookId = books[0]._id;

        expectedResponse.books[0].chapters = chapters[0].book.chapters.slice(1).map(function (chapter, index) {
            var newChapter = {};
            newChapter.chapterIndex = index + 1;
            Object.keys(chapter).forEach(function (key) {
                newChapter[key] = chapter[key];
            });
            return newChapter;
        });

        request(app)
            .delete("/religions/" + books[0].religion + "/books/" + books[0]._id + "/chapters/" + (requestChapterIndex + 1))
            .expect(204)
            .end(function (err) {
                if (err) return done(err);
                request(app)
                    .get("/religions/" + books[0].religion + "/books/" + books[0]._id)
                    .expect(200)
                    .expect(expectedResponse, done);
            });
    });

    it("should return 404 when chapter index not present in remove", function (done) {
        request(app)
            .delete("/religions/" + books[0].religion + "/books/" + books[0]._id + "/chapters/12345")
            .expect(404, done);
    });
});