module.exports = (function() {
  // Utility function to enable binding a given function to a given context --
  // making using object methods as callbacks easier.
  var bind = function(fn, context) {
    return function() {
      fn.apply(context, arguments);
    };
  };

  // The JsonData object accumulates HTTP response data and parses the data as
  // JSON, returning the result, when you're done.
  //
  // You can start, should you want to, with an initial value (defaults to an
  // empty string).
  function JsonData(initial) {
    if(!initial) initial = '';
    this.data = initial;
    this.push = bind(this.push, this);
  }

  // Add more data to the internal container.
  JsonData.prototype.push = function(data) {
    this.data += data;
  };

  // Parse the current data contents as JSON.
  JsonData.prototype.toJSON = function() {
    return JSON.parse(this.data);
  };

  return JsonData;
})();

