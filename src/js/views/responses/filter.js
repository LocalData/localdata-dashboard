/*jslint nomen: true */
/*globals define: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',
  'lib/tinypubsub',
  'lib/kissmetrics',

  // LocalData
  'settings',
  'api',

  // Models
  'models/responses',
  'models/stats',

  // Templates
  'text!templates/filters/filter.html',
  'text!templates/filters/loading.html'
],

function($, _, Backbone, events, _kmq, settings, api, Responses, Stats, template, loadingTemplate) {
  'use strict';

  /**
   * Intended for shorter lists of responses (arbitrarily <25)
   * Doesn't include pagination, which isn't relevant in this case.
   * See responses/responses/ListView for a heavyweight implementation.
   */
  var FilterView = Backbone.View.extend({
    className: 'filters',
    filters: {},

    template: _.template(template),
    loadingTemplate: _.template(loadingTemplate),

    events: {
      "click .question label": "selectQuestion",
      "click .answer": "selectAnswer",
      "click .clear": "reset"
    },

    initialize: function(options) {
      _.bindAll(this, 'render', 'reset');

      this.survey = options.survey;
      this.forms = options.forms;
      this.map = options.map;

      this.stats = new Stats.Model({
        id: this.survey.get('id')
      });
      this.stats.on('change', this.render);
      this.$el.html(this.loadingTemplate({}));
    },

    render: function() {
      console.log('Rendering the filters');

      // Match the question names and answer values from the form with stats and colors.
      var questions = this.forms.getFlattenedForm();
      var stats = this.stats;

      _.each(_.keys(questions), function (question) {
        var answers = questions[question].answers;
        var answerObjects = {};
        var questionStats = stats.get(question);
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
      });

      var context = {
        questions: questions,
        mapping: this.forms.map()
      };
      this.$el.html(this.template(context));
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
    },

    /**
     * Reset any filters
     */
    reset: function(event) {
      if(event) {
        event.preventDefault();
      }

      this.filters = {};
      this.map.clearFilter();

      $('.question').removeClass('selected');
      $('.answers .circle').removeClass('inactive');
    },

    markQuestionSelected: function($question) {
      // Mark this filter as selected and show answers
      $('.filters .question').removeClass('selected');
      $question.parent().addClass('selected');
      $question.parent().find('.answers').show();
    },

    selectQuestion: function(event) {
      _kmq.push(['record', "Question filter selected"]);
      console.log("Another filter selected", event);

      // Clear out any filters
      if(this.filters.answer) {
        this.reset();
      }

      var $question = $(event.target);
      var question = $question.attr('data-question');
      if(!question) {
        $question = $question.parent();
        question = $question.attr('data-question');
      }
      this.filters.question = question;
      var answers = this.stats.get(question);

      this.markQuestionSelected($question);

      // Color the responses on the map
      this.map.setFilter(question);
    },

    /**
     * Show only responses with a specific answer
     */
    selectAnswer: function(event) {
      _kmq.push(['record', "Answer filter selected"]);
      var $answer = $(event.target);
      this.filters.answer = $answer.attr('data-answer');

      // Make sure we have the right question selected
      this.filters.question = $answer.attr('data-question');
      var $question = $('label[data-question=' + this.filters.question + ']');
      this.markQuestionSelected($question);

      if(!this.filters.answer) {
        $answer = $answer.parent();
        this.filters.answer = $answer.attr('data-answer');
      }

      // Mark the answer as selected
      $('.answers').removeClass('selected');
      $('.answers .circle').addClass('inactive');

      $answer.find('.circle').addClass('selected');
      $answer.find('.circle').removeClass('inactive');

      // Color the responses on the map
      this.map.setFilter(this.filters.question, this.filters.answer);

      console.log("Selected answer", $answer, this.filters.answer);
    }
  });

  return FilterView;

});
