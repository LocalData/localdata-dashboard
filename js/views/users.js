/*jslint nomen: true */
/*globals define: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',
  'lib/tinypubsub',

  // LocalData
  'routers/index',
  'settings',
  'api',

  // Models
  'models/users'
],

function($, _, Backbone, events, router, settings, api, UserModels) {
  'use strict';

  var UserViews = {};


  UserViews.LoginView = Backbone.View.extend({
    el: "#container",

    events: {
      "click #login .button": "logIn",
      "click #create-account .button": "createUser"
    },

    initialize: function(options) {
      this.redirectTo = options.redirectTo || "/";
      this.redirectTo = this.redirectTo.replace("?redirectTo=", "");
      console.log("Creating login view");
      _.bindAll(this, 'render', 'update', 'createUser', 'logIn', 'logInCallback');

      this.render();
    },

    render: function() {
      var context = {
        redirectTo: this.redirectTo
      };
      this.$el.html(_.template($('#login-view').html(), context));
      return this;
    },

    update: function() {
      this.render();
    },

    logInCallback: function(error, user) {
      if(error) {
        console.log(error);
        $('#login .error').html(error).fadeIn(500);
        return;
      }

      console.log(this.redirectTo);
      events.publish('navigate', [this.redirectTo]);
    },

    logIn: function(event) {
      event.preventDefault();

      $("#login .error").fadeOut();
      var user = $(event.target).parent().serializeArray();
      api.logIn(user, this.logInCallback);
    },

    createUser: function(event) {
      event.preventDefault();

      $("#create-account .error").fadeOut();
      var user = $(event.target).parent().serializeArray();

      api.createUser(user, function(error, user) {
        if(error) {
          $("#create-account .error").html(error).fadeIn(500);
          return;
        }

        // Success! Go to the dashboard.
        events.publish('navigate', ['/']);
      });
    }

  });

  return UserViews;

}); // End UserViews
