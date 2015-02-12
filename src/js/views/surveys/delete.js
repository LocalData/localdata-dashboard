/*jslint nomen: true */
/*globals define: true */

define(function(require, exports, module) {
  'use strict';

  // Libs
  var $ = require('jquery');
  var _ = require('lib/lodash');
  var Backbone = require('backbone');
  var events = require('lib/tinypubsub');

  // LocalData
  var settings = require('settings');
  var api = require('api');

  // Templates
  var template = require('text!templates/surveys/delete.html');


  var DeleteView = Backbone.View.extend({
    el: '#delete-view-container',
    template: _.template(template),

    events: {
      'click .start-delete': 'start',
      'click .confirm-delete': 'confirm',
      'click .cancel-delete': 'cancel'
    },

    initialize: function(options) {
      _.bindAll(
        this,
        'render',
        'done',
        'fail',
        'start',
        'cancel'
      );

      this.survey = options.survey;
      this.survey.on('change', this.render);

      this.render();
    },

    start: function() {
      this.$el.find('.start-delete').hide();
      this.$el.find('#delete-survey-form').show();
    },

    cancel: function(event) {
      event.preventDefault();
      this.$el.find('.error').html();
      this.$el.find('.error').fadeOut();
      this.$el.find('#delete-survey-form').hide();
      this.$el.find('.start-delete').show();
    },

    confirm: function(event) {
      event.preventDefault();
      this.$el.find('.error').fadeOut();
      var val = this.$el.find('.delete-confirm-name').val();
      if (val === this.survey.get('name')) {
        // Delete the survey
        this.survey.destroy({
          success: this.done,
          error: this.fail
        });
      } else {
        this.$el.find('.no-match').fadeIn();
      }
    },

    fail: function(model, response, options) {
      this.$el.find('.failed').html(response.statusText);
      this.$el.find('.failed').fadeIn();
    },

    done: function() {
      events.publish('navigate', ['/']);
    },

    render: function() {
      this.$el.html(this.template({
        survey: this.survey.toJSON()
      }));
    }
  });

  return DeleteView;
});
