/*jslint nomen: true */
/*globals define, document */

define(function (require) {
  'use strict';

  var $ = require('jquery');
  var _ = require('lib/lodash');
  var async = require('lib/async');
  var Backbone = require('backbone');
  var events = require('lib/tinypubsub');
  var L = require('lib/leaflet/leaflet.tilejson');

  var settings = require('settings');
  var util = require('util');

  // Models
  var Forms = require('models/forms');
  var Stats = require('models/stats');
  var Surveys = require('models/surveys');
  var Responses = require('models/responses');

  // Views
  var ObjectView = require('views/projects/datalayers/survey/object-view');
  var SettingsView = require('views/projects/datalayers/survey/settings-survey');
  var StatsView = require('views/projects/datalayers/survey/stats-survey');
  var ExportView = require('views/export');
  var LegendView = require('views/surveys/legend');


  // Templates
  var template = require('text!templates/projects/layerControl.html');

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

    // active, inactive
    state: 'active',
    className: 'layer',

    events: {
      'click .close': 'close',
      'click .toggle-layer': 'toggleLayer',
      'click .show-settings .title': 'showSettings'
    },

    initialize: function(options) {
      _.bindAll(this,
        'render',
        'update',
        'doneLoading',
        'getForms',
        'addTileLayer',

        // Settings
        'setupSettings',
        'showSettings',

        // Reports
        'setupStats',
        'setupExport',

        // Interaction
        'handleClick'
      );

      console.log("Creating survey layer with options", options);
      this.layerName = options.survey.layerName;
      this.surveyId = options.survey.layerId;
      this.layerDef = {
        query: options.survey.query,
        select: options.survey.select,
        styles: options.survey.styles
      };
      this.color = options.survey.color;
      this.exploration = options.survey.exploration;
      this.state = options.survey.state || 'active';
      this.filters = options.survey.filters;

      this.mapView = options.mapView;

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
        if (options.surveyOptions) {
          var surveyOptions = self.survey.get('surveyOptions');
          self.survey.set({
            surveyOptions: _.defaults(options.surveyOptions, surveyOptions)
          });
        }
        self.trigger('count', util.dotPath({
          stats: self.stats.toJSON(),
          survey: self.survey.toJSON()
        }, options.survey.countPath));

        self.survey.set('queryCount', util.dotPath({
          stats: self.stats.toJSON(),
          survey: self.survey.toJSON()
        }, options.survey.countPath));

        self.render();
        self.getTileJSON();
      });

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
        data = _.find(filterDefs, { name: filter.answer }).layer;
      }

      // Get TileJSON
      // TODO: Switch this to a POST once we support proxying the post to the
      // tile server through the API.
      $.ajax({
        url: '/tiles/surveys/' + this.survey.get('id') + '/tile.json',
        type: 'POST',
        dataType: 'json',
        cache: false,
        contentType: 'application/json',
        data: JSON.stringify(data)
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
      this.mapView.fitBounds(newBounds);
    },

    addTileLayer: function(tilejson) {
      if(this.tileLayer) {
        this.mapView.removeTileLayer(this.tileLayer);
      }
      this.tileLayer = new L.TileJSON.createTileLayer(tilejson);

      // Create the grid layer
      if (this.gridLayer) {
        this.mapView.removeTileLayer(this.gridLayer);
      }
      this.gridLayer = new L.UtfGrid(tilejson.grids[0], {
        resolution: 4
      });
      this.gridLayer.on('click', this.handleClick);

      if(this.mapView && this.state === 'active') {
        this.mapView.addTileLayer(this.tileLayer);
        this.mapView.addGridLayer(this.gridLayer, true);
      }
    },

    toggleLayer: function () {
      console.log("Toggling layer, start state", this.state);
      if (this.state === 'active') {
        this.state = 'inactive';
        this.mapView.removeTileLayer(this.tileLayer);
        this.mapView.removeGridLayer(this.gridLayer);
        //this.changeLegend();
        this.$el.addClass('legend-inactive');
      } else if (this.state === 'inactive') {
        this.state = 'active';
        this.mapView.addTileLayer(this.tileLayer);
        this.mapView.addGridLayer(this.gridLayer, true);
        // this.removeLegend();
        this.$el.removeClass('legend-inactive');
      }
    },

    selectItem: function (objectId, latlng) {
      // FIXME: If this gets called because of a direct navigation to a
      // surveys/:slug/dive/:oid URL, then there was never a click on the
      // map, and so the object in question hasn't been highlighted on the map.
      var rc = new Responses.Collection([], {
        surveyId: this.survey.get('id'),
        objectId: objectId
      });

      var surveyOptions = this.survey.get('surveyOptions') || {};
      this.selectedItemListView = new ObjectView({
        id: 'responses-list',
        collection: rc,
        labels: this.forms.getQuestions(),
        forms: this.forms,
        surveyOptions: surveyOptions,
        survey: this.survey
      });

      this.trigger('itemSelected', {
        view: this.selectedItemListView,
        latlng: latlng
      });

      this.listenTo(this.selectedItemListView, 'remove', this.mapView.deselectObject);

      rc.on('destroy', function() {
        this.mapView.update();
      }.bind(this));
    },

    handleClick: function (event) {
      var objectId;

      if (event.data) {
        objectId = event.data.object_id;
      } else {
        return;
      }

      var hash = document.location.hash.substr(1);

      // Navigate to the deep-dive version of this view.
      // TODO: The MultiSurveyView (multi.js) should handle this, not the
      // SurveyLayer.
      if (this.mode === 'overview') {
        events.publish('navigate', [hash + '/dive']);
      }

      if (objectId) {
        this.selectItem(objectId, event.latlng);
      }
    },

    /**
     * Highlight a selected object
     * @param  {Object} event
     */
    selectObject: function(event) {
      if (!event.data) {
        return;
      }

      this.deselectObject();

      // Add a layer with a visual selection
      this.selectedLayer = new L.GeoJSON(event.data.geometry, {
        pointToLayer: this.defaultPointToLayer,
        style: settings.selectedStyle
      });

      // XXX TODO
      // Send the layer up to the map
      // this.map.addLayer(this.selectedLayer);
      // this.selectedLayer.bringToFront();
    },

    deselectObject: function(event) {
      // XXX TODO
      // if (this.selectedLayer !== null) {
      //   this.map.removeLayer(this.selectedLayer);
      //   delete this.selectedLayer;
      // }
    },

    doneLoading: function() {
      this.$el.find('.loading').hide();
    },

    setupSettings: function() {
      var options = {
        survey: this.survey,
        forms: this.forms,
        stats: this.stats,
        exploration: this.exploration
      };

      if (this.filters) {
        options.filters = this.filters;
      }

      this.settings = new SettingsView(options);

      this.listenTo(this.settings, 'filterSet', this.changeFilter);
      this.listenTo(this.settings, 'updated', this.changeLegend);

      var $el = this.settings.render();
      this.$settings = $el;
      this.trigger('renderedSettings', $el);
    },

    showSettings: function (event) {
      console.log("Showing settings", this.$settings);
      this.$settings.show();
    },

    setupStats: function() {
      this.statsView = new StatsView({
        title: this.layerName,
        survey: this.survey,
        forms: this.forms,
        stats: this.stats,
        layerDef: this.layerDef,
        exploration: this.exploration
      });

      var $el = this.statsView.render();
      this.$stats = $el;
      this.trigger('renderedStats', $el);
    },

    setupExport: function() {
      this.exportView = new ExportView({
        isEmbed: true,
        survey: this.survey
      });
      var $el = this.exportView.render();
      this.trigger('renderedExport', $el);
    },

    changeFilter: function(filter) {
      // Assume this activates the layer
      this.state = 'active';

      this.getTileJSON(filter);
    },

    changeLegend: function(options) {
      this.legendView.setFilters(options.filters);
      this.legendView.setCategory(options.category);
      if (options.category) {
        this.$el.removeClass('legend-inactive');
      }
      this.legendView.render();
    },

    getForms: function() {
      this.forms = new Forms.Collection({
        surveyId: this.survey.get('id')
      });
      this.forms.fetch({ reset: true });
    },

    render: function() {
      var context = {
        name: this.layerName || this.survey.get('name') || 'LocalData Survey',
        kind: 'responses',
        meta: { }
      };

      if (this.color) {
        context.meta.color = this.color;
      }

      context.meta.count = util.numberWithCommas(this.survey.get('queryCount')) || '';

      this.$el.html(this.template(context));
      if(this.survey.get('name')) {
        this.doneLoading();
      }

      if (this.state === 'inactive') {
        this.$el.addClass('legend-inactive');
      }

      this.legendView = new LegendView({
        el: this.$('.legend'),
        filters: {},
        category: null
      });
      this.legendView.render();

      this.trigger('rendered', this.$el);

      this.setupStats();
      this.setupSettings();

      // TODO: Remove these inter-View event bindings when we turn the filter
      // state into a Model.
      this.legendView.on('answerSelected', this.settings.selectAnswer, this.settings);
      this.legendView.on('questionSelected', this.settings.selectQuestion, this.settings);
      this.legendView.on('filterReset', this.settings.reset, this.settings);

      return this.$el;
    }
  });

  return LayerControl;

});
