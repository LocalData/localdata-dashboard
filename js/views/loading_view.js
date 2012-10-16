NSB.views.LoadingView = Backbone.View.extend({

  initialize: function() {
    _.bindAll(this, 'render');
    this.render();
  },

  render: function() {
    this.$el.html(_.template($('#loading-view').html(), {}));  
    return this;
  }

});
