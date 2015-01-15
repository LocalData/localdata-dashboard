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
  var template = require('text!templates/surveys/layerFilter.html');
  // var loadingTemplate = require('text!templates/filters/loading.html');

  var ANSWER = 'response';
  var NOANSWER = 'no response';

  var FilterView = Backbone.View.extend({
    className: 'settings filters',
    filters: {},

    template: _.template(template),
    //loadingTemplate: _.template(loadingTemplate),

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
      // this.mapView = options.map;

      this.stats = options.stats;
      this.stats.on('change', this.render);

      //this.$el.html(this.loadingTemplate({}));
    },

    close: function() {
      console.log("Closing settings");
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

      var questions = this.forms.getFlattenedForm();
      var stats = this.stats;
      questions = this.prepQuestions(questions, stats);

      var context = {
        questions: questions,
        mapping: this.forms.map()
      };
      this.$el.html(this.template(context));
      return this.$el;
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

      this.filters = {};
      this.trigger('filterReset');

      $('.filters .clear').slideUp();
      $('.filters .options .answers').slideUp();
      $('.filters .answer').removeClass('active');
    },

    selectQuestion: function(event) {
      // Clear out any filters
      if(this.filters.answer) {
        this.reset();
      }

      // Set up handy shortcuts
      var $question = $(event.target).parent();
      var question = $question.attr('data-question');
      this.filters.question = question;

      // Show the sub-answers
      $('.filters .options .answers').slideUp();
      $question.find('.answers').slideDown();
      $('.filters .clear').slideDown();
      $question.find('.toggle').slideUp();

      this.trigger('filterSet', this.filters);

      // Mark this question as selected
      this.$('.filters .question').removeClass('selected');

      // Then, add the selected class to this question
      $question.addClass('selected');
    },

    /**
     * Show only responses with a specific answer
     */
    selectAnswer: function(event) {
      var $answer = $(event.target);
      this.filters.answer = $answer.attr('data-answer');

      if(!this.filters.answer) {
        $answer = $answer.parent();
        this.filters.answer = $answer.attr('data-answer');
      }

      // Make sure we have the right question selected
      this.filters.question = $answer.attr('data-question');
      //var $question = $('div[data-question=' + this.filters.question + ']');

      this.trigger('filterSet', this.filters);

      $('.filters .answer').removeClass('active');
      $answer.addClass('active');
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
