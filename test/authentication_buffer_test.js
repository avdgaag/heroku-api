var AuthenticationBuffer = require('../lib/authentication_buffer'),
    expect = require('expect.js');

describe(AuthenticationBuffer, function() {
  it('requires a username and password', function() {
    expect(function() {
      new AuthenticationBuffer('username', 'password');
    }).to.not.throwException();
  });

  it('outputs a Base64-encoded string', function() {
    var ab = new AuthenticationBuffer('username', 'password');
    expect(ab.toString()).to.eql('dXNlcm5hbWU6cGFzc3dvcmQ=');
  });
});
