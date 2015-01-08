/*jslint nomen: true */
/*globals define: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',
  'settings'
],

function($, _, Backbone, settings) {
  'use strict';

  var Activity = {};

  Activity.Model = Backbone.Model.extend({
    urlRoot: settings.api.baseurl + "/surveys/",

    url: function() {
      var url = this.urlRoot + this.id + '/stats/activity/monthly';
      if (this.params) {
        url += '?' + $.param(this.params);
      }
      return url;
    },

    initialize: function(options) {
      _.bindAll(this, 'parse', 'url');

      this.attributes = {}; // otherwise fetch doesn't seem to remove old vals
      this.params = options.params || {};
    },

    parse: function(response) {
      return response.stats.activity;
    },

    // Adds commas to numbers to make them look good. 2000000 => 2,000,000
    numberWithCommas: function(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
  });

  return Activity;
});
