NSB.views.SurveyView = Backbone.View.extend({
  el: $("#container"),
  
  survey: null,
  responseView: null,
  
  initialize: function(options) {
    _.bindAll(this, 'render');
    
    /* 
     * Set up the view to show a given survey. 
     */
    this.survey = new NSB.models.Survey({id: options.id});
    this.survey.bind('all', this.render);
    
    this.responses = new NSB.views.ResponseView({surveyId: options.id});
  },
    
  render: function() {
    // Cut out old stuff
    $("#modal-list-surveys").remove();
          
    // Set the context & render the page
    var context = {
      'survey': this.survey.toJSON(),
    };
        
    this.$el.html(_.template($('#survey-view').html(), context));
  }
  
});

