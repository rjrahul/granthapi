"use strict";
/**
 * Created by RJ on 3/25/15.
 *
 * Instantiates default logging options on winston
 */
var logger = require("winston");
logger.add(logger.transports.File, {
    level: "verbose",
    filename: "logs/logFile.log",
    maxsize: 5242880,
    tailable: true,
    handleExceptions: true
});
if (process.env.NODE_ENV != 'development') {
    /* istanbul ignore if: this is only for production setting */
    if (process.env.NODE_ENV != 'tests') {
        logger.transports.File.level = "error";
    }
    logger.remove(logger.transports.Console);
}
module.exports = logger;