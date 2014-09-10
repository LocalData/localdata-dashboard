/*jslint nomen: true */
/*globals define: true */

define(function (require) {
  'use strict';

  // Libraries
  var $ = require('jquery');
  var _ = require('lib/lodash');
  var Backbone = require('backbone');
  var L = require('lib/leaflet/leaflet.tilejson');
  var moment = require('moment');

  // Templates
  var template = _.template(require('text!templates/projects/table.html'));

  var TableView = Backbone.View.extend({
    initialize: function(options) {
      _.bindAll(this, 'render');
      this.render();
    },

    render: function() {
      var context = {};
      this.$el.html(template({
        bikeCounts: [{
          date: '1-Aug-2014',
          count: 40
        }, {
          date: '2-Aug-2014',
          count: 52
        }, {
          date: '3-Aug-2014',
          count: 34
        }, {
          date: '4-Aug-2014',
          count: 57
        }, {
          date: '5-Aug-2014',
          count: 38
        }],

        pedestrian: [{
          date: '1-Sep-2014',
          count: 40
        }, {
          date: '2-Sep-2014',
          count: 47
        }, {
          date: '3-Sep-2014',
          count: 53
        }, {
          date: '4-Sep-2014',
          count: 39
        }],

        social: [{
          location: '3rd and 16th',
          count: 358
        }, {
          location: 'Owens',
          count: 247
        }, {
          location: '4th and King',
          count: 866
        }, {
          location: 'Jackson Park',
          count: 729
        }]
      }));
    }
  });

  return TableView;
});
