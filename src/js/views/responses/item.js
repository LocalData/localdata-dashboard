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
      'click .action-show-edit': 'edit',
      'click .action-save-edit': 'save',
      'click .cancel': 'cancel',

      'click .action-flag': 'flag',
      'click .action-accept': 'accept'
    },

    initialize: function(options) {
      this.listenTo(this.model, "sync", this.render);
      this.listenTo(this.model, "destroy", this.remove);

      this.surveyOptions = options.surveyOptions || {};
      this.labels = options.labels;
      this.forms = options.forms;
    },

    render: function() {
      console.log("Rendering the model", this.model);

      console.log("Using form", this.forms.getFlattenedForm());
      var $el = $(this.el);

      this.surveyOptions.loggedIn = settings.user.isLoggedIn();

      var options = {
        r: this.model.toJSON(),
        labels: this.labels,
        form: this.forms.getFlattenedForm(),
        surveyOptions: this.surveyOptions
      };

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

    edit: function(event) {
      event.preventDefault();
      this.$('.value').hide();
      this.$('.edit').show();
      this.$('.action-save-edit').show();
      this.$('.action-cancel-edit').show();
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
