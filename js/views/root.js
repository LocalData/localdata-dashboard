/*jslint nomen: true */
/*globals define: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',

  // LocalData
  'settings',

  // Router
  'routers/index',

  // Views
  'views/home',
  'views/surveys'
],

function($, _, Backbone, settings, IndexRouter, HomeView, SurveyViews) {
  'use strict'; 

  var AllViews = {};
  AllViews.HomeView = HomeView;
  AllViews.SurveyView = SurveyViews.SurveyView;

  /*
   * The singleton view which manages all others. Essentially, a "controller".
   */
  var RootView = Backbone.View.extend({
    
    el: $("body"),
    views: {},
    _router: null,
    survey: null,
    
    initialize: function() {
      // Bind local methods
      _.bindAll(this);
      
      // Set up global router
      this._router = new IndexRouter({ controller: this });
      
      return this;
    },
    
    startRouting: function() {
      /*
       * Start Backbone routing. Separated from initialize() so that the
       * global controller is available for any preset routes (direct links).
       */
      Backbone.history.start();
    },
      
    getOrCreateView: function(name, options) {
      // _kmq.push(['record', name]);
      
      // Register each view as it is created and never create more than one.
      if (name in this.views) {
        console.log("Going to " + name);
        return this.views[name];
      }

      console.log("Creating " + name);
      this.views[name] = new AllViews[name](options);

      return this.views[name];
    },
    
    // Not used anywhere
    // switchPage: function(page) {
    //   /*
    //    * Show the given page; hide the others
    //    */
    //   $('.page').hide();
    //   if (page.show !== undefined) {
    //     page.show();
    //   } else {
    //     page.$el.show();
    //   }
    // },
    
    goto_home: function() {
      this.currentContentView = new HomeView(); // = this.getOrCreateView("Home");
    },
    
    goto_survey: function() {
      this.currentContentView = this.getOrCreateView("SurveyView", {id: settings.surveyId});
      this.currentContentView.showResponses();
      // _kmq.push(['record', "SurveyView"]);
      this._router.navigate("surveys/" + settings.slug);
    },
    
    goto_upload: function() {
      this.currentContentView = this.getOrCreateView("SurveyView", {id: settings.surveyId});
      this.currentContentView.showUpload();
      // _kmq.push(['record', "UploadView"]);
      this._router.navigate("surveys/" + settings.slug + "/upload");
    },
    
    goto_map: function() {
      this.currentContentView = this.getOrCreateView("SurveyView", {id: settings.surveyId});
      this.currentContentView.showMap();
      // _kmq.push(['record', "MapView"]);
      this._router.navigate("surveys/" + settings.slug + "/map");
    },
    
    goto_settings: function() {
      this.currentContentView = this.getOrCreateView("SurveyView", {id: settings.surveyId});
      this.currentContentView.showSettings();
      // _kmq.push(['record', "SettingsView"]);
      this._router.navigate("surveys/" + settings.slug + "/settings");
    },
    
    goto_scans: function() {
      this.currentContentView = this.getOrCreateView("SurveyView", {id: settings.surveyId});
      this.currentContentView.showScans();
      this._router.navigate("surveys/" + settings.slug + "/scans");
    },
    
    goto_export: function() {
      this.currentContentView = this.getOrCreateView("SurveyView", {id: settings.surveyId});
      this.currentContentView.showExport();
      // _kmq.push(['record', "ExportView"]);
      this._router.navigate("surveys/" + settings.slug + "/export");
    }
    
  });

  return RootView;

}); // End Root module