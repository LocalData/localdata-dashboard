NSB.views.SurveyView = Backbone.View.extend({
  el: $("#container"),
  
  toshow: ['', 0],
  survey: null,
  bodyView: null,
  
  initialize: function(options) {
    _.bindAll(this, 'render', 'show', 'showResponses', 'showUpload', 'showMap');
    
    // Set up the page and show the given survey
    this.surveyId = options.id;
    this.survey = new NSB.models.Survey({id: this.surveyId});
    
    // Get the relevant responses    
    this.responses = new NSB.collections.Responses({surveyId: this.surveyId}); 
    this.responses.on('all', this.render, this);
    
    // Do things once the survey has loaded
    this.survey.bind('change', this.render, this);
        
    // Create sub views
    this.mapView = new NSB.views.MapView({responses: this.responses});
    this.responseListView = new NSB.views.ResponseListView({responses: this.responses});
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
    this.mapView.render(); 
    this.responseListView.render();
    $('#map-view-container').hide();
    $('#response-view-container').hide();
    
    // This is a really bad way to show the right stuff
    this.show(this.toshow[0], this.toshow[1]);
  },
  
  show: function(id, tab) {
    // This is a really bad way to show the right stuff
    this.toshow = [id, tab];
    console.log("Showing " + id);
    $("#content > div").hide();
    $(id).show();
    this.subnavView.setActiveTab(tab);
  },
  
  showResponses: function() {
    this.show('#response-view-container', 0);
  },
  
  showMap: function() {
    this.show('#map-view-container', 1);
  },
    
  // Not yet implemented
  showUpload: function() {
    console.log("Using upload view");
   // this.bodyView = new NSB.views.UploadView({surveyId: this.surveyId});
   // this.subnavView.setActiveTab(2);
   // this.bodyView.render();
  },
  
  showScans: function() {
    console.log("Using scans view");
   // this.bodyView = new NSB.views.ScansListView({surveyId: this.surveyId});
   // this.subnavView.setActiveTab(1);
  }
  
});
