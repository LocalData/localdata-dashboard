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

  var MAX_LENGTH = 20;

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
      _.each(labels, function(label, index) {
        if (label.length > MAX_LENGTH) {
          labels[index] = label.substring(0, MAX_LENGTH) + '...';
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

    makeBarChart: function(question, title, ctx) {
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

      var myBarChart = new Chart(ctx).Bar(data, {
        scaleFontFamily: 'NeuzeitOfficeW01-Regula',
        tooltipFontFamily: 'NeuzeitOfficeW01-Regula',
        tooltipTitleFontFamily: 'NeuzeitOfficeW01-Regula'
      });
    },

    makePieChart: function(question, title, ctx) {
      // Set up the colors for the pie chart
      var colors = {};
      _.each(_.keys(question), function(key, index ) {
        colors[key] = settings.colorRange[index + 1];
      });
      colors.no = colors['no response'];

      // Set up the data
      var data = [];
      _.each(question, function(value, answer) {
        if (answer === 'no response') { answer = 'no'; }
        data.push({
          value: value,
          color: colors[answer],
          highlight: '#ffe000',
          label: answer
        });
      });

      var myPieChart = new Chart(ctx).Pie(data, {
        animation: false
      });
    },

    // Graph the reports!
    graph: function(question, title) {
      console.log("Time to graph!", question, title);
      var chartType;

      // Skip unhelpful qustions,
      // like those with lots of answers
      if(title === 'id') { return; }
      if(title === 'Collectors') { return; }
      if(_.size(question) > 8) { return; }

      // Prep the HTML for the question
      this.report(question, title);

      var $elt = $('#' + title).get(0);
      if (!$elt) {
        return;
      }
      var ctx = $elt.getContext('2d');

      // We'll use pie charts for yes / no questions
      if(_.size(question) === 2) {
        this.makePieChart(question, title, ctx);
      }else {
        this.makeBarChart(question, title, ctx);
      }

    }
  });

  return ExportView;

});
