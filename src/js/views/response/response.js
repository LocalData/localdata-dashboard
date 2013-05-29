/*jslint nomen: true */
/*globals define: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',
  'lib/tinypubsub',

  // LocalData
  'settings',
  'api',

  // Models
  'models/responses',

  // Templates
  'text!templates/response-list-item.html'
],

function($, _, Backbone, events, settings, api, Responses, template) {
  'use strict';

  var ResponseView = Backbone.View.extend({
    className: 'response',

    template: _.template(template),

    events: {
      'click .delete': 'destroy',
      'click .confirm': 'confirm',
      'click .cancel': 'cancel'
    },

    initialize: function() {
      this.listenTo(this.model, "change", this.render);
    },

    render: function() {
      var $el = $(this.el);
      $el.html(this.template({r: this.model.toJSON() }));
      return this;
    },

    confirm: function(event) {
      event.preventDefault();
      $('confirm-delete').show();
    },

    cancel: function(event) {
      event.preventDefault();
      $('confirm-delete').hide();
    },

    destroy: function(event) {
      event.preventDefault();

      function success(model, repsonse) {
        console.log("Success");
        this.remove();
      }

      function error(model, xhr, options) {
        console.log("Error destroying");
        $('.error').html('Error');
      }

      this.model.destroy({
        success: success,
        error: error
      });
    }

  });

  return ResponseView;

});
