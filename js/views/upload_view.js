NSB.views.UploadView = Backbone.View.extend({
  elId: "#body",
    
  initialize: function(options) {
    _.bindAll(this, 'render');
    
    // Show a given survey
    this.surveyId = options.surveyId;
  },
  
  ready: function() {
    this.render();
  },
    
  render: function() {
    console.log("Rendering upload view");
    
    // Set the context & render the page
    var context = {
      'survey': ''
    };
    
    $(this.elId).html(_.template($('#upload-view').html(), context));
  }
  
    
});
