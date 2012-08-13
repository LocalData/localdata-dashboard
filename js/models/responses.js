NSB.models.Response = Backbone.Model.extend({ 
  
});

NSB.collections.Responses = Backbone.Collection.extend({
  model: NSB.models.Response,
  
  initialize: function(options) {
    console.log("Getting responses");
    this.surveyId = options.surveyId;
    this.fetch();
  },
  
  url: function() {
    return NSB.API + '/surveys/' + this.surveyId + '/responses';
  },
        
  parse: function(response) {
    console.log("Parsing response collection");
    console.log(response);
    return response.responses;
  }
  
});
