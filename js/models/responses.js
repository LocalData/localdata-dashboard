NSB.models.Response = Backbone.Model.extend({ 
  
});

NSB.collections.Responses = Backbone.Collection.extend({
  model: NSB.models.Response,
  
  initialize: function(options) {
    // Ugly -- we'll need to find a nicer way to init this thing.s
    // Maybe: function(models, options)
    if(options != null) {
      console.log("Getting responses");
      this.surveyId = options.surveyId;
      this.fetch();
    }
  },
  
  url: function() {
    return NSB.settings.api.baseurl + '/surveys/' + this.surveyId + '/responses';
  },
        
  parse: function(response) {
    console.log("Parsing response collection");
    console.log(response);
    return response.responses;
  }
  
});
