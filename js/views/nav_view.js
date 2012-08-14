NSB.views.SubnavView = Backbone.View.extend({
  elId: '#subnav',
  active: null,
  
  initialize: function(options) {
    _.bindAll(this, 'render', 'makeNavItem', 'makeNavItem');
    this.surveyId = options.surveyId;
    
    // Set up the navigation elements. 
    // Each has an ID, a route, and text that displays in the tab
    this.items = [
      this.makeNavItem('nav-responses', 'surveys/' + this.surveyId, 'Overview', 'icon-home'),
      this.makeNavItem('nav-map', 'surveys/' + this.surveyId + '/map', 'Map', 'icon-map-marker'),
      this.makeNavItem('nav-export', 'surveys/' + this.surveyId + '/export', 'Export', 'icon-download'),
      
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
        console.log("Nav: activating " + item.title);
        item.active = "active";
      };
    }, this);
      
    // console.log($("#subnav"));
    $(this.elId).html(_.template($('#subnav-view').html(), { items: this.items }));    
  }

});


