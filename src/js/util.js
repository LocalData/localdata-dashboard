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

  exports.track = function(event, data) {
    Intercom('trackEvent', event, data);
  };
  
  // Take an array of URLs and return a template of the form
  // `//{s}.foo.bar/tiles/baz` and an array of substitutions for `s` that will
  // generate the original URLs
  exports.templatizeURLs = function templatizeURLs(urls) {
    if (urls.length === 1) {
      return {
        template: urls[0],
        subs: ['']
      };
    }

    // Index of the first differing character.
    var first;
    // Index of the last differing character, using negative indexing (-1 is the
    // last character).
    var last;
    var count = urls.length;
    var minLength = urls.reduce(function (memo, url) {
      return Math.min(memo, url.length);
    }, Number.POSITIVE_INFINITY);

    // Find the first character that differs.
    var same = true;
    var i;
    var k = 0;
    while (same && k < minLength) {
      for (i = 1; i < count && same; i += 1) {
        if (urls[i][k] !== urls[i-1][k]) {
          same = false;
        }
      }
      if (same) {
        k += 1;
      }
    }
    first = k;

    // Find the end of the differing region, using negative indexing, so that we
    // can index the same way into different-length URLs.
    same = true;
    k = -1;
    while (same && (minLength + k) >= first) {
      for (i = 1; i < count && same; i += 1) {
        if (urls[i][urls[i].length + k] !== urls[i-1][urls[i-1].length + k]) {
          same = false;
        }
      }
      if (same) {
        k -= 1;
      }
    }
    last = k;

    var template = urls[0].slice(0, first) + '{s}' + urls[0].slice(urls[0].length + last + 1);
    var subs = urls.map(function (url) {
      return url.slice(first, url.length + last + 1);
    });

    return {
      template: template,
      subs: subs
    };
  };

});
