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
  'views/builder'
],

function($, _, Backbone, settings, api, DesignViews, BuilderViews) {
  'use strict'; 

  var FormViews = {};

  FormViews.FormView = Backbone.View.extend({
    
    elId: "#form-view-container",

    initialize: function(options) {
      _.bindAll(this, 'render', 'showDesigner', 'showBuilder');
      console.log("Initializing forms view");
      this.survey = options.survey;
      this.forms = options.forms;
      // console.log(this.survey);
      // console.log(this.forms);
    },
    
    showDesigner: function() {
      $("#survey-design-container").empty();

      // If there isn't a form yet, let's show the survey creation view
      if (settings.formData === undefined) {

        $("#send-survey-container").hide();

        $('.button').hide();

        var designView = new DesignViews.DesignView({
          elId: "#survey-design-container",
          survey: this.survey
        });
        designView.render();

        designView.on("formAdded", this.render, this);

      }else {

        $("#send-survey-container").show(); // hacky!

        // Preview the form if there already is one.
        this.previewView = new FormViews.PreviewView({
          elId: "#preview-view-container",
          forms: [settings.formData]
        });  

      }    
    },

    showBuilder: function() {
      this.builderView = new BuilderViews.BuilderView({
        forms: this.forms
      });
      this.builderView.render();
    },
    
    render: function() {        
      var context = { 
        survey: this.survey.toJSON(),
        forms: this.forms.toJSON() 
      };    

      $(this.elId).html(_.template($('#form-view').html(), context));

      api.getForm(this.showDesigner);

      $(".edit-form-button").click(this.showBuilder);

    }
  });



  return FormViews;
});