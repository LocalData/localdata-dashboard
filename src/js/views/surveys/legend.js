/*jslint nomen: true */
/*globals define */

define(function (require) {
  'use strict';

  var _ = require('lib/lodash');
  var Backbone = require('backbone');

  var util = require('util');

  // Templates
  var template = require('text!templates/projects/surveys/legend.html');

  var LegendView = Backbone.View.extend({
    className: 'legend',
    filters: {},

    template: _.template(template),

    events: {
      "click .question-title": "selectQuestion",
      "click .answer": "selectAnswer"
    },

    initialize: function(options) {
      _.bindAll(this, 'render', 'reset');

      this.setFilters(options.filters);
      this.setCategory(options.category);

      console.log("Init legend with options", options);

    },

    render: function() {
      if (!this.category) {
        this.$el.html('');
        return this;
      }
      var context = {
        category: this.category,
        filters: this.filters
      };
      console.log("Rendering legend", context);
      this.$el.html(this.template(context));
      return this;
    },

    /**
     * Reset any filters
     */
    reset: function(event) {
      if (event) {
        event.preventDefault();
      }

      this.trigger('filterReset');
    },

    setFilters: function setFilters(filters) {
      this.filters = filters;
    },

    setCategory: function setCategory(category) {
      this.category = category;
      if (!category) {
        return;
      }
      // We alias answers to values to make this view more generic
      // (useful in the projects view)
      if (this.category.answers) {
        this.category.values = this.category.answers;
      }
      if (!this.category.text) {
        this.category.text = this.filters.question;
      }
    },

    selectQuestion: function(event) {
      if (event) {
        event.preventDefault();
      }

      this.trigger('questionSelected', event);
    },

    /**
     * Show only responses with a specific answer
     */
    selectAnswer: function(event) {
      if (event) {
        event.preventDefault();
      }

      this.trigger('answerSelected', event);
    }

  });

  return LegendView;
});
