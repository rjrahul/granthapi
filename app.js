"use strict";
/**
 * Created by RJ on 3/15/15.
 *
 * Initializes express app
 */

var express = require("express");
var path = require("path");
var favicon = require("serve-favicon");
var logger = require("./lib/log.js");
var expressWinston = require("express-winston");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");

var religions = require("./routes/religions");
var books = require("./routes/books");
var chapters = require("./routes/chapters");
var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

// uncomment after placing your favicon in /public
app.use(favicon(__dirname + "/public/favicon.ico"));
app.use(expressWinston.logger({
    winstonInstance: logger,
    expressFormat: true,
    colorStatus: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
if (app.get("env") === "development" || app.get("env") === "tests") {
    app.use("/app/tests", express.static(path.join(__dirname, "test/client")));
    app.use("/public", express.static(path.join(__dirname, "public")));
    app.use("/bower_components", express.static(path.join(__dirname, "bower_components")));
    app.use("/app/tests/setup", require("./test/client/testSetup.js"));
}
app.use("/app", express.static(path.join(__dirname, "public")));
app.use("/app", express.static(path.join(__dirname, "bower_components")));

app.use("/religions/:religion/books/:bookId/chapters", chapters);
app.use("/religions/:religion/books", books);
app.use("/religions", religions);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error("Not Found");
    err.status = 404;
    next(err);
});

app.use(expressWinston.errorLogger({
    winstonInstance: logger
}));
// error handlers

// development error handler
// will print stacktrace
/* istanbul ignore else: for else is in default for this setup */
if (app.get("env") === "development" || app.get("env") === "tests") {
    app.use("/app", function (err, req, res, next) {
        res.status(err.status || 500);
        res.render("error", {
            message: err.message,
            error: err
        });
    });
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.json({
            message: err.message,
            stack: err.stack,
            error: err
        });
    });
}

// production error handler
// no stacktrace leaked to user
app.use("/app", function (err, req, res, next) {
    logger.log("error", "Error occurred in /app", err);
    res.status(err.status || 500);
    res.render("error", {
        message: err.message,
        error: {}
    });
});

app.use(function (err, req, res, next) {
    logger.log("error", "Error occurred", err);
    res.status(err.status || 500);
    res.json({
        message: err.message,
        error: {}
    });
});

module.exports = app;
