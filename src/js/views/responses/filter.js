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
        } else if (type === 'number') {
          questions[question].answers = [];

          // Rework the numeric answers into the format we need for display
          _.each(questionStats, function(count, answer) {
            questions[question].answers.push({
              text: answer,
              value: answer,
              count: count
            });
          });

          // Assign each answer a color
          var length = questions[question].answers.length;
          _.each(questions[question].answers, function(answer, index) {
            answer.color = settings.colorRange[(index + 1) % length];
          });

          // The last "answer" is the no-response placeholder, which gets the
          // zero-index color.
          // answer.color = settings.colorRange[(index + 1) % answers.length];

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
        questions: questions
      };
      console.log("Context", context);
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
