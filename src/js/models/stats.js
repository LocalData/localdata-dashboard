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
      console.log("URL", this.urlRoot + this.id + '/stats/');
      return this.urlRoot + this.id + '/stats/';
    },

    initialize: function(options) {
      _.bindAll(this, 'parse', 'url');
      this.fetch();
    },

    parse: function(response) {
      return response.stats;
    }

  });

  return Stats;
});
