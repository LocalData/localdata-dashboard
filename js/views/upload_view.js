NSB.views.UploadView = Backbone.View.extend({
  elId: "#body",
    
  initialize: function(options) {
    _.bindAll(this, 'render', 'ready', 'setupUploader');
    
    // Show a given survey
    this.surveyId = options.surveyId;
        
  },
  
  setupUploader: function() {
    // Set up the uploader script (provided via fileuploader.js)
    console.log("Setting up file uploader");
    var uploader = new qq.FileUploader({
      element: document.getElementById('file-uploader'),
      action: NSB.API + '/surveys/' + this.surveyId + '/scans',
      debug: true,
      extraDropzones: [qq.getByClass(document, 'drop-area')[0]]
    });
  },
  
  ready: function() {
    this.render();
  },
    
  render: function() {
    console.log("Rendering upload view");
    
    // Set the context & render the page
    var context = {};
    $(this.elId).html(_.template($('#upload-view').html(), context));
    this.setupUploader();
  }
    
});
