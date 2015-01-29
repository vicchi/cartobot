var StdIo = require('stdio');
var SQLite3 = require('sqlite3');

var options = StdIo.getopt({
    'consumerkey': {
        key: 'c',
        description: 'Twitter consumer key',
        mandatory: true,
        args: 1
    },
    'consumersecret': {
        key: 's',
        description: 'Twitter consumer secret',
        mandatory: true,
        args: 1
    },
    'accesstoken': {
        key: 'a',
        description: 'Twitter access token',
        mandatory: true,
        args: 1
    },
    'accesssecret': {
        key: 'S',
        description: 'Twitter access token secret',
        mandatory: true,
        args: 1
    }
});

var db = new SQLite3.Database('auth.sqlite3');
var sql;

db.serialize(function() {
    sql = 'CREATE TABLE IF NOT EXISTS twitter_auth (id INTEGER PRIMARY KEY, consumer_key TEXT, consumer_secret TEXT, access_token TEXT, access_secret TEXT);';
    db.run(sql, error_handler);

    sql = 'INSERT INTO twitter_auth(id, consumer_key, consumer_secret, access_token, access_secret) VALUES($id,$consumer_key,$consumer_secret,$access_token,$access_secret);';
    var params = {
        $id: 1,
        $consumer_key: options.consumerkey,
        $consumer_secret: options.consumersecret,
        $access_token: options.accesstoken,
        $access_secret: options.accesssecret
    };
    db.run(sql, params, error_handler);
});

function error_handler(error) {
    if (error) {
        console.log('"' + sql + '"');
        console.log(error);
    }
}
