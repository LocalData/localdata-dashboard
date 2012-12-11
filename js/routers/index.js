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
      "login": "login",

      "surveys/new": "new",      
      "surveys/:slug": "survey",
      "surveys/:slug/map": "map",
      "surveys/:slug/export": "export_",
      "surveys/:slug/settings": "settings",
      
      // "surveys/:slug/scans": "scans",
      // "surveys/:slug/upload": "upload",
      
      "*actions": "default_route"
    },
    
    initialize: function(options) {
      this.controller = options.controller;
    },
    
    home: function() {
      console.log("Index");
      this.controller.goto_home();
    },

    login: function() {
      console.log("Going to login view");
      this.controller.goto_login();
    },

    new: function() {
      this.controller.goto_new();
    },
    
    survey: function(slug) {
      api.setSurveyIdFromSlug(slug, this.controller.goto_survey);
      //this.controller.goto_survey(NSB.API.setSurveyIdFromSlug(slug));
    },
    
    map: function(slug) {
      api.setSurveyIdFromSlug(slug, this.controller.goto_map);
    },
    
    settings: function(slug) {
      api.setSurveyIdFromSlug(slug, this.controller.goto_settings);
    },
    
    export_: function(slug) {
      api.setSurveyIdFromSlug(slug, this.controller.goto_export);
    },
    
    scans: function(slug) {
      api.setSurveyIdFromSlug(slug, this.controller.goto_scans);
    },

    default_route: function(actions) {
      console.log(actions);
    }  
  });

  return IndexRouter;

}); // End IndexRouter view module