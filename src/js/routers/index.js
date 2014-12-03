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
      "reset": "reset_password",
      "reset/:resetInfo": "change_password",

      "surveys/new": "new_survey",
      "surveys/:slug/dive": "dive",
      "surveys/:slug/export": "survey_export",
      "surveys/:slug/design": "design",
      "surveys/:slug/review": "review",
      "surveys/:slug": "survey",

      "surveys/:slug/form/edit": "form_edit",
      "surveys/:slug/form": "form",

      "surveys/:slug/settings": "settings",

      'embed/surveys/:slug': 'embed',
      // TODO: a multi-dataset view is a project that can reference multiple surveys,
      // so 'multi/survey/:slug' is not totally intuitive, but we're keeping it
      // around for now for backward compatibility.
      'multi/surveys/:slug': 'multi',
      'projects/:slug': 'multi',

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

    change_password: function (resetInfo) {
      this.controller.goto_change_password(resetInfo);
    },

    reset_password: function () {
      this.controller.goto_reset_password();
    },

    new_survey: function() {
      api.getCurrentUser(function(user) {
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

    review: function(slug) {
      api.setSurveyIdFromSlug(slug, this.controller.goto_review);
    },

    embed: function (slug) {
      api.setSurveyIdFromSlug(slug, this.controller.gotoSurveyEmbed);
    },

    multi: function (slug) {
      this.controller.gotoMultiSurvey(slug);
    },

    default_route: function(actions) {
      // console.log(actions);
    }
  });

  return IndexRouter;

}); // End IndexRouter view module
