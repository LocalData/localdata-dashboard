NSB.views.SurveyView = Backbone.View.extend({
  el: $("#container"),
  
  survey: null,
  bodyView: null,
  
  initialize: function(options) {
    _.bindAll(this, 'render', 'showResponses', 'showUpload', 'showMap');
    
    // Set up the page and show the given survey
    this.surveyId = options.id;
    this.survey = new NSB.models.Survey({id: this.surveyId});
    
    // Get the relevant responses    
    this.responses = new NSB.collections.Responses({surveyId: this.surveyId}); 
    this.responses.on('all', this.render, this);
    
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
    this.bodyView.render(); 
  },
  
  showResponses: function() {
    console.log("Using response view");
    this.bodyView = new NSB.views.ResponseListView({responses: this.responses});
    this.subnavView.setActiveTab(0);
    //this.bodyView.render();
  },
  
  showMap: function() {
    console.log("Using map view");
    this.bodyView = new NSB.views.MapView({responses: this.responses});
    this.subnavView.setActiveTab(1);
    this.bodyView.render();
  },
    
  showUpload: function() {
    console.log("Using upload view");
    this.bodyView = new NSB.views.UploadView({surveyId: this.surveyId});
    this.subnavView.setActiveTab(2);
    this.bodyView.render();
  },
  
  showScans: function() {
    console.log("Using scans view");
    this.bodyView = new NSB.views.ScansListView({surveyId: this.surveyId});
    this.subnavView.setActiveTab(1);
  }
  
});
