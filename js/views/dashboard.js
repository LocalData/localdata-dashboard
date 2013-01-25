/*jslint nomen: true */
/*globals define: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',
  'settings',

  // Router
  'routers/index',

  // Models
  'models/surveys',

  // Views
  'views/surveys'

],

function($, _, Backbone, settings, IndexRouter, Surveys, SurveyViews) {
  'use strict';

  var DashboardView = Backbone.View.extend({
  
    el: '#container',
    
    initialize: function(options) {
      _.bindAll(this, 'render', 'appendSurvey');

      if (options) {
        this.el = options.el || '#container';
      }

      this.surveys = new Surveys.Collection();
      this.surveys.bind('reset', this.render);
    },

    update: function() {
      this.surveys.fetch();
    },
    
    render: function() {
      console.log("Rendering DashboardView");
      
      var self = this;
      var context = {};
      this.$el.html(_.template($('#dashboard').html(), context));

      this.surveys.each(function(survey) {
        self.appendSurvey(survey);
      });
    },

    appendSurvey: function(survey) {
      var surveyListItemView = new SurveyViews.ListItemView({
        model: survey
      });
      $('.survey-list', this.el).append(surveyListItemView.render().el);
    }
    
  });

  return DashboardView;

}); // End DashboardView
