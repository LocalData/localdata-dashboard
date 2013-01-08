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
      "click #login button": "logIn",
      "click #create-user button": "createUser"
    },

    initialize: function(options) {
      this.redirectTo = options.redirectTo || "/";
      this.redirectTo = this.redirectTo.replace("?redirectTo=", "");
      console.log("Creating login view");
      _.bindAll(this, 'render', 'update', 'createUser');
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

    logIn: function() {
      console.log("Logging in");
    },  

    createUser: function(event) {
      event.preventDefault();
      var user = $(event.target).parent().serializeArray();
      console.log(user);
      console.log("Create a user");

      api.createUser(user, function(error, user) {
        if(error) {
          console.log(error);
          return;
        }

        // Success! Go to the dashboard. 
        router.navigate("/", true);
      });
    }

  });

  return UserViews;

}); // End UserViews 
