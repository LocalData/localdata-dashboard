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

function($,
  _,
  Backbone,
  events,
  _kmq,
  settings,
  api,
  Responses,
  Stats,
  template,
  answersTemplate,
  loadingTemplate
) {
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
      "click .select": "showOptions",
      "click .question-title": "selectQuestion",
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
    },

    showOptions: function(event) {
      event.preventDefault();
      console.log("FO", $('.filters .options'));
      $('.filters .options').slideToggle();
      $('.filters .options .question').show();
    },

    /**
     * Reset any filters
     */
    reset: function(event) {
      console.log("Resetting filters");
      if(event) {
        event.preventDefault();
      }

      this.filters = {};
      this.map.clearFilter();

      $('.filters .clear').slideUp();
      $('.filters .options .answers').slideUp();
      $('.filters .options').slideUp();
      $('.filters .answer').removeClass('active');
    },

    selectQuestion: function(event) {
      console.log("Filter selected", event);

      // Clear out any filters
      if(this.filters.answer) {
        this.reset();
      }

      // Set up handy shortcuts
      var $question = $(event.target).parent();
      var question = $question.attr('data-question');
      console.log("Question", question);
      this.filters.question = question;

      // Show the sub-answers
      $('.filters .options .answers').slideUp();
      $question.find('.answers').slideDown();
      $('.filters .clear').slideDown();
      $question.find('.toggle').slideUp();


      // Hide other questions
      $('.filters .options .question').not($question).slideUp();

      this.map.setFilter(question);
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

      // Color the responses on the map
      this.map.setFilter(this.filters.question, this.filters.answer);

      $('.filters .answer').removeClass('active');
      $answer.addClass('active');

      console.log("Selected answer", $answer, this.filters.answer);
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
