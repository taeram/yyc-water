YYC Water
=========

Monitors Alberta Health Services website for Boil Water advisories,
and sends a text message when there are updates.

Setup
=====
Requires:
* A Heroku account
* A Twilio account and a Twilio number
* A Bit.ly account, with an API key

Heroku Configuration
====================

Create your Heroku application, set these configuration variables, and then push it up:
```bash
heroku config:set \
    YYC_WATER_URL="http://www.albertahealthservices.ca/8644.asp" \
    TZ="America/Edmonton" \
    BITLY_USERNAME=<your bitly username> \
    BITLY_API_KEY=<your bitly api key> \
    TWILIO_SID=<your twilio sid> \
    TWILIO_AUTH_TOKEN=<your twilio auth token> \
    TWILIO_FROM_NUMBER=<your twilio from number> \
    SCRAPE_INTERVAL_MINUTES=5
```


[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/taeram/yyc-water/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

