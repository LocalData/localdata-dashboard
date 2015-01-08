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
      _.bindAll(this,
        'render',
        'getNew'
      );

      this.survey = options.survey;
      this.forms = options.forms;

      // Set the response collection
      this.collection = new Responses.Collection([], {
        surveyId: this.survey.get('id'),
        limit: 1,
        filters: {
          reviewed: 'undefined'
        }
      });
      this.collection.on('reset', this.render);
      this.collection.on('remove', this.getNew);
      this.collection.on('change:responses', this.getNew);

      this.getNew();
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

    getNew: function() {
      // Remove any existing entries
      this.collection.reset();

      this.collection.fetch({ reset: true });
    }
  });

  return ReviewView;
});

