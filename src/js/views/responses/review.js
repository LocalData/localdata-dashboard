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

  // Views
  var ResponseListView = require('views/responses/multi-object-list');

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
        'render'
      );

      this.survey = options.survey;
      this.forms = options.forms;
      this.render();
    },

    render: function() {
      // Actually render the page
      this.$el.html(this.template({}));

      // Set the response collection
      this.collection = new Responses.Collection({
        surveyId: this.survey.get('id')
      });

      // Create the list view
      var reviewListView = new ResponseListView({
        el: '#review-list',
        collection: this.collection,
        labels: this.forms.getQuestions()
      });

      this.collection.fetch({ reset: true });
    }

  });


  return ReviewView;

});

