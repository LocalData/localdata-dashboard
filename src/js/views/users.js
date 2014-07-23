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
  'models/users',

  // Templates
  'text!templates/login.html',
  'text!templates/register.html',
  'text!templates/reset.html',
  'text!templates/changePassword.html'

],

function($, _, Backbone, events, _kmq, router, settings, api,
  UserModels,
  loginTemplate,
  registerTemplate,
  resetPasswordTemplate,
  changePasswordTemplate
) {
  'use strict';

  var UserViews = {};

  function deserializeResetInfo(serialized) {
    console.log(serialized);
    var data = JSON.parse(window.atob(serialized));
    return {
      email: data[0],
      token: data[1]
    };
  }

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


  UserViews.RegisterView = Backbone.View.extend({
    el: '#container',

    template: _.template(registerTemplate),

    events: {
      "click #register .button": "createUser"
    },

    initialize: function(options) {
      console.log("Initialize login view");
      _.bindAll(this, 'render', 'update', 'createUser', 'createUserCallback');

      this.user = options.user;

      this.render();
    },

    render: function() {
      this.$el.html(this.template({}));
      return this;
    },

    update: function() {
      this.render();
    },

    createUserCallback: function(error, user) {
      if(error) {
        $("#register .error").html(error.message).fadeIn();
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
      $('#register .error').fadeOut();

      api.createUser(user, this.createUserCallback);
    }
  });


  UserViews.LoginView = Backbone.View.extend({
    el: "#container",

    template: _.template(loginTemplate),

    events: {
      "click #login button": "logIn"
    },

    initialize: function(options) {
      console.log("Initialize login view");
      _.bindAll(this, 'render', 'update', 'logIn', 'logInCallback');

      this.redirectTo = options.redirectTo || "/";
      this.redirectTo = this.redirectTo.replace("?redirectTo=", "");

      this.user = options.user;

      this.render();
    },

    render: function() {
      var context = {
        redirectTo: this.redirectTo
      };
      this.$el.html(this.template(context));
      return this;
    },

    update: function() {
      this.render();
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

    logIn: function(event) {
      event.preventDefault();
      _kmq.push(['record', 'User logging in']);
      $('#login .error').fadeOut();

      var user = $(event.target).parent().serializeArray();
      api.logIn(user, this.logInCallback);
    }
  });


  UserViews.ChangePasswordView = Backbone.View.extend({
    el: '#container',

    events: {
      'click #change-password button': 'changePassword'
    },

    initialize: function (options) {
      console.log('Initialize password change view');
      _.bindAll(this, 'render', 'update', 'changePassword', 'changeDone');

      this.redirectTo = '/';

      var resetInfo = deserializeResetInfo(options.resetInfo);
      this.token = resetInfo.token;
      this.user = new UserModels.Model({
        email: resetInfo.email
      });

      this.render();
    },

    render: function () {
      this.$el.html(changePasswordTemplate);
      return this;
    },

    update: function () {
      this.render();
    },

    changeDone: function (error, user) {
      if (error) {
        _kmq.push(['record', 'Password reset error: ' + error]);
        this.$('.error').html(error.message).fadeIn();
        return;
      }

      this.user.fetch();
      events.publish('navigate', [this.redirectTo]);
    },

    changePassword: function(event) {
      event.preventDefault();
      _kmq.push(['record', 'User reset password']);
      this.$('.error').fadeOut();

      var pw = this.$('input[name=password]').val();
      var pw2 = this.$('input[name=password-check]').val();
      if(pw !== pw2) {
        this.$('.error').html("The passwords don't match").fadeIn();
        return;
      }

      var user = {
        email: this.$('input[name=email]').val(),
        password: this.$('input[name=password]').val()
      };
      api.changePassword(user, this.token, this.changeDone);
    }
  });


  UserViews.ResetPasswordView = Backbone.View.extend({
    el: '#container',

    events: {
      'click #reset-password button': 'resetPassword'
    },

    initialize: function (options) {
      console.log('Initialize password reset view');
      _.bindAll(this, 'render', 'update', 'resetPassword', 'changeDone', 'changeFail');
      this.render();
    },

    render: function () {
      this.$el.html(resetPasswordTemplate);
      return this;
    },

    update: function () {
      this.render();
    },

    changeDone: function (error, user) {
      console.log("CHANGE DONE");
      this.$el.find('.done').fadeIn();
    },

    changeFail: function (error) {
      console.log("Change fail", this, error);
      var responseText = $.parseJSON(error.responseText);
      this.$el.find('.error').html(responseText.message).fadeIn();
    },

    resetPassword: function(event) {
      console.log("Resetting password");
      event.preventDefault();
      this.$('.error').fadeOut();

      var user = {
        email: this.$('input[name=email]').val()
      };
      var reset = api.resetPassword(user);
      reset.success(this.changeDone);
      reset.fail(this.changeFail);
    }
  });


  return UserViews;

}); // End UserViews
