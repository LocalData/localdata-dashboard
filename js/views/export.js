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

  var ExportView = Backbone.View.extend({
    elId: "#export-view-container",
      
    initialize: function(options) {
      _.bindAll(this, 'render');
      
      // Show a given survey
      this.surveyId = options.surveyId;
          
    },
      
    render: function() {
      // Set the context & render the page
      var context = {
        surveyId: this.surveyId,
        baseurl: settings.api.baseurl
      };
      $(this.elId).html(_.template($('#export-view').html(), context));
    }
  });

  return ExportView;

});
