NSB.views.ExportView = Backbone.View.extend({
  elId: "#export-view-container",
    
  initialize: function(options) {
    _.bindAll(this, 'render');
    
    // Show a given survey
    this.surveyId = options.surveyId;
        
  },
  
    
  render: function() {
    // Set the context & render the page
    var context = {
      surveyId: this.surveyId,
      baseurl: NSB.settings.api.baseurl
    };
    $(this.elId).html(_.template($('#export-view').html(), context));
  }
    
});
