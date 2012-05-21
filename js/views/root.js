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
  
  initialize: function() {
    // Bind local methods
    _.bindAll(this);
    
    // Set up global router
    this._router = new NSB.routers.Index({ controller: this });
    
    return this;
  },
  
  start_routing: function() {
    /*
     * Start Backbone routing. Separated from initialize() so that the
     * global controller is available for any preset routes (direct links).
     */
    Backbone.history.start();
  },
  
  get_or_create_view: function(name, options) {
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
  
  goto_home: function() {
    this.current_content_view = this.get_or_create_view("Index");
    this.current_content_view.reset();
  },
  
  goto_survey: function(id) {
    this.current_content_view = this.get_or_create_view("SurveyView");
    this.current_content_view.reset(id);

    this._router.navigate("survey/" + id);
  },
  
  goto_export: function(id) {
    this.current_content_view = this.get_or_create_view("ExportView");
    this.current_content_view.reset(id);

    this._router.navigate("survey/" + id + "/export");
  }
  
});