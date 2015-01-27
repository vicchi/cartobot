/*jslint node: true, white: true, nomen: true, vars: true, unparam: true */

"use strict";

var config = require('./config');
var TwitterBot = require('./twitter-bot');
var PocketBot = require('./pocket-bot');
var Twit = require('twit');
var StdIo = require('stdio');
var Logger = require('simple-node-logger');

function CartoBot(config, loggers) {
    this.config = config;
    this.loggers = loggers;
    this.log = this.loggers.cartobot;
    this.twit = new Twit(this.config.twitter.auth);
    this.twitterBot = new TwitterBot({
        config: this.config,
        twit: this.twit,
        logger: this.loggers.twitterbot
    });
    this.pocketBot = new PocketBot({
        config: this.config,
        twit: this.twit,
        logger: this.loggers.pocketbot
    });
}

CartoBot.prototype = {
    refreshConfig: function() {
        var self = this;
        this.log.info('Getting latest t.co limits from Twitter ...');
        this.twit.get('help/configuration', {}, function(err, reply) {
            if (err) {
                self._errorHandler(err);
            }
            else {
                self.config.twitter.short_url_length = reply.short_url_length;
                self.config.twitter.short_url_length_https = reply.short_url_length_https;
                self.twitterBot.refreshConfig(self.config);
                self.log.info('Current Twitter t.co limits are ' + reply.short_url_length + ' chars (' + reply.short_url_length_https + ' for HTTPS)');
            }
        });

    },
    run: function() {
        this.log.info('Running ...');
        this.log.debug('Getting current Twitter config ...');
        // var self = this;
        // this.twit.get('help/configuration', {}, function(err, reply) {
        //     if (err) {
        //         self._errorHandler(err);
        //     }
        //     else {
        //         console.log(reply);
        //         self.config.twitter.short_url_length = reply.short_url_length;
        //         self.config.twitter.short_url_length_https = reply.short_url_length_https;
        //
        //         this.twitterBot = new TwitterBot(this.config, this.twit);
        //         this.pocketBot = new PocketBot(this.config, this.twit);
        //
        //         this.twitterBot.run();
        //         this.pocketBot.run();
        //     }
        // });

        if (this.config.twitter.enabled === true) {
            this.twitterBot.run();
        }
        else {
            this.loggers.twitterbot.info('Twitter search is disabled, skipping ...');
        }

        if (this.config.getpocket.enabled === true) {
            this.pocketBot.run();
        }
        else {
            this.loggers.pocketbot.info('GetPocket search is disabled, skipping ...');
        }
    },
    _errorHandler: function(err) {
        this.log.error(err);
    }
};

var options = StdIo.getopt({
    'debug': {
        key: 'd',
        description: 'Produce loads of debug logging',
        mandatory: false
    },
    'interval': {
        key: 'i',
        description: 'How often CartoBot wakes up and runs, in minutes',
        mandatory: false,
        args: 1,
        default: 60
    },
    'tweetcount': {
        key: 't',
        description: 'Maximum number of Tweets to search for',
        mandatory: false,
        args: 1,
        default: 5
    },
    'bookmarkcount': {
        key: 'b',
        description: 'Maximum number of unarchived GetPocket bookmarks to search for',
        mandatory: false,
        args: 1,
        default: 5
    },
    'notwitter': {
        key: 'T',
        description: 'Disable searching for related Tweets',
        mandatory: false
    },
    'nopocket': {
        key: 'P',
        description: 'Disable searching for unarchived GetPocket bookmarks',
        mandatory: false
    },
    'norepeat': {
        key: 'R',
        description: 'Run once and then terminate',
        mandatory: false
    },
    'dryrun': {
        key: 'D',
        description: 'Run searches but don\'t Tweet or Archive GetPocket bookmarks',
        mandatory: false
    }
});

var title = 'cartobot';
if (options.title) {
    title = options.title;
}
process.title = title;

var logManager = Logger.createLogManager();
var logLevel = 'info';
if (options.debug) {
    logLevel = 'debug';
}
var loggers = {
    cartobot: logManager.createLogger('CartoBot', logLevel),
    twitterbot: logManager.createLogger('TwitterBot', logLevel),
    pocketbot: logManager.createLogger('PocketBot', logLevel)
};

var interval = (options.interval * 60) * 1000;
loggers.cartobot.debug('Running every ' + options.interval + ' minutes (' + interval + ' ms)');

if (options.notwitter) {
    config.twitter.enabled = false;
}
if (options.nopocket) {
    config.getpocket.enabled = false;
}
if (options.dryrun) {
    config.dryrun = true;
}

config.twitter.tweets = options.tweetcount;
config.getpocket.bookmarks = options.bookmarkcount;

var cartoBot = new CartoBot(config, loggers);

if (!options.norepeat) {
    setInterval(function() {
        loggers.cartobot.info('I\'m awake and making coffee ...');
        cartoBot.run();
        loggers.cartobot.info('All done; time for a snooze');
    }, interval);

    var refreshInterval = 86400000;
    setInterval(function() {
        loggers.cartobot.info('I\'m awake and checking the daily config for t.co');
        cartoBot.refreshConfig();
        loggers.cartobog.info('Config check done; snoozing for another 24 hours');
    }, refreshInterval);
}

cartoBot.refreshConfig();
cartoBot.run();
loggers.cartobot.info('All done; time for a snooze');
