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

  // Models
  var Surveys = require('models/surveys');
  var Forms = require('models/forms');
  var Stats = require('models/stats');

  // Views
  var SettingsView = require('views/projects/datalayers/survey/settings-survey');

  // Templates
  var template = require('text!templates/projects/layerControl.html');
  var tableTemplate = require('text!templates/projects/surveys/table-survey.html');


  // The View
  var LayerControl = Backbone.View.extend({
    template: _.template(template),
    tableTemplate: _.template(tableTemplate),

    events: {
      'click .close': 'close',
      'click .show-settings': 'showSettings'
    },

    className: 'layer',
    initialize: function(options) {
      _.bindAll(this,
        'render',
        'update',
        'close',
        'processData',
        'doneLoading',
        'getForms',
        'getTileJSON',
        'addTileLayer',

        // Settings
        'setupSettings',
        'showSettings',
        'changeFilter',
        'clearFilter'
      );

      console.log("Creating survey layer with options", options);
      this.map = options.map;
      this.table = options.tableView;
      this.surveyId = options.layerId;

      this.survey = new Surveys.Model({ id: this.surveyId });
      this.survey.on('change', this.processData);
      this.survey.fetch();
    },

    processData: function(data) {
      this.render();
      this.getTileJSON();
    },

    update: function() {

    },

    /**
     * Set up and fetch the tilejson neede to add the survey to the map.
     */
    getTileJSON: function(filter) {
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

    addTileLayer: function(tilejson) {
      if(this.tileLayer) {
        this.map.removeLayer(this.tileLayer);
      }
      this.tileLayer = new L.TileJSON.createTileLayer(tilejson);
      this.map.addLayer(this.tileLayer);
    },

    doneLoading: function() {
      this.$el.find('.loading').hide();
    },

    setupSettings: function() {
      // XXX TODO
      // Settings are getting rendered multiple times
      console.log("Getting settings", this.forms);
      this.stats = new Stats.Model({
        id: this.survey.get('id')
      });
      this.stats.on('reset', this.setupTable);
      this.stats.fetch({reset: true});

      this.settings = new SettingsView({
        survey: this.survey,
        forms: this.forms,
        stats: this.stats
      });

      this.settings.on('filterSet', this.changeFilter);
      this.settings.on('filterReset', this.clearFilter);

      var $el = this.settings.render();
      this.$el.find('.settings-container').html($el);
    },

    setupTable: function() {
      var $table = this.tableTemplate({
        survey: this.survey.toJSON(),
        stats: this.stats.toJSON()
      });
      console.log("Setting table", this.table, this.stats.toJSON());
      this.table.$el.append($table);
    },

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
      this.forms.on('reset', this.setupSettings);
      this.forms.fetch({ reset: true });
    },

    render: function() {
      var context = {
        name: this.survey.get('name') || 'LocalData Survey',
        kind: 'responses',
        meta: {
          count: this.survey.get('responseCount') || 0 //this.getCount()
        }
      };

      this.$el.html(this.template(context));
      if(this.survey.get('name')) {
        this.doneLoading();
      }

      this.getForms();

      return this.$el;
    },

    close: function() {
      if(this.tileLayer) {
        this.map.removeLayer(this.tileLayer);
      }
      this.remove();
    }
  });

  return LayerControl;

});