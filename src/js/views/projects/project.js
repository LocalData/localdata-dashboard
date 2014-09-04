/*jslint nomen: true */
/*globals define, cartodb: true */

define([
  //'jquery',
  'jqueryUI',
  'rangeSlider',
  'lib/lodash',
  'backbone',
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

  // Data sources
  'views/projects/datalayers/instagram',
  'views/projects/datalayers/factual',
  'views/projects/datalayers/survey',

  // Templates
  'text!templates/projects/project.html'
],

function(jqueryUI, $, _, Backbone, settings,
  IndexRouter,
  Surveys,
  SurveyViews,
  MapView,
  LayerControl,
  DataSelector,
  TableView,

  instagramDataSource,
  factualDataSource,
  surveyDataSource,

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
      _.bindAll(this, 'render', 'setupMap', 'showDataSelector', 'addLayer');
      this.survey = new Surveys.Model({id: '85968dd0-98c2-11e2-ab9b-79cb9b3de46f'});
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
    },

    /* Data selector ------------------------------------- */
    setupDataSelector: function() {
      var $el = this.selectorView.render();
      this.$el.find('.b').prepend($el);
    },

    setupSlider: function() {
      var min = new Date(new Date().getTime() - (60*60*24*7*1000));
      var max = new Date();
      console.log("Min and max time", min.getTime(), max.getTime());

      // Rangeslider -- too clunky
      //
      // $('#slider-range').dateRangeSlider({
      //   // valueLabels: 'change',
      //   bounds: {
      //     min: new Date(2014, 8, 5),
      //     max: new Date(2014, 9, 2)
      //   },
      //   step: {
      //     days: 1
      //   }
      // });
      // $("#slider-range").bind("valuesChanged", function(e, data) {
      //   console.log("Values just changed. min: " + data.values.min + " max: " + data.values.max);
      //   console.log(this.layer);
      //   if(!this.layer) {return;}
      //   this.layer.update({
      //     type: 'daterange',
      //     data: {
      //       start: data.values.min,
      //       end: data.values.max
      //     }
      //   });
      // }.bind(this));

      // This is the default Jquery UI slider:
      $( "#slider-range" ).slider({
        range: true,
        min: min.getTime(),
        max: max.getTime(),
        step: 1000 * 60 * 60 * 24, // one day in ms
        // values: [ 75, 300 ],
        slide: function( event, ui ) {
          console.log("slider", ui.values);
          if(!this.layer) {
            return;
          }
          this.layer.update({
            type: 'daterange',
            data: {
              start: new Date(ui.values[0]),
              end: new Date(ui.values[1])
            }
          });
          //$( "#amount" ).val( "$" + ui.values[ 0 ] + " - $" + ui.values[ 1 ] );
        }.bind(this)
      });
    },

    showDataSelector: function(event) {
      event.preventDefault();
      this.selectorView.show();
    },

    layers: {
      'instagram': instagramDataSource,
      'factual-business': factualDataSource,
      'survey': surveyDataSource
    },

    addLayer: function(layerName, layerId) {
      console.log("Add layer", layerName, layerId);

      // Dispatch the correct layers
      this.layer = new this.layers[layerName]({
        map: this.mapView.map,
        layerId: layerId
      });
      this.$el.find('.layers').append(this.layer.render());
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
