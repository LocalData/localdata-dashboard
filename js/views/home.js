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
  'models/users',
  'models/surveys',

  // Views
  'views/surveys'
  
],

function($, _, Backbone, settings, api, Users, Surveys, SurveyViews) {
  'use strict'; 

  var HomeView = Backbone.View.extend({
  
    el: $("#container"),
    
    initialize: function(options) {
      _.bindAll(this, 'render', 'update', 'checkUserView');

      this.userModel = new Users.Model();
      this.userModel.on("change", this.checkUserView)
    },

    update: function() {
      this.render();
    },

    checkUserView: function() {
      console.log(this.userModel.isLoggedIn());
    },
    
    render: function() {  
      console.log("Rendering HomeView"); 
      

      var self = this;
      var context = {};
      this.$el.html(_.template($('#home').html(), context));  
    }
    
  });

  return HomeView;

}); // End HomeView
