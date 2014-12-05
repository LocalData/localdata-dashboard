/*jslint nomen: true */
/*globals define: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',
  'Chart',
  'moment',

  // LocalData
  'settings',
  'api',

  // Models
  'models/stats',

  // Templates
  'text!templates/responses/reports.html',
  'text!templates/responses/report.html'
],

function($, _, Backbone, Chart, moment, settings, api, Stats, template, reportTemplate) {
  'use strict';

  var MAX_LENGTH = 14;

  var ReportView = Backbone.View.extend({
    el: '#reports-view-container',

    template: _.template(template),
    reportTemplate: _.template(reportTemplate),

    events: {
      'click .shapefile': 'getShapefile'
    },

    initialize: function(options) {
      _.bindAll(this, 'render', 'report', 'graph');

      this.survey = options.survey;
      this.stats = options.stats;
      this.forms = options.forms;

      this.stats.on('change', this.render);



      this.titles = this.forms.getFlattenedForm();
    },

    render: function() {
      var context = {};
      console.log("Reports: using stats", this.stats.toJSON());

      context.count = this.survey.get('responseCount') || 0;
      context.stats = this.stats.toJSON();

      // Get list of top questions
      var form = this.forms.getMostRecentForm();
      console.log("Form", form);

      // Get list of rest of the questions
      console.log("Rendering reports");
      this.$el.html(this.template(context));

      this.makeLineChart();

      _.each(this.titles, this.graph); //was this.stats.toJSON()
    },

    // Make a shorter label for long questions
    labelize: function(answers, question) {
      var labels = [];
      _.each(answers, function(answer) {
        if (answer.text === 'no response') {
          labels.push('no response');
          return;
        }

        // Remove the prepended quesiton
        var label = answer.text.substring(question.text.length + 2);

        // Truncate really long questions
        if (label > MAX_LENGTH) {
          label = label.substring(0, MAX_LENGTH) + '...';
        }

        labels.push(label);
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


    getCheckboxData: function(question) {
      var stats = this.stats.toJSON();

      var data = [];
      _.each(question.answers, function(answer) {
        if(stats[answer.name]) {
          data.push(stats[answer.name].yes);
        } else {
          data.push(0);
        }
      });
      return data;
    },


    makeCheckboxChart: function(question, title, ctx) {
      console.log("Making checkbox chart", question, title);

      var data = {
        labels: this.labelize(question.answers, question),
        datasets: [
          {
            label: "Dataset!",
            fillColor: "#58aeff",
            strokeColor: "#daedff",
            highlightFill: "#ffad00",
            highlightStroke: "#fff3da",
            data: this.getCheckboxData(question)
          }
        ]
      };

      var myBarChart = new Chart(ctx).Bar(data, {
        scaleFontFamily: 'NeuzeitOfficeW01-Regula',
        tooltipFontFamily: 'NeuzeitOfficeW01-Regula',
        tooltipTitleFontFamily: 'NeuzeitOfficeW01-Regula'
      });
    },

    makeLineChart: function() {
      // Render the chart of users over time.
      var userActivityChart = $('#chart-user-activity').get(0);
      if (!userActivityChart) {
        return;
      }
      console.log("Using activity chart", userActivityChart);
      var ctx = userActivityChart.getContext('2d');


      console.log("GEtting user activity");

      $.get('https://localhost:3443/api/surveys/06a311f0-4b1a-11e3-aca4-1bb74719513f/stats/activity?after=1385320961495&resolution=296000000&until=1416857080118')
        .done(function(stats) {
          console.log("GOT user activity data", stats);

          var labels = [];
          var data = [];
          _.each(stats.stats.activity, function(a) {
            data.push(a.count);
            var created = moment(a.ts).format("Do YYYY"); //- h:mma
            labels.push(created);
            console.log("CHECKING", a, created);
          });

          var chartOptions = {
            labels: labels,
            datasets: [
                {
                    label: "My First dataset",
                    fillColor: "rgba(220,220,220,0.2)",
                    strokeColor: "rgba(220,220,220,1)",
                    pointColor: "rgba(220,220,220,1)",
                    pointStrokeColor: "#fff",
                    pointHighlightFill: "#fff",
                    pointHighlightStroke: "rgba(220,220,220,1)",
                    data: data
                }
            ]
          };

          console.log("using options", labels, data);

          var myLineChart = new Chart(ctx).Line(chartOptions, {}) ;

        });
    },

    makePieChart: function(question, title, ctx) {
      // console.log("Making pie chart", question, title, ctx);
      // Set up the colors for the pie chart
      var colors = {};
      _.each(_.keys(question), function(key, index ) {
        colors[key] = settings.colorRange[index + 1];
      });
      colors['no response'] = settings.colorRange[0];

      // Set up the data
      var data = [];
      _.each(question, function(value, answer) {
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
    graph: function(question, slug) {
      // console.log("Time to graph!", question, slug);
      var chartType;
      var stats = this.stats.toJSON();

      // Skip unhelpful qustions,
      // like those with lots of answers
      if (question.type === 'file') { return; }
      if (question.type === 'text') { return; }

      // Prep the HTML for the question
      this.report(question, slug);

      var $elt = $('#' + slug).get(0);
      if (!$elt) {
        return;
      }
      var ctx = $elt.getContext('2d');

      // We'll use pie charts for yes / no questions
      if (question.type === 'checkbox') {
        this.makeCheckboxChart(question, slug, ctx);  // this.makeBarChart(question, slug, ctx);
      } else if (question.type === undefined) {
        question = stats[question.name];
        this.makePieChart(question, slug, ctx);
      }

    }
  });

  return ReportView;

});
