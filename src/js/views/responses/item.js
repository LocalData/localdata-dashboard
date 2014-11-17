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

    responseEdits: {}, // changes to make to the responses object.

    events: {
      // Deleting
      'click .action-show-confirm': 'confirm',
      'click .action-delete': 'destroy',
      'click .cancel': 'cancel',

      // Editing
      'click .action-show-edit': 'edit',
      'click .action-save-edit': 'save',
      'click .action-cancel-edit': 'cancelEdit',
      'change .edit': 'questionEdited',

      // Flagging
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

    // Deleting
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


    // Editing
    edit: function(event) {
      event.preventDefault();
      this.$('.value').hide();
      this.$('.edit').show();
      this.$('.action-save-edit').show();
      this.$('.action-cancel-edit').show();
    },

    questionEdited: function(event) {
      console.log("Model", this.model);
      var question = $(event.target).attr('data-question');
      var answer = $(event.target).val();

      this.responseEdits[question] = answer;
    },

    cancelEdit: function(event) {
      event.preventDefault();

      this.$('.value').show();
      this.$('.edit').hide();
      this.$('.action-save-edit').hide();
      this.$('.action-cancel-edit').hide();

      // Fetch the attributes to make sure we have the latest version.
      this.model.fetch();
    },

    save: function(event) {
      event.preventDefault();

      this.model.save({
        responses: this.responseEdits
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


    // Flagging
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
