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

  // Misc
  'misc/exampleform',
  'misc/blankform'
],

function($, _, Backbone, events, settings, api, SurveyModels, FormModels, PreviewView, designTemplate, exampleForm, blankForm) {
  'use strict';

  var DesignViews = {};

  DesignViews.DesignView = Backbone.View.extend({
    template: _.template(designTemplate),

    events: {
      'click .preview': 'preview',
      'click .use-survey': 'useSurvey',
      'click .use-blank-survey': 'useBlankSurvey'
    },

    initialize: function(options) {
      _.bindAll(this, 'update', 'render', 'useSurvey', 'useBlankSurvey', 'preview');

      this.el = options.el;
      this.$el = $(options.el);

      this.model.on('change', this.render, this);
    },

    update: function() {
      console.log("Update design view called, but not operational");
      // this.render();
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
