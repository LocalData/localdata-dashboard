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
      this.$el.html(template({}));
    }
  });

  return TableView;
});
