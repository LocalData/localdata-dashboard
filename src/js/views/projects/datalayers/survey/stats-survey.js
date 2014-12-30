/*jslint nomen: true */
/*globals define */

define(function (require) {
  'use strict';

  var $ = require('jquery');
  var _ = require('lib/lodash');
  var d3 = require('d3');
  var c3 = require('lib/c3');
  var Backbone = require('backbone');
  var util = require('util');

  // LocalData
  var settings = require('settings');

  // Models
  var Activity = require('models/activity');

  // Templates
  var template = require('text!templates/projects/surveys/stats-survey.html');
  var graphTemplate = require('text!templates/projects/surveys/stats-survey-graph.html');

  var DURATION = 100;

  c3 = window.c3;

  /**
   * Intended for shorter lists of responses (arbitrarily <25)
   * Doesn't include pagination, which isn't relevant in this case.
   * See responses/responses/ListView for a heavyweight implementation.
   */
  var StatsView = Backbone.View.extend({
    filters: {},
    $legend: null,

    template: _.template(template),
    graphTemplate: _.template(graphTemplate),

    events: {
      "click .close-settings": "close"
    },

    initialize: function(options) {
      _.bindAll(
        this,
        'render',
        'graph',
        'activityGraph'
      );

      this.survey = options.survey;
      this.forms = options.forms;
      this.stats = options.stats;
      this.layerDef = options.layerDef;
      this.exploration = options.exploration;
      this.title = options.title;
    },

    close: function() {
      this.$el.hide();
    },

    render: function() {
      var count = util.numberWithCommas(this.survey.get('queryCount'));
      this.activityId = _.uniqueId('activity-'); // used for the activity graph

      var context = {
        activityId: this.activityId,
        title: this.title,
        type: this.layerName || 'responses',
        count: count,
        slug: this.survey.get('slug')
      };
      this.$el.html(this.template(context));

      _.each(this.exploration, this.graph);

      var key = _.keys(this.layerDef.query)[0];
      var val = this.layerDef.query[key];
      var responseFilters = {};
      responseFilters[key.replace('entries.responses.', '')] = val;
      this.activity = new Activity.Model({
        id: this.survey.get('id'),
        params: {
          responses: responseFilters
        }
      });
      // TODO
      // Reset doesn't get noticed (even with reset: true)
      this.activity.on('change', this.activityGraph);
      this.activity.fetch();

      return this.$el;
    },

    activityGraph: function () {
      var data = this.activity.toJSON();
      var counts = ['responses'];
      var times = ['x'];

      // Format counts and labels in the way that c3 expects.
      var vals = _.each(data, function(d){
        counts.push(d.count);
        times.push(d.date.month + '-' + d.date.year);
      });

      var chart = c3.generate({
        bindto: '#' + this.activityId,
        data: {
          x: 'x',
          columns: [
            times,
            counts
          ],
          xFormat: '%m-%Y'
        },
        axis: {
          x: {
            type: 'timeseries',
            tick: {
              format: '%b \'%y',
              culling: {
                max: 5 // max 5 ticks displayed
              }
            }
          },
          y: {
            show: false
          }
        },
        legend: {
          show: false
        },
        point: {
          r: 6,
          select: {
            r: 8
          }
        },
        padding: {
          left: 15,
          right: 15
        }
      });

    },

    // Generate a graph for a question
    // XXX TODO
    // use the exploration options instead.
    graph: function (question) {
      if (!question.question) {
        return;
      }

      // Skip photo / text questions for now
      if(question.values.length === 1) {
        return;
      }

      // Add stats to each value
      var stats = this.stats.toJSON()[question.question];

      // Get the sum of all the answeres we care about
      // Used later to caclulate percentages
      var sum = 0;

      _.each(question.values, function(value) {
        sum += stats[value.name];
      });

      // We could instead get the sum of all answers to the question,
      // but that includes deceptive 'no response' answers.
      // var sum = _.reduce(_.values(stats), function(memo, num){ return memo + num; }, 0);

      _.each(question.values, function(value, index) {
        if (!stats[value.name]) {
          console.log("Missing", value, stats);
          return;
        }
        question.values[index].count = stats[value.name];
        question.values[index].prettyCount = util.numberWithCommas(stats[value.name]);
        question.values[index].percent = stats[value.name] / sum * 100;
      });

      var $el = this.graphTemplate(question);
      this.$el.find('.graphs').append($el);
    }
  });

  return StatsView;

});
