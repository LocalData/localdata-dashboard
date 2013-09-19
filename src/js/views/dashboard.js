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
      this.$el.html(_.template($('#dashboard').html(), context));

      this.surveys.each(function(survey) {
        self.appendSurvey(survey);
      });
    },

    appendSurvey: function(survey) {
      var surveyListItemView = new SurveyViews.ListItemView({
        model: survey
      });

      var $el = surveyListItemView.render().$el;
      $('.survey-list', this.$el).append($el);

      console.log($('.map', $el));
      this.map = new L.map($('.map', $el)[0], {
        zoom: 15
      });
      this.baseLayer = L.tileLayer(settings.baseLayer);
      this.map.addLayer(this.baseLayer);
    }
  });

  return DashboardView;

}); // End DashboardView
