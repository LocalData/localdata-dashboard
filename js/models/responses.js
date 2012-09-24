NSB.models.Response = Backbone.Model.extend({ 
  
});

NSB.collections.Responses = Backbone.Collection.extend({
  model: NSB.models.Response,
  
  initialize: function(models, options) {
    // Ugly -- we'll need to find a nicer way to init this thing.s
    // Maybe: function(models, options)
    if(models !== []) {
      this.models = models;
    }

    if(options !== undefined) {
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
    uniqueAnswers = _.unique(answers);

    // Replace undefined with a string for nice rendering
    var idxOfUndefinedToReplace = _.indexOf(uniqueAnswers, undefined);
    uniqueAnswers[idxOfUndefinedToReplace] = "[empty]";
    return uniqueAnswers;
  }
  
});
