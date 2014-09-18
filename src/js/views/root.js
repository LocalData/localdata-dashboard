/*jslint nomen: true */
/*globals define: true */

define(function(require, exports, module) {
  'use strict';

  // Libs
  var $ = require('jquery');
  var _ = require('lib/lodash');
  var Backbone = require('backbone');

  // App
  var settings = require('settings');
  var IndexRouter = require('routers/index');

  // Models
  var Users = require('models/users');

  // Views
  var HomeView = require('views/home');
  var DashboardView = require('views/dashboard');
  var UserViews = require('views/users');
  var SurveyViews = require('views/surveys');
  var DesignViews = require('views/design');
  var SettingsViews = require('views/settings');
  var ReviewView = require('views/responses/review');


  var AllViews = {};
  AllViews.HomeView = HomeView;
  AllViews.DashboardView = DashboardView;

  AllViews.SurveyView = SurveyViews.SurveyView;
  AllViews.NewSurveyView= SurveyViews.NewSurveyView;
  AllViews.DesignView = DesignViews.DesignView;
  AllViews.ReviewView = ReviewView;

  AllViews.LoginView = UserViews.LoginView;
  AllViews.ChangePasswordView = UserViews.ChangePasswordView;
  AllViews.ResetPasswordView = UserViews.ResetPasswordView;
  AllViews.UserBarView = UserViews.UserBarView;

  // The singleton view which manages all others.
  // Essentially, a "controller".
  var RootView = Backbone.View.extend({

    el: $("body"),
    views: {},
    _router: null,
    survey: null,

    initialize: function() {
      // Bind local methods
      _.bindAll(this);

      // Keep track of the user.
      this.userView = new AllViews.UserBarView({
        user: settings.user // created on init in app.js
      });

      // Set up global router
      this._router = new IndexRouter({ controller: this });

      return this;
    },

    // Start Backbone routing. Separated from initialize() so that the
    // global controller is available for any preset routes (direct links).
    startRouting: function() {
      Backbone.history.start();
    },

    // Register each view as it is created and never create more than one.
    getOrCreateView: function(viewClass, viewName, options) {
      // If the view already exists, use it.
      // If it doesn't exist, create it.
      if (_.has(this.views, viewName)) {
        console.log("Going to " + viewName);

      } else {
        console.log("Creating view " + viewName);
        this.views[viewName] = new AllViews[viewClass](options);
      }

      this.views[viewName].update();
      return this.views[viewName];
    },

    // Handle routes (they're in routers/index.js) .............................
    // Home
    goto_home: function() {
      // this.currentContentView = this.getOrCreateView("HomeView", "HomeView");
      this.currentContentView = this.getOrCreateView("DashboardView", "DashboardView");

    },

    goto_login: function(redirectTo) {
      this.currentContentView = this.getOrCreateView("LoginView", "LoginView", {
        'redirectTo': redirectTo,
        'user': this.user
      });
    },

    goto_change_password: function (resetInfo) {
      this.currentContentView = this.getOrCreateView('ChangePasswordView', 'ChangePasswordView', {
        resetInfo: resetInfo
      });
    },

    goto_reset_password: function () {
      this.currentContentView = this.getOrCreateView('ResetPasswordView', 'ResetPasswordView');
    },


    // Survey dashboard routes .................................................
    goto_survey: function(tab) {

      // Get or create a view for the survey
      var surveyViewName = "Survey" + settings.surveyId;
      this.currentContentView = this.getOrCreateView("SurveyView", surveyViewName, {id: settings.surveyId});

      // Show the correct tab
      switch(tab) {
        case undefined:
          this.currentContentView.showResponses();
          break;
        case "export":
          this.currentContentView.showExport();
          break;
        case "form":
          this.currentContentView.showForm();
          break;
        case "settings":
          this.currentContentView.showSettings();
          break;
        case "filters":
          this.currentContentView.showFilters();
          break;
        case "review":
          this.currentContentView.showReview();
          break;
      }
    },

    goto_new: function() {
      console.log("Going to new");
      this.currentContentView = this.getOrCreateView("NewSurveyView", "NewSurveyView");
    },

    goto_settings: function() {
      this._router.navigate("surveys/" + settings.slug + "/settings");
      this.goto_survey("settings");
    },

    goto_form: function() {
      this._router.navigate("surveys/" + settings.slug + "/form");
      this.goto_survey("form");
    },

    goto_export: function() {
      this._router.navigate("surveys/" + settings.slug + "/export");
      this.goto_survey("export");
    },

    goto_filters: function() {
      this._router.navigate("surveys/" + settings.slug + "/dive");
      this.goto_survey("filters");
    },

    goto_review: function() {
      this._router.navigate("surveys/" + settings.slug + "/review");
      this.goto_survey("review");
    },

    goto_design: function() {
      console.log("Going to design");
      this.currentContentView = this.getOrCreateView("DesignView", "DesignView", {id: settings.surveyId});
    }

  });

  return RootView;

}); // End Root module
