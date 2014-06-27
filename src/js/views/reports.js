/*jslint nomen: true */
/*globals define: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',
  'settings',
  'api',

  'models/stats',


  // Templates
  'text!templates/responses/reports.html'
],

function($, _, Backbone, settings, api, Stats, template) {
  'use strict';

  var ExportView = Backbone.View.extend({
    el: '#reports-view-container',

    template: _.template(template),

    events: {
      'click .shapefile': 'getShapefile'
    },

    initialize: function(options) {
      _.bindAll(this, 'render', 'graph');

      // Show a given survey
      this.surveyId = options.surveyId;
      this.stats = options.stats;

      // TODO: this is a terrible way to get the stats.
      this.stats = new Stats.Model({
        id: this.surveyId
      });
      this.stats.on('change', this.render);
    },

    render: function(loading) {
      // Set the context & render the page
      console.log(this.stats.toJSON());
      var context = {
        surveyId: this.surveyId,
        baseurl: settings.api.baseurl,
        loading: loading,
        questions: this.stats.toJSON()
      };

      console.log("RENDERING REPORTS", context.questions);
      this.$el.html(this.template(context));

      _.each(context.questions, this.graph);
    },

    valuize: function(values) {
      var data = [];
      _.each(values, function(value, title) {
        data.push({
          x: title,
          y: value
        });
      });
      return data;
    },

    graph: function(question, title) {
      console.log("Time to graph!", question, title);

      var values = this.valuize(question);
      var barChartData = [{
        label: title,
        values: values
      }];
      console.log(barChartData, $('#Collectors'));
      $('#' + title).epoch({
        type: 'bar',
        orientation: 'vertical',
        data: barChartData
      });
    }
  });

  return ExportView;

});
