/*jslint nomen: true */
/*globals define: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',
  'lib/tinypubsub',

  // Models
  'models/surveys',

  // Templates
  'text!templates/surveys/count.html'
],

function($, _, Backbone, events, Responses, template) {
  'use strict';

  var ResponseCountView = Backbone.View.extend({
    template: _.template(template),

    initialize: function() {
      this.listenTo(this.model, "change", this.render);
      this.listenTo(this.model, "destroy", this.remove);
    },

    render: function() {
      var $el = $(this.el);
      $el.html(this.template({count: this.model.getCount() }));
      return this;
    }

  });

  return ResponseCountView;
});
