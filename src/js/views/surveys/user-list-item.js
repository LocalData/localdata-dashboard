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
  var Users = require('models/users');

  // Templates
  var template = require('text!templates/surveys/users-list-item.html');

  var UserListItemView = Backbone.View.extend({
    template: _.template(template),

    events: {
      'click .remove': 'removeUser'
    },

    initialize: function(options) {
      _.bindAll(
        this,
        'render',
        'removeUser',
        'done',
        'fail'
      );
      this.survey = options.survey;
    },

    message: function(selector, message) {
      $(this.el).find(selector)
                 .html(message)
                 .fadeIn()
                 .css("display","inline-block")
                 .delay(2000)
                 .fadeOut();
    },

    fail: function(jqXHR, textStatus, errorThrown) {
      var error = $.parseJSON(jqXHR.responseText);
      this.message('.error', error.message);
    },

    done: function() {
      this.remove();
    },

    removeUser: function(event) {
      event.preventDefault();

      var request = api.removeUserFromSurvey({
        surveyId: this.survey.get('id'),
        email: this.model.get('email')
      });

      request.done(this.done);
      request.fail(this.fail);
    },

    render: function() {
      var context = {
        user: this.model.toJSON()
      };
      this.$el.html(this.template(context));
      return this;
    }
  });

  return UserListItemView;
});
