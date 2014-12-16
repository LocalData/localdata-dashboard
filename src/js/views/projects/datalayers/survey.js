/*jslint nomen: true */
/*globals define */

define(function (require) {
  'use strict';

  var $ = require('jquery');
  var _ = require('lib/lodash');
  var async = require('lib/async');
  var Backbone = require('backbone');
  var L = require('lib/leaflet/leaflet.tilejson');

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
        'addTileLayer',

        // Settings
        'setupSettings',
        'showSettings'
      );

      console.log("Creating survey layer with options", options);
      this.layerName = options.layerName;
      this.surveyId = options.layerId;
      this.layerDef = {
        query: options.query,
        select: options.select,
        styles: options.styles
      };
      this.color = options.color;
      this.exploration = options.exploration;

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
        self.getTileJSON();
      });

      this.survey.on('change:responseBounds', this.fitBounds);
      this.survey.fetch();
    },

    update: function() {

    },

    /**
     * Set up and fetch the tilejson neede to add the survey to the map.
     */
    getTileJSON: function (filter) {
      var data;
      if (!filter || !filter.question) {
        data = this.layerDef;
      } else if (filter.question && !filter.answer) {
        // TODO: Switch nomenclature to "category" and "value" instead of
        // "question" and "answer".
        data = _.find(this.exploration, { name: filter.question }).layer;
      } else {
        var filterDefs = _.find(this.exploration, {
          name: filter.question
        }).values;
        data = _.find(filterDefs, { text: filter.answer }).layer;
      }

      // Get TileJSON
      // TODO: Switch this to a POST once we support proxying the post to the
      // tile server through the API.
      $.ajax({
        url: '/tiles/surveys/' + this.survey.get('id') + '/tile.json',
        type: 'GET',
        dataType: 'json',
        cache: false,
        data: { layerDefinition: JSON.stringify(data) }
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

    addTileLayer: function(tilejson) {
      if(this.tileLayer) {
        this.trigger('removeLayer', this.tileLayer);
      }
      this.tileLayer = new L.TileJSON.createTileLayer(tilejson);
      this.trigger('tileLayerReady', this.tileLayer);
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
        stats: this.stats,
        exploration: this.exploration
      });

      this.listenTo(this.settings, 'filterSet', this.changeFilter);
      this.listenTo(this.settings, 'legendSet', this.changeLegend);

      var $el = this.settings.render();
      this.$settings = $el;
      this.trigger('renderedSettings', $el);
    },

    showSettings: function() {
      console.log("Showing settings", this.$settings);
      this.$settings.show();
    },

    changeFilter: function(filter) {
      console.log("Got filter", filter);
      this.getTileJSON(filter);

      // Set up the legend
      // this.$el.find('.legend').html($legend);
    },

    changeLegend: function($legend) {
      this.$el.find('.legend').empty().append($legend);
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

      if(this.color) {
        context.meta.color = this.color;
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
