/*jslint nomen: true */
/*globals define */

define(function (require) {
  'use strict';

  var $ = require('jquery');
  var _ = require('lib/lodash');
  var async = require('lib/async');
  var Backbone = require('backbone');
  var events = require('lib/tinypubsub');
  var L = require('lib/leaflet/leaflet.tilejson');

  var settings = require('settings');

  // Models
  var Forms = require('models/forms');
  var Stats = require('models/stats');
  var Surveys = require('models/surveys');
  var Responses = require('models/responses');

  // Views
  var ResponseListView = require('views/responses/list');
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

  function dotPath(obj, path) {
    return path.split('.').reduce(function (memo, index) {
      if (!memo) { return memo; }
      return memo[index];
    }, obj);
  }

  // The View
  var LayerControl = Backbone.View.extend({
    template: _.template(template),
    tableTemplate: _.template(tableTemplate),

    // active, inactive, filtered
    state: 'active',

    events: {
      'click .close': 'close',
      'click .toggle-layer': 'toggleLayer',
      'click .show-settings .title': 'showSettings'
    },

    className: 'layer',
    initialize: function(options) {
      _.bindAll(this,
        'render',
        'update',
        'doneLoading',
        'getForms',
        'setCount',
        'addTileLayer',

        // Settings
        'setupSettings',
        'showSettings',

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
        self.trigger('count', dotPath({
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

      console.log("Adding tile layer", tilejson, this.tileLayer);

      this.mapView.addTileLayer(this.tileLayer);
      this.mapView.addTileLayer(this.gridLayer);
    },

    toggleLayer: function () {
      if (this.state === 'active') {
        this.state = 'inactive';
        this.mapView.removeTileLayer(this.tileLayer);
        this.mapView.removeTileLayer(this.gridLayer);
        this.changeLegend();
      } else if (this.state === 'inactive') {
        this.state = 'active';
        this.mapView.addTileLayer(this.tileLayer);
        this.mapView.addTileLayer(this.gridLayer);
        this.removeLegend();
      } else if (this.state === 'filtered') {
        this.state = 'active';
        this.changeFilter();
        this.removeLegend();
      }
    },

    selectItem: function (objectId) {
      if (this.selectedItemListView) {
        this.selectedItemListView.remove();
      }

      // FIXME: If this gets called because of a direct navigation to a
      // surveys/:slug/dive/:oid URL, then there was never a click on the
      // map, and so the object in question hasn't been highlighted on the map.
      var rc = new Responses.Collection([], {
        surveyId: this.survey.get('id'),
        objectId: objectId
      });

      var surveyOptions = this.survey.get('surveyOptions') || {};
      this.selectedItemListView = new ResponseListView({
        el: '#responses-list',
        collection: rc,
        labels: this.forms.getQuestions(),
        forms: this.forms,
        surveyOptions: surveyOptions
      });
      var $el = this.selectedItemListView.render();
      this.trigger('renderedDetails', $el);

      this.listenTo(this.selectedItemListView, 'remove', this.mapView.deselectObject);

      rc.on('destroy', function() {
        this.mapView.update();
      }.bind(this));
    },

    handleClick: function (event) {
      console.log("Handle click", event);
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
        this.selectItem(objectId);
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
      this.listenTo(this.settings, 'legendRemoved', this.removeLegend);

      var $el = this.settings.render();
      this.$settings = $el;
      this.trigger('renderedSettings', $el);
    },

    showSettings: function (event) {
      console.log("Showing settings", this.$settings);
      this.$settings.show();
    },

    changeFilter: function(filter) {
      console.log("Got filter", filter);
      this.getTileJSON(filter);

      // Set up the legend
      // this.$el.find('.legend').html($legend);
    },

    removeLegend: function() {
      this.$el.find('.legend').empty();
      this.$el.find('.show-settings').removeClass('legend-active');
    },

    changeLegend: function($legend) {
      this.$el.find('.show-settings').addClass('legend-active');
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
