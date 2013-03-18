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


  UserViews.ResetView = Backbone.View.extend({
    el: "#container",

    events: {
      'click .button': 'reset'
    },

    initialize: function(options) {
      console.log('init reset view');
      _.bindAll(this, 'render', 'update', 'reset', 'resetCallback');

      this.token = options.token;
    },

    update: function() {
      this.render();
    },

    render: function() {
      var context = {
        token: this.token
      };
      this.$el.html(_.template($('#reset-view').html(), context));
      return this;
    },

    reset: function() {
      // Get the data from the form. Ew. 
      var data = $(event.target).parent().serializeArray();
      var token = data[0].value;
      var email = data[1].value;
      var password1 = data[2].value;
      var password2 = data[3].value;

      console.log(token);
      if(password1 !== password2) {
        $('#reset .error').html('The passwords should match').fadeIn();
        return;
      }

      var query = {
        'reset': {
          'email': email,
          'password': password1,
          'token': token
        }
      };
      api.reset(query, this.resetCallback);
    },

    resetCallback: function(error) {
      if(error) {
        _kmq.push(['record', error]);
        $('#reset .error').html(error.message).fadeIn();
        return;
      }

      events.publish('navigate', ['/']);
    }
  });


  UserViews.LoginView = Backbone.View.extend({
    el: "#container",

    events: {
      'click #login .button': 'logIn',
      'click #create-account .button': "createUser",
      'click #login .forgot': 'forgot',
      'click #forgot .button': 'reset'
    },

    initialize: function(options) {
      console.log("Initialize login view");
      _.bindAll(this, 'render', 'update', 'createUser', 'createUserCallback',
        'logIn', 'logInCallback',
        'forgot', 'reset', 'forgotCallback');

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

    forgot: function() {
      console.log("forgot password");
      $('#login').fadeOut(200, function(){
        $('#forgot').fadeIn(200);
      });
    },

    reset: function(event) {
      console.log("Resetting password");
      $('#forgot .error').hide();
      var data = $(event.target).parent().serializeArray();
      var query = {'user': {'email': data[0].value}};
      api.forgot(query, this.forgotCallback);
    },

    forgotCallback: function(error) {
      if(error) {
        console.log("ERROR!!!", error);
        _kmq.push(['record', error]);
        $('#forgot .error').html(error.message).fadeIn();
        return;
      }

      $('#forgot .success').fadeIn();
    },

    logIn: function(event) {
      event.preventDefault();
      _kmq.push(['record', 'User logging in']);
      $('#login .error').fadeOut();

      var user = $(event.target).parent().serializeArray();
      console.log(user);
      api.logIn(user, this.logInCallback);
    },

    logInCallback: function(error, user) {
      if(error) {
        _kmq.push(['record', error]);
        $('#login .error').html(error).fadeIn();
        return;
      }

      this.user.fetch();
      events.publish('navigate', [this.redirectTo]);
    },

    createUser: function(event) {
      event.preventDefault();

      _kmq.push(['record', 'Creating user account']);
      var user = $(event.target).parent().serializeArray();
      $('#create-account .error').fadeOut();

      api.createUser(user, this.createUserCallback);
    },

    createUserCallback: function(error, user) {
      if(error) {
        $("#create-account .error").html(error).fadeIn();
        return;
      }

      this.user = user;

      // Success! Go to the dashboard.
      events.publish('navigate', ['/']);
    }
  });

  return UserViews;

}); // End UserViews
