var JsonData = require('../lib/json_data'),
    expect = require('expect.js');

describe('JsonData', function() {
  it('should start with empty data', function() {
    expect(new JsonData().data).to.eql('');
  });

  it('allows setting arbitrary initial data', function() {
    expect(new JsonData('foo').data).to.eql('foo');
  });

  it('parses data as JSON', function() {
    var json_string = '{ "foo": "bar" }';
    expect(new JsonData(json_string).toJSON()).to.eql({ 'foo': 'bar' });
  });

  it('adds new data to the data streaM', function() {
    var jd = new JsonData('foo');
    jd.push('bar');
    expect(jd.data).to.eql('foobar');
  });
});
