/*jslint nomen: true */
/*globals define, cartodb, Rickshaw: true */

define(function (require) {
  'use strict';

  var $ = require('jquery');
  var _ = require('lib/lodash');
  var Backbone = require('backbone');

  // LocalData
  var settings = require('settings');

  // Models
  var Responses = require('models/responses');

  // Templates
  var template = require('text!templates/projects/surveys/settings-survey.html');
  var loadingTemplate = require('text!templates/filters/loading.html');
  var legendTemplate = require('text!templates/projects/surveys/legend.html');

  var ANSWER = 'response';
  var NOANSWER = 'no response';
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

      // If the settings are initialized with a filter,
      // reduce the set of questions available
      this.questions = this.forms.getFlattenedForm();
      console.log("QUESTIONS / FILTER", this.questions, options.filter);
      if(options.filter) {
        this.originalFilter = options.filter;
        this.questions = this.forms.getSubquestionsFor(options.filter.question, options.filter.answer); //this.questions[options.filter.question];
      }

      this.on('questionSet', this.generateLegend);
    },

    close: function() {
      this.$el.hide();
    },

    prepQuestions: function(questions, stats) {
      // Match the question names and answer values from the form with stats and colors.
      _.each(_.keys(questions), function (question) {
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

      return questions;
    },

    render: function() {
      console.log('Rendering the filters');

      var stats = this.stats;
      var questions = this.prepQuestions(this.questions, stats);

      var context = {
        questions: questions,
        mapping: this.forms.map()
      };
      this.$el.html(this.template(context));
      return this.$el;
    },

    generateLegend: function() {
      var question = this.questions[this.filters.question];

      if(!question) {
        this.trigger('legendSet', $(''));
        return;
      }

      var legend = this.legendTemplate({
        filters: this.filters,
        question: question
      });
      var $legend = $(legend);

      $legend.find('.question-title').on('click', this.selectQuestion.bind(this));
      $legend.find('.answer').on('click', this.selectAnswer.bind(this));

      this.trigger('legendSet', $legend);
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


      // XXX TODO
      // This method of clearing the legend  with an empty obj -- aka $('') --
      // is a bit of a hack. We should have a better way of clearing it.
      this.trigger('filterSet', this.filters, $(''));

      $('.filters .clear').slideUp(DURATION);
      $('.filters .options .answers').slideUp(DURATION);
      $('.filters .answer').removeClass('active');

      this.generateLegend();
      this.close();
    },

    selectQuestion: function(event) {
      // Clear out any filters
      if(this.filters.answer) {
        this.filters = {};
      }

      // Set up handy shortcuts
      var $question = $(event.target).parent();
      var question = $question.attr('data-question');
      this.filters.question = question;

      // Show the sub-answers
      $('.filters .options .answers').slideUp(DURATION);
      $question.find('.answers').slideDown(DURATION);
      $('.filters .clear').slideDown(DURATION);
      $question.find('.toggle').slideUp(DURATION);

      this.trigger('filterSet', this.filters);

      this.generateLegend();

      this.close();

      // XXX TODO
      // Mark this question as selected
    },

    /**
     * Show only responses with a specific answer
     */
    selectAnswer: function(event) {
      var $answer = $(event.target);
      this.filters.answer = $answer.attr('data-answer');

      // Make sure we have the right question selected
      this.filters.question = $answer.attr('data-question');
      var $question = $('div[data-question=' + this.filters.question + ']');

      if(!this.filters.answer) {
        $answer = $answer.parent();
        this.filters.answer = $answer.attr('data-answer');
      }

      this.trigger('filterSet', this.filters);

      console.log("Activating", $answer);

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
