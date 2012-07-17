NSB.views.PaginationView = Backbone.View.extend({
  el: "#result-pagination",
  
  events: {
		'click .pagination-item a': 'goToPage'
	},
  
  initialize: function(options) {
    _.bindAll(this, 'render', 'goToPage');
    this.pageCount = options.pageCount;
    this.render();
  },
  
  render: function(options) {
    console.log("Rendering pagination view");
    var context = { pageCount: this.pageCount };    
    $(this.el).html(_.template($('#pagination-view').html(), context));
    return this;
  },
  
  goToPage: function(e) {
    e.preventDefault();
    this.trigger('changePage', e.target.innerText);
  }
  
});