/*jslint nomen: true */
/*globals define: true */

define(function(require, exports, module) {
  'use strict';

  // Libs
  var $ = require('jquery');
  var _ = require('lib/lodash');
  var Backbone = require('backbone');
  var moment = require('moment');
  var Pikaday = require('pikaday');

  // App
  var settings = require('settings');
  var util = require('util');

  // Models
  var Stats = require('models/stats');

  // Templates
  var template = require('text!templates/filters/filters.html');
  var questionFiltersTemplate = require('text!templates/filters/question-filters.html');
  var selectedFiltersTemplate = require('text!templates/filters/selected-filters.html');

  var ANSWER = 'response';
  var NOANSWER = 'no response';

  /**
   * Intended for shorter lists of responses (arbitrarily <25)
   * Doesn't include pagination, which isn't relevant in this case.
   * See responses/responses/ListView for a heavyweight implementation.
   */
  var FilterView = Backbone.View.extend({
    filters: {},

    template: _.template(template),
    questionFiltersTemplate: _.template(questionFiltersTemplate),
    selectedFiltersTemplate: _.template(selectedFiltersTemplate),

    events: {
      "click .question-title": "selectQuestion",
      "click .answer": "selectAnswer",
      "click .clear": "reset",
      "click .close-settings": "close",

      "change #collectorfilter": "selectCollector"
    },

    initialize: function(options) {
      _.bindAll(this, 'render', 'reset', 'updateSidebar', 'selectDate');

      this.survey = options.survey;
      this.forms = options.forms;
      this.map = options.map;

      this.stats = options.stats || (new Stats.Model({
        id: this.survey.get('id')
      }));
      this.stats.on('change', this.render);
    },

    close: function() {
      console.log("Closing filters");
      this.$el.find('.filters').hide();
    },

    getParams: function() {
      var options = {};
      if (this.filters.collector) {
        options.collector = this.filters.collector;
      }

      if (this.filters.after) {
        options.after = this.filters.after.getTime();
      }

      return options;
    },

    selectCollector: function(event) {
      util.track('survey.filters.collector.select');

      var collector = $(event.target).val();

      if (collector === 'all') {
        delete this.filters.collector;
      } else {
        this.filters.collector = collector;
      }

      var mapParams = this.getParams();
      this.map.setOptions(mapParams);

      // Reset the stats with the new parameters.
      this.stats.initialize({
        id: this.survey.get('id'),
        params: mapParams
      });

      this.filters.collector = collector;
      this.updateSidebar();
    },

    selectDate: function(date) {
      util.track('survey.filters.after.select');

      date.setHours(0, 0, 0, 0);
      this.filters.after = date;

      // Set the date on the map, so the correct tiles are fetched.
      var mapParams = this.getParams();
      this.map.setOptions(mapParams);

      // Reset the stats with the new parameters.
      this.stats.initialize({
        id: this.survey.get('id'),
        params: mapParams
      });

      // Update the sidebar
      this.updateSidebar();
    },

    render: function() {
      // We only render the full filter container once.
      // Future updates are done only to the stats.
      if (!this.skipFullRender) {
        var collectorList = [];

        // Get the list of collectors and counts together
        _.each(this.stats.toJSON().Collectors, function(count, collector) {
          collectorList.push({
            count: count,
            collector: collector
          });
        });

        collectorList = _.sortBy(collectorList, 'collector');

        this.$el.html(this.template({
          collectors: collectorList
        }));

        // Set up date pickers
        var selectDate = this.selectDate;
        var picker = new Pikaday({
          field: document.getElementById('date-filter-start'),
          format: 'D MMM YYYY',
          onSelect: function() {
            var date = this.getDate();
            selectDate(date);
          }
        });

        this.skipFullRender = true;
      }


      this.$el.find('.question-filters').html('');

      // Match the question names and answer values from the form with stats and colors.
      this.questions = this.forms.getFlattenedForm();
      var questions = this.questions;
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
        // TODO: scope this search to less than the whole document
        var $question = $('div[data-question=' + this.filters.question + ']');
        this.markQuestionSelected();
      }
      if(this.filters.answer) {
        // TODO: scope this search to less than the whole document
        var $answer = $('div[data-question=' +
                        this.filters.question +
                        '][data-answer=' +
                        this.filters.answer + ']');
        this.markAnswerSelected();
      }

      return this;
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

      util.track('survey.filters.reset');

      this.filters = {};
      this.map.clearFilter();

      // Reset the date filter
      $('#date-filter-start').val('');

      $('.question').removeClass('selected');
      $('.answer').removeClass('inactive');

      // Clear out the sidebar
      this.updateSidebar();
    },

    // Display the selected question on the sidbar.
    updateSidebar: function() {
      var question;
      if (this.filters.question) {
        question = this.questions[this.filters.question];
      }

      this.trigger('updated', {
        category: question,
        filters: this.filters
      });
    },

    markQuestionSelected: function() {
      // Mark this filter as selected and show answers
      // First, clear out any selected questions
      $('.filters .question').removeClass('selected');
      $('.answer').removeClass('inactive');

      var $question = $('div.question[data-question=' + this.filters.question + ']');

      // Then, add the selected class to this question
      $question.addClass('selected');

      this.updateSidebar();
    },

    markAnswerSelected: function() {
      // Remove the "selected" class from any of the circles.
      $('.answer').addClass('inactive');

      var $question = $('div.question[data-question=' + this.filters.question + ']');
      var $answer = $question.find('div.answer[data-answer="' + this.filters.answer + '"]');

      $answer.removeClass('inactive');

      // Color the responses on the map
      this.map.setFilter(this.filters.question, this.filters.answer);

      this.updateSidebar();
    },

    selectQuestion: function(event) {
      var $question = $(event.target);
      util.track('survey.filters.question.select');

      var question = $question.attr('data-question');
      if(!question) {
        $question = $question.parent();
        question = $question.attr('data-question');
      }

      // Clear out any existing filters
      if(this.filters.answer) {
        delete this.filters.answer;
      }

      // Record the filter
      this.filters.question = question;

      this.markQuestionSelected();

      // Color the responses on the map
      this.map.setFilter(question);
    },

    /**
     * Show only responses with a specific answer
     */
    selectAnswer: function(event) {
      var $answer = $(event.target);
      util.track('survey.filters.answer.select');
      this.filters.answer = $answer.attr('data-answer');

      this.markAnswerSelected($answer);
    }
  });

  return FilterView;

});
