/*jslint nomen: true */
/*globals define: true */

define(function(require, exports, module) {
  'use strict';

  var $ = require('jquery');
  var _ = require('lib/lodash');
  var Backbone = require('backbone');
  var Chart = require('Chart');

  // LocalData
  var settings = require('settings');
  var api = require('api');

  // Models
  var Stats = require('models/stats');

  var template = require('text!templates/responses/reports.html');
  var reportTemplate = require('text!templates/responses/report.html');
  var statsTemplate = require('text!templates/responses/stats.html');

  var MAX_LENGTH = 14;

  var ANSWER = 'response';
  var NOANSWER = 'no response';

  var ExportView = Backbone.View.extend({
    el: '#reports-view-container',

    template: _.template(template),
    reportTemplate: _.template(reportTemplate),
    statsTemplate: _.template(statsTemplate),

    events: {
      'click .shapefile': 'getShapefile'
    },

    initialize: function(options) {
      _.bindAll(this, 'render', 'renderStats', 'report', 'graph');

      this.surveyId = options.surveyId;
      this.stats = options.stats;
      this.forms = options.forms;

      // TODO: this is a terrible way to get the stats.
      this.stats = new Stats.Model({
        id: this.surveyId
      });
      this.stats.on('change', this.render);

      this.titles = this.forms.getFlattenedForm();
      console.log("FLATTENED FORM", this.titles);
    },

    renderStats: function() {
      // Match the question names and answer values from the form with stats and colors.
      var questions = this.forms.getFlattenedForm();
      var stats = this.stats;

      if (stats.has('reviewed')) {
        questions.reviewed = {
          text: 'Review status',
          answers: [{
            text: 'flagged',
            value: 'flagged'
          }, {
            text: 'accepted',
            value: 'accepted'
          }, {
            text: 'no response',
            value: 'no response'
          }]
        };
      }

      _.each(_.keys(questions), function (question) {
        var answerObjects = {};
        var questionStats = stats.get(question);
        var type = questions[question].type;
        if (type === 'text') {
          var total = _.reduce(questionStats, function (sum, count) {
            return sum + count;
          }, 0);

          var noResponseCount;
          if (questionStats) {
            noResponseCount = questionStats[NOANSWER];
          }
          if (noResponseCount === undefined) {
            noResponseCount = 0;
          }

          questions[question].answers = [{
            text: ANSWER,
            value: ANSWER,
            count: total - noResponseCount,
            color: settings.colorRange[1]
          }, {
            text: NOANSWER,
            value: NOANSWER,
            count: noResponseCount,
            color: settings.colorRange[0]
          }];
        } else if (type === 'file') {
          // TODO: We need to see photo upload numbers in the stats (or
          // somewhere) to report them in the UI.

          questions[question].answers = [{
            text: ANSWER,
            value: ANSWER,
            count: '',
            color: settings.colorRange[1]
          }, {
            text: NOANSWER,
            value: NOANSWER,
            count: '',
            color: settings.colorRange[0]
          }];
        } else {
          var answers = questions[question].answers;
          _.each(answers, function (answer, index) {
            if (!questionStats) {
              answer.count = 0;
            } else {
              // Get the count from the stats object.
              answer.count = questionStats[answer.value];
              if (answer.count === undefined) {
                answer.count = 0;
              }
            }

            // Get the color.
            // The last "answer" is the no-response placeholder, which gets the
            // zero-index color.
            answer.color = settings.colorRange[(index + 1) % answers.length];
          });
        }
      });

      var context = {
        questions: questions,
        mapping: this.forms.map()
      };
      this.$el.html(this.template(context));

      this.$el.find('#stats-list').html(this.statsTemplate(context));
    },

    render: function() {
      console.log("Rendering reports");
      this.$el.html(this.template({}));

      console.log("Got stats", this.stats.toJSON());

      // Render the stats
      this.renderStats();

      // Render the graphs
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

  return ExportView;

});
