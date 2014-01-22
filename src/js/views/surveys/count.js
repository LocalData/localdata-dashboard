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

    numberWithCommas: function(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },

    render: function() {
      var $el = $(this.el);

      var count = this.model.get('responseCount');
      count = this.numberWithCommas(count);
      $el.html(this.template({count: count }));
      return this;
    }

  });

  return ResponseCountView;
});
