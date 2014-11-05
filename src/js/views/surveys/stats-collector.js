/*jslint nomen: true */
/*globals define: true */

define(function(require, exports, module) {
  'use strict';

  // Libs
  var $ = require('jquery');
  var _ = require('lib/lodash');
  var Backbone = require('backbone');

  // LocalData
  var settings = require('settings');
  var api = require('api');


  // Templates
  var template = require('text!templates/surveys/stats-collector.html');


  var CollectorStatsView = Backbone.View.extend({
    el: '#collector-stats-container',
    template: _.template(template),

    initialize: function(options) {
      _.bindAll(
        this,
        'render'
      );

      this.survey = options.survey;
      this.stats = options.stats;

      this.stats.on('sync', this.render);
    },

    render: function(event) {
      var context = {
        collectors: this.stats.getCollectors()
      };
      this.$el.html(this.template(context));
    }
  });

  return CollectorStatsView;
});
