/*jslint nomen: true */
/*globals define: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',

  // LocalData
  'settings',
  'api',

  // Views
  'views/design',
  'views/builder',
  'views/preview'
],

function($, _, Backbone, settings, api, DesignViews, BuilderViews, PreviewView) {
  'use strict';

  var FormViews = {};

  FormViews.FormView = Backbone.View.extend({
    
    el: '#form-view-container',

    initialize: function(options) {
      _.bindAll(this, 'render', 'showDesigner', 'showBuilder');
      console.log('Initializing forms view');
      this.el = options.el || '#form-view-container';

      this.survey = options.survey;
      this.forms = options.forms;
    },
    
    showDesigner: function() {
      $('#survey-design-container').empty();

      // If there isn't a form yet, let's show the survey creation view
      if (settings.formData === undefined) {

        $('#survey-form-tools-container').hide();

        $('.button').hide();

        var designView = new DesignViews.DesignView({
          el: '#survey-design-container',
          survey: this.survey
        });
        designView.render();

        designView.on('formAdded', this.render, this);

      }else {
        $('#survey-form-tools-container').show(); // hacky!

        // Preview the form if there already is one.
        this.previewView = new PreviewView({
          el: '#preview-view-container',
          forms: [settings.formData]
        });

      }
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
        this.builderView = null;
      });
      // this.builderView.on('done', function() {
      //
      //   delete this.builderView;
      // }, this);

    },
    
    render: function() {
      var context = {
        survey: this.survey.toJSON(),
        forms: this.forms.toJSON()
      };
      this.$el.html(_.template($('#form-view').html(), context));

      // old: Make sure we have up-to-date form data before showing the design view
      api.getForm(this.showDesigner);

      // Show the editor
      $('.edit-form-button').click(this.showBuilder);
    }
  });

  return FormViews;
});