NSB.views.PaginationView = Backbone.View.extend({
  events: {
		'click': 'goto',
		// 'click a.next': 'gotoNext',
		// 'click a.page': 'gotoPage'
	},
  
  initialize: function(options) {
    this.elId = options.elId;
    this.pageCount = options.pageCount
    this.render();
  },
  
  render: function(options) {
    console.log("Rendering pagination view");
    var context = { pageCount: this.pageCount };    
    $(this.elId).html(_.template($('#pagination-view').html(), context));
  },
  
  goto: function(e) {
    e.preventDefault();
    console.log("Clicked!");
  }
  
});