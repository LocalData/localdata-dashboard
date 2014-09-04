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
  'text!templates/projects/layerControl.html'
],

function($, _, Backbone, cartodb, Rickshaw, moment, settings, IndexRouter, Surveys, SurveyViews, MapView, cdb, template) {
  'use strict';

  cartodb = window.cartodb;

  var LayerControl = Backbone.View.extend({
    template: _.template(template),

    className: 'layer',

    initialize: function(options) {
      _.bindAll(this,
        'setup',
        'render',
        'update',
        'doneLoading'
      );
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
      //
      if(options.daterange) {
        options.type = 'daterange';
        options.data = {
          start: new Date(options.daterange[0]),
          end: new Date(options.daterange[1])
        };
      }

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

      if(!this.graph) {
        console.log("Creating graph with data", prepped);
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
            var date = moment(x).format("ddd, D/M");
            return date + '<br>' + y + ' photos';
          }
        });

        this.graph.render();
        this.doneLoading();
      } else {
        // If the graph already exists, we just need to update the data.
        console.log("UPDATING GRAPH", prepped);
        var series = [{
          data: prepped,
          color: '#daedff'
        }];
        this.graph.series[0].data=prepped;
        this.graph.update();
        this.doneLoading();
      }
    },

    doneLoading: function() {
      this.$el.find('.loading').hide();
    },

    render: function() {
      console.log("Rendering layerControl", this.$el);
      var context = {
        name: 'Instagram',
        icon: 'fa-instagram',
        meta: {}
      };
      this.$el.html(this.template(context));
      return this.$el;
    }


  });

  return LayerControl;

});
