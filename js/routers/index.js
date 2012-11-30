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

  var IndexRouter = Backbone.Router.extend({
    routes: {
      "": "home",
      
      "surveys/:slug/export": "export",
      "surveys/:slug/settings": "settings",
      "surveys/:slug": "survey",

      "surveys/:slug/scans": "scans",
      "surveys/:slug/upload": "upload",
      
      "*actions": "default_route"
    },
    
    initialize: function(options) {
      this.controller = options.controller;
    },
    
    home: function() {
      console.log("Index");
      this.controller.goto_home();
    },
    
    survey: function(slug) {
      api.setSurveyIdFromSlug(slug, this.controller.goto_survey);
      //this.controller.goto_survey(NSB.API.setSurveyIdFromSlug(slug));
    },
    
    map: function(slug) {
      api.setSurveyIdFromSlug(slug, this.controller.goto_map)
    },
    
    settings: function(slug) {
      api.setSurveyIdFromSlug(slug, this.controller.goto_settings)
    },
    
    export: function(slug) {
      api.setSurveyIdFromSlug(slug, this.controller.goto_export)
    },
    
    scans: function(slug) {
      api.setSurveyIdFromSlug(slug, this.controller.goto_scans)
    },
    
    upload: function(slug) {
      NSB.API.setSurveyIdFromSlug(slug, this.controller.goto_upload)
    },
      
    default_route: function(actions) {
      console.log(actions);
    }  
  });

  return IndexRouter;

}); // End IndexRouter view module