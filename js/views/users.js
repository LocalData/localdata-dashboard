/*jslint nomen: true */
/*globals define: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',
  'lib/tinypubsub',

  // LocalData
  'settings',

  // Models
  'models/users'
],

function($, _, Backbone, events, settings, UserModels) {
  'use strict'; 

  var UserViews = {};


  UserViews.LoginView = Backbone.View.extend({
    el: "#container",

    initialize: function(options) {
      this.redirectTo = options.redirectTo || "/";
      this.redirectTo = this.redirectTo.replace("?redirectTo=", "")
      console.log("Creating login view");
      _.bindAll(this, 'render', 'update');
    },

    render: function() {
      var context = {
        redirectTo: this.redirectTo
      }
      this.$el.html(_.template($('#login-view').html(), context));  
      return this;
    },

    update: function() {
      this.render();
    }
  });

  return UserViews;

}); // End UserViews 
