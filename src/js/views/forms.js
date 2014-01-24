/*jslint nomen: true */
/*globals define: true, window: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',

  // LocalData
  'settings',
  'api',

  // Templates
  'text!templates/surveys/form.html',

  // Views
  'views/design',
  'views/builder',
  'views/preview'
],

function($, _, Backbone, settings, api, template, DesignViews, BuilderViews, PreviewView) {
  'use strict';

  var FormViews = {};

  FormViews.FormView = Backbone.View.extend({
    template: _.template(template),

    el: '#form-view-container',

    initialize: function(options) {
      _.bindAll(this, 'render', 'showDesigner', 'showBuilder');
      console.log('Initializing forms view');

      this.survey = options.survey;
      this.forms = options.forms;

      this.survey.on('change', this.render, this);
    },

    showDesigner: function() {
      // $('#survey-design-container').empty();

      // If there isn't a form yet, let's show the survey creation view

        $('#survey-form-tools-container').hide();

        $('.button').hide();

        var designView = new DesignViews.DesignView({
          el: '#survey-design-container',
          model: this.survey
        });
        designView.render();

        designView.on('formAdded', this.render, this);
    },

    showBuilder: function() {
      // Hide the toolbar when in editing mode.
      // Maybe we'll want to animate this?
      $('#survey-form-tools-container').hide();

      this.builderView = new BuilderViews.BuilderView({
        forms: this.forms
      });
      this.builderView.render();

      this.builderView.on('formUpdated', function() {
        console.log('Builder: Telling preview to update...');
        console.log(this.previewView);
        this.previewView.render();
      }, this);

      this.listenTo(this.builderView, 'done', function () {
        $(this.builderView.el).html('');
        $('#survey-form-tools-container').show();
        this.builderView.stopListening();
        this.builderView = null;
      });
    },

    render: function() {
      var context = {
        survey: this.survey.toJSON(),
        forms: this.forms.toJSON(),
        mobile: 'http://' + window.location.host + '/mobile/#' + this.survey.get('slug')
      };

      this.$el.html(this.template(context));

      this.showDesigner();

      // old: Make sure we have up-to-date form data before showing the design view
      api.getForm(function() {
        if (settings.formData === undefined) {
          // this.showDesigner();
        }else {
          // this.showBuilder();
        }
      }.bind(this));

    }
  });

  return FormViews;
});
