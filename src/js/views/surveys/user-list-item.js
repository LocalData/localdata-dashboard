/*jslint nomen: true */
/*globals define: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',

  // LocalData
  'settings',
  'api',

  // Models
  'models/Users',

  // Templates
  'text!templates/surveys/users-list-item.html'
],

function($, _, Backbone, settings, api, Users, template) {
  'use strict';

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

      api.removeUserFromSurvey({
        surveyId: this.survey.get('id'),
        email: this.model.get('email'),
        done: this.done,
        fail: this.fail
      });
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
