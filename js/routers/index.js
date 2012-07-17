NSB.routers.Index = Backbone.Router.extend({
  routes: {
    "": "home",
    "surveys/:id": "survey",
    "surveys/:id/scans": "scans",
    
    "surveys/:id/export": "download",
    "surveys/:id/upload": "upload",
    
    "*actions": "default_route"
  },
  
  initialize: function(options) {
      this.controller = options.controller;
  },
  
  home: function() {
    console.log("Index");
    this.controller.goto_home();
  },
  
  survey: function(id) {
    this.controller.goto_survey(id);
  },
  
  download: function(id) {
    this.controller.goto_export(id);
  },
  
  scans: function(id) {
    this.controller.goto_scans(id);
  },
  
  upload: function(id) {
    this.controller.goto_upload(id);
  },
    
  default_route: function(actions) {
    console.log(actions);
  }    
});