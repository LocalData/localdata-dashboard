NSB.models.Scan = Backbone.Model.extend({
  
});

NSB.collections.Scans = Backbone.Collection.extend({
  model: NSB.models.Scan,
  
  initialize: function(options) {
    console.log("Getting scans");
    this.surveyId = options.surveyId;
    this.fetch();
  },
  
  url: function() {
    return NSB.settings.api.baseurl + '/surveys/' + this.surveyId + '/scans';
  },
  
  parse: function(response) {
    console.log("Parsing scans");
    return response.scans;
  }
  
});
