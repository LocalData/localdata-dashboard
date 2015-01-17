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
  var template = require('text!templates/projects/surveys/settings-survey.html');
  var loadingTemplate = require('text!templates/filters/loading.html');
  var legendTemplate = require('text!templates/projects/surveys/legend.html');

  var DURATION = 100;

  /**
   * Intended for shorter lists of responses (arbitrarily <25)
   * Doesn't include pagination, which isn't relevant in this case.
   * See responses/responses/ListView for a heavyweight implementation.
   */
  var FilterView = Backbone.View.extend({
    filters: {},
    $legend: null,

    template: _.template(template),
    loadingTemplate: _.template(loadingTemplate),
    legendTemplate: _.template(legendTemplate),

    events: {
      "click .select": "showOptions",
      "click .question-title": "selectQuestion",
      "click .answer": "selectAnswer",
      "click .clear": "reset",
      "click .close-settings": "close"
    },

    initialize: function(options) {
      _.bindAll(this, 'render', 'reset');

      this.survey = options.survey;
      this.forms = options.forms;
      this.stats = options.stats;
      this.exploration = options.exploration;
      this.filters = {};
    },

    close: function() {
      this.$el.hide();
    },

    render: function() {
      var context = {
        categories: this.exploration,
        filters: this.filters
      };
      console.log("Rendering filter with context", context);
      this.$el.html(this.template(context));
      return this.$el;
    },

    updateLegend: function () {
      console.log("Filter set, updating legend", this.filters);
      var category;
      if (this.filters.question) {
        category = _.find(this.exploration, { name: this.filters.question });
      }

      this.trigger('updated', {
        category: category,
        filters: this.filters
      });
      return;
    },

    showOptions: function(event) {
      event.preventDefault();
      $('.filters .options').show();
    },

    /**
     * Reset any filters
     */
    reset: function(event) {
      if(event) {
        event.preventDefault();
      }

      console.log("Resetting in survey settings");

      // Reset to the original filters, or none
      if (this.originalFilter) {
        this.filters = this.originalFilter;
      } else {
        this.filters = {};
      }

      this.trigger('filterSet', this.filters);

      $('.filters .clear').slideUp(DURATION);
      $('.filters .options .answers').slideUp(DURATION);
      $('.filters .answer').removeClass('active');
      $('.filters .answer').removeClass('inactive');

      this.updateLegend();
      this.close();
    },

    selectQuestion: function(event) {
      // Set up handy shortcuts
      var $question = $(event.target);
      var question = $question.attr('data-question');
      if(!question) {
        $question = $question.parent();
        question = $question.attr('data-question');
      }

      // Clear out any filters
      if(this.filters.answer) {
        delete this.filters.answer;
      }

      this.filters.question = question;

      console.log("Set question to", this.filters.question);

      // Show the sub-answers
      // TODO: The following slides operate on two different matches. One
      // seems to be hidden with a display:none, the other is a descendant of
      // this.$el, so we can scope the search.
      $('.filters .options .answers').slideUp(DURATION);
      $question.find('.answers').slideDown(DURATION);
      $('.filters .clear').slideDown(DURATION);
      $question.find('.toggle').slideUp(DURATION);
      $question.find('.answer').removeClass('inactive');

      this.trigger('filterSet', this.filters);

      this.updateLegend();
      this.render();

      this.close();
    },

    /**
     * Show only responses with a specific answer
     */
    selectAnswer: function(event) {
      var $answer = $(event.target);
      var answer = $answer.attr('data-answer');
      var question = $answer.attr('data-question');
      if(!answer) {
        $answer = $answer.parent();
        answer = $answer.attr('data-answer');
        question = $answer.attr('data-question');

        // Handle an edge case with a phantom click
        if (!answer) {
          return;
        }
      }
      this.filters.answer = answer;

      var $question = this.$el.find('.question[data-question="' + question + '"]');
      $question.find('.answer').addClass('inactive');
      $answer.removeClass('inactive');

      this.trigger('filterSet', this.filters);

      // Generate the legend
      this.updateLegend();
    },

    /**
     * Associate a unqie color with each answer in a list
     */
    colors: function(keys) {
      var answers = {};
      _.each(keys, function(key, index) {
        answers[key] = {
          color: settings.colorRange[index + 1]
        };
      });
      return answers;
    }

  });

  return FilterView;

});
