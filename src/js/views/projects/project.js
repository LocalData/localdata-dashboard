/*jslint nomen: true */
/*globals define, cartodb: true */

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
  'views/maps/project-map',
  'views/projects/layerControl',
  'views/projects/dataSelector',

  // Templates
  'text!templates/projects/project.html'
],

function($, _, Backbone, settings, IndexRouter, Surveys, SurveyViews, MapView, LayerControl, DataSelector, template) {
  'use strict';

  var ProjectView = Backbone.View.extend({
    el: '#container',
    template: _.template(template),

    events: {
      'click .show-data-selector': 'showDataSelector'
    },

    initialize: function(options) {
      _.bindAll(this, 'render', 'setupMap', 'showDataSelector', 'addLayer');
      this.survey = new Surveys.Model({id: '85968dd0-98c2-11e2-ab9b-79cb9b3de46f'});
      this.selectorView = new DataSelector({});
      this.selectorView.on('addLayer', this.addLayer);
    },

    update: function() {
      this.render();
    },

    render: function() {
      console.log("Rendering ProjectView", this.$el);
      var context = {};
      this.$el.html(this.template({}));
      this.setupDataSelector();
      this.setupMap();
    },

    /* Data selector ------------------------------------- */
    setupDataSelector: function() {
      var $el = this.selectorView.render();
      this.$el.find('.b').prepend($el);
    },

    showDataSelector: function(event) {
      event.preventDefault();
      this.selectorView.show();
    },

    addLayer: function(layerName) {
      console.log("Add layer:", layerName);
      var layer = new LayerControl({ });
      console.log(layer);
      this.$el.find('.layers').append(layer.render());

    },

    /* Map ------------------------------------------------ */
    setupMap: function() {
      this.mapView = new MapView({
        el: $('#project-map'),
        survey: this.survey,
        clickHandler: this.mapClickHandler
      });

      // this.setupLayers();
    }
    /* Layer controls ------------------------------------- */
    // setupLayers: function() {
    // }

  });

  return ProjectView;

});
