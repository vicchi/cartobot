/*jslint node: true, white: true, nomen: true, vars: true, unparam: true */

"use strict";

var GetPocket = require('node-getpocket');
var Url = require('url');

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
        //var uri = encodeURIComponent(entry.given_url);
        var uri = entry.given_url;
        this.log.debug(entry.item_id + ' URL: ' + uri + ' (' + uri.length + ' chars)');
        var title = entry.resolved_title;
        if (!title || (title && title.length === 0)) {
            title = 'A Map!';
        }
        this.log.debug(entry.item_id + ' Title: ' + title + ' (' + title.length + ' chars)');

        var max_length = 140;
        var components = Url.parse(uri);
        var tco_length = this.config.twitter.short_url_length;
        if (components.protocol === 'https') {
            tco_length = this.config.twitter.short_url_length_https;
        }

        if (title.length > ((max_length - tco_length) + 1)) {
            var index = max_length - tco_length;
            title = title.substring(0, index);
            this.log.debug(entry.item_id + ' Truncated title to: ' + title);
        }

        var tweet = title + ' ' + uri;
        this.log.debug(entry.item_id + ' Tweet: ' + tweet + ' (' + tweet.length + ' chars)');
        this._tweetEntry(entry.item_id, tweet);
    },
    _tweetEntry: function(item_id, tweet) {
        var self = this;
        var options = {
            status: tweet
        };
        self.log.info('Tweeting ' + item_id + ' as "' + tweet + '"');

        this.twit.post('statuses/update', options, function(err, reply) {
            if (err) {
                return self._errorHandler(new Error(err));
            }

            self._archiveEntry(item_id);
        });

    },
    _archiveEntry: function(item_id) {
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
    },
    _errorHandler: function(err) {
        this.log.error(err.stack);
    }
};

module.exports = PocketBot;
