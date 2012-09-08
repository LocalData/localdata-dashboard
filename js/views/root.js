NSB.views.Root = Backbone.View.extend({
  /*
   * The singleton view which manages all others. Essentially, a "controller".
   *
   * A single instance of this object exists in the global namespace as 
   * "Everything".
   */
  
  el: $("body"),
  views: {},
  _router: null,
  survey: null,
  
  initialize: function() {
    // Bind local methods
    _.bindAll(this);
    
    // Set up global router
    this._router = new NSB.routers.Index({ controller: this });
    
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
    _kmq.push(['record', name]);
    
    // Register each view as it is created and never create more than one.
    if (name in this.views) {
      console.log("Going to " + name);
      return this.views[name];
    }

    console.log("Creating " + name);
    this.views[name] = new NSB.views[name](options);

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
    this.currentContentView = this.getOrCreateView("Home");
  },
  
  goto_survey: function() {
    this.currentContentView = this.getOrCreateView("SurveyView", {id: NSB.settings.surveyId});
    this.currentContentView.showResponses();
    _kmq.push(['record', "SurveyView"]);
    this._router.navigate("surveys/" + NSB.settings.slug);
  },
  
  goto_upload: function() {
    this.currentContentView = this.getOrCreateView("SurveyView", {id: NSB.settings.surveyId});
    this.currentContentView.showUpload();
    _kmq.push(['record', "UploadView"]);
    this._router.navigate("surveys/" + NSB.settings.slug + "/upload");
  },
  
  goto_map: function() {
    this.currentContentView = this.getOrCreateView("SurveyView", {id: NSB.settings.surveyId});
    this.currentContentView.showMap();
    _kmq.push(['record', "MapView"]);
    this._router.navigate("surveys/" + NSB.settings.slug + "/map");
  },
  
  goto_settings: function() {
    this.currentContentView = this.getOrCreateView("SurveyView", {id: NSB.settings.surveyId});
    this.currentContentView.showSettings();
    _kmq.push(['record', "SettingsView"]);
    this._router.navigate("surveys/" + NSB.settings.slug + "/settings");
  },
  
  goto_scans: function() {
    this.currentContentView = this.getOrCreateView("SurveyView", {id: NSB.settings.surveyId});
    this.currentContentView.showScans();
    this._router.navigate("surveys/" + NSB.settings.slug + "/scans");
  },
  
  goto_export: function() {
    this.currentContentView = this.getOrCreateView("SurveyView", {id: NSB.settings.surveyId});
    this.currentContentView.showExport();
    _kmq.push(['record', "ExportView"]);
    this._router.navigate("surveys/" + NSB.settings.slug + "/export");
  }
  
});