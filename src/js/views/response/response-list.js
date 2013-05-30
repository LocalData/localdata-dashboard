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

  // Views
  'views/response/response',

  // Templates
  'text!templates/response-list.html'
],

function($, _, Backbone, events, settings, api, Responses, ResponseView, template) {
  'use strict';

  var ResponseListView = Backbone.View.extend({
    className: 'responses',

    template: _.template(template),

    events: {
      'click .close': 'remove'
    },

    initialize: function() {
      this.listenTo(this.collection, 'add', this.render);
      this.listenTo(this.collection, 'reset', this.render);
    },

    render: function() {
      var $el = $(this.el);
      $el.html(this.template());

      this.collection.each(function(response) {
        var item = new ResponseView({ model: response });
        $el.append(item.render().el);
      });

      return this;
    }
  });

  return ResponseListView;

});
