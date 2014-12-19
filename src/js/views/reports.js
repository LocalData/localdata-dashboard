/*jslint nomen: true */
/*globals define: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',
  'Chart',
  'd3',
  'lib/c3',
  'moment',

  // LocalData
  'settings',
  'api',

  // Models
  'models/stats',

  // Templates
  'text!templates/responses/reports.html',
  'text!templates/responses/report.html',
  'text!templates/responses/report-top-question.html'
],

function($, _, Backbone, Chart, d3, c3, moment, settings, api, Stats, template, reportTemplate, topQuestionTemplate) {
  'use strict';

  // c3 = window.c3;

  var MAX_LENGTH = 14;
  Chart.defaults.global.responsive = true;

  var numberWithCommas = function(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  var statDetails = function(stats) {
    var s = {};
    var sum = _.reduce(stats, function(memo, stat){ return memo + stat; }, 0);

    _.each(stats, function(stat, key) {
      s[key] = {
        count: stat,
        prettyCount: numberWithCommas(stat),
        percent: stat / sum * 100,
        prettyPercent: stat / sum * 100
      };
    });

    return s;
  };

  var ReportView = Backbone.View.extend({
    el: '#reports-view-container',

    template: _.template(template),
    reportTemplate: _.template(reportTemplate),
    topQuestionTemplate: _.template(topQuestionTemplate),

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

      // Don't render if we don't have the stats yet
      if(_.isEmpty(this.stats.toJSON())) {
        return;
      }

      // First, set up some basic stats and render those while
      // we wait for the rest of the stats to load
      context.count = this.survey.get('responseCount') || 0;
      context.count = numberWithCommas(context.count);
      context.stats = this.stats.toJSON();

      var form = this.forms.getMostRecentForm();
      this.$el.html(this.template(context));

      // Start making the user activity chart
      this.makeUserActivityChart();

      // Highlight the top question
      this.makeTopQuestionChart();

      _.each(this.titles, this.graph); //was this.stats.toJSON()
    },

    makeTopQuestionChart: function() {
      // Add a stat for the first question
      var formOrder = this.forms.getMostRecentForm().toJSON().questions;
      var firstQuestion = formOrder[0];
      var firstQuestionStats = this.stats.toJSON()[firstQuestion.name];
      var enhancedStats = statDetails(firstQuestionStats);

      console.log("Working with titles", firstQuestion, firstQuestionStats);
      $('#report-top-question').html(this.topQuestionTemplate({
        question: firstQuestion,
        stats: enhancedStats
      }));
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

    makeBarChart: function(data, title, selector) {
      console.log("Making bar chart", data, title, selector);

      var values = _.values(data).unshift('count');
      var labels = _.keys(data).unshift('x');

      var columns = [];
      _.each(data, function (value, key) {
        columns.push([key, value]);
      });

      console.log("Using columns", columns);

      // TODO - rig up the data
      var chart = c3.generate({
        bindto: selector,
        data: {
            columns: columns,
            type: 'bar'
        },
        bar: {
            width: {
                ratio: 0.5 // this makes bar width 50% of length between ticks
            }
            // or
            //width: 100 // this makes bar width 100px
        }
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

    makeUserActivityChart: function() {
      // Render the chart of users over time.
      var userActivityChart = $('#chart-user-activity').get(0);
      if (!userActivityChart) {
        return;
      }

      // XXX TODO
      // Use the survey ID
      $.get('https://localhost:3443/api/surveys/06a311f0-4b1a-11e3-aca4-1bb74719513f/stats/activity?after=1385320961495&resolution=296000000&until=1416857080118')
        .done(function(stats) {
          console.log("Got user activity data", stats);

          var labels = ['Responses'];
          var data = ['Responses per days'];
          _.each(stats.stats.activity, function(a) {
            data.push(a.count);
            var created = moment(a.ts).format("Do YYYY");
            labels.push(created);
            // Hack to hide labels
            // TODO: maybe show every third?
            // & use moment.js
            // labels.push('');
          });

          var chart = c3.generate({
            bindto: '#chart-user-activity',
            data: {
              x: 'Responses',
              columns: [
                labels,
                data
              ],
              colors: {
                  counts: '#58aeff'
              }
            },
            size: {
              height: 200
            },
            interaction: {
              enabled: false
            },
            axis: {
              x: {
                type: 'category',
                tick: {
                  // this also works for non timeseries data
                  values: labels // ['2013-01-05', '2013-01-10']
                }
              }
            }
          });
        });
    },


    /**
     * Graph the questions
     * @param  {Object} question
     * @param  {String} slug     Question slug, eg is-property-vacant
     */
    graph: function(question, slug) {
      var chartType;
      var stats = this.stats.toJSON();

      // Skip unhelpful qustions, like those with lots of answers
      if (question.type === 'file') { return; }
      if (question.type === 'text') { return; }

      // Prep the HTML for the question and add it to the DOM
      this.report(question, slug);

      // Find the element we just created and create a Canvas context for it
      var selector = '#' + slug;
      var $elt = $(selector).get(0);
      if (!$elt) {
        return;
      }

      // Decide what type of chart to use.
      // We'll use pie charts for yes / no questions
      // if (question.type === 'checkbox') {
      //   //this.makeCheckboxChart(question, slug, selector);  // this.makeBarChart(question, slug, ctx);
      // } else if (question.type === undefined)
      var data = stats[question.name];
      console.log("Getting stats for question", question, stats, data);
      this.makeBarChart(data, slug, selector);

    }
  });

  return ReportView;

});
