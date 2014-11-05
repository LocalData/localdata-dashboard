/*jslint nomen: true */
/*globals define, cartodb, Rickshaw: true */

define(function (require) {
  'use strict';

  var $ = require('jquery');
  var _ = require('lib/lodash');
  var Backbone = require('backbone');
  var L = require('lib/leaflet/leaflet.tilejson');

  var cartodb = require('cartodb');
  cartodb = window.cartodb;

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

        // Settings
        'setupSettings',
        'showSettings',
        'changeFilter',
        'clearFilter'
      );

      console.log("Creating cartodb layer with options", options);
      this.map = options.map;
      this.table = options.tableView;
      this.layerId = options.layerId;
    },

    update: function() {

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
