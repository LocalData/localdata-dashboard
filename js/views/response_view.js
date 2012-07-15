NSB.views.ResponseView = Backbone.View.extend({
  
  el: $("#responses"),
  responses: null,
  surveyId: null,

  initialize: function(options) {
    _.bindAll(this, 'render', 'debug');
    this.surveyId = options.surveyId;
    
    this.responses = new NSB.collections.PaginatedResponses({surveyId: this.surveyId});    
    
    this.responses.fetch({
      success: this.pager()
    });
    
    this.responses.on('change', this.render, this);
		this.responses.on('reset', this.render, this);
		    
  },
  
  pager: function() {
    this.responses.pager();
  },
  
  debug: function() {
    this.responses.pager();
    console.log("Debugging pagination");
    console.log(this.responses);
  },
  
  render: function() {  
    console.log("Rendering paginated result view");
    
    var context = this.responses;    
    $("#responses").html(_.template($('#response-view').html(), context));
    console.log(context);
  }
  
});