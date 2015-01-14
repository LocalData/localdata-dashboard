/*jslint nomen: true */
/*globals define */

define(function (require) {
  'use strict';

  var $ = require('jquery');
  var _ = require('lib/lodash');
  var Backbone = require('backbone');

  // LocalData
  var settings = require('settings');

  // Views
  var LegendView = require('views/surveys/legend');

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
    },

    close: function() {
      this.$el.hide();
    },

    render: function() {
      var context = {
        categories: this.exploration
      };
      this.$el.html(this.template(context));
      return this.$el;
    },

    generateLegend: function () {
      console.log("Filter set", this.filters);
      var category;
      if (this.filters.question) {
        category = _.find(this.exploration, { name: this.filters.question });
      }

      if (!category) {
        this.$legend = null;
        this.trigger('legendRemoved');
      } else {

        var legendView = new LegendView({
          filters: this.filters,
          category: category
        });

        this.$legend = legendView.render();

        this.listenTo(legendView, 'filterReset', this.reset);
        this.listenTo(legendView, 'questionSelected', this.selectQuestion);
        this.listenTo(legendView, 'answerSelected', this.selectAnswer);

        this.trigger('legendSet', this.$legend);
      }
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

      this.generateLegend();
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

      this.generateLegend();

      this.close();
    },

    /**
     * Show only responses with a specific answer
     */
    selectAnswer: function(event) {
      var $answer = $(event.target);
      this.filters.answer = $answer.attr('data-answer');

      // Make sure we have the right question selected
      this.filters.question = $answer.attr('data-question');
      var $question = $('div[data-question="' + this.filters.question + '"]');

      if(!this.filters.answer) {
        $answer = $answer.parent();
        this.filters.answer = $answer.attr('data-answer');
      }

      // We're manipulating the answer styling in both the legend and the
      // survey-layer settings box, so we need to find both answer elements.
      // TODO: This is a hack. We should probably factor the legend out into
      // its own view and let it manage its own styling. The legend and
      // settings views can both listen to the appropriate events. The current
      // technique is bound to interfere with other layers that have
      // coincidentally-named questions/answers.
      $answer = $('span[data-question="' + this.filters.question + '"][data-answer="' + this.filters.answer + '"]');

      this.trigger('filterSet', this.filters);

      $question.find('.answer').addClass('inactive');
      $question.find('.answer').removeClass('active');
      $answer.addClass('active');
      $answer.removeClass('inactive');
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
