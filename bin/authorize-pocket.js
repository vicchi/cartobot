var GetPocket = require('node-getpocket');
var Express = require('express');
var StdIo = require('stdio');
// var SQLite3 = require('sqlite3');

var options = StdIo.getopt({
    'consumerkey': {
        key: 'c',
        description: 'GetPocket consumer key',
        mandatory: true,
        args: 1
    },
    'host': {
        key: 'h',
        description: 'Host name or IP address',
        args: 1,
        default: '127.0.0.1'
    },
    'port': {
        key: 'p',
        description: 'Listening port',
        args: 1,
        default: 8080
    }
});

var config = {
    consumer_key: options.consumerkey,
    request_token: '',
    access_token: '',
    user_name: '',
    redirect_uri: 'http://localhost:8080/authorize'
}

var app = Express();
app.get('/', init_callback);
app.get('/authorize', authorize_callback);
var server = app.listen(options.port, options.host, server_callback);

var pocket = new GetPocket(config);

function server_callback() {
    console.log('Now listening at http://%s:%s', server.address().address, server.address().port);
}

function init_callback(req, res) {
    var params = {
        redirect_uri: config.redirect_uri
    };
    app.locals.res = res;
    console.log('Asking GetPocket for request token ...');
    pocket.getRequestToken(params, request_token_handler);
}

function request_token_handler(error, response, body) {
    if (error) {
        console.log('Failed to get request token: ' + error);
        app.locals.res.send('<p>' + 'Failed to get request token: ' + error + '</p>');
    }

    else {
        var json = JSON.parse(body);
        config.request_token = json.code;
        console.log('Received request token: ' + config.request_token);

        var url = pocket.getAuthorizeURL(config);
        console.log('Redirecting to ' + url + ' for authentication');
        app.locals.res.redirect(url);
    }
}

function authorize_callback(req, res) {
    console.log('Authentication callback active ...');
    console.log('Asking GetPocket for access token ...');

    app.locals.res = res;
    var params = {
        request_token: config.request_token
    };
    pocket.getAccessToken(params, access_token_handler);

}

function access_token_handler(error, response, body) {
    if (error) {
        console.log('Failed to get access token: ' + error);
        app.locals.res.send('<p>' + 'Failed to get access token: ' + error + '</p>');
    }

    else {
        var json = JSON.parse(body);
        config.access_token = json.access_token;
        config.user_name = json.username;
        console.log('Received access token: ' + config.access_token + ' for user ' + config.user_name);
        app.locals.res.send('<p>' + 'Received access token: ' + config.access_token + ' for user ' + config.user_name + '</p>');
        // secure_credentials();
    }
}

// function secure_credentials() {
//     var db = new SQLite3.Database('auth.sqlite3');
//
//     db.serialize(function() {
//         var sql = 'DROP TABLE IF EXISTS pocket_auth';
//         db.run(sql, function(err) {
//             if (err) {
//                 console.log('"' + sql + '" failed: ' + err);
//             }
//         });
//
//         sql = 'CREATE TABLE IF NOT EXISTS pocket_auth (id INTEGER PRIMARY KEY, consumer_key TEXT, access_token TEXT, user_name TEXT);';
//         db.run(sql, function(err) {
//             if (err) {
//                 console.log('"' + sql + '" failed: ' + err);
//             }
//         });
//
//         sql = 'INSERT INTO pocket_auth (id, consumer_key, access_token, user_name) VALUES($id,$consumer_key,$access_token,$user_name)';
//         var params = {
//             $id: 1,
//             $consumer_key: config.consumer_key,
//             $access_token: config.access_token,
//             $user_name: config.user_name
//         };
//         db.run(sql, params, function(err) {
//             if (err) {
//                 console.log('"' + sql + '" failed: ' + err);
//             }
//         });
//     });
//
//     db.close();
// }
