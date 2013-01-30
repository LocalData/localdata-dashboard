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

      "surveys/:slug/settings": "settings",

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
      api.getUser(function(user) {
        this.controller.goto_new();
      }.bind(this));
    },
    
    survey: function(slug) {
      api.setSurveyIdFromSlug(slug, this.controller.goto_survey);
      //this.controller.goto_survey(NSB.API.setSurveyIdFromSlug(slug));
    },
    
    map: function(slug) {
      api.setSurveyIdFromSlug(slug, this.controller.goto_map);
    },
    
    settings: function(slug) {
      api.getUser(function(user) {
        api.setSurveyIdFromSlug(slug, this.controller.goto_settings);
      }.bind(this));
    },

    form: function(slug) {
      api.getUser(function(user) {
        api.setSurveyIdFromSlug(slug, this.controller.goto_form);
      }.bind(this));
    },
    
    survey_export: function(slug) {
      api.setSurveyIdFromSlug(slug, this.controller.goto_export);
    },
    
    design: function(slug) {
      api.getUser(function(user) {
        api.setSurveyIdFromSlug(slug, this.controller.goto_design);
      }.bind(this));
    },

    default_route: function(actions) {
      // console.log(actions);
    }
  });

  return IndexRouter;

}); // End IndexRouter view module