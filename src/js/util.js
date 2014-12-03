/*jslint nomen: true */
/*globals define */

define(function (require, exports) {
  'use strict';
  exports.numberWithCommas = function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
});
