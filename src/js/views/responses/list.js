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

    remove: function() {
      this.$el.empty();
      this.stopListening();
      return this;
    },

    render: function() {
      var first = this.collection.at(0);
      var name;

      if(first.get('geo_info') !== undefined) {
        name = first.get('geo_info').humanReadableName;
      }else {
        name = first.get('parcel_id');
      }

      var $el = $(this.el);
      $el.html(this.template({ name: name }));

      this.collection.each(function(response) {
        var item = new ResponseView({
          model: response,
          labels: this.labels
        });
        $el.find('.responses-list').append(item.render().el);
      }.bind(this));

      return this;
    }
  });

  return ResponseListView;

});
