var Heroku = require('../index'),
    expect = require('expect.js'),
    nock  = require('nock');

describe('Heroku', function() {
  describe('instantiation', function() {
    it('creates new object given API token and app name', function() {
      expect(function() {
        new Heroku({ app: 'my-app', api_token: 'foo' });
      }).to.not.throwException()
    });

    it('requires an API token', function() {
      expect(function() {
        new Heroku({ app: 'my-app' });
      }).to.throwException(/API token required/);
    });

    it('requires an application name', function() {
      expect(function() {
        new Heroku({ api_token: 'foo' });
      }).to.throwException(/Application name required/);
    });
  });

  describe('requests', function() {
    describe('config', function() {
      var heroku, mocked_request;

      beforeEach(function() {
        heroku = new Heroku({ app: 'foo', api_token: 'bar' });
      });

      describe('when unsuccessful', function() {
        beforeEach(function() {
          mocked_request = nock('https://api.heroku.com')
            .get('/apps/foo/config_vars')
            .reply(500, { 'error': 'oh noes' });
        });

        it('sets an error', function(done) {
          heroku.config('bla', function(err) {
            expect(err).to.be.ok();
            mocked_request.done();
            done();
          });
        });
      });

      describe('when successful', function() {
        beforeEach(function() {
          mocked_request = nock('https://api.heroku.com')
            .get('/apps/foo/config_vars')
            .reply(200, { 'foo': 'bar', 'msg': 'Hello, world' });
        });

        it('reads a config key', function(done) {
          heroku.config('msg', function(err, val) {
            expect(val).to.eql('Hello, world');
            mocked_request.done();
            done();
          });
        });

        it('memoizes the results', function(done) {
          heroku.config('msg', function(err, msg) {
            expect(msg).to.eql('Hello, world');
            mocked_request.done();
            heroku.config('foo', function(err, foo) {
              expect(foo).to.eql('bar');
              done();
            });
          });
        });
      });
    });
  });
});
