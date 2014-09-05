/*jslint nomen: true */
/*globals define, cartodb, Rickshaw: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',
  'cartodb',
  'Rickshaw',
  'moment',
  'highcharts',

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

function($,
  _,
  Backbone,
  cartodb,
  Rickshaw,
  moment,
  Highcharts,

  // LD
  settings,
  IndexRouter,
  Surveys,
  SurveyViews,
  MapView,
  cdb,
  template) {
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

$('.widegraph .graph').highcharts({
        chart: {
            zoomType: 'x',
            height: 170
        },

        title: {
            text: ''
        },
        /*
        subtitle: {
            text: document.ontouchstart === undefined ?
              'Click and drag in the plot area to zoom in' :
              'Pinch the chart to zoom in'
        },*/
        xAxis: {
          type: 'linear',
          //categories: [
          //  '12AM',
          //  '1AM',
          //  '2AM',
          //  '3AM',
          //  '4AM',
          //  '5AM',
          //  '6AM',
          //  '7AM',
          //  '8AM',
          //  '9AM',
          //  '10AM',
          //  '11AM',
          //  '12PM',
          //  '1PM',
          //  '2PM',
          //  '3PM',
          //  '4PM',
          //  '5PM',
          //  '6PM',
          //  '7PM',
          //  '8PM',
          //  '9PM',
          //  '10PM',
          //  '11PM'
          //],
          labels: {
            formatter: function () {
              return '';
              //return Math.floor(this.value) + 'AM';
            }
          }
          //tickInterval: 1
            //type: 'datetime',
            //minRange: 2 // two hours
        },
        yAxis: {
            title: {
                text: 'Count'
            },
            min: 0,
            minPadding: 0
        },
        legend: {
            enabled: false
        },
        plotOptions: {
            area: {
                fillColor: {
                    linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1},
                    stops: [
                        [0, '#1d61a1'], //Highcharts.getOptions().colors[0]],
                        [1, Highcharts.Color('#1d61a1').setOpacity(0).get('rgba')]
                    ]
                },
                marker: {
                    radius: 2
                },
                lineWidth: 1,
                states: {
                    hover: {
                        lineWidth: 1
                    }
                },
                threshold: null
            }
        },

        series: [{
          type: 'area',
          name: 'counts',
          pointInterval: 1, // hours
          pointStart:1, //  Date.UTC(2006, 0, 1),
          data: data
        }]
    });

      // if(!this.graph) {
      //   console.log("Creating wide graph with data", data);
      //   this.graph = new Rickshaw.Graph({
      //     series: [{
      //       data: data,
      //       color: '#0062be'
      //     }],
      //     renderer: 'line',
      //     height: 100,
      //     element: this.$el.find('.graph')[0] // document.querySelector('.layer-permits .graph')
      //   });
//
      //   var hoverDetail = new Rickshaw.Graph.HoverDetail( {
      //     graph: this.graph,
      //     formatter: function(series, x, y) {
      //       var date = moment(x).format("ddd, D/M");
      //       return date + '<br>' + y + ' checkins';
      //     }
      //   });
//
      //   this.graph.render();
      //   this.doneLoading();
      // } else {
      //   // If the graph already exists, we just need to update the data.
      //   this.graph.series[0].data = data;
      //   this.graph.update();
      //   this.doneLoading();
      // }
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
