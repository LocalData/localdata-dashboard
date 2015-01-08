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
  var embeddedSurveyTemplate = require('text!templates/projects/reports.html');

  var ReportsView = Backbone.View.extend({
    activeLayers: {},

    template: _.template(embeddedSurveyTemplate),

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

    render: function () {
      var context = {
        description: this.project.description
      };
      this.$el.html(this.template(context));


      // Render survey layers
      _.each(this.project.surveys, function (survey, i) {
        var surveyLayer = new SurveyLayer({
          survey: survey,
          surveyOptions: survey.options
        });

        this.activeLayers[survey.layerId] = surveyLayer;

        this.listenTo(surveyLayer, 'renderedStats', this.appendStats);
      }.bind(this));

    }
  });

  return ReportsView;

});
