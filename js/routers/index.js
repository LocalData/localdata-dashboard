NSB.routers.Index = Backbone.Router.extend({
  routes: {
    "": "home",
    "survey/:id": "survey",
    "survey/:id/export": "download",
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
  
  default_route: function(actions) {
    console.log(actions);
  }    
});