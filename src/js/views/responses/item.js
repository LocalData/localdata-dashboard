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
  'text!templates/responses/item.html'
],

function($, _, Backbone, events, settings, api, Responses, template) {
  'use strict';

  var ResponseView = Backbone.View.extend({
    className: 'response',

    template: _.template(template),

    events: {
      'click .action-show-confirm': 'confirm',
      'click .action-delete': 'destroy',
      'click .cancel': 'cancel',

      'click .action-flag': 'flag',
      'click .action-accept': 'accept'
    },

    initialize: function(options) {
      this.listenTo(this.model, "sync", this.render);
      this.listenTo(this.model, "destroy", this.remove);

      this.renderOptions = options || {};
      this.labels = options.labels;
    },

    render: function() {
      console.log("Re-rendering model", this.model);
      var $el = $(this.el);

      var options = {
        r: this.model.toJSON(),
        labels: this.labels,
        renderOptions: this.renderOptions
      };

      // For now, we always want to show the review tools.
      options.renderOptions.showReviewTools = true;

      $el.html(this.template(options));
      return this;
    },

    confirm: function(event) {
      event.preventDefault();
      this.$('.action-show-confirm').hide();
      this.$('.confirm-delete').show();
    },

    cancel: function(event) {
      event.preventDefault();
      this.$('.confirm-delete').hide();
      this.$('.action-show-confirm').show();
    },

    destroy: function(event) {
      event.preventDefault();

      function success(model, repsonse) {
      }

      function error(model, xhr, options) {
        console.log("Error destroying", xhr, options);
        console.log($('.error'));
        $('.error').show();
      }

      this.model.destroy({
        success: success,
        error: error
      });
    },

    flag: function(event) {
      event.preventDefault();
      this.model.save({
        responses: {
          reviewed: 'flagged'
        }
      }, {
        patch: true,
        wait: true, // wait until sync to update attributes
        success: function (event) {
          // We need to fetch the model because patch resets the local
          // attributes.
          this.model.fetch({ reset: true });
        }.bind(this)
      });
    },

    accept: function(event) {
      event.preventDefault();
      this.model.save({
        responses: {
          reviewed: 'accepted'
        }
      }, {
        patch: true,
        wait: true,
        success: function (event) {
          this.model.fetch({ reset: true });
        }.bind(this)
      });
    }
  });

  return ResponseView;
});
