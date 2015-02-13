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
    },

    update: function() {
      this.render();
    },

    render: function() {
      console.log("Rendering HomeView");

      this.$el.html(_.template($('#home').html()));
    }
  });

  return HomeView;

}); // End HomeView
