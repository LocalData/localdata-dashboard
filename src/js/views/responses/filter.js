/*jslint nomen: true */
/*globals define: true */

define(function(require, exports, module) {
  'use strict';

  // Libs
  var $ = require('jquery');
  var _ = require('lib/lodash');
  var Backbone = require('backbone');

  // App
  var settings = require('settings');
  var api = require('api');

  // Models
  var Responses = require('models/responses');
  var Stats = require('models/stats');

  // Views
  var ResponseListView = require('views/responses/list');

  // Templates
  var template = require('text!templates/filters/filters.html');
  var questionFiltersTemplate = require('text!templates/filters/question-filters.html');

  var ANSWER = 'response';
  var NOANSWER = 'no response';

  /**
   * Intended for shorter lists of responses (arbitrarily <25)
   * Doesn't include pagination, which isn't relevant in this case.
   * See responses/responses/ListView for a heavyweight implementation.
   */
  var FilterView = Backbone.View.extend({
    className: 'filters',
    filters: {},

    template: _.template(template),
    questionFiltersTemplate: _.template(questionFiltersTemplate),

    events: {
      "click .question label": "selectQuestion",
      "click .answer": "selectAnswer",
      "click .clear": "reset",

      "change #datefilter": "selectDate"
    },

    initialize: function(options) {
      _.bindAll(this, 'render', 'reset');

      this.survey = options.survey;
      this.forms = options.forms;
      this.map = options.map;
      this.stats = options.stats;

      this.stats.on('change', this.render);
      this.$el.html(this.template());
    },

    selectDate: function(event) {
      var HOUR_IN_MS = 1000*60*60;
      var val = $(event.target).val();
      var after = new Date();

      if (val === 'all') {
        this.map.setDate({});
        this.stats.initialize({
          id: this.survey.get('id')
        });

        return;
      }

      if (val === 'hour') {
        after = new Date(after.getTime() - HOUR_IN_MS);
      }

      if (val === 'today') {
        // The beginning of the day, not 24 hours ago.
        after = new Date(after.setHours(0,0,0,0));
      }

      if (val === 'week') {
        after = new Date(after.getTime() - (HOUR_IN_MS * 24 * 7));
      }

      // Set the date on the map, so the correct tiles are fetched.
      this.map.setDate({
        after: after.getTime()
      });

      // Reset the stats with the new parameters.
      this.stats.initialize({
        id: this.survey.get('id'),
        params: {
          after: after.getTime()
        }
      });
    },

    render: function() {
      console.log('Rendering the filters');

      this.$el.find('.question-filters').html('');

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

      this.$el.find('.question-filters').html(this.questionFiltersTemplate(context));

      // Re-mark any selected questions
      if(this.filters.question) {
        var $question = $('label[data-question=' + this.filters.question + ']');
        this.markQuestionSelected($question);
      }
      if(this.filters.answer) {
        var $answer = $('div[data-question=' + this.filters.question + '][data-answer='
            + this.filters.answer + ']');
        this.markAnswerSelected($answer);
      }

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

    markAnswerSelected: function($answer) {
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
    },

    selectQuestion: function(event) {
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
      var $answer = $(event.target);
      this.filters.answer = $answer.attr('data-answer');

      this.markAnswerSelected($answer);
    }
  });

  return FilterView;

});
