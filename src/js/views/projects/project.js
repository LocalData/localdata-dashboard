/*jslint nomen: true */
/*globals define, cartodb, Rickshaw: true */

define(function (require) {
  'use strict';

  var $ = require('jquery');
  $ = require('rangeSlider');
  var _ = require('lib/lodash');
  var Backbone = require('backbone');
  var L = require('lib/leaflet/leaflet.tilejson');
  var moment = require('moment');

  // LocalData
  var settings = require('settings');

  // Models
  var Surveys = require('models/surveys');

  // Views
  var MapView = require('views/maps/project-map');
  var LayerControl = require('views/projects/layerControl');
  var DataSelector = require('views/projects/dataSelector');
  var TableView = require('views/projects/table');
  var WideGraph = require('views/projects/wideGraph');

  // Datasources
  var instagramDataSource = require('views/projects/datalayers/instagram');
  var factualDataSource = require('views/projects/datalayers/factual');
  var pedFatalitiesDataSource = require('views/projects/datalayers/ped-fatalities');
  var bikeFatalitiesDataSource = require('views/projects/datalayers/bike-fatalities');
  var bikeCountsDataSource = require('views/projects/datalayers/bike-counts');
  var cartoDataSource = require('views/projects/datalayers/carto');
  var pedCountsDataSource = require('views/projects/datalayers/ped-counts');
  var traffic = require('views/projects/datalayers/traffic');
  var surveyDataSource = require('views/projects/datalayers/survey');


  // Templates
  var template = require('text!templates/projects/project.html');
  var surveyTemplate = require('text!templates/projects/surveyDataSelector.html');


  var ProjectView = Backbone.View.extend({
    el: '#container',
    template: _.template(template),

    events: {
      'click .show-data-selector': 'showDataSelector',
      'click #export-btn': 'downloadData',
      'click #map-btn': 'showMap',
      'click #table-btn': 'showTable'
    },

    initialize: function(options) {
      _.bindAll(this,
        'render',
        'setupMap',
        'setupTable',
        'setupWideGraph',
        'showDataSelector',
        'addLayer',
        'updateDate'
      );

      this.selectorView = new DataSelector({});
      this.selectorView.on('addLayer', this.addLayer);
    },

    update: function() {
      this.render();
    },

    render: function() {
      console.log("Rendering ProjectView", this.$el);
      var context = {};
      this.$el.html(this.template({}));
      this.setupSlider();
      this.setupTable();
      this.setupDataSelector();
      this.setupMap();
    },

    setupWideGraph: function(info) {
      if (this.$wideGraphEl) {
        this.$wideGraphEl.remove();
      }
      this.wideGraph = new WideGraph();
      this.$wideGraphEl = this.wideGraph.render({
        title: info.title
      });
      this.$el.find('#project').append(this.$wideGraphEl);

      // Highcarts setup
      this.wideGraph.setupGraph(info.data);
    },

    /* Data selector ------------------------------------- */
    setupDataSelector: function() {
      var $el = this.selectorView.render();
      this.$el.find('.b').prepend($el);

      // Dynamically add surveys to the dataSelector.
      this.surveys = new Surveys.Collection();
      this.surveys.fetch({ reset: true });
      this.surveys.on('reset', function() {
        var t = _.template(surveyTemplate);
        this.$el.find('.dataselect').append(t({ surveys: this.surveys.toJSON() }));
      }.bind(this));
    },

    /**
     * Iterate over all layers and change the date range
     * @param  {Array} values start and end dates
     *
     * TODO:
     * - Move this to a master layerController
     * - Debounce, otherwise we get lots of requests!!
     */
    updateDate: function() {
      var values = this.getDateRange();
      var start = new Date(values[0]);
      var stop = new Date(values[1]);

      $('.startend .start').html(moment(start).format("ddd, D/M"));
      $('.startend .end').html(moment(stop).format("ddd, D/M"));

      _.each(this.activeLayers, function(layer) {
        layer.update({
          type: 'daterange',
          data: {
            start: start,
            stop: stop
          }
        });
      });
    },

    getDateRange: function() {
      return $('#slider-range').slider('values');
    },

    setupSlider: function() {
      var min = new Date(new Date().getTime() - (60*60*24*14*1000));
      var max = new Date();
      console.log("Min and max time", min.getTime(), max.getTime());

      // This is the default Jquery UI slider:
      $( "#slider-range" ).slider({
        range: true,
        min: min.getTime(),
        max: max.getTime(),
        step: 1000 * 60 * 60 * 24, // one day in ms
        values: [ min, max ],
        slide: this.updateDate
      });

      this.updateDate();
    },

    showDataSelector: function(event) {
      event.preventDefault();
      this.selectorView.show();
    },

    layers: {
      'instagram': instagramDataSource,
      'factual-business': factualDataSource,
      'ped-fatalities': pedFatalitiesDataSource,
      'bike-fatalities': bikeFatalitiesDataSource,
      'bike-counts': bikeCountsDataSource,
      'carto': cartoDataSource,
      'ped-counts': pedCountsDataSource,
      'traffic': traffic,
      'survey': surveyDataSource
    },

    activeLayers: {

    },

    /**
     * Create a layer
     * @param {String} layerType
     * @param {String} layerId   Specific instance of this type of layer to create
     *                           For example, for surveys, this is this surveyId.
     */
    addLayer: function(layerType, layerId) {
      console.log("Add layer", layerType, layerId);

      var self = this;
      // Dispatch the correct layers
      this.activeLayers[layerType] = new this.layers[layerType]({

        // Pass in the map and table views, so the layer can add itself
        map: this.mapView.map,
        tableView: this.tableView,

        // Set the specific layer to create
        layerId: layerId,

        // Optional click handler
        // TODO: not sure why we have this.
        clickHandler: function (data) {
          self.setupWideGraph(data);
        }
      });

      // Append to the list of active layers
      // TODO: use a model
      this.$el.find('.layers').append(this.activeLayers[layerType].render());
    },

    /* Data views ----------------------------------------- */
    showMap: function (e) {
      e.preventDefault();
      if (this.tableView) {
        this.tableView.$el.hide();
      }
      if (!this.mapView) {
        this.setupMap();
      } else {
        this.mapView.$el.show();
      }
      this.$('#map-tools a').removeClass('selected');
      this.$('#map-btn').addClass('selected');
    },

    showTable: function (e) {
      e.preventDefault();
      if (this.mapView) {
        this.mapView.$el.hide();
      }
      if (this.wideGraph) {
        this.wideGraph.$el.hide();
      }
      if (!this.tableView) {
        this.setupTable();
      } else {
        this.tableView.$el.show();
      }
      this.$('#map-tools a').removeClass('selected');
      this.$('#table-btn').addClass('selected');
    },

    setupTable: function() {
      this.tableView = new TableView({});
      var $table = this.tableView.render();
      this.$el.find('.b').append($table);
    },

    /* Map ------------------------------------------------ */
    setupMap: function() {
      var startHeight = $('.b').height();
      var mapHeight = startHeight - 50 - 100;
      console.log("Setting height", mapHeight);
      $('#map').height(mapHeight);

      this.mapView = new MapView({
        el: $('#project-map'),
        clickHandler: this.mapClickHandler
      });

      this.mapView.on('zoneCreated', this.mapZoneSelected);
    },

    mapZoneSelected: function(geometry, json) {
      console.log("Map zone created", geometry, json);
    },

    /* Tools ---------------------------------------------- */
    downloadData: function (e) {
      e.preventDefault();

      var data = 'cGFyY2VsX2lkLGFkZHJlc3MsY29sbGVjdG9yLHRpbWVzdGFtcCxzb3VyY2UsY2VudHJvaWQsc3RydWN0dXJlLGNvbmRpdGlvbix2YWNhbmN0LGZpcmUtZGFtYWdlLGR1bXBpbmcsaW1wcm92ZW1lbnRzCjM3MjgwNDgsMTQ5IDA5VEggU1QsTGVzbGllLDIwMTMtMDMtMjlUMjI6NTI6MTIuODU2Wixtb2JpbGUsIi0xMjIuNDEzNjI4MTEzNTE2NTUsMzcuNzc1NzE5OTUzODAzNTY2Iix5ZXMsZXhjZWxsZW50LHllcyx5ZXMsbm8sCjM3MjgwNDcsNzc4IE5BVE9NQSBTVCxMZXNsaWUsMjAxMy0wMy0yOVQyMjo1MjoyOC42NjZaLG1vYmlsZSwiLTEyMi40MTM0NzQzOTIyMTU5LDM3Ljc3NTg0MDU5OTkwNjQ5IixubywsLCx5ZXMsdW5pbXByb3ZlZAozNzI4MDQ1LDc3MCBOQVRPTUEgU1QsTGVzbGllLDIwMTMtMDMtMjlUMjI6NTI6NDMuNjQ3Wixtb2JpbGUsIi0xMjIuNDEzMzUxMzQ5MzA4NiwzNy43NzU5MzcxMzEyMjU1NCIseWVzLGV4Y2VsbGVudCx5ZXMsLHllcwozNzI4MDQ0LDc2NCBOQVRPTUEgU1QsTGVzbGllLDIwMTMtMDMtMjlUMjI6NTI6NTQuMjUzWixtb2JpbGUsIi0xMjIuNDEzMjg5ODI2NDMwNDQsMzcuNzc1OTg1Mzk2NTQyNzgiLHllcyxmYWlyLCx5ZXMKMzcyODA0Myw3NTggTkFUT01BIFNULExlc2xpZSwyMDEzLTAzLTI5VDIyOjUzOjAwLjM1MFosbW9iaWxlLCItMTIyLjQxMzIyODMwNDY5MjQsMzcuNzc2MDMzNjYyMzM5NDciCjM3MjgwNDIsNzU0IE5BVE9NQSBTVCxMZXNsaWUsMjAxMy0wMy0yOVQyMjo1MzowNi4wMjZaLG1vYmlsZSwiLTEyMi40MTMxNjY3ODI1MDY1OCwzNy43NzYwODE5Mjc1MDQwOTQiCjA4NjIwMjMsNzYzIEhBSUdIVCBTVCxQcmFzaGFudCwyMDEzLTAzLTMwVDA3OjMxOjU0LjY4OFosbW9iaWxlLCItMTIyLjQzNDY5MDI3MDIzNTIyLDM3Ljc3MTI3OTM5Nzk4MTE5Iix5ZXMsZXhjZWxsZW50LCwsbm8KMzcyODAxOSwxMjk4IEhPV0FSRCBTVCxQcmFzaGFudCwyMDEzLTA1LTAzVDIyOjI1OjM2LjY1OVosbW9iaWxlLCItMTIyLjQxMjc3ODY3NjAwMzc0LDM3Ljc3NTYyODU3ODY5ODk1Iix5ZXMsZXhjZWxsZW50LCwsbm8K';

      var dlTemplate = _.template('<iframe width="1px" height="1px" frameborder="0" src="<%= src %>"></iframe>');
      $('body').append(dlTemplate({
        src: '//data-uri.herokuapp.com/reverse?uri=' + encodeURIComponent('data:text/plain;charset=utf-8;content-disposition=attachment;filename=export.csv;base64,' + data)
      }));
    }

  });

  return ProjectView;

});
