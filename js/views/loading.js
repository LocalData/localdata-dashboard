/*jslint nomen: true */
/*globals define: true */

define([
  'jquery',
  'lib/lodash',
  'backbone'
],

function($, _, Backbone) {
  'use strict'; 

  var LoadingView = Backbone.View.extend({
	  initialize: function() {
	  	this.$el = $("#loading-view-container");
	  	console.log(this.$el)
	    _.bindAll(this, 'render');
	    this.render();
	  },

	  render: function() {
	    this.$el.html(_.template($('#loading-view').html(), {}));  
	  }
	});

	return LoadingView;
});
