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
      _.bindAll(this, 'render', 'save', 'showEditor');

      this.survey = options.survey;
      this.forms = options.forms;

      this.render();
    },
    
    save: function(event) {
      event.preventDefault();

      // Get the fields from the form
      var form = $(event.target).parent().serializeArray();

      // Transform them so that we can save them
      var fields = _.reduce(form, function(memo, field) {
        memo[field.name] = field.value;
        return memo;
      }, {});

      console.log(fields);
      this.survey.set(fields);
      this.survey.save();
    },

    render: function() {
      var context = {
        survey: this.survey.toJSON({namespace: false}),
        forms: this.forms.toJSON()
      };

      this.$el.html(_.template($('#settings-view').html(), context));

      api.getForm(this.showEditor);

    }
  });

  return SettingsView;
});