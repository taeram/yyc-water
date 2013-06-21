var redisClient = require('../libs/redis').client;

exports.index = function(req, res){
    res.render('index', {
        title: 'YYC Water',
        scrapedFromUrl: process.env.YYC_WATER_URL,
        addNumberIsSuccessful: (req.query.success !== undefined),
        twiloFromNumber: process.env.TWILIO_FROM_NUMBER
    });
};

exports.last_updated = function(req, res){
    redisClient.get('last-updated', function (err, lastUpdated) {
        res.send(lastUpdated);
    });
};

exports.add = function (req, res) {
    var sanitize = require('validator').sanitize,
        _ = require('underscore');

    // Sanitize the number
    var number = req.body.number;
    number = sanitize(number).toInt();

    // Validate the number
    if (number < 1000000000 || number > 9999999999) {
        return res.send('Invalid phone number. Must be exactly 10 digits long. Eg. 403-111-2233', 500);
    }

    // Get the current list of numbers
    redisClient.get('sms-numbers', function (err, numbersJson) {
        if (err) {
            throw err;
        }

        var numbers = JSON.parse(numbersJson);
        if (!numbers) {
            numbers = [];
        }

        // Add the number to the list
        numbers.push(number);

        // Remove any duplicates
        numbers = _.uniq(numbers);

        // Store the new list of number
        redisClient.set('sms-numbers', JSON.stringify(numbers));
console.log('Stored numbers', numbers);
        return res.redirect('/?success');
    });
};
