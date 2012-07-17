NSB.views.SurveyView = Backbone.View.extend({
  el: $("#container"),
  
  survey: null,
  bodyView: null,
  
  initialize: function(options) {
    _.bindAll(this, 'render', 'showResponses', 'showUpload');
    
    // Set up the page and show the given survey
    this.surveyId = options.id;
    this.survey = new NSB.models.Survey({id: this.surveyId});
    
    // Do things once the survey has loaded
    this.survey.bind('change', this.render, this);
        
    // Create subnav view 
    this.subnavView = new NSB.views.SubnavView({surveyId: this.surveyId});  
  },
    
  render: function() {
    console.log("Rendering survey view");
    
    // Set the context & render the page
    var context = {
      'survey': this.survey.toJSON()
    };
    this.$el.html(_.template($('#survey-view').html(), context));
    
    // Render the sub components
    this.subnavView.render();
    this.bodyView.ready(); 
  },
  
  showResponses: function() {
    console.log("Using response view");
    this.bodyView = new NSB.views.ResponseListView({surveyId: this.surveyId});
    this.subnavView.setActiveTab(0);
  },
  
  showUpload: function() {
    console.log("Using upload view");
    this.bodyView = new NSB.views.UploadView({surveyId: this.surveyId});
    this.bodyView.render();
    this.subnavView.setActiveTab(2);
  }
  
});
