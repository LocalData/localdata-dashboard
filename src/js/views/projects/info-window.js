/*jslint nomen: true */
/*globals define */

define(function (require, exports, module) {
  'use strict';

  var _ = require('lib/lodash');
  var Backbone = require('backbone');
  
  // LocalData
  var settings = require('settings');

  var infoWindowTemplate = require('text!templates/projects/info-window.html');
  
  module.exports = Backbone.View.extend({
    template: _.template(infoWindowTemplate),
    
    events: {
      'click .close': 'remove'
    },
    
    views: null,
    viewOrder: null,
    
    initialize: function (options) {
      this.suppressStreetview = options.suppressStreetview;

      // We display results corresponding to a click on a map. We track the
      // click location, so we know if we should append item views to this
      // instance or toss it out and create a new one.
      this.latlng = options.latlng;

      this.views = [];
      this.viewOrder = [];
    },
    
    addView: function (options) {
      // Detach views
      this.$list.children().detach();
      options.view.render();
      this.views.push(options.view);
      this.viewOrder.push(options.order);

      // Sort
      this.views = _.sortBy(this.views, function (view, i) {
        return this.viewOrder[i];
      }, this);
      this.viewOrder = _.sortBy(this.viewOrder);
      
      // Append
      this.$list.append(_.map(this.views, function (view) {
        return view.$el[0];
      }));
    },

    render: function (data) {
      this.$el.html(this.template({
        suppressStreetview: !!this.suppressStreetview,
        latlng: this.latlng,
        googleKey: settings.GoogleKey
      }));
      this.$list = this.$el.find('#info-item-list');
      return this;
    },

    remove: function () {
      this.trigger('remove');
      Backbone.View.prototype.remove.call(this);
    }
  });
});
