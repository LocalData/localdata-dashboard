NSB.views.ScansListView = Backbone.View.extend({
  elId: "#body",
    
  initialize: function(options) {
    _.bindAll(this, 'render', 'ready', 'humanize');
    
    // Show a given survey
    this.surveyId = options.surveyId;
    this.scans = new NSB.collections.Scans({surveyId: this.surveyId});
    this.scans.on('all', this.render, this); 
  },
  
  ready: function() {
  },
  
  humanize: function() {
    // Translate the terms used in scans to Human-Speak.  
    var humanizedScans = [];
    
    var js = this.scans.toJSON();
    _.each(js, function(scan){
      if (scan.status === 'pending') {
        scan.status = 'awaiting processing';
      }
      if (scan.status === 'working') {
        scan.status = 'processing in progress';
      }
      if (scan.status === 'completed') {
        scan.status = 'processed';
      }
      humanizedScans.push(scan);
    });
    
    return humanizedScans;
  },
    
  render: function() {
    console.log("Rendering scan view");
    
    // Set the context & render the page
    console.log(this.scans);
    var context = {
      scans: this.humanize()
    };
    $(this.elId).html(_.template($('#scan-view').html(), context));
    
  }
    
});
