/*jslint nomen: true */
/*globals define: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',
  'settings'
],

function($, _, Backbone, settings) {
  'use strict';

  var Zones = {};

  Zones.Model = Backbone.Model.extend({
    blacklist: ['layer'],

    toJSON: function(options) {
      return _.omit(this.attributes, this.blacklist);
    }
  });

  Zones.Collection = Backbone.Collection.extend({
    model: Zones.Model
  });

  return Zones;
});
