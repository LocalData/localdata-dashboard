NSB.models.Form = Backbone.Model.extend({
  
  initialize: function(options) {
    this.surveyId = options.surveyId;
  },
  
  url: function() {
    if (this.get("id") != undefined) {
      return NSB.settings.api.baseurl + '/surveys/' + this.surveyId + '/forms';
    };
    return NSB.settings.api.baseurl + '/surveys/' + this.surveyId + '/forms';
  },
  
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
    };
    
    return response.forms;
  }
  
});
