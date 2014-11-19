/*jslint nomen: true */
/*globals define, cartodb, Rickshaw: true */

define(function (require) {
  'use strict';

  var $ = require('jquery');
  var _ = require('lib/lodash');
  var async = require('lib/async');
  var Backbone = require('backbone');
  var L = require('lib/leaflet/leaflet.tilejson');

  // LocalData
  var settings = require('settings');

  // Models
  var Surveys = require('models/surveys');
  var Forms = require('models/forms');
  var Stats = require('models/stats');

  // Views
  var LayerFilterView = require('views/surveys/layer-filter');

  // Templates
  var template = require('text!templates/surveys/survey-control.html');


  var MIN_GRID_ZOOM = 14; // furthest out we'll have interactive grids.


  function downgrade(f) {
    return function g(data) {
      console.log("Downgrade", data);
      return f(null, data);
    };
  }

  function numberWithCommas(x) {
      return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  // The View
  var LayerControl = Backbone.View.extend({
    template: _.template(template),

    events: {
      'click .close': 'close',
      'click .show-settings': 'showSettings'
    },

    className: 'layer',
    initialize: function(options) {
      _.bindAll(this,
        'render',
        'processData',
        'doneLoading',
        'getForms',
        'getTileJSON',
        'addTileLayer'

        // Settings
        // XXX NOT USED IN MULTI EMBED
        // 'setupSettings',
        // 'showSettings',
        // 'changeFilter',
        // 'clearFilter'
      );

      console.log("Creating survey layer with options", options);
      this.map = options.map;
      this.surveyId = options.layerId;

      this.filter = options.filter;

      this.survey = new Surveys.Model({ id: this.surveyId });
      //this.survey.on('change', this.processData);
      this.survey.fetch();
      this.getTileJSON();

      this.forms = new Forms.Collection({ surveyId: this.surveyId });
      this.stats = new Stats.Model({ id: this.surveyId });
      this.stats.fetch({reset: true});
      this.stats.on('change', function() {
        console.log("STATS RESET", this.stats);
      }.bind(this));

      // Don't render the page until we have the necessary models.
      var self = this;
      async.parallel([
        function (next) {
          self.survey.once('change', downgrade(next));
        },
        function (next) {
          self.stats.once('change', downgrade(next));
        },
        function (next) {
          self.forms.once('reset', downgrade(next));
        }
      ], function (error) {
        console.log("GOT EVERYTHING", error);
        self.processData();
      });

    },

    processData: function() {
      this.render();
    },

    /**
     * Set up and fetch the tilejson neede to add the survey to the map.
     */
    getTileJSON: function() {
      var filter = this.filter;

      // Build the appropriate TileJSON URL.
      var url = '/tiles/' + this.survey.get('id');
      if (filter) {
        if(filter.question) {
          url = url + '/filter/' + filter.question;
        }
        if(filter.answer) {
          url = url + '/' + filter.answer;
        }
      }
      url = url + '/tile.json';

      // Get TileJSON
      $.ajax({
        url: url,
        type: 'GET',
        dataType: 'json',
        cache: false
      }).done(this.addTileLayer)
      .fail(function(jqXHR, textStatus, errorThrown) {
        console.log("Error fetching tilejson", jqXHR, textStatus, errorThrown);
      });
    },

    addGridLayer: function(tilejson) {
      this.gridLayer = new L.UtfGrid(tilejson.grids[0], {
        resolution: 4
      });

      // Make sure the grid layer is on top.
      if (this.map.getZoom() >= MIN_GRID_ZOOM) {
        this.map.addLayer(this.gridLayer);
      }

      this.gridLayer.on('click', this.selectObject);
      if (this.clickHandler) {
        this.gridLayer.on('click', this.clickHandler);
      }
    },

    selectObject: function() {
      console.log("selected");
    },


    addTileLayer: function(tilejson) {
      if(this.tileLayer) {
        this.map.removeLayer(this.tileLayer);
      }
      this.tileLayer = new L.TileJSON.createTileLayer(tilejson);
      this.map.addLayer(this.tileLayer);

      this.addGridLayer(tilejson);
    },

    doneLoading: function() {
      this.$el.find('.loading').hide();
    },

    //setupSettings: function() {
    //  // XXX TODO
    //  // Settings are getting rendered multiple times
    //  console.log("Getting settings", this.forms);
    //  this.stats = new Stats.Model({
    //    id: this.survey.get('id')
    //  });
    //  this.stats.fetch({reset: true});
//
    //  this.settings = new LayerFilterView({
    //    survey: this.survey,
    //    forms: this.forms,
    //    stats: this.stats
    //  });
//
    //  this.settings.on('filterSet', this.changeFilter);
    //  this.settings.on('filterReset', this.clearFilter);
//
    //  var $el = this.settings.render();
    //  this.$el.find('.settings-container').html($el);
    //},

    showSettings: function() {
      console.log("Showing settings", this.$el.find('.settings'));
      this.$el.find('.settings').show();
    },

    changeFilter: function(filter) {
      this.getTileJSON(filter);
    },

    clearFilter: function() {
      this.getTileJSON();
    },

    getForms: function() {
      this.forms = new Forms.Collection({
        surveyId: this.survey.get('id')
      });
      // this.forms.on('reset', this.setupSettings);
      this.forms.fetch({ reset: true });
    },

    render: function() {

      // The response count to display
      var count = this.survey.get('responseCount') || 0;

      // Change the response count if we have a specific filter
      if (this.filter) {
        count = this.stats.get(this.filter.question)[this.filter.answer];
        count = numberWithCommas(count);
      }

      var context = {
        name: this.survey.get('name') || 'LocalData Survey',
        kind: 'responses',
        meta: {
          count: count,
          filter: this.filter
        }
      };

      this.$el.html(this.template(context));
      if(this.survey.get('name')) {
        this.doneLoading();
      }

      return this.$el;
    }
  });

  return LayerControl;

});
