var redisClient = require('./libs/redis').client;
var MAX_SMS_LENGTH = 160; // As defined by twilio: http://www.twilio.com/docs/errors/21605)

process.on('uncaughtException', function(err) {
    console.error(err.stack);
});

// Retrieve the page
var retrievePage = function() {
    console.log("Retrieving the page");

    var request = require('request');
    request(process.env.YYC_WATER_URL, processPage);
};

// Process the retrieved page, grabbing the boil water advisory links
var processPage = function (err, res, body) {
    console.log("Processing the page");

    var $ = require('jquery'),
        md5 = require('md5'),
        url = require('url');

    if (!err && res.statusCode == 200) {
        var headings = $(body).find('p').has('big').has('strong');
        var foundBoilWaterSection = false;
        for (var i=0; i < headings.length; i++) {
            // Find the Boil Water section
            if ($(headings[i]).text().match(/Boil Water/i) === null) {
                continue;
            }
            foundBoilWaterSection = true;

            // Grab the list of advisory links
            var links = $(headings[i]).next().find('a');
            for (var j=0; j < links.length; j++) {
                // Find any links that mention Calgary
                if ($(links[j]).text().match(/Calgary/i)) {
                    console.log("Processing link: " + $(links[j]).text());

                    // If it's a local url, make it absolute
                    var pageUrl = $(links[j]).attr('href');
                    if (pageUrl.match(/^\//)) {
                        var baseUrl = url.parse(process.env.YYC_WATER_URL);
                        pageUrl = baseUrl.protocol + '//' + baseUrl.host + pageUrl;
                    }

                    // Extract the link details
                    var link = {
                        id: md5.digest_s(pageUrl),
                        url: pageUrl,
                        title: "Boil Water Advisory: " + $(links[j]).text()
                    };

                    processLinks(link);
                } else {
                    console.log("Not processing: " + $(links[j]).text());
                }
            }
        }

        if (foundBoilWaterSection === false) {
            throw "Could not find the Boil Water section";
        }
    } else {
        throw err;
    }

    setLastUpdatedTime();
};

// Process the links we've found
var processLinks = function (link) {
    var Bitly = require('bitly');
    var bitly = new Bitly(process.env.BITLY_USERNAME, process.env.BITLY_API_KEY);

    // Do we have this link cached?
    redisClient.get(link.id, function (err, cachedLink) {
        if (err) {
            throw err;
        }

        // Don't send out a link twice
        if (cachedLink) {
            console.log("Found cached link, not sending it out", cachedLink);
            return;
        }

        // Get a short url from bitly
        bitly.shorten(link.url, function(err, res) {
            if (err || res.status_code != 200) {
                console.log(res);
                throw err;
            }

            // Add the short url
            link.shortUrl = res.data.url;

            // Cache the link
            redisClient.set(link.id, JSON.stringify(link));

            // Send out the link
            sendSms(link);
        });
    });
};

// Cache the prices
var setLastUpdatedTime = function (callback) {
    console.log("Setting the last updated time");

    var moment = require('moment'),
        time = require('time');

    // Force an America/Edmonton timestamp, regardless of the server's timestamp
    var date = new time.Date();
    date.setTimezone(process.env.TZ);
    var dateString = moment(date).format("MMMM Do YYYY, h:mm a") + " " + date.getTimezoneAbbr();

    redisClient.set('last-updated', dateString);
};

/**
 * Send an SMS message
 *
 * @param object link The link object
 */
var sendSms = function(link) {
    var twilio = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

    // Send the updated link to all of the numbers
    redisClient.get('sms-numbers', function (err, numbersJson) {
        if (err) {
            throw err;
        }

        var numbers = JSON.parse(numbersJson);
        if (!numbers) {
            console.log("No numbers found, not sending any SMS");
            return;
        }

        for (var i=0; i < numbers.length; i++) {
            // Truncate the body length if necessary
            var body = '';
            var truncateSize = 0;
            while (body.length == 0 || body.length > MAX_SMS_LENGTH) {
                if (truncateSize > 0) {
                    link.title = link.title.substr(0, (link.title.length - truncateSize)) + '... ';
                }

                body = link.title + ": " + link.shortUrl;
                truncateSize += 10;
            }

            var options = {
                to: numbers[i],
                from: process.env.TWILIO_FROM_NUMBER,
                body: body
            };

            console.log("Sending SMS to " + options.to + " from " + options.from + " with: " + options.body);

            twilio.sms.messages.create(options, function(err, res) {
                if (err) {
                    console.log(res.stats, res.message);
                    throw err;
                }
            });
        }
    });
};

// Start the show
setInterval(retrievePage, process.env.SCRAPE_INTERVAL_MINUTES * 60 * 1000);
