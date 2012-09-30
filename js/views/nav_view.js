NSB.views.SubnavView = Backbone.View.extend({
  elId: '#subnav',
  active: null,
  
  initialize: function(options) {
    _.bindAll(this, 'render', 'makeNavItem', 'makeNavItem');
    this.slug = options.slug;
    
    // Set up the navigation elements. 
    // Each has an ID, a route, and text that displays in the tab
    this.items = [
      this.makeNavItem('nav-responses', 'surveys/' + this.slug, 'Results', 'icon-home'),
      this.makeNavItem('nav-export', 'surveys/' + this.slug + '/export', 'Export', 'icon-download'),
      this.makeNavItem('nav-settings', 'surveys/' + this.slug + '/settings', 'Survey Settings', 'icon-cog'),

      //this.makeNavItem('nav-map', 'surveys/' + this.slug + '/map', 'Results', 'icon-map-marker'),
     //  this.makeNavItem('nav-scans', 'surveys/' + this.surveyId + '/scans', 'Scans'),
     //  this.makeNavItem('nav-upload', 'surveys/' + this.surveyId + '/upload', 'Upload'),
     // this.makeNavItem('nav-collectors', 'surveys/' + this.surveyId + '/collectors', 'Collectors')
    ];
    this.current = this.items[0];
  },
  
  makeNavItem: function(id, fragment, title, icon) {
    var item = {
      id: id,
      fragment: fragment,
      title: title,
      icon: icon,
      active: ''
    };
    return item;
  },
  
  setActiveTab: function(n) {
    this.current.active = '';
    this.current = this.items[n];
    this.render();
  },
    
  render: function() {
    _.each(this.items, function(item){
      if (item === this.current) {
        item.active = "active";
      };
    }, this);
      
    $(this.elId).html(_.template($('#subnav-view').html(), { items: this.items }));    
  }

});


