/*jslint nomen: true */
/*globals define */

define(function (require, exports) {
  'use strict';
  exports.numberWithCommas = function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  exports.dotPath = function dotPath(obj, path) {
    return path.split('.').reduce(function (memo, index) {
      if (!memo) { return memo; }
      return memo[index];
    }, obj);
  };
});
