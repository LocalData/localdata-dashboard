/*jslint nomen: true */
/*globals define, cartodb: true */

define([
  'jquery',
  'jqueryUI',
  'lib/lodash',
  'backbone',
  'moment',
  'highcharts',

  // LD
  'settings',

  // Router
  'routers/index',

  // Models
  'models/surveys',

  // Views
  'views/surveys',
  'views/maps/project-map',
  'views/projects/layerControl',
  'views/projects/dataSelector',
  'views/projects/table',
  'views/projects/wideGraph',

  // Data sources
  'views/projects/datalayers/instagram',
  'views/projects/datalayers/factual',
  'views/projects/datalayers/ped-fatalities',
  'views/projects/datalayers/bike-fatalities',
  'views/projects/datalayers/bike-counts',
  'views/projects/datalayers/ped-counts',
  'views/projects/datalayers/traffic',
  'views/projects/datalayers/survey',
  'views/projects/cartoData',

  // Templates
  'text!templates/projects/project.html'
],

function($,
  jqueryUI,
  _,
  Backbone,
  moment,
  Highcharts,

  settings,
  IndexRouter,
  Surveys,
  SurveyViews,
  MapView,
  LayerControl,
  DataSelector,
  TableView,
  WideGraph,

  instagramDataSource,
  factualDataSource,
  pedFatalitiesDataSource,
  bikeFatalitiesDataSource,
  bikeCountsDataSource,
  pedCountsDataSource,
  traffic,
  surveyDataSource,
  cartoData,

  template
  ){
  'use strict';

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
        'setupWideGraph',
        'showDataSelector',
        'addLayer',
        'updateDate'
      );

      this.survey = new Surveys.Model({id: '5b51af30-3477-11e4-8466-37cd6d8f8d78'});
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
      this.setupDataSelector();
      this.setupMap();
      //this.setupWideGraph();
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
/*
      this.wideGraph.setupGraph([[
        {x: 1, y: 12}, // REPLACE WITH SAMPLE DATA
        {x: 2, y: 13},
        {x: 3, y: 8},
        {x: 4, y: 15},
        {x: 5, y: 17},
        {x: 6, y: 15},
        {x: 7, y: 5},
        {x: 8, y: 13},
        {x: 9, y: 6},
        {x: 10, y: 12},
        {x: 11, y: 17},
        {x: 12, y: 11},
        {x: 13, y: 8},
        {x: 14, y: 15},
        {x: 15, y: 13},
        {x: 16, y: 17},
        {x: 17, y: 6},
        {x: 18, y: 12}
      ],
      [
        {x: 1, y: 8}, // REPLACE WITH SAMPLE DATA
        {x: 2, y: 4},
        {x: 3, y: 5},
        {x: 4, y: 9},
        {x: 5, y: 3},
        {x: 6, y: 4},
        {x: 7, y: 2},
        {x: 8, y: 6},
        {x: 9, y: 7},
        {x: 10, y: 12},
        {x: 11, y: 5},
        {x: 12, y: 9},
        {x: 13, y: 10},
        {x: 14, y: 15},
        {x: 15, y: 13},
        {x: 16, y: 7},
        {x: 17, y: 4},
        {x: 18, y: 6}
      ]]);
*/

      /* WORKING LIVE INSTAGRAM DATA
      var self = this;
      cartoData.countsByHourOfWeek()
      .then(function (data) {
        self.wideGraph.setupGraph(_.map(data.rows, function (row) {
          return {
            x: row.d * 24 + row.h,
            y: row.count
          };
        }));
      }).catch(function (error) {
        console.log(error);
      });
      */


      //// Highcarts setup
      this.wideGraph.setupGraph(info.data);
      //var self = this;
      //cartoData.countsByHourOfWeek()
      //.then(function (data) {
      //  self.wideGraph.setupGraph(_.map(data.rows, function (row) {
      //    return row.count;
      //  }));
      //}).catch(function (error) {
      //  console.log(error);
      //});

      //this.wideGraph.setupGraph([
      //  {x: 1, y: 2}, // REPLACE WITH SAMPLE DATA
      //  {x: 2, y: 5}
      //]);
    },

    /* Data selector ------------------------------------- */
    setupDataSelector: function() {
      var $el = this.selectorView.render();
      this.$el.find('.b').prepend($el);
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
      'ped-counts': pedCountsDataSource,
      'traffic': traffic,
      'survey': surveyDataSource
    },

    activeLayers: {

    },

    addLayer: function(layerName, layerId) {
      console.log("Add layer", layerName, layerId);

      var self = this;
      // Dispatch the correct layers
      this.activeLayers[layerName] = new this.layers[layerName]({
        map: this.mapView.map,
        layerId: layerId,
        clickHandler: function (data) {
          self.setupWideGraph(data);
        }
      });
      this.$el.find('.layers').append(this.activeLayers[layerName].render());
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
      if (!this.wideGraph) {
        this.setupGraph();
      } else {
        this.wideGraph.$el.show();
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
      this.tableView = new TableView({
        el: $('#project-table')
      });
    },

    /* Map ------------------------------------------------ */
    setupMap: function() {
      var startHeight = $('.b').height();
      var mapHeight = startHeight - 50 - 100;
      console.log("Setting height", mapHeight);
      $('#map').height(mapHeight);

      this.mapView = new MapView({
        el: $('#project-map'),
        survey: this.survey,
        clickHandler: this.mapClickHandler
      });

      this.mapView.on('zoneCreated', this.mapZoneSelected);
    },

    mapZoneSelected: function(geometry, json) {
      console.log("Map zone created", geometry, json);
    },

    /* Layer controls ------------------------------------- */
    // setupLayers: function() {
    // }

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
