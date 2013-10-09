/*jslint nomen: true */
/*globals define: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',
  'lib/tinypubsub',

  // LocalData
  'settings',
  'api',

  // Models
  'models/responses',
  'models/stats',

  // Templates
  'text!templates/filters/filter.html'
],

function($, _, Backbone, events, settings, api, Responses, Stats, template) {
  'use strict';

  /**
   * Intended for shorter lists of responses (arbitrarily <25)
   * Doesn't include pagination, which isn't relevant in this case.
   * See responses/responses/ListView for a heavyweight implementation.
   */
  var FilterView = Backbone.View.extend({
    className: 'filters',

    template: _.template(template),

    events: {
      "click .question": "filter",
      "click .answer": "filter",
      "click .clear": "reset"
    },

    initialize: function(options) {
      _.bindAll(this, 'render');

      this.survey = options.survey;
      this.forms = options.forms;
      this.map = options.map;

      this.stats = new Stats.Model({
        id: this.survey.get('id')
        // forms: this.forms
      });
      this.stats.on('change', this.render);
    },

    render: function() {
      console.log(this.stats.toJSON());
      var context = {
        questions: this.stats.toJSON(),
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
      console.log("Clearing filter");
      this.filters = {};

      this.responses.clearFilter();
      this.updateFilterView();
    },

    filter: function(e) {
      _kmq.push(['record', "Question filter selected"]);
      var $question = $(e.target);
      var question = $question.attr('data-question');
      var answers = this.stats.get(question);

      // Color the responses on the map
      this.map.setFilter(question, answers);

      // Mark this filter as selected
    },

    /**
     * Show only responses with a specific answer
     */
    subFilter: function(event) {
      _kmq.push(['record', "Answer filter selected"]);
      var $answer = $(event.target);

      // Clear the current filter, if there is one.
      if(_.has(this.filters, 'answer')) {
        this.responses.clearFilter({ silent: true });
      }

      // Mark the answer as selected
      $('#subfilter a').removeClass('selected');
      $answer.addClass('selected');

      // Notify the user we're working on it
      // (it can take a while to filter a lot of items)
      // events.publish('loading', [true]);
      $('#loadingsmg').show();
      console.log("Loading");

      // Filter the responses
      this.filters.answer = $answer.text();
      this.filters.question = $("#filter").val();
      this.responses.setFilter(this.filters.question, this.filters.answer);

      // Note that we're done loading
      events.publish('loading', [false]);
      $('#loadingsmg').hide();
      console.log("Done loading");


      this.updateFilterView();
    }
  });

  return FilterView;

});
