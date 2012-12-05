module.exports = (function() {
  function AuthenticationBuffer(username, password) {
    this.auth_string = '' + username + ':' + password;
  }

  AuthenticationBuffer.prototype.toString = function() {
    return new Buffer(this.auth_string).toString('base64');
  };

  return AuthenticationBuffer;
})();
