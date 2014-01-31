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
      "reset/:resetInfo": "reset_password",

      "surveys/new": "new_survey",
      "surveys/:slug/dive": "dive",
      "surveys/:slug/export": "survey_export",
      "surveys/:slug/reports": "reports",
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

    reset_password: function (resetInfo) {
      this.controller.goto_password_reset(resetInfo);
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

    reports: function(slug) {
      api.setSurveyIdFromSlug(slug, this.controller.goto_reports);
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
