/*jslint nomen: true */
/*globals define: true */

define(function(require, exports, module) {
  'use strict';

  // Libs
  var $ = require('jquery');
  var _ = require('lib/lodash');
  var Backbone = require('backbone');

  // LocalData
  var settings = require('settings');
  var api = require('api');

  // Models
  var Users = require('models/users');

  // Models
  var UserListItemView = require('views/surveys/user-list-item');

  // Templates
  var template = require('text!templates/surveys/users.html');


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
      var request = api.addUserToSurvey({
        surveyId: this.survey.get('id'),
        email: email || undefined
      });

      request.done(this.done);
      request.fail(this.fail);
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
