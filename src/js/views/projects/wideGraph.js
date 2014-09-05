/*jslint nomen: true */
/*globals define, cartodb, Rickshaw: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',
  'cartodb',
  'Rickshaw',
  'moment',

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
  'text!templates/projects/wideGraph.html'
],

function($, _, Backbone, cartodb, Rickshaw, moment, settings, IndexRouter, Surveys, SurveyViews, MapView, cdb, template) {
  'use strict';

  cartodb = window.cartodb;

  var LayerControl = Backbone.View.extend({
    template: _.template(template),

    className: 'widegraph',

    initialize: function(options) {
      _.bindAll(this,
        'setup',
        'render',
        'update',
        'doneLoading'
      );
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

      if(options.daterange) {
        options.type = 'daterange';
        options.data = {
          start: new Date(options.daterange[0]),
          stop: new Date(options.daterange[1])
        };
      }

      console.log("Using options", options, options.data);
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
      //var prepped = [];
      //_.each(data.rows, function(row, index) {
      //  prepped.push({
      //    x: new Date(row.d).getTime(), // index, // new Date(row.d),
      //    y: row.count
      //  });
      //});

      if(!this.graph) {
        console.log("Creating wide graph with data", data);
        this.graph = new Rickshaw.Graph({
          series: [{
            data: data[0],
            color: '#0062be'
          },
          {
            data: data[1],
            color: '#f15a24'
          }],
          renderer: 'line',
          height: 100,
          element: this.$el.find('.graph')[0] // document.querySelector('.layer-permits .graph')
        });

        var hoverDetail = new Rickshaw.Graph.HoverDetail( {
          graph: this.graph,
          formatter: function(series, x, y) {
            var date = moment(x).format("ddd, D/M");
            return date + '<br>' + y + ' photos';
          }
        });

        this.graph.render();
        this.doneLoading();
      } else {
        // If the graph already exists, we just need to update the data.
        this.graph.series[0].data = data;
        this.graph.update();
        this.doneLoading();
      }
    },

    doneLoading: function() {
      this.$el.find('.loading').hide();
    },

    render: function() {
      console.log("Rendering wide graph view", this.$el);
      var context = {
      };
      this.$el.html(this.template(context));
      return this.$el;
    }


  });

  return LayerControl;

});
