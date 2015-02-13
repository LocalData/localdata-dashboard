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
    var context = { pageCount: this.pageCount };
  },

  goToPage: function(e) {
    e.preventDefault();
    this.trigger('changePage', e.target.innerText);
  }

});
