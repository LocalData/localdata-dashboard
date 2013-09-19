/*jslint nomen: true */
/*globals define: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',
  'lib/kissmetrics',

  // LocalData
  'settings',

  // Router
  'routers/index',

  // Views
  'views/home',
  'views/dashboard',
  'views/users',
  'views/surveys',
  'views/design',
  'views/settings',

  // Models
  'models/users'
],

function($, _, Backbone, _kmq, settings, IndexRouter, HomeView, DashboardView, UserViews, SurveyViews, DesignViews, SettingsViews, Users) {
  'use strict';

  var AllViews = {};
  AllViews.HomeView = HomeView;
  AllViews.DashboardView = DashboardView;

  AllViews.SurveyView = SurveyViews.SurveyView;
  AllViews.NewSurveyView= SurveyViews.NewSurveyView;
  AllViews.DesignView = DesignViews.DesignView;

  AllViews.LoginView = UserViews.LoginView;
  AllViews.RegisterView = UserViews.RegisterView;
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
      this.user = new Users.Model();
      this.userView = new AllViews.UserBarView({
        user: this.user
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
      _kmq.push(['record', name]);

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

    goto_register: function() {
      this.currentContentView = this.getOrCreateView("RegisterView", "RegisterView", {
        'user': this.user
      });
    },


    // Survey dashboard routes .................................................
    goto_survey: function(tab) {

      _kmq.push(['record', "SurveyView"]);

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
      }
    },

    goto_new: function() {
      console.log("Going to new");
      this.currentContentView = this.getOrCreateView("NewSurveyView", "NewSurveyView");
    },

    goto_settings: function() {
      _kmq.push(['record', "SettingsView"]);
      this._router.navigate("surveys/" + settings.slug + "/settings");
      this.goto_survey("settings");
    },

    goto_form: function() {
      this._router.navigate("surveys/" + settings.slug + "/form");
      this.goto_survey("form");
    },

    goto_export: function() {
      _kmq.push(['record', "ExportView"]);
      this._router.navigate("surveys/" + settings.slug + "/export");
      this.goto_survey("export");
    },

    goto_design: function() {
      console.log("Going to design");
      this.currentContentView = this.getOrCreateView("DesignView", "DesignView", {id: settings.surveyId});

      // this.currentContentView = this.getOrCreateView("DesignView", "DesignView");
    }

  });

  return RootView;

}); // End Root module
