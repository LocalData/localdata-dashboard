/*jslint nomen: true */
/*globals define: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',

  // LocalData
  'settings',
  'api'
],

function($, _, Backbone, settings, api) {
  'use strict';

  var SettingsView = Backbone.View.extend({
    
    el: '#settings-view-container',

    events: {
      'click .save': 'save'
    },

    initialize: function(options) {
      _.bindAll(this, 'render', 'save', 'success');

      this.survey = options.survey;
      this.forms = options.forms;

      this.survey.on('change', this.render);
    },

    success: function() {
      $(".saved").fadeIn().css("display","inline-block").delay(2000).fadeOut();
    },
    
    save: function(event) {
      event.preventDefault();

      // Get the fields from the form
      var form = $(event.target).parent().serializeArray();

      // Convert the fields into a format that can be saved
      var fields = _.reduce(form, function(memo, field) {
        memo[field.name] = field.value;
        return memo;
      }, {});

      this.survey.set(fields);
      this.survey.save({}, {
        success: this.success
      });
    },

    render: function() {

      console.log(this.survey);

      var context = {
        survey: this.survey.toJSON(),
        forms: this.forms.toJSON()
      };

      this.$el.html(_.template($('#settings-view').html(), context));
    }
  });

  return SettingsView;
});