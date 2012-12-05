module.exports = (function() {
  var http                 = require('https'),
      AuthenticationBuffer = require('lib/authentication_buffer'),
      JsonData             = require('lib/json_data');

  // Constructor function that requires an `options` object with at least the
  // `api_token` and `app` keys. Any other values are ignored.
  function Heroku(options) {
    if(!options.api_token) throw new Error('API token required');
    if(!options.app)       throw new Error('Application name required');
    this.api_token = options.api_token;
    this.app       = options.app;
  }

  // Internal utility function to actually make the HTTP requests against the
  // Heroku API using a set of standard request options, parsing the repsonse
  // body as JSON.
  //
  // Note how a special header is added to the request to set the Heroku client
  // gem version. Without this value, Heroku will misbehave.
  Heroku.prototype.request = function(path, fn) {
    var options = {
      host:    'api.heroku.com',
      method:  'GET',
      path:    path,
      headers: {
        'Accept':               'application/json',
        'X-Heroku-Gem-Version': '2.1.2',
        'Authorization':        'Basic'
      }
    };

    // Make the request, accumulate any response data into a `JsonData`
    // container and return it either as the error or data object to the given
    // callback function -- depending on the HTTP status code.
    http.request(options, function(response) {
      var json_response = new JsonData();
      response.setEncoding('utf-8');
      response.on('data', json_response.push);
      response.on('end', function() {
        var err, rval, json;
        json = json_response.toJSON();
        if(response.statusCode >= 200 && response.statusCode <=299) {
          rval = json;
        } else {
          err = json;
        }
        fn(err, rval);
      });
    }).end();
  };

  // Generate a subpath local to an application root path on the Heroku API.
  // For internal use only.
  Heroku.prototype.appPath = function(subpath) {
    return '/apps/' + this.app + '/' + subpath;
  };

  // Load the value for a given environment variable on the current
  // application. The results are cached locally, so only a single request will
  // be made.
  Heroku.prototype.config = function(key, fn) {
    var that = this;
    if(this._config_cache) {
      if(this._config_cache.hasOwnProperty(key)) {
        fn(null, this._config_cache[key]);
      } else {
        fn({ 'error': 'Key not found' });
      }
    } else {
      this.request(this.appPath('config_vars'), function(err, config) {
        that._config_cache = err ? {} : config;
        that.config(key, fn);
      });
    }
  };

  return Heroku;
})();
