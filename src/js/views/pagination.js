/*jslint nomen: true */
/*globals define: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',
  'moment',

  'settings',
  'api'
],

function($, _, Backbone, moment, settings, api) {
  'use strict';


  var PaginationView = Backbone.View.extend({
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
      //$(this.el).html(_.template($('#pagination-view').html(), context));
      // return this;
    },

    goToPage: function(e) {3
      e.preventDefault();
      this.trigger('changePage', e.target.innerText);
    }
  });

  return PaginationView;

});
