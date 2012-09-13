NSB.views.SurveyListItemView = Backbone.View.extend({

  initialize: function() {
    _.bindAll(this, 'render');
    this.model.bind('change', this.render);
  },

  render: function() {
    this.$el.html(_.template($('#survey-list-item-view').html(), {survey: this.model }));  
    return this;
  }

});


NSB.views.SurveyView = Backbone.View.extend({
  el: $("#container"),
  
  toshow: ['', 0],
  survey: null,
  bodyView: null,
  
  initialize: function(options) {
    _.bindAll(this, 'render', 'show', 'showResponses', 'showUpload', 'showMap', 'showSettings');
    
    // Set up the page and show the given survey
    this.surveyId = options.id;
    this.survey = new NSB.models.Survey({id: this.surveyId});
    this.survey.bind('change', this.render, this);
    
    // Get the relevant responses    
    this.responses = new NSB.collections.Responses({surveyId: this.surveyId}); 
    this.responses.on('all', this.render, this);
    
    // Get the forms
    this.forms = new NSB.collections.Forms({surveyId: this.surveyId});     
  },
    
  render: function() {
    console.log("Rendering survey view");
    
    // Set the context & render the page
    var context = {
      'survey': this.survey.toJSON()
    };
    this.$el.html(_.template($('#survey-view').html(), context));
    
    console.log(this.settingsView);
    
    // Render the sub components
    $('#response-view-container').hide();
    $('#settings-view-container').hide();
    $('#export-view-container').hide();

    // Create sub views
    this.mapView = new NSB.views.MapView({responses: this.responses});
    this.responseListView = new NSB.views.ResponseListView({
      el: $("#response-view-container"),
      responses: this.responses 
    });
    
    this.subnavView = new NSB.views.SubnavView({slug: NSB.settings.slug});  
    this.exportView = new NSB.views.ExportView({surveyId: this.surveyId});  
    this.settingsView = new NSB.views.SettingsView({
      surveyId: this.surveyId,
      forms: this.forms
    });  

    this.subnavView.render();
    this.mapView.render(); 
    this.settingsView.render(); 
    this.exportView.render(); 
    
    this.responseListView.render();
    
    // This is a really bad way to show the right stuff
    this.show(this.toshow[0], this.toshow[1]);
  },
  
  show: function(id, tab) {
    // This is a really bad way to show the right stuff
    this.toshow = [id, tab];
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
  
  showExport: function() {
    this.show('#export-view-container', 2);
  },
  
  showSettings: function() {
    this.show('#settings-view-container', 3);
  },
      
  // Not yet implemented
  showUpload: function() {
    console.log("[not] Using upload view");
   // this.bodyView = new NSB.views.UploadView({surveyId: this.surveyId});
   // this.subnavView.setActiveTab(2);
   // this.bodyView.render();
  },
  
  showScans: function() {
    console.log("[not] Using scans view");
   // this.bodyView = new NSB.views.ScansListView({surveyId: this.surveyId});
   // this.subnavView.setActiveTab(1);
  }
  
});
