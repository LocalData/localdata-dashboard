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
      if (this.slug === 'walkscope') {
        this.project = projects.walkscope;
      } else {
        this.project = projects.gtech;
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

    appendExport: function($el) {
      console.log("Got an export view", $el);
      this.$el.find('.exports-container').append($el);
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

        // If we don't have an export for this layer already:
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