/*jslint node: true, white: true, nomen: true, vars: true, unparam: true */

"use strict";

var SEARCH_URL = 'search/tweets';
var RETWEET_URL = 'statuses/retweet/:id';
var FOLLOW_URL = 'friendships/create';

function TwitterBot(options) {
    this.config = options.config;
    this.twit = options.twit;
    this.log = options.logger;

    this.raw_query = '#maps OR #cartography OR #carto OR #map filter:links';
    this.query = encodeURIComponent(this.raw_query);
    this.last_tweet_id = 0;
}

TwitterBot.prototype = {
    refreshConfig: function(config) {
        this.log.info('Refreshing latest t.co limit config ...');
        this.config = config;
    },
    run: function() {
        this.log.info('Running ...');
        this.log.debug('Raw query: ' + this.raw_query);
        this.log.debug('Query: ' + this.query);
        this.search();
    },
    search: function() {
        this.log.info('Searching for ' + this.config.twitter.tweets + ' tweets ...');
        var params = {
            q: this.raw_query,
            result_type: 'mixed',
            count: this.config.twitter.tweets
        };
        if (this.last_tweet_id > 0) {
            params.since_id = this.last_tweet_id;
        }
        var self = this;
        this.log.debug('Params: ', params);
        this.log.debug('Hitting Twitter API endpoint ' + SEARCH_URL);
        this.twit.get(SEARCH_URL, params, function(err, data, resp) {
            self.log.info('Search complete');
            if (err) {
                self._errorHandler(new Error(err.statusCode + ' ' + err.twitterReply));
            }
            else {
                self._parseSearchResults(data);
            }
        });
    },
    _parseSearchResults: function(reply) {
        if (!reply.search_metadata || !reply.search_metadata.count) {
            this._errorHandler(new Error('Bad search response; cannot find reply.search_metadata or reply.search_metadata.count'));
        }

        else if (!reply.statuses) {
            this._errorHandler(new Error('Bad search response; cannot find reply.statuses'));
        }

        else {
            var self = this;

            reply.statuses.forEach(function(status) {
                self.log.debug(status.id_str + ': Starting to process Tweet');
                self._processSearchEntry(status);
                if ((self.last_tweet_id === 0) || (status.id_str > self.last_tweet_id)) {
                    self.last_tweet_id = status.id_str;
                }
            });
        }
    },
    _processSearchEntry: function(status) {
        this.log.debug(status.id_str + ': Id: ' + status.id_str);
        this.log.debug(status.id_str + ': Text: ' + status.text);
        this.log.debug(status.id_str + ': User: ', status.user.name + ' (@' + status.user.screen_name + ')');
        this._retweetEntry(status);
    },
    _retweetEntry: function(status) {
        this.log.info(status.id_str + ': Checking retweet status');
        this.log.debug(status.id_str + ': retweeted flag: ' + status.retweeted);
        this.log.debug(status.id_str + ': protected flag: ' + status.user.protected);

        if (status.retweeted === true) {
            this.log.info(status.id_str + ': Already retweeted, skipping retweet');
        }
        else if (status.user.protected === true) {
            this.log.info(status.id_str + ': Cannot retweet user @' + status.user.screen_name + '; they\'re protected');
        }
        else {
            this.log.info(status.id_str + ': Retweeting ...');
            var self = this;
            var options = {
                id: status.id_str
            };
            this.log.debug(status.id_str + ': Hitting Twitter API endpoint ' + RETWEET_URL);
            this.twit.post(RETWEET_URL, options, function(err, data, resp) {
                if (err) {
                    if (err.statusCode === 403) {
                        self.log.info(status.id_str + ': failed to retweet, probably a duplicate');
                    }
                    else {
                        self.log.debug(status.id_str + ': err: ', err);
                        self._errorHandler(new Error(err.statusCode + ' ' + err.twitterReply));
                        //return self._errorHandler(new Error(status.id_str + ' ' + err));
                    }
                }
            });
        }
        this._followUser(status);
    },
    _followUser: function(status) {
        this.log.info(status.id_str + ': Checking follow status for @' + status.user.screen_name);
        if (status.user.following) {
            this.log.info(status.id_str + ': Already following @' + status.user.screen_name + ', skipping follow');
        }
        else {
            var self = this;
            var options = {
                user_id: status.user.id
            };
            this.log.info(status.id_str + ': Following user @' + status.user.screen_name);
            this.log.debug(status.id_str + ': Hitting Twitter API endpoint ' + FOLLOW_URL);
            this.twit.post(FOLLOW_URL, options, function(err, data, resp) {
                if (err) {
                    self._errorHandler(new Error(err.statusCode + ' ' + err.twitterReply));
                    // return self._errorHandler(new Error(status.id_str + ' ' + err));
                }
            });
        }
    },
    _errorHandler: function(err) {
        this.log.error(err.stack);
    }
};

module.exports = TwitterBot;
