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
  'views/forms',
  'views/design'
],

function($, _, Backbone, settings, api, PreviewView, DesignViews) {
  'use strict'; 

  var SettingsView = Backbone.View.extend({
    
    elId: "#settings-view-container",

    // TODO 
    // Save survey settings
    // events: {
    //   "form input[type='submit'] click": this.save
    // },

    initialize: function(options) {
      _.bindAll(this, 'render', 'save', 'showEditor', 'showSurveySetup');
      this.survey = options.survey;
      this.forms = options.forms;
      console.log(this.survey);
      console.log(this.forms);
    },
    
    // TODO
    save: function(event) {
      event.preventDefault();
      console.log("Submitting settings. Not yet implemented.");
      console.log(event);
    },

    showSurveySetup: function(event) {
      event.preventDefault();
      this.designView = new DesignViews.DesignView({
        elId: "#survey-design-container",
        survey: this.survey
      });  
      this.designView.render();
    },

    showEditor: function() {
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

      }else {

        $("#send-survey-container").show(); // hacky!

        // Preview the form if there already is one.
        this.previewView = new PreviewView({
          elId: "#preview-view-container",
          forms: [settings.formData]
        });  

      }    
    },
    
    render: function() {        
      var context = { 
        survey: this.survey.toJSON(),
        forms: this.forms.toJSON() 
      };    

      $(this.elId).html(_.template($('#settings-view').html(), context));

      api.getForm(this.showEditor);

    }
  });

  return SettingsView;
});