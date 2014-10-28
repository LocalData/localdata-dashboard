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
      _.bindAll(this, 'parse', 'url', 'getCollectors');

      this.attributes = {}; // otherwise fetch doesn't seem to remove old vals
      this.params = options.params || {};
      this.fetch();
    },

    parse: function(response) {
      return response.stats;
    },

    numberWithCommas: function(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },

    dedupeCollectors: function() {
      var deduped = {};
      _.each(this.get('Collectors'), function(count, name) {
        var cleanName = name.trim().toLowerCase();

        if(_.has(deduped, cleanName)) {
          deduped[cleanName] += count;
        } else {
          deduped[cleanName] = count;
        }
      });

      return deduped;
    },

    // Get a list of the collectors, ordered by count.
    getCollectors: function() {
      if (!this.get('Collectors')) {
        return [];
      }

      var collectors = this.dedupeCollectors();
      var collectorList = [];
      _.each(collectors, function(count, name) {
        collectorList.push({
          name: name,
          count: count,
          prettyCount: this.numberWithCommas(count)
        });
      }.bind(this));

      var sorted = _.sortBy(collectorList, function(x) { return -x.count; });
      return sorted;
    }
  });

  return Stats;
});
