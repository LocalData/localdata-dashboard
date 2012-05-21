NSB.views.ExportView = Backbone.View.extend({
  el: $("#container"),
  
  survey: null,
  
  initialize: function(options) {
    _.bindAll(this, 'set_survey', 'reset', 'render');
  },
  
  set_survey: function(survey) {
    this.survey = survey; 
  },
  
  
  reset: function(id) {
    var init = { resource_uri: NSB.API + "/surveys/" + id + "/" };
    this.survey = new NSB.models.Survey(init);
    
    // get the survey
    this.survey.fetch({
      url: NSB.API + "/surveys/" + id + "/",
      async: false,
      success: _.bind(function(model, response) {
        // On success, get the responses for that survey. 
        this.survey = model;   
        this.render();    
      }, this)
    });
  },
  
  render: function() {
    // Cut out old stuff
    $("#modal-list-surveys").remove();
    
    // Set the context & render the page
    var context = {
      'survey': this.survey.toJSON(true)
    };
    
    console.log(context);
    this.el.html(NSB.templates.export_view(context));
  }
  
});

