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

      this.surveys = new Surveys.Collection();
      this.surveys.bind('reset', this.render);
    },

    update: function() {
      this.surveys.fetch({
        reset: true
      });
    },

    render: function() {
      console.log("Rendering DashboardView");

      var self = this;
      var context = {};
      this.$el.html(_.template($('#dashboard').html())(context));

      if(this.surveys.length === 0) {
        $('.first-run').slideDown();
      }

      var parity = 0;
      var render = false;
      if (this.surveys.length <= 5) {
        render = true;
      }
      this.surveys.each(function(survey) {
        if (parity === 0) {
          survey.set('parity', 'odd');
          parity = 1;
        }else {
          survey.set('parity', 'even');
          parity = 0;
        }
        survey.set('render', render);
        self.appendSurvey(survey);
      });
    },

    appendSurvey: function(survey) {
      var surveyListItemView = new SurveyViews.ListItemView({
        model: survey
      });
      console.log("Appending survey");
      this.$('.survey-list').append(surveyListItemView.$el);
    }
  });

  return DashboardView;

}); // End DashboardView
