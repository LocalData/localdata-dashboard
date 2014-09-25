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
        'render'
      );

      this.survey = options.survey;
      this.forms = options.forms;

      // Set the response collection
      this.collection = new Responses.Collection({
        surveyId: this.survey.get('id'),
        limit: 1
      });
      this.collection.on('reset', this.render);
      this.getNew();
    },

    render: function() {
      this.$el.html(this.template({}));

      var responseView = new ResponseListView({
        collection: this.collection,
        showReviewTools: true
      });
    },

    getNew: function() {
      this.collection.fetch({reset: true});
    }

  });


  return ReviewView;

});

