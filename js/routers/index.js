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

      "surveys/new": "new_survey",      
      "surveys/:slug/map": "map",
      "surveys/:slug/export": "survey_export",
      "surveys/:slug/design": "design",
      "surveys/:slug": "survey",

      "surveys/:slug/form/edit": "form_edit",
      "surveys/:slug/form": "form",
      
      "*actions": "default_route"
    },
  
    initialize: function(options) {
      this.controller = options.controller;
      
      this.route(/^login\/(.*)$/, "login", this.login);

      // "*actions": "default_route"
    },
    
    home: function() {
      console.log("Index");
      this.controller.goto_home();
    },

    login: function(redirectTo) {
      console.log("Going to login view");
      this.controller.goto_login(redirectTo);
    },

    new_survey: function() {
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

    form: function(slug) {
      api.setSurveyIdFromSlug(slug, this.controller.goto_form);
    },
    
    survey_export: function(slug) {
      api.setSurveyIdFromSlug(slug, this.controller.goto_export);
    },
    
    scans: function(slug) {
      api.setSurveyIdFromSlug(slug, this.controller.goto_scans);
    },

    design: function(slug) {
      api.setSurveyIdFromSlug(slug, this.controller.goto_design);
    },

    default_route: function(actions) {
      console.log(actions);
    }  
  });

  return IndexRouter;

}); // End IndexRouter view module