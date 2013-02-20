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

  UserViews.UserBarView = Backbone.View.extend({
    el: "#userbar-container",

    initialize: function(options) {
      _.bindAll(this, 'render');

      if(_.has(options, 'user')) {
        this.user = options.user;
        this.user.on('change', this.render);
      }
    },

    render: function() {
      console.log("rendering");
      var context = {
        user: this.user.toJSON()
      };
      this.$el.html(_.template($('#userbar-view').html(), context));
      this.$el.fadeIn(400).css("display","inline-block");
      return this;
    }
  });


  UserViews.UserView = Backbone.View.extend({

  });


  UserViews.LoginView = Backbone.View.extend({
    el: "#container",

    events: {
      "click #login .button": "logIn",
      "click #create-account .button": "createUser"
    },

    initialize: function(options) {
      console.log("Initialize login view");
      _.bindAll(this, 'render', 'update', 'createUser', 'createUserCallback', 'logIn', 'logInCallback');

      this.redirectTo = options.redirectTo || "/";
      this.redirectTo = this.redirectTo.replace("?redirectTo=", "");

      this.user = options.user;

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

      this.user.fetch();
      events.publish('navigate', [this.redirectTo]);
    },

    logIn: function(event) {
      event.preventDefault();

      _kmq.push(['record', 'User logging in']);
      console.log("Logging in");

      var user = $(event.target).parent().serializeArray();
      api.logIn(user, this.logInCallback);
    },

    createUserCallback: function(error, user) {
      if(error) {
        console.log(error);
        $("#create-account .error").html(error);
        return;
      }

      // Get the current user model
      this.user.fetch();

      // Success! Go to the dashboard.
      events.publish('navigate', ['/']);
    },

    createUser: function(event) {
      event.preventDefault();

      _kmq.push(['record', 'Creating user account']);
      var user = $(event.target).parent().serializeArray();
      console.log(user);
      console.log("Create a user");

      api.createUser(user, this.createUserCallback);
    }
  });

  return UserViews;

}); // End UserViews
