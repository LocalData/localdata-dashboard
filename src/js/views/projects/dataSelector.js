/*jslint nomen: true */
/*globals define, cartodb, Rickshaw: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',

  // LocalData
  'settings',

  // Models
  'models/surveys',

  // Templates
  'text!templates/projects/dataSelector.html'
],

function($, _, Backbone, settings, Surveys, template) {
  'use strict';

  var DataSelector = Backbone.View.extend({
    template: _.template(template),

    id: 'data-select-container',

    events: {
      'click .categories .dataset': 'showSources',
      'click .sources .dataset': 'showDetails',
      'click .add-layer': 'addLayer'
    },

    initialize: function(options) {
      _.bindAll(this, 'render', 'show', 'showSources', 'showDetails', 'addLayer');
    },

    render: function() {
      var context = {};
      this.$el.html(this.template({}));
      console.log("Rendering data selector", this.$el);
      return this.$el;
    },

    show: function() {
      console.log(this);
      this.$el.show();
    },

    showSources: function(event) {
      this.$el.find('.categories .dataset').removeClass('selected');
      this.$el.find('.sources .dataset').removeClass('selected');
      this.$el.find('.details').hide();
      $(event.target).closest('.dataset').addClass('selected');
      this.$el.find('.sources').show();
    },

    showDetails: function(event) {
      console.log("Clicked datasource");
      this.$el.find('.sources .dataset').removeClass('selected');
      $(event.target).addClass('selected');
      this.$el.find('.details').show();
    },

    addLayer: function(event) {
      console.log("Adding layer");
      this.trigger('addLayer', 'layer name here');
      this.close();
    },

    close: function() {
      this.$el.hide();
      this.$el.find('.dataset').removeClass('selected');
      this.$el.find('.details').hide();
      this.$el.find('.sources').hide();
    }

  });

  return DataSelector;

});
