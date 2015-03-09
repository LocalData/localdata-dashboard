/*jslint nomen: true */
/*globals define: true */

define(function(require, exports, module) {
  'use strict';

  // Libs
  var _ = require('lib/lodash');
  var Backbone = require('backbone');

  // Models
  var Responses = require('models/responses');

  // Views
  var ResponseListView = require('views/responses/list');

  // Templates
  var template = require('text!templates/responses/review.html');

  var ReviewView = Backbone.View.extend({

    template: _.template(template),

    el: '#review-view-container',

    events: {
      'click .refresh': 'getNew'
    },

    initialize: function(options) {
      this.survey = options.survey;
      this.forms = options.forms;

      // Set the response collection
      this.collection = new Responses.Collection([], {
        surveyId: this.survey.get('id'),
        limit: 1,
        filters: {
          reviewed: 'undefined'
        },
        reset: true
      });
      this.listenTo(this.collection, 'reset', this.render);
      this.listenTo(this.collection, 'remove', this.handleRemove);
      this.listenTo(this.collection, 'change:responses', this.handleChange);
    },

    render: function() {
      this.$el.html(this.template({}));

      var surveyOptions = this.survey.get('surveyOptions') || {};
      surveyOptions.showReviewTools = true;
      var responseView = new ResponseListView({
        el: '.response-container',
        collection: this.collection,
        forms: this.forms,
        labels: this.forms.getQuestions(),
        surveyOptions: surveyOptions,
        survey: this.survey
      });
      responseView.render();
    },

    handleChange: function onChange(response, attributes) {
      // If an entry has been flagged or accepted, then we remove it.
      if (response.get('responses').reviewed !== undefined) {
        this.collection.remove(response);
      }
      this.render();
    },

    handleRemove: function onRemove(response, collection) {
      // If all of the entries have been flagged, accepted, or deleted, then we
      // fetch the next set.
      if (collection.length === 0) {
        this.collection.fetch({ reset: true});
      }
    },
  });

  return ReviewView;
});

