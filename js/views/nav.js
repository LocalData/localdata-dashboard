/*jslint nomen: true */
/*globals define: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',
  'settings',
  'api'
],

function($, _, Backbone, settings, api) {
  'use strict'; 

  var NavView = Backbone.View.extend({
    elId: '#nav',
    active: null,
    
    initialize: function(options) {
      _.bindAll(this, 'render', 'makeNavItem', 'makeNavItem');
      this.slug = options.slug;
      
      // Set up the navigation elements.
      // Each has an ID, a route, and text that displays in the tab
      this.items = [
        this.makeNavItem('nav-responses', 'surveys/' + this.slug, 'Results', 'icon-home'),
        this.makeNavItem('nav-export', 'surveys/' + this.slug + '/export', 'Export', 'icon-download'),
        this.makeNavItem('nav-form', 'surveys/' + this.slug + '/form', 'Form', 'icon-cog'),

        this.makeNavItem('nav-form', 'surveys/' + this.slug + '/settings', 'Settings', 'icon-cog tab-settings')
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
        
      $(this.elId).html(_.template($('#nav-view').html(), { items: this.items }));    
    }

  });
  
  return NavView;
  
});


