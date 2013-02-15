/*jslint nomen: true */
/*globals define: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',
  'lib/tinypubsub',
  'lib/kissmetrics',

  // LocalData
  'routers/index',
  'settings',
  'api',

  // Models
  'models/users'
],

function($, _, Backbone, events, _kmq, router, settings, api, UserModels) {
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
        _kmq.push(['record', error]);
        console.log(error);
        $('#login .error').html(error);
        return;
      }

      console.log(this.redirectTo);
      events.publish('navigate', [this.redirectTo]);
    },

    logIn: function(event) {
      event.preventDefault();

      _kmq.push(['record', 'User logging in']);
      console.log("Logging in");

      var user = $(event.target).parent().serializeArray();
      api.logIn(user, this.logInCallback);
    },

    createUser: function(event) {
      event.preventDefault();

      _kmq.push(['record', 'Creating user account']);
      var user = $(event.target).parent().serializeArray();
      console.log(user);
      console.log("Create a user");

      api.createUser(user, function(error, user) {
        if(error) {
          console.log(error);
          _kmq.push(['record', 'Error creating user account']);
          _kmq.push(['record', error]);
          $("#create-account .error").html(error);
          return;
        }

        // Success! Go to the dashboard.
        events.publish('navigate', ['/']);
      });
    }

  });

  return UserViews;

}); // End UserViews
