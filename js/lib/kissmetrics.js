/*globals define: true */

define(function () {

  "use strict";

  var _kmq = _kmq || [];
  var _kmk = _kmk || '1f57015c5e8f46bdc07701e1aa74c6cbdf565383';
  function _kms(u){
    setTimeout(function(){
      var d = document, f = d.getElementsByTagName('script')[0],
      s = d.createElement('script');
      s.type = 'text/javascript'; s.async = true; s.src = u;
      f.parentNode.insertBefore(s, f);
    }, 1);
  }
  _kms('//i.kissmetrics.com/i.js');
  _kms('//doug1izaerwt3.cloudfront.net/' + _kmk + '.1.js');
  
  return _kmq;
});
