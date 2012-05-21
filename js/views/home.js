NSB.views.Index = Backbone.View.extend({
  
  el: $("#container"),
  
  initialize: function(options) {
    _.bindAll(this);
  },
  
  reset: function() {
    this.render();
  },
  
  render: function() {
    console.log("rendering home");
    var surveys = new NSB.collections.Surveys();

    surveys.fetch({
      data: { },
      success: _.bind(function() {
        var context = surveys.results();
        
        console.log("Listing surveys:");
        console.log(context);

        this.el.html(NSB.templates.home(context));
    }, this)
    });
    
  }
});

