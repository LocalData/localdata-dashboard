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

  var Surveys = {};

  Surveys.Model = Backbone.Model.extend({
    urlRoot: settings.api.baseurl + "/surveys/",
    
    initialize: function(options) {
      _.bindAll(this, 'parse');
      this.fetch();
    },
    
    parse: function(response) {
      if (_.has(response, "survey")) {
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


