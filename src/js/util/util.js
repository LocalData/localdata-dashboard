/*jslint nomen: true */
/*globals define, FileReader: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',
  'lib/tinypubsub',

  'settings'
],

/**
 * Create a schema from a set of rows
 */

function($, _, Backbone, events, settings) {
  'use strict';

  var Util = {
    slugify: function(text) {
      text = text.replace(/[^-a-zA-Z0-9,&\s]+/ig, '');
      text = text.replace(/\s/gi, "-");
      text = text.replace(/,/gi, '');
      text = text.replace(/&/g, 'and');
      return text;
    }
  };

  return Util;
});
