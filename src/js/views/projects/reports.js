/*jslint nomen: true */
/*globals define: true */

define(function(require, exports, module) {
  'use strict';

  // Libs
  var $ = require('jquery');
  var _ = require('lib/lodash');
  var Backbone = require('backbone');
  var util = require('util');

  var api = require('api');

  // Views
  var SurveyLayer = require('views/projects/datalayers/survey');
  var projects = require('views/projects/projects');

  // Templates
  var template = require('text!templates/projects/reports.html');

  var ReportsView = Backbone.View.extend({
    activeLayers: {},

    template: _.template(template),

    el: '#container',

    initialize: function(options) {
      // XXX TODO
      // Pull from survey options?
      // Load the right layers for each survey.
      this.slug = options.slug;
      this.project = projects[this.slug];
      if (!this.project) {
        this.project = projects.gtech; // defaut fallback
      }

      this.mode = options.mode;

      this.render();
    },

    append: function ($el) {
      this.$el.find('.layers').append($el);
    },

    appendStats: function($el) {
      this.$el.find('.stats-container').append($el);
    },

    appendExport: function(exportView) {
      this.$el.find('.exports-container').append(exportView.$el);
    },

    render: function () {
      var context = {
        description: this.project.description
      };
      this.$el.html(this.template(context));

      var addedLayerIds = {};

      // Render survey layers
      _.each(this.project.surveys, function (survey, i) {
        console.log("Adding survey", survey);
        var surveyLayer = new SurveyLayer({
          survey: survey,
          surveyOptions: survey.options
        });

        // Add an export section if we don't already have one for this survey
        if(!this.activeLayers[survey.layerId]) {
          this.listenTo(surveyLayer, 'renderedExport', this.appendExport);
          surveyLayer.setupExport();
        }

        this.activeLayers[survey.layerId] = surveyLayer;

        this.listenTo(surveyLayer, 'renderedStats', this.appendStats);
      }.bind(this));
    }
  });

  return ReportsView;

});
