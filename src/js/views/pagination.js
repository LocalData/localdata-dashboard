/*jslint nomen: true */
/*globals define: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',
  'moment',

  'settings',
  'api',

  // Templates
  'text!templates/pagination.html'
],

function($, _, Backbone, moment, settings, api, template) {
  'use strict';


  var PaginationView = Backbone.View.extend({
    el: "#result-pagination",
    template: _.template(template),

    events: {
          'click .pagination-item a': 'goToPage'
      },

    initialize: function(options) {
      _.bindAll(this, 'render', 'goToPage');
      this.pageCount = options.pageCount;
      this.render();
    },

    render: function(options) {
      var context = {
        pageCount: this.pageCount
      };
      $(this.el).html(this.template(context));
       return this;
    },

    goToPage: function(e) {
      e.preventDefault();
      console.log("Caught page change");
      this.trigger('change', e.target.innerText);
    }
  });

  return PaginationView;

});
