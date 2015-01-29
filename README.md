# CartoBot

**Cartobot** is a [Twitterbot](http://en.wikipedia.org/wiki/Twitterbot), written in [Node.js](http://nodejs.org/), that searches for Tweets about maps and cartography and scans your GetPocket queue for bookmarks tagged with `maps` and Tweets about them.

If you don't want to Tweet about this sort of thing, Cartobot is fully configurable to search for other information in Twitter, based on the [Twitter search API](https://dev.twitter.com/rest/public/search), including searching based on hashtags, exclusing certain hashtags and certain accounts.

## Installation

Clone Cartobot's GitHub repository ...

```
$ git clone git@github.com:vicchi/cartobot.git
```

Or install from the latest release's archive.

```
$ wget https://github.com/vicchi/cartobot/archive/master.zip
```

Install dependencies with `npm`

```
$ cd cartobot && npm install
```

## Authentication with Twitter

Cartobot is a *Twitterbot* which means you'll need to create a Twitter account for the bot to Tweet through and to authenticate your account with Cartobot to allow it to Tweet.

It can't be stressed enough that you should create a *new account* to use Cartobot. Bots do can banned or blocked from time to time and you don't want your usual Twitter account to be the one that gets blocked.

After you've created your new account and are signed in, you'll need to create a new Twitter *app* which you can do [here](https://apps.twitter.com/app/new). Once you've created your *app* clicking on *Keys and Access Tokens* will show your *Consumer Key*, *Consumer Secret*, *Access Token* and *Access Token Secret*. These should all be updated in `etc/config.js` as `twitter.auth.consumer_key`, `twitter.auth.consumer_secret`, `twitter.auth.access_token` and `twitter.auth.access_token_secret`.

## Authentication with GetPocket

Cartobot supports tweeting about bookmarks saved to your GetPocket queue with a specific tag. You'll need to have a valid GetPocket account and to create an *application* to use Cartobot with the GetPocket API, which you can do [here](http://getpocket.com/developer/apps/new). Make sure you set at least *Modify* and *Retrieve* permissions for your application; these permissions cannot be added after your application is created. Once the application is created with GetPocket, you'll be notified of your *consumer key* to allow you to authenticate Cartobot with your GetPocket account using OAuth.

Cartobot needs to be configured with both your GetPocket *consumer key* and your GetPocket *access token*. You can obtain your access token by using the helper script in `bin/authorize-pocket.js` and passing it your *consumer key* on the command line.

```
$ node bin/authorize-pocket.js --consumerkey 'YOUR-CONSUMER-KEY'
Now listening at http://127.0.0.1:8080
```

Point your web browser of choice at http://127.0.0.1:8080 and you'll be guided through the OAuth handshaking dance and be presented with your *access token*.

Take both your *consumer key* and *access token* and update `etc/config.js` inserting these values as `getpocket.auth.consumer_key` and `getpocket.auth.access_token`.

## Configuration

Cartobot ships with a template configuration file in `etc/config.js.sample`. You'll need to copy this to `etc/config.js` and edit it to meet your needs. Hopefully `config.js.sample` is relatively self explanatory, but excepting the authentication items described above, these are the other configuration fields.

* `dryrun`: set to true to disable tweeting, retweeting, following and archiving GetPocket bookmarks
* `title`: process title - WARNING make sure this matches the process name for the stop script in package.json
* `twitter.enabled`: set to false to disable Twitter searching, retweeting and following. Does not disable tweeting GetPocket bookmarks
* `twitter.tweets`: number of applicable search results that will be retweeted
* `twitter.short_url_length`, `twitter.short_url_length_https`: default t.co URL lengths
* `twitter.query.main`: main Twitter search API query
* `twitter.query.args`: additional search arguments
* `twitter.query.ignore.hashtags`: array of hashtags to exclude
* `twitter.query.ignore.accounts`: array of accounts to exclude
* `getpocket.enabled`: set to false to disable Twitter searching, retweeting and following. Does not disable tweeting GetPocket bookmarks
* `getpocket.bookmarks`: number of applicable GetPocket bookmarks that will be tweeted
* `getpocket.query.tag`: the GetPocket bookmark tag to be searched for

In addition to reading configuration from `etc/config.js`; some configuration parameters can be overridden from the command line.

```
$ node cartobot.js --help
USAGE: node cartobot.js [OPTION1] [OPTION2]... arg1 arg2...
The following options are supported:
  -d, --debug                	Produce loads of debug logging
  -i, --interval <ARG1>      	How often CartoBot wakes up and runs, in minutes ("120" by default)
  -t, --tweetcount <ARG1>    	Maximum number of Tweets to search for ("5" by default)
  -b, --bookmarkcount <ARG1> 	Maximum number of unarchived GetPocket bookmarks to search for ("5" by default)
  -T, --notwitter            	Disable searching for related Tweets
  -P, --nopocket             	Disable searching for unarchived GetPocket bookmarks
  -R, --norepeat             	Run once and then terminate
  -D, --dryrun               	Run searches but don't Tweet or Archive GetPocket bookmarks
```
## Running CartoBot

Run `cartobot.js` with `node`:

```
$ node cartobot.js
```

Or start Cartobot with `npm`:

```
$ npm start
```

Or run Cartobot under `forever` as a service on RHEL/CentOS machines:

```
$ sudo su -
$ npm -g install forever
$ cp bin/cartobot /etc/rc.d/init.d/
$ chmod +x /etc/rc.d/init.d/cartobot
$ /sbin/chkconfig --level 345 cartobot on
$ service cartobot start
```

## Credits

Cartobot's [icon](https://www.iconfinder.com/icons/239239/address_gps_location_map_navigate_navigation_pin_icon#size=128) is by PixelKit.
