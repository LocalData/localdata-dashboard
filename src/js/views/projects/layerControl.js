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

  // Templates
  'text!templates/projects/layerControl.html'
],

function($, _, Backbone, cartodb, Rickshaw, settings, IndexRouter, Surveys, SurveyViews, MapView, template) {
  'use strict';

  cartodb = window.cartodb;

  var LayerControl = Backbone.View.extend({
    template: _.template(template),

    initialize: function(options) {
      _.bindAll(this, 'render');
      this.sql = cartodb.SQL({ user: 'localdata' });
      this.setupGraph();
    },

    setupGraph: function() {
      // Graph for permit data
      this.sql.execute("SELECT to_char(approved_date, 'YYYY-MM'), count(*) FROM san_francisco_street_permits group by to_char(approved_date, 'YYYY-MM') ORDER BY to_char(approved_date, 'YYYY-MM') ASC")
        .done(function(data) {
          var prepped = [];
          // console.log(data.rows);
          _.each(data.rows, function(row, index) {
            prepped.push({
              x: index,
              y: row.count
            });
          });

          var graph = new Rickshaw.Graph({
            series: [{
              data: prepped,
              color: '#daedff'
            }],
            renderer: 'area',
            element: document.querySelector('.layer-permits .graph')
          });
          graph.render();

          var hoverDetail = new Rickshaw.Graph.HoverDetail( {
            graph: graph,
            formatter: function(series, x, y) {
              var month = data.rows[x - 1].to_char;
              return month + '<br>' + y + ' permits';
            }
          });
      });
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
