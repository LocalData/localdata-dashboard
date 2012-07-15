NSB.views.Home = Backbone.View.extend({
  
  el: $("#container"),
  
  initialize: function(options) {
    _.bindAll(this, 'render');
    this.surveys = new NSB.collections.Surveys();
    this.surveys.bind('all', this.render);
  },
  
  render: function() {
    
    console.log(this.surveys);
  
    var context = { 
      surveys: this.surveys.toJSON()
    };
    
    console.log(this.surveys);
    console.log("Listing surveys:");
    console.log(context);
    this.$el.html(_.template($('#home').html(), context));  
  }
  
});

