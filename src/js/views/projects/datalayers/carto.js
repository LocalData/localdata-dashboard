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
        'doneLoading',

        // Settings
        'setupSettings',
        'showSettings'
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

      // this.settings = new SettingsView({
      // });

      // var $el = this.settings.render();
      this.$el.find('.settings-container').html('Settings!');
    },

    setupTable: function() {
      // var $table = this.tableTemplate({
      // });
      // console.log("Setting table", this.table, this.stats.toJSON());
      // this.table.$el.append($table);
    },

    showSettings: function() {
      console.log("Showing settings", this.$el.find('.settings'));
      this.$el.find('.settings').show();
    },

    render: function() {
      var context = {
        name: 'Carto Dataset', // XXX TODO Add datasetname
        kind: 'values',
        meta: {
          count: 200 // XXX TODO
          // count: this.survey.get('responseCount') || 0 //this.getCount()
        }
      };

      this.$el.html(this.template(context));

      cartodb.createLayer(this.map, 'https://localdata.cartodb.com/api/v2/viz/0e8bbb64-6514-11e4-bdbc-0e4fddd5de28/viz.json')
        .addTo(this.map)
        .on('done', function(layer) {
          this.doneLoading();
          console.log("Stuff");
        }.bind(this))
        .on('error', function(err) {
          console.log("some error occurred: " + err);
        });


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
