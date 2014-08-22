/*jslint nomen: true */
/*globals define, FileReader: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',
  'lib/tinypubsub',

  // LocalData
  'settings',
  'util/util'
],

/**
 * Create a schema from a set of rows
 */

function($, _, Backbone, events, settings, Util) {
  'use strict';

  var RateLimiter = Backbone.View.extend({
    initialize: function(options) {
      _.bindAll(this, 'startItem');
      this.done = options.done;
      this.fn = options.fn; // fn to run
      this.list = options.list;
      this.wait = options.wait; // wait time in ms
      this.started = 0;
      this.startItem(this.list[0]);
    },

    startItem: function(item) {
      this.fn(item);
      this.started++;
      if(this.started === this.list.length) {
        return;
      }
      setTimeout(function() {
        this.startItem(this.list[this.started]);
      }.bind(this), this.wait);
    }
  });

  return RateLimiter;
});
