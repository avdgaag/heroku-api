module.exports = (function() {
  var http                 = require('https'),
      querystring          = require('querystring'),
      url                  = require('url'),
      AuthenticationBuffer = require('./authentication_buffer'),
      JsonData             = require('./json_data');

  function isString(obj) {
    return Object.prototype.toString.call(obj) == '[object String]';
  }

  function extend(obja, objb) {
    for(key in objb) {
      if(objb.hasOwnProperty(key)) {
        obja[key] = objb[key];
      }
    }
  }

  function merge() {
    var objc = {};
    for(var i = 0, j = arguments.length; i < j; i++) {
      extend(objc, arguments[i]);
    }
    return objc;
  }

  // Constructor function that requires an `options` object with at least the
  // `api_token` and `app` keys. Any other values are ignored.
  function Heroku(options) {
    if(!options.api_token) throw new Error('API token required');
    if(!options.app)       throw new Error('Application name required');
    this.api_token = options.api_token;
    this.app       = options.app;
  }

  // ## Requests

  // Internal utility function to actually make the HTTP requests against the
  // Heroku API using a set of standard request options, parsing the repsonse
  // body as JSON.
  //
  // Note how a special header is added to the request to set the Heroku client
  // gem version. Without this value, Heroku will misbehave.
  Heroku.prototype.request = function(path_or_options, fn) {
    var options, post_data, default_options = {
      host: 'api.heroku.com',
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Heroku-Gem-Version': '2.1.2',
        'Authorization': this.auth()
      }
    };

    // Either use `path_or_options` as a path by using all the
    // default options, overriding only the `path` option -- or
    // use it as a set of options and merge it entirely into the
    // default options.
    if(isString(path_or_options)) {
      options = merge(default_options, { path: path_or_options });
    } else {
      options = merge(default_options, path_or_options);
    }

    // If the set of options has `post_data`, extract it into a
    // variable to write it into the request later on.
    if(options.post_data) {
      post_data = querystring.stringify(options.post_data);
      delete options.post_data;
    }

    // If the options set contains an `auth` key, use that for the
    // nested Authorization header.
    if(options.auth) {
      options.headers['Authorization'] = options.auth;
      delete options.auth;
    }

    // Make the request, accumulate any response data into a `JsonData`
    // container and return it either as the error or data object to the given
    // callback function -- depending on the HTTP status code.
    var request = http.request(options, function(response) {
      var json_response = new JsonData();
      response.setEncoding('utf-8');
      response.on('data', json_response.push);
      response.on('end', function() {
        var err, rval, json;
        json = json_response.toJSON();

        // Consider the response JSON as an error or data based on the
        // HTTP status code.
        if(response.statusCode >= 200 && response.statusCode <=299) {
          rval = json;
        } else {
          err = json;
        }

        // If there is a callback, call it with any errors and
        // data.
        if(fn) fn(err, rval);
      });
    });
    if(post_data) {
      request.write(post_data);
    }
    request.end();
  };

  // Wrapper method for internal use to make a request to the Heroku API as
  // with `request`, but with a local cache for results. This method is not
  // aware of whether it makes sense to cache, so use at your own peril.
  Heroku.prototype.cachedRequest = function(path, fn) {
    var cache, that = this;
    if(!this.requestCache) this.requestCache = {};
    if(this.requestCache.hasOwnProperty(path)) {
      fn(this.requestCache[path][0], this.requestCache[path][1]);
    } else {
      this.request(path, function(err, data) {
        that.requestCache[path] = [err, data];
        that.cachedRequest(path, fn);
      });
    }
  };

  // ## Helper methods

  // Generate a subpath local to an application root path on the Heroku API.
  // For internal use only.
  Heroku.prototype.appPath = function(subpath) {
    return '/apps/' + this.app + '/' + subpath;
  };

  // Generate an authentication header value for a given username and password.
  // Defaults to just the API token for regular Heroku API requests.
  Heroku.prototype.auth = function(username, password) {
    if(!username) username = '';
    if(!password) password = this.api_token;
    return 'Basic ' + new AuthenticationBuffer(username, password).toString();
  };

  // ## API methods

  // Load the value for a given environment variable on the current
  // application. The results are cached locally, so only a single request will
  // be made.
  Heroku.prototype.config = function(key, fn) {
    this.cachedRequest(this.appPath('config_vars'), function(err, data) {
      if(err) {
        fn(err);
      } else if(data && !data.hasOwnProperty(key)) {
        fn({ 'error': 'Key not found' });
      } else {
        fn(err, data[key]);
      }
    });
  };

  // List all the releases for the current application.
  Heroku.prototype.releases = function(fn) {
    this.request(this.appPath('releases'), fn);
  };

  // List running processes for the current application.
  Heroku.prototype.ps = function(fn) {
    this.request(this.appPath('ps'), fn);
  };

  // Run a one-off process for the current application.
  Heroku.prototype.run = function(command, fn) {
    this.request({
      path:      this.appPath('ps'),
      method:    'POST',
      post_data: { command: command }
    }, fn);
  };

  // Scale an application's processes up or down
  Heroku.prototype.scale = function(process_type, quantity, fn) {
    this.request({
      path:      this.appPath('ps/scale'),
      method:    'POST',
      post_data: { type: process_type, qty: quantity }
    }, fn);
  };

  // Get details on the latest backup for this application using
  // the pgbackups extension.
  Heroku.prototype.latestBackup = function(fn) {
    var that = this;
    this.config('PGBACKUPS_URL', function(err, value) {
      if(err) {
        fn(err);
      } else {
        var database_url = url.parse(value);
        that.request({
          host: database_url.host,
          path: '/client/latest_backup',
          auth: that.auth.apply(that, database_url.auth.split(':'))
        }, fn);
      }
    });
  };

  return Heroku;
})();
