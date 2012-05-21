NSB.views.SurveyView = Backbone.View.extend({
  el: $("#container"),
  
  survey: null,
  responses: null,
  
  initialize: function(options) {
    _.bindAll(this, 'set_survey', 'set_responses', 'reset', 'render');
  },
  
  set_survey: function(survey) {
    this.survey = survey; 
  },
  
  set_responses: function(callback) {
    console.log("Getting responses for survey " + this.survey.get('id'));
    
    var results_uri = NSB.API + "/surveys/" + this.survey.id + "/responses/";
    this.responses = new NSB.collections.Responses({ resource_uri: results_uri });   
    
    this.responses.fetch({
      url: results_uri,
      async:false,
      success: _.bind(function(model, response) {
        this.responses = model;
        console.log(model);
        callback();
      }, this)
    });    
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
        this.set_responses(function() { }); 
        this.render();    
      }, this)
    });
  },
  
  render: function() {
    // Cut out old stuff
    $("#modal-list-surveys").remove();
      
    // Set the context & render the page
    var context = {
      'survey': this.survey.toJSON(true),
      'responses': this.responses.toJSON(true)
    };
    
    console.log(context);
    this.el.html(NSB.templates.survey_view(context));
  }
  
});

