NSB.models.Form = Backbone.Model.extend({
  
  initialize: function(options) {
    this.surveyId = options.surveyId;
  },
  
  url: function() {
    if (this.get("id") !== undefined) {
      return NSB.settings.api.baseurl + '/surveys/' + this.surveyId + '/forms';
    }
    return NSB.settings.api.baseurl + '/surveys/' + this.surveyId + '/forms';
  }
  
});



NSB.collections.Forms = Backbone.Collection.extend({
  model: NSB.models.Form,
  
  initialize: function(options) {
    this.surveyId = options.surveyId;
    this.fetch();
  },
  
  url: function() {
    return NSB.settings.api.baseurl + '/surveys/' + this.surveyId + '/forms';
  },
  
  parse: function(response) {
    console.log(response);
    
    if (response.forms.length === 0) {
      console.log("No forms yet");
      var newForm = new NSB.models.Form({ 'questions': [] });
      return [ newForm ];
    }
    
    return response.forms;
  },

  // Find the most recent form of the given type (usually "mobile" or "paper")
  getMostRecentForm: function(type) {
    var i;

    // find mobile forms by default
    if (type === undefined) {
      type = "mobile";
    }

    for (i = 0; i < this.models.length; i++) {
      if (this.models[i].get('type') === type) {
        return this.models[i];
      }
    }
  },

  // Helper method used by the recursive getFlattenedForm
  flattenForm: function(question, flattenedForm) {

    // Add the question to the list of questions
    // Naive -- takes more space than needed (because it includes subquestions)
    flattenedForm.push(question);

    // Check if there are sub-questions associated with any of the answers
    _.each(question.answers, function(answer){
      if (answer.questions !== undefined) {
        _.each(answer.questions, function(question) {

          // Recusively call flattenForm to process those questions.
          return this.flattenForm(question, flattenedForm);

        }, this);        
      }
    }, this);

    return flattenedForm;
  },

  // Returns the most recent form as a flat list of question objects
  // Objects have name (functions as id), text (label of the question)
  getFlattenedForm: function() {
    var mostRecentForm = this.getMostRecentForm();
    var flattenedForm = [];
    var distinctQuestions = [];

    // Process the form if we have one
    if (mostRecentForm !== undefined) {
      console.log("getting flattened form");
      _.each(mostRecentForm.get("questions"), function(question) {
        flattenedForm = flattenedForm.concat(this.flattenForm(question, flattenedForm));
      }, this);

      // Make sure there's only one question per ID. 
      var questionNames = [];
      _.each(flattenedForm, function(question) {
        if (! _.contains(questionNames, question.name)) {
          questionNames.push(question.name);
          distinctQuestions.push(question);
        }
      });
    }

    return distinctQuestions;
  }
  
});
