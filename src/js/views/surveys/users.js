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

  // Views
  'views/surveys/user-list-item',

  // Templates
  'text!templates/surveys/users.html'
],

function($, _, Backbone, settings, api, Users, UserListItemView, template) {
  'use strict';

  var UsersView = Backbone.View.extend({
    el: '#sharing-view-container',
    template: _.template(template),

    events: {
      'click .survey-users-add': 'addUser'
    },

    initialize: function(options) {
      _.bindAll(
        this,
        'render',
        'renderUser',
        'addUser',
        'done',
        'fail'
      );

      this.survey = options.survey;
      this.survey.on('change', this.render);

      this.users = new Users.Collection({
        surveyId: this.survey.get('id')
      });
      this.users.on('reset', this.render);
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
      this.users.fetch({reset: true});
    },

    addUser: function(event) {
      event.preventDefault();

      // Get the form fields
      var form = $(event.target).parent().serializeArray();
      var email = form[0].value;

      // Find the user by email
      api.addUserToSurvey({
        surveyId: this.survey.get('id'),
        email: email || undefined,
        done: this.done,
        fail: this.fail
      });
    },

    renderUser: function(user) {
      var view = new UserListItemView({
        model: user,
        survey: this.survey
      });
      view.render();
      $('.survey-users ul').append(view.$el);
    },

    render: function() {
      var context = {
        survey: this.survey.toJSON()
      };
      this.$el.html(this.template(context));

      // Add the list of users
      this.users.each(this.renderUser);
    }
  });

  return UsersView;
});
