/*jslint nomen: true */
/*globals define, cartodb, Rickshaw: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',
  'cartodb',
  'Rickshaw',

  // LocalData
  'settings',

  // Router
  'routers/index',

  // Models
  'models/surveys',

  // Views
  'views/surveys',
  'views/map',
  'views/projects/cartoData',

  // Templates
  'text!templates/projects/layerControl.html'
],

function($, _, Backbone, cartodb, Rickshaw, settings, IndexRouter, Surveys, SurveyViews, MapView, cdb, template) {
  'use strict';

  cartodb = window.cartodb;

  var LayerControl = Backbone.View.extend({
    template: _.template(template),

    className: 'layer',

    initialize: function(options) {
      _.bindAll(this, 'setup', 'render', 'update');
      this.setup(options);
    },

    update: function(options) {
      this.setup(options);
    },

    /**
     * Set up the map and chart data
     * @param  {Object} options
     */
    setup: function(options) {
      // Add data to the map
      cdb.map = options.map;
      cdb.updateCDBMap(options);

      // Default options for map:
      // {
      //   type: 'daterange',
      //   data: {}
      // }

      // Set up the counts
      var countsByDate = cdb.countsByDate(options.data);
      countsByDate.then(function (data) {
        console.log("Got data", data);
        this.setupGraph(data);
      }.bind(this)).catch(function (error) {
        console.log("Error getting chart from cartodb", error);
      });
    },

    setupGraph: function(data) {
      console.log("Setup graph el", data);
      var prepped = [];
      _.each(data.rows, function(row, index) {
        prepped.push({
          x: new Date(row.d).getTime(), // index, // new Date(row.d),
          y: row.count
        });
      });

      console.log("Using prepped", prepped);

      if(!this.graph) {
        this.graph = new Rickshaw.Graph({
          series: [{
            data: prepped,
            color: '#daedff'
          }],
          renderer: 'area',
          height: 75,
          element: this.$el.find('.graph')[0] // document.querySelector('.layer-permits .graph')
        });

        var hoverDetail = new Rickshaw.Graph.HoverDetail( {
          graph: this.graph,
          formatter: function(series, x, y) {
            var month = data.rows[x - 1].to_char;
            return month + '<br>' + y + ' photos';
          }
        });

        var xAxis = new Rickshaw.Graph.Axis.Time( {
          graph: this.graph,
         // ticksTreatment: ticksTreatment,
          timeFixture: new Rickshaw.Fixtures.Time.Local()
        });

        this.graph.render();
      } else {
        // If the graph already exists, we just need to update the data.
        console.log("UPDATING GRAPH", prepped);
        var series = [{
          data: prepped,
          color: '#daedff'
        }];
        this.graph.series[0].data=series;
        this.graph.update();
      }
    },

    render: function() {
      console.log("Rendering layerControl", this.$el);
      var context = {};
      this.$el.html(this.template({}));
      return this.$el;
    }


  });

  return LayerControl;

});
