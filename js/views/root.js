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
    /*
     * Register each view as it is created and never create more than one.
     */
    if (name in this.views) {
      return this.views[name];
    }

    console.log(name);
    this.views[name] = new NSB.views[name](options);

    return this.views[name];
  },
  
  switchPage: function(page) {
    /*
     * Show the given page; hide the others
     */
    $('.page').hide();
    if (page.show !== undefined) {
      page.show();
    } else {
      page.$el.show();
    }
  },
  
  goto_home: function() {
    this.currentContentView = this.getOrCreateView("Home");
  },
  
  goto_survey: function(id) {
    this.currentContentView = this.getOrCreateView("SurveyView", {id: id});
    this._router.navigate("survey/" + id);
  },
  
  goto_export: function(id) {
    this.currentContentView = this.getOrCreateView("ExportView");
    this.currentContentView.reset(id);

    this._router.navigate("survey/" + id + "/export");
  }
  
});