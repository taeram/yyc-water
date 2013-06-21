var redis = require('redis'),
    url = require('url');

var params = url.parse(process.env.REDISTOGO_URL);

var client = redis.createClient(params.port, params.host.split(":")[0]);
client.auth(params.auth.split(":")[1]);

module.exports = {
    client: client
};
