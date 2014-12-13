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
  var SettingsView = require('views/projects/datalayers/survey/settings-survey');

  // Templates
  var template = require('text!templates/projects/layerControl.html');
  var tableTemplate = require('text!templates/projects/surveys/table-survey.html');

  function flip(a) {
    return [a[1], a[0]];
  }

  function downgrade(f) {
    return function g(data) {
      return f(null, data);
    };
  }


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
        'doneLoading',
        'getForms',
        'setCount',
        'fitBounds',
        'getTileJSON',
        'addTileLayer',

        // Settings
        'setupSettings',
        'showSettings',
        'changeFilter',
        'clearFilter'
      );

      console.log("Creating survey layer with options", options);
      this.layerName = options.layerName;
      this.surveyId = options.layerId;
      this.filter = options.filter;

      this.survey = new Surveys.Model({ id: this.surveyId });
      this.stats = new Stats.Model({ id: this.surveyId });
      this.stats.fetch({reset: true});
      this.forms = new Forms.Collection({ surveyId: this.surveyId });
      this.forms.fetch({ reset: true });

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
        self.render();
        self.getTileJSON(self.filter);
      });

      this.survey.on('change:responseBounds', this.fitBounds);
      this.survey.fetch();
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

    // XXX TODO
    // Trigger when bounds change
    fitBounds: function() {
      var bounds = this.survey.get('responseBounds');
      if (!bounds) {
        return;
      }
      var newBounds = [flip(bounds[0]), flip(bounds[1])];
      this.trigger('newBounds', newBounds);
    },


    // XXX TODO This fires multiple times
    addTileLayer: function(tilejson) {
      // if(this.tileLayer) {
      //   this.map.removeLayer(this.tileLayer);
      // }
      this.tileLayer = new L.TileJSON.createTileLayer(tilejson);
      this.trigger('tileLayerReady', this.tileLayer, this.surveyId);
      //this.map.addLayer(this.tileLayer);
    },

    doneLoading: function() {
      this.$el.find('.loading').hide();
    },

    setupSettings: function() {
      // XXX TODO
      // Settings are getting rendered multiple times
      console.log("Getting settings", this.forms);

      this.settings = new SettingsView({
        survey: this.survey,
        forms: this.forms,
        stats: this.stats
      });

      this.settings.on('filterSet', this.changeFilter);
      this.settings.on('filterReset', this.clearFilter);

      var $el = this.settings.render();
      this.$settings = $el;
      this.trigger('renderedSettings', $el);
    },

    showSettings: function() {
      console.log("Showing settings", this.$settings);
      this.$settings.show();
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
      this.forms.fetch({ reset: true });
    },

    setCount: function() {
      var count = this.stats.get(this.filter.question)[this.filter.answer] || '';

      console.log("GOT COUNT", count);
    },

    render: function() {
      var context = {
        name: this.layerName || this.survey.get('name') || 'LocalData Survey',
        kind: 'responses',
        meta: { }
      };

      if(this.filter) {
        context.meta.color = this.filter.color;
        context.meta.count = '';
        this.stats.on('reset', this.setCount);
      }else {
        context.meta.count = this.survey.get('responseCount') || '';
      }

      this.$el.html(this.template(context));
      if(this.survey.get('name')) {
        this.doneLoading();
      }

      this.trigger('rendered', this.$el);

      console.log('Created survey $el', this.$el);
      this.setupSettings();
      // return this.$el;
    }

    // close: function() {
    //   if(this.tileLayer) {
    //     this.map.removeLayer(this.tileLayer);
    //   }
    //   this.remove();
    // }
  });

  return LayerControl;

});
