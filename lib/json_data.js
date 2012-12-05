module.exports = (function() {
  var bind = function(fn, context) {
    return function() {
      fn.apply(context, arguments);
    };
  };

  function JsonData(initial) {
    if(!initial) initial = '';
    this.data = initial;
    this.push = bind(this.push, this);
  }
  JsonData.prototype.push = function(data) {
    this.data += data;
  };
  JsonData.prototype.toJSON = function() {
    return JSON.parse(this.data);
  };
  return JsonData;
})();

