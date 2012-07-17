NSB.views.Home = Backbone.View.extend({
  
  el: $("#container"),
  
  initialize: function(options) {
    _.bindAll(this, 'render');
    this.surveys = new NSB.collections.Surveys();
    this.surveys.bind('all', this.render);
  },
  
  render: function() {  
    console.log("Rendering home");
    var context = { 
      surveys: this.surveys.toJSON()
    };
    
    this.$el.html(_.template($('#home').html(), context));  
  }
  
});

