/*jslint nomen: true */
/*globals define: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',
  'settings',
  'api'
],

function($, _, Backbone, settings, api) {
  'use strict';

  var Surveys = {};

  Surveys.Model = Backbone.Model.extend({
    urlRoot: settings.api.baseurl + "/surveys/",

    namespace: 'survey',

    blacklist: ['_id'],

    initialize: function(options) {
      _.bindAll(this, 'parse');
      this.fetch();
    },

    numberWithCommas: function(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },

    getCount: function() {
      return this.numberWithCommas(this.get('responseCount'));
    },

    getLocation: function(callback) {
      // If there are no bounds, geocode the survey location and zoom there.
      var location = this.get('location');
      api.codeAddress('', location, function(error, results) {
        if (error) {
          console.log("Error geocoding survey location", error);
          callback(error);
        }

        callback(error, results);
      });
    },

    toJSON: function(options) {
        return _.omit(this.attributes, this.blacklist);
    },

    parse: function(response) {
      if (_.has(response, 'survey')) {
        // Individual surveys are returned a little differently from
        // lists of surveys. Oh well.

        return response.survey;
      }

      return response;
    }

  });


  Surveys.Collection = Backbone.Collection.extend({
    model: Surveys.Model,
    url: settings.api.baseurl + "/surveys",

    initialize: function(options) {
      _.bindAll(this, 'parse');
      // this.fetch();
    },

    parse: function(response) {
      return response.surveys;
    }

  });

  return Surveys;

}); // End Surveys module


