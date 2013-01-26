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
  'models/responses',
  'models/forms',

  // Views
  'views/nav',
  'views/export',
  'views/settings',
  'views/responses',
  'views/forms',

  // Misc
  'misc/exampleform'

],

function(
  $, 
  _, 
  Backbone, 
  events, 

  // LocalData
  settings, 
  api, 

  // Models
  SurveyModels, 
  ResponseModels, 
  FormModels, 

  // Views
  NavView, 
  ExportView, 
  SettingsView, 
  ResponseViews, 
  FormViews, 

  // Misc
  exampleForm 
){
  'use strict'; 

  var SurveyViews = {};


  SurveyViews.ListItemView = Backbone.View.extend({
    initialize: function() {
      _.bindAll(this, 'render');
      this.model.bind('change', this.render);
    },

    render: function() {
      this.$el.html(_.template($('#survey-list-item-view').html(), {survey: this.model }));  
      return this;
    }
  });


  SurveyViews.NewSurveyView = Backbone.View.extend({
    el: $("#container"),

    initialize: function(options) {
      console.log("Init new survey view");
    },

    update: function() {
      this.render();
    },

    render: function() {
      console.log("Rendering new survey view");

      // Set the context & render the page
      var context = {};
      this.$el.html(_.template($('#new-survey-view').html(), context));

      $('#new-survey-form .show-advanced').click(function() {
        $('#new-survey-form .advanced').show();
      });

      // TODO: This should be unnecessary.
      $("#new-survey-form .submit").click(function(){
        $("#new-survey-form").submit();
      });

      // When the new survey form is submitted:
      $("#new-survey-form").submit(function(event){
        event.preventDefault();

        // Get the name and other basic details
        // TODO: this should probably be a new Survey model? 
        var survey = {
          "name": $("input.survey-name").val(),
          "location": $("input.survey-location").val()
        };

        // Get some of the optional parameters
        // Custom geoObjectSource
        var geoObjectSource = $(".survey-geoObjectSource").val();
        if(geoObjectSource) {
          survey.geoObjectSource = $.parseJSON(geoObjectSource);
        }

        // Custom survey type
        // (Right now, only "point" is a real option) 
        var type = $("input.survey-type").val();
        if(type) {
          survey.type = type;
        }

        console.log("Survey form submitted");
        console.log(survey);

        // Submit the details as a new survey.
        api.createSurvey(survey, function(survey) {
          console.log("Survey created");
          console.log(survey);

          // LD.router._router.navigate("surveys/" + survey.slug, {trigger: true});

          // TODO -- use the router
          location.href = "/#surveys/" + survey.slug + "/form";

        });
      });

    }

  });

  SurveyViews.SurveyView = Backbone.View.extend({
    el: $("#container"),
    
    toshow: ['', 0],
    survey: null,
    bodyView: null,
    
    initialize: function(options) {
      _.bindAll(this, 'update', 'render', 'show', 'showResponses', 'showUpload', 'showForm');

      // Set up the page and show the given survey
      this.surveyId = options.id;
      this.survey = new SurveyModels.Model({id: this.surveyId});
      this.survey.on('change', this.render, this);
      
      // Get the relevant responses    
      this.responses = new ResponseModels.Collection([], {surveyId: this.surveyId}); 

      // Get the forms
      this.forms = new FormModels.Collection({surveyId: this.surveyId});
    },

    update: function () {
      return this.render();
    },

    render: function (model) {
      console.log("Rendering survey view");

      if (model !== undefined) {
        if (!_.has(model.changedAttributes, 'id')) {
          // The survey has not changed, just attributes of the survey, like
          // the name.
          // TODO: use a separate template/view
          this.$('#survey-name').html(model.get('name'));
          return;
        }
      }

      // Remove old sub-views
      if (this.responseListView !== undefined) {
        this.responseListView.remove();
      }
      
      // Set the context & render the page
      var context = {
        'survey': this.survey.toJSON()
      };
      this.$el.html(_.template($('#survey-view').html(), context));
      
      // Show the loading state 
      events.publish('loading', [true]);

      // Render the sub components
      $('#form-view-container').hide();
      $('#export-view-container').hide();

      // List the responses
      this.responseListView = new ResponseViews.MapAndListView({
        el: $("#response-view-container"),
        responses: this.responses,
        forms: this.forms
      });

      // Form view
      this.formView = new FormViews.FormView({
        survey: this.survey,
        forms: this.forms
      });

      // Nav & Export views   
      this.navView = new NavView({slug: settings.slug});  
      this.exportView = new ExportView({surveyId: this.surveyId});  

      // Render navigation, export, and settings views
      this.navView.render();
      this.exportView.render(); 
      this.formView.render();

      // By default, we show the first tab
      this.show(this.toshow[0], this.toshow[1]);
    },
    
    show: function(id, tab) {
      // This is a really bad way to show the right tab
      this.toshow = [id, tab];

      $("#content > div").hide();
      $("#content #loading-view-container").show();
      $(id).show();
      this.navView.setActiveTab(tab);
    },
    
    showResponses: function() {
      this.show('#response-view-container', 0);
    },
    
    showExport: function() {
      this.show('#export-view-container', 1);
    },
    
    showForm: function() {
      this.show('#form-view-container', 2);
    },
        
    // Not yet implemented
    showUpload: function() {
      console.log("[not] Using upload view");
    },
    
    showScans: function() {
      console.log("[not] Using scans view");
    }
    
  });

  return SurveyViews;

}); // End SurveyViews 
