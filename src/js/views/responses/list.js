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
  'views/responses/item',

  // Templates
  'text!templates/responses/list.html'
],

function($, _, Backbone, events, settings, api, Responses, ResponseView, template) {
  'use strict';

  /**
   * Intended for shorter lists of responses (arbitrarily <25)
   * Doesn't include pagination, which isn't relevant in this case.
   * See responses/responses/ListView for a heavyweight implementation.
   */
  var ResponseListView = Backbone.View.extend({
    className: 'responses',

    template: _.template(template),

    events: {
      'click .close': 'remove'
    },

    initialize: function(options) {
      this.listenTo(this.collection, 'add', this.render);
      this.listenTo(this.collection, 'reset', this.render);

      this.labels = options.labels;
    },

    render: function() {
      var $el = $(this.el);
      $el.html(this.template());

      this.collection.each(function(response) {
        var item = new ResponseView({
          model: response,
          labels: this.labels
        });
        $el.append(item.render().el);
      }.bind(this));

      return this;
    }
  });

  return ResponseListView;

});
