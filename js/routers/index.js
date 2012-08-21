NSB.routers.Index = Backbone.Router.extend({
  routes: {
    "": "home",
    
    "surveys/:slug": "survey",
    "surveys/:slug/map": "map",
    "surveys/:slug/export": "export",
    "surveys/:slug/settings": "settings",
    
    "surveys/:slug/scans": "scans",
    "surveys/:slug/upload": "upload",
    
    "*actions": "default_route"
  },
  
  initialize: function(options) {
    this.controller = options.controller;
  },
  
  home: function() {
    console.log("Index");
    this.controller.goto_home();
  },
  
  survey: function(slug) {
    NSB.API.setSurveyIdFromSlug(slug, this.controller.goto_survey);
    //this.controller.goto_survey(NSB.API.setSurveyIdFromSlug(slug));
  },
  
  map: function(slug) {
    NSB.API.setSurveyIdFromSlug(slug, this.controller.goto_map)
  },
  
  settings: function(slug) {
    NSB.API.setSurveyIdFromSlug(slug, this.controller.goto_settings)
  },
  
  export: function(slug) {
    NSB.API.setSurveyIdFromSlug(slug, this.controller.goto_export)
  },
  
  scans: function(slug) {
    NSB.API.setSurveyIdFromSlug(slug, this.controller.goto_scans)
  },
  
  upload: function(slug) {
    NSB.API.setSurveyIdFromSlug(slug, this.controller.goto_upload)
  },
    
  default_route: function(actions) {
    console.log(actions);
  }    
});