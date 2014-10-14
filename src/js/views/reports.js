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
  var statsTemplate = require('text!templates/responses/reports.html');

  var MAX_LENGTH = 14;

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
      console.log("FLATTENED FORM", this.titles);
    },

    render: function() {
      console.log("Rendering reports");
      this.$el.html(this.template({}));
      console.log("Got stats", this.stats.toJSON());
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
