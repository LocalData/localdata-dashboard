/*jslint nomen: true */
/*globals define: true */

define(function(require, exports, module) {
  'use strict';

  // Libs
  var $ = require('jquery');
  var _ = require('lib/lodash');
  var Backbone = require('backbone');

  var util = require('util');

  // Views
  var DeleteView = require('views/surveys/delete');
  var UsersView = require('views/surveys/users');

  // Templates
  var template = require('text!templates/surveys/settings.html');


  var SettingsView = Backbone.View.extend({
    el: '#settings-view-container',
    template: _.template(template),

    events: {
      'click .save': 'save'
    },

    initialize: function(options) {
      _.bindAll(this, 'render', 'save', 'success', 'error');

      this.survey = options.survey;

      this.survey.on('change', this.render);
    },

    error: function(model, xhr, options) {
      $("#survey-settings-form .error").fadeIn().css("display","inline-block").delay(2000).fadeOut();
    },

    success: function() {
      $("#survey-settings-form .saved").fadeIn().css("display","inline-block").delay(2000).fadeOut();
    },

    save: function(event) {
      event.preventDefault();
      util.track('survey.settings.save');

      // Get the fields from the form
      var form = $(event.target).parent().serializeArray();

      // Convert the fields into a format that can be saved
      var fields = _.reduce(form, function(memo, field) {
        memo[field.name] = field.value;
        return memo;
      }, {});

      this.survey.set(fields);
      this.survey.attributes.zones = this.mapDrawView.getZones();
      this.survey.save({}, {
        success: this.success,
        error: this.error
      });
    },

    render: function() {
      var context = {
        survey: this.survey.toJSON()
      };

      this.$el.html(this.template(context));

      this.sharingView = new UsersView({
        survey: this.survey
      });
      this.deleteView = new DeleteView({
        survey: this.survey
      });
    }
  });

  return SettingsView;
});
