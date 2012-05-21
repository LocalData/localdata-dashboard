NSB.models.Response = Backbone.Model.extend({

  initialize: function(options) {
    _.bindAll(this, 'render', 'parse');
  },
  
  parse: function(response) {
    console.log("parsing");
    console.log(response);
    return response;
  },
  
  render: function() {
    console.log("Rendering response");
    var context = {  };
    this.el.html(NSB.templates.response(context));
    return this;
  },
  
  results: function() {
    /*
     * Render this object with embedded search results data for templating.
     */
    var results = this.toJSON(true);

    return results;
  },
});


NSB.collections.Responses = Backbone.Collection.extend({
  model: NSB.models.Response,
  
  get_results_for_survey: function(id) {
    return this;
  },
      
  parse: function(response) {
    return response.responses;
  },
  
  results: function() {
    /*
     * Grab the current data in a simplified data structure appropriate
     * for templating.
     */     
   
    return {
      responses: _.invoke(this.models, "results") 
    }
  }     
});