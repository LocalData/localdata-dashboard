/*jslint nomen: true */
/*globals define */

define(function (require, exports, module) {
  'use strict';

  var _ = require('lib/lodash');
  var Backbone = require('backbone');

  // We reuse the cartodb layer templates
  var infoTemplate = require('text!templates/foreign-layer-info.html');

  // Render an infowindow for a selected map item
  module.exports = Backbone.View.extend({
    template: _.template(infoTemplate),

    events: {
      'click .close': 'remove'
    },

    initialize: function (options) {
      this.layerOptions = options.layerOptions;
      this.data = options.data;
    },

    render: function () {
      var context = {
        name: this.data[this.layerOptions.humanReadableField],
        raw: this.data
      };

      var names = this.layerOptions.fieldNames;
      context.fields = _.map(_.keys(names), function (name) {
        return {
          name: names[name],
          value: this.data[name]
        };
      }, this);
      this.$el.html(this.template(context));
      return this;
    }
  });
});