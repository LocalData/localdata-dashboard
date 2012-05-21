NSB.models.Survey = Backbone.Model.extend({
  
  initialize: function(options) {
    _.bindAll(this, 'render', 'parse');
  },
  
  parse: function(response) {
    console.log("parsing");
    console.log(response);
    this.survey_name = response['name'];
    return response['survey'];
  },
  
  render: function() {
    console.log("Rendering survey");
    var context = {  };
    this.el.html(NSB.templates.survey_view(context));
    return this;
  },
  
  results: function() {
    /*
     * Render this object with embedded search results data for templating.
     */
    var results = this.toJSON(true);
        
    //console.log(results);
    //_.extend(results, this.data.results());
    return results;
  },
  
});


NSB.collections.Surveys = Backbone.Collection.extend({
  model: NSB.models.Survey,
  url: NSB.API + "/surveys", // TODO -- why do we need this?
      
  parse: function(response) {
    return response.surveys;
  },
  
  results: function() {
    /*
     * Grab the current data in a simplified data structure appropriate
     * for templating.
     */

    return {
        surveys: _.invoke(this.models, "results") 
    }
  }     
});