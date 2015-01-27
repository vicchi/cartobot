/*jslint node: true, white: true, nomen: true, vars: true, unparam: true */

"use strict";

var GetPocket = require('node-getpocket');
var Url = require('url');
var Twitter = require('twitter-text');

function PocketBot(options) {
    this.config = options.config;
    this.twit = options.twit;
    this.log = options.logger;

    this.getPocket = new GetPocket(this.config.getpocket.auth);
    this.tags = 'maps';
}

PocketBot.prototype = {
    run: function() {
        this.log.info('Running ...');
        this.log.debug('Search tags: ' + this.tags);
        this.search();
    },
    search: function() {
        this.log.info('Searching ...');
        var options = {
            state: 'unread',
            tag: this.tags,
            detailType: 'simple',
            sort: 'oldest',
            count: this.config.getpocket.bookmarks
        };
        var self = this;
        this.log.debug('Options: ', options);
        this.getPocket.get(options, function(err, reply) {
            self.log.info('Search complete');
            if (err) {
                return self._errorHandler(new Error(err));
            }

            self._parseSearchResults(reply);
        });
    },
    _parseSearchResults: function(reply) {
        if (!reply.list) {
            return this._errorHandler(new Error('Bad search response; cannot find reply.list'));
        }

        var prop;

        for (prop in reply.list) {
            if (reply.list.hasOwnProperty(prop)) {
                this.log.debug('Starting to process Item ID: ' + prop);
                this._processSearchEntry(reply.list[prop]);
            }
        }   // end-for(...)
    },
    _processSearchEntry: function(entry) {
        var uri = entry.given_url;
        this.log.debug(entry.item_id + ' URL: ' + uri + ' (' + uri.length + ')');
        var title = entry.resolved_title;
        if (!title || (title && title.length === 0)) {
            title = 'A Map!';
        }
        this.log.debug(entry.item_id + ' Title: ' + title + ' (' + Twitter.getTweetLength(title, this.config.twitter) + ')');

        // If this bookmark comes from Twitter, detect and fix up any horribleness that
        // GetPocket dues to t.co URLs, making them look like http : //t.co. No, really
        if (entry.resolved_url.indexOf('https://twitter.com') === 0) {
            // title = title.replace(/http : \/\/t.co\/[^\s]+/, '');
            title = title.replace(/http : \/\//, '');
            this.log.debug(entry.item_id + ' t.co fixed up title: ' + title + ' (' + Twitter.getTweetLength(title, this.config.twitter) + ')');
        }


        title += ' ';
        var tweet = title + uri;
        var tweetlen = Twitter.getTweetLength(tweet, this.config.twitter);
        var maxlen = 140;
        if (tweetlen > maxlen) {
            var diff = (tweetlen - maxlen) + 2;
            var index = title.length - diff;
            title = title.substring(0, index);
            title += ' ';
            tweet = title + uri;
        }

        this.log.debug(entry.item_id + ' Final Tweet: ' + tweet + ' (' + Twitter.getTweetLength(tweet, this.config.twitter) + ')');

        var stat = Twitter.isInvalidTweet(tweet);
        if (!stat) {
            this._tweetEntry(entry.item_id, tweet);
        }
        else {
            return this._errorHandler(new Error('Bad Tweet; ' + stat));
        }

        // var max_length = 140;
        // var components = Url.parse(uri);
        // var tco_length = this.config.twitter.short_url_length;
        // if (components.protocol === 'https') {
        //     tco_length = this.config.twitter.short_url_length_https;
        // }
        //
        // if (title.length > ((max_length - tco_length) + 1)) {
        //     var index = max_length - tco_length;
        //     title = title.substring(0, index);
        //     this.log.debug(entry.item_id + ' Truncated title to: ' + title);
        // }
        //
        // var tweet = title + ' ' + uri;
        // this.log.debug(entry.item_id + ' Tweet: ' + tweet + ' (' + tweet.length + ' chars)');
        // this._tweetEntry(entry.item_id, tweet);
    },
    _tweetEntry: function(item_id, tweet) {
        var self = this;
        var options = {
            status: tweet
        };

        if (this.config.dryrun) {
            self.log.info('(DRY RUN) Tweeting ' + item_id + ' as "' + tweet + '"');
            self._archiveEntry(item_id);
        }

        else {
            self.log.info('Tweeting ' + item_id + ' as "' + tweet + '"');

            this.twit.post('statuses/update', options, function(err, reply) {
                if (err) {
                    self.log.error(err);
                    return self._errorHandler(new Error(err));
                }

                self._archiveEntry(item_id);
            });
        }
    },
    _archiveEntry: function(item_id) {
        if (this.config.dryrun) {
            this.log.info('(DRY RUN) Archiving ' + item_id);
        }
        else {
            this.log.info('Archiving ' + item_id);
            var self = this;
            var options = {
                actions: [
                    {
                        action: 'archive',
                        item_id: item_id,
                        time: new Date().getTime()
                    }
                ]
            };
            this.getPocket.modify(options, function(err, response, body) {
                if (err) {
                    return self._errorHandler(new Error('Failed to archive ' + item_id + ' ' + err));
                }
                self.log.info('Archive of ' + item_id + ' completed');
            });
        }
    },
    _errorHandler: function(err) {
        this.log.error(err.stack);
    }
};

module.exports = PocketBot;
