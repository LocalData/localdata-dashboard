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
      'click .add-layer': 'addLayer',
      'click .close': 'close'
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
      $('#project-map').hide();
      this.$el.show();
    },

    showSources: function(event) {
      this.$el.find('.categories .dataset').removeClass('selected');
      this.$el.find('.sources .dataset').removeClass('selected');
      this.$el.find('.details').hide();
      this.$el.find('.sources').hide();

      var $dataset = $(event.target).closest('.dataset');
      $dataset.addClass('selected');

      var show = $dataset.attr('data-show');
      this.$el.find('.sources.' + show).show();
    },

    showDetails: function(event) {
      console.log("Clicked datasource");
      this.$el.find('.sources .dataset').removeClass('selected');
      this.$el.find('.details').hide();

      var $dataset = $(event.target).closest('.dataset');
      $dataset.addClass('selected');

      // Show the relevant details
      var show = $dataset.attr('data-show');
      this.$el.find('.details.' + show).show();
    },

    addLayer: function(event) {
      var layerName = $(event.target).closest('a').attr('data-add');
      var layerId = $(event.target).closest('a').attr('data-id');
      this.trigger('addLayer', layerName, layerId);
      this.close();
    },

    close: function() {
      this.$el.hide();
      this.$el.find('.dataset').removeClass('selected');
      this.$el.find('.details').hide();
      this.$el.find('.sources').hide();
      $('#project-map').show();
    },

    data: {
      'categories': [
        {
          name: 'My Surveys'
        },
        {
          name: 'Social media'
        },
        {
          name: 'Economic'
        },
        {
          name: 'Transportation'
        },
        {
          name: 'Crime & safety'
        },
        {
          name: 'Upload data'
        }
      ],
      'sources': {
        'my': [ 'foo'
        ],
        'socialmedia': [],
        'economic': [],
        'transportation': [],
        'crimeandsafety': [],
        'upload': []
      }
    }

  });

  return DataSelector;

});
