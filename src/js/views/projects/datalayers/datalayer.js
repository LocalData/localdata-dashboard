/*jslint nomen: true */
/*globals define, cartodb, Rickshaw: true */

define(function (require) {
  'use strict';

  var $ = require('jquery');
  var _ = require('lib/lodash');
  var Backbone = require('backbone');
  var L = require('lib/leaflet/leaflet.tilejson');

  // LocalData
  var settings = require('settings');

  // Templates
  var template = require('text!templates/projects/layerControl.html');


  var LayerControl = Backbone.View.extend({
    template: _.template(template),

    events: {
      'click .close': 'close',
      'click .open-settings': 'settings'
    },

    className: 'layer',

    initialize: function(options) {
      _.bindAll(this,
        'setup',
        'render',
        'update',
        'close',
        'settings'
      );
      console.log("Creating data layer layer with options", options);
      this.map = options.map;
      this.layerId = options.layerId;

      this.model = options.model(options);
      this.model.on('fetch', this.render);

      this.setup();
    },

    update: function(options) {
      this.model.fetch();
    },

    /**
     * Set up the map and chart data
     * @param  {Object} options
     */
    setup: function() {
    },

    render: function() {
      console.log("Rendering layerControl", this.$el);
      var context = {};
      this.$el.html(this.template(context));
      return this.$el;
    },

    close: function() {
      // this.map.removeLayer(this.layer); // include by default?
      this.remove();
    },

    /**
     * Setup the settings panel
     * Probably should be run after render so there's a valid $el to manipulate.
     */
    setupSettings: function() {

    },

    settings: function(event) {
      event.preventDefault();
      this.$el.find('.settings').show();
    },

    /**
     * Returns the current state of the view, including filters, settings, etc.
     * Used for saving a layer to a project.
     * @return {Object}
     */
    getState: function() {
      return {};
    }

  });

  return LayerControl;
});
