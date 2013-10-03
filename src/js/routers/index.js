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
      "register": "register",

      "surveys/new": "new_survey",
      "surveys/:slug/dive": "dive",
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
    },

    home: function() {
      console.log("Index");
      this.controller.goto_home();
    },

    login: function(redirectTo) {
      console.log("Going to login view");
      this.controller.goto_login(redirectTo);
    },

    register: function() {
      this.controller.goto_register();
    },

    new_survey: function() {
      api.getUser(function(user) {
        this.controller.goto_new();
      }.bind(this));
    },

    survey: function(slug) {
      api.setSurveyIdFromSlug(slug, this.controller.goto_survey);
    },

    dive: function(slug) {
      api.setSurveyIdFromSlug(slug, this.controller.goto_filters);
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

    design: function(slug) {
      api.setSurveyIdFromSlug(slug, this.controller.goto_design);
    },

    default_route: function(actions) {
      // console.log(actions);
    }
  });

  return IndexRouter;

}); // End IndexRouter view module
