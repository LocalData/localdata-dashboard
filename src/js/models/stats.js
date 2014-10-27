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

  var Stats = {};

  Stats.Model = Backbone.Model.extend({
    urlRoot: settings.api.baseurl + "/surveys/",

    url: function() {
      return this.urlRoot + this.id + '/stats?' +  $.param(this.params);
    },

    initialize: function(options) {
      _.bindAll(this, 'parse', 'url');

      this.attributes = {}; // otherwise fetch doesn't seem to remove old vals
      this.params = options.params || {};
      this.fetch();
    },

    parse: function(response) {
      return response.stats;
    }
  });

  return Stats;
});
