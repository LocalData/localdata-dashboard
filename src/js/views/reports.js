/*jslint nomen: true */
/*globals define: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',
  'Chart',

  // LocalData
  'settings',
  'api',

  // Models
  'models/stats',

  // Templates
  'text!templates/responses/reports.html',
  'text!templates/responses/report.html'
],

function($, _, Backbone, Chart, settings, api, Stats, template, reportTemplate) {
  'use strict';

  var ExportView = Backbone.View.extend({
    el: '#reports-view-container',

    template: _.template(template),
    reportTemplate: _.template(reportTemplate),

    events: {
      'click .shapefile': 'getShapefile'
    },

    initialize: function(options) {
      _.bindAll(this, 'render', 'report', 'graph');

      this.surveyId = options.surveyId;
      this.stats = options.stats;
      this.forms = options.forms;

      // TODO: this is a terrible way to get the stats.
      this.stats = new Stats.Model({
        id: this.surveyId
      });
      this.stats.on('change', this.render);

      this.titles = this.forms.getFlattenedForm();
      console.log("TITLES", this.titles);
    },

    render: function() {
      console.log("RENDERING REPORTS");
      this.$el.html(this.template({}));
      _.each(this.stats.toJSON(), this.graph);
    },

    // Make a shorter label for long questions
    labelize: function(labels) {
      var maxLength = 10;
      _.each(labels, function(label, index) {
        if (label.length > maxLength) {
          labels[index] = label.substring(0, maxLength) + '...';
        }
      });
      return labels;
    },

    // Render the graph container
    report: function(question, slug) {

      // Check if we have a nice title for this question
      var title = slug;
      if (this.titles[slug]) {
        title = this.titles[slug].text;
      }

      var context = {
        title: title,
        slug: slug
      };
      $('#report-list').append(this.reportTemplate(context));
    },

    // Graph the reports!
    graph: function(question, title) {
      console.log("Time to graph!", question, title);

      // Skip unhelpful qustions,
      // like those with lots of answers
      if(title === 'id') { return; }
      if(title === 'Collectors') { return; }
      if(_.size(question) > 8) { return; }

      this.report(question, title);

      var data = {
        labels: this.labelize(_.keys(question)),
        datasets: [
          {
            label: "Dataset!",
            fillColor: "#58aeff",
            strokeColor: "#daedff",
            highlightFill: "#ffad00",
            highlightStroke: "#fff3da",
            data: _.values(question)
          }
        ]
      };

      var elt = $('#' + title).get(0);
      if (!elt) {
        return;
      }
      var ctx = elt.getContext('2d');
      var myBarChart = new Chart(ctx).Bar(data, {
        scaleFontFamily: 'NeuzeitOfficeW01-Regula',
        tooltipFontFamily: 'NeuzeitOfficeW01-Regula',
        tooltipTitleFontFamily: 'NeuzeitOfficeW01-Regula'
      });
    }
  });

  return ExportView;

});
