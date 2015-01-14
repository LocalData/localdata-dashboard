/*jslint nomen: true */
/*globals define */

define(function (require) {
  'use strict';

  var $ = require('jquery');
  var _ = require('lib/lodash');
  var Backbone = require('backbone');

  // LocalData
  var settings = require('settings');

  // Templates
  var template = require('text!templates/projects/surveys/legend.html');

  var LegendView = Backbone.View.extend({
    className: 'legend',
    filters: {},

    template: _.template(template),

    events: {
      "click .question-title": "selectQuestion",
      "click .answer": "selectAnswer"
    },

    initialize: function(options) {
      _.bindAll(this, 'render', 'reset');

      this.filters = options.filters;
      this.category = options.category;

      console.log("Init legend with options", options);

      // We alias answers to values to make this view more generic
      // (useful in the projects view)
      if (this.category.answers) {
        this.category.values = this.category.answers;
      }
      if (!this.category.text) {
        this.category.text = this.filters.question;
      }

    },

    render: function() {
      var context = {
        category: this.category,
        filters: this.filters
      };
      this.$el.html(this.template(context));
      return this.$el;
    },

    /**
     * Reset any filters
     */
    reset: function(event) {
      if (event) {
        event.preventDefault();
      }

      this.trigger('filterReset');
    },

    selectQuestion: function(event) {
      if (event) {
        event.preventDefault();
      }

      // TODO
      // Pass the question instead of the event?`
      // var $question = $(event.target).parent();
      // var question = $question.attr('data-question');

      this.trigger('questionSelected', event);
    },

    /**
     * Show only responses with a specific answer
     */
    selectAnswer: function(event) {
      if (event) {
        event.preventDefault();
      }

      // TODO
      // Pass the answer instead of the event?
      // var $answer = $(event.target);
      // var answer = $answer.attr('data-answer');

      this.trigger('answerSelected', event);
    }

  });

  return LegendView;
});
