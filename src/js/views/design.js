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
  'models/surveys',
  'models/forms',

  // Views
  'views/preview',

  // Templates
  'text!templates/surveys/design.html',
  'text!templates/surveys/design-copy-survey.html',

  // Misc
  'misc/exampleform',
  'misc/blankform'
],

function($, _, Backbone, events, settings, api, SurveyModels, FormModels, PreviewView,
    designTemplate, copySurveyTemplate, exampleForm, blankForm) {
  'use strict';

  var DesignViews = {};

  DesignViews.DesignView = Backbone.View.extend({
    template: _.template(designTemplate),
    copySurveyTemplate: _.template(copySurveyTemplate),

    events: {
      'click .preview': 'preview',
      'click .use-survey': 'useSurvey',
      'click .use-blank-survey': 'useBlankSurvey',
      'click .copy-form': 'copyForm'
    },

    initialize: function(options) {
      _.bindAll(this,
        'update',
        'render',
        'useSurvey',
        'useBlankSurvey',
        'copyForm',
        'saveFormToSurvey',
        'showSurveys',
        'preview'
      );

      this.surveys = new SurveyModels.Collection();
      this.surveys.bind('reset', this.showSurveys);
      this.surveys.fetch({
        reset: true
      });

      this.el = options.el;
      this.$el = $(options.el);

      this.model.on('change', this.render, this);
    },

    update: function() {
      console.log("Update design view called, but not operational");
      // this.render();
    },

    // List surveys the user owns
    showSurveys: function(event) {
      var context = {
        surveys: this.surveys.toJSON()
      };
      this.$el.find('.copy-survey').html(this.copySurveyTemplate(context));
    },

    // Start copying a form from an existing survey
    copyForm: function(event) {
      event.preventDefault();
      var $target = $(event.target);
      var $select = $target.parent().find('select');
      var surveyId = $select.val();
      this.getForm(surveyId);

      // Mark the button disabled so users know we're waiting
      $target.attr('disabled', 'disabled');
      $target.addClass('disabled');
    },

    // Get the forms of an existing survey
    getForm: function(surveyId) {
      var form = new FormModels.Collection({
        surveyId: surveyId
      });
      form.on('reset', this.saveFormToSurvey);
    },

    // Save an existing survey form to this new survey
    saveFormToSurvey: function(formCollection) {
      var formToSave = formCollection.toJSON()[0];
      delete formToSave.created;
      delete formToSave.id;
      api.createForm(formToSave, $.proxy(function() {
        this.trigger('formAdded');
      },this));
    },

    useSurvey: function(event) {
      console.log("Using the survey");
      api.createForm(exampleForm, $.proxy(function() {
        this.trigger('formAdded');
      },this));
    },

    useBlankSurvey: function(event) {
      console.log("Using the survey");
      api.createForm(blankForm, $.proxy(function() {
        this.trigger('formAdded');
      },this));
    },

    render: function() {
      console.log("Rendering design view");
      $("#preview-view-container").empty();

      // Set the context & render the page
      var context = {
        'survey': this.model.toJSON()
      };
      this.$el.html(this.template(context));
    },

    preview: function(event) {
      console.log("Survey preview clicked");
      event.preventDefault();

      this.previewView = new PreviewView({
        el: '#preview-view-container',
        popup: true,
        forms: [exampleForm]
      });
    }

  });

  return DesignViews;
});
