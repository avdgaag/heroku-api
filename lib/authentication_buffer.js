module.exports = (function() {
  // An AuthenticationBuffer joins a username and password into an encoded
  // string suitable for use with HTTP authentication headers.
  function AuthenticationBuffer(username, password) {
    this.auth_string = '' + username + ':' + password;
  }

  AuthenticationBuffer.prototype.toString = function() {
    return new Buffer(this.auth_string).toString('base64');
  };

  return AuthenticationBuffer;
})();
