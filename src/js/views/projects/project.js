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
  'views/surveys',
  'views/map',

  // Templates
  'text!templates/projects/project.html'
],

function($, _, Backbone, settings, IndexRouter, Surveys, SurveyViews, MapView, template) {
  'use strict';

  var ProjectView = Backbone.View.extend({
    el: '#container',
    template: _.template(template),

    initialize: function(options) {
      _.bindAll(this, 'render', 'setupMap');
      this.survey = new Surveys.Model({id: '06a311f0-4b1a-11e3-aca4-1bb74719513f'});

    },

    update: function() {
      this.render();
    },

    render: function() {
      console.log("Rendering ProjectView", this.$el);
      var context = {};
      this.$el.html(this.template({}));
      this.setupMap();
    },

    setupMap: function() {
      this.mapView = new MapView({
        el: $('#project-map'),
        survey: this.survey,
        clickHandler: this.mapClickHandler
      });
    }

  });

  return ProjectView;

});
