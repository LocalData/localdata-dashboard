NSB.models.Response = Backbone.Model.extend({ 
  
});

NSB.collections.Responses = Backbone.Collection.extend({
  model: NSB.models.Response,
  
  initialize: function(options) {
    // Ugly -- we'll need to find a nicer way to init this thing.s
    // Maybe: function(models, options)
    if(options !== null) {
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
  },

  getResponseKeys: function() {
    this.responseKeys = [];
    _.each(this.models, function(response) {
      var responseJSON = response.toJSON();
      if (_.has(responseJSON, 'responses')) {
        this.responseKeys = _.union(this.responseKeys, _.keys(responseJSON.responses));
      }
    }, this);
    return this.responseKeys;
  },

  getUniqueAnswersForQuestion: function(question) {
    var answers = _.map(this.models, function(response){
      if(_.has(response.attributes, 'responses')) {
        if (_.has(response.attributes.responses, question)) {
          return response.attributes.responses[question];
        }
      }
    });
    console.log(answers);
    return _.unique(answers);
  }
  
});
