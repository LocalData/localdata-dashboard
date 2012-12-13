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
  'views/subnav',
  'views/export',
  'views/settings',
  'views/responses',
  'views/forms',

  // Misc
  'misc/exampleform'

],

function($, _, Backbone, events, settings, api, SurveyModels, ResponseModels, FormModels, SubnavView, ExportView, SettingsView, ResponseViews, PreviewView, exampleForm) {
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

      // On submisision of the new survey form...
      $("#new-survey-form").submit(function(event){
        event.preventDefault();

        // Get the name and other details
        // TODO: this should probably be a new Survey model? 
        var survey = {
          "name": $("input.survey-name").val(),
          "location": $("input.survey-location").val()
        };

        console.log("Survey form submitted");
        console.log(survey);

        // Submit the details as a new survey.
        api.createSurvey(survey, function(survey) {
          console.log("Survey created");
          console.log(survey);

          // LD.router._router.navigate("surveys/" + survey.slug, {trigger: true});

          // TODO -- use the router
          location.href = "/#surveys/" + survey.slug;

        });
      });

    }

  });

  SurveyViews.DesignView = Backbone.View.extend({
    el: $("#container"),
    
    survey: null,
    
    initialize: function(options) {
      _.bindAll(this, 'update', 'render');
      console.log(options);
      // Set up the page and show the given survey
      this.surveyId = options.id;
      this.survey = new SurveyModels.Model({id: this.surveyId});
      this.survey.on('change', this.render, this);
    },

    update: function() {
      // console.log("Updating survey");
      // this.render();
    },

    render: function() {
      console.log("Rendering survey view");
      
      // Set the context & render the page
      var context = {
        'survey': this.survey.toJSON()
      };
      this.$el.html(_.template($('#new-survey-design').html(), context));

      $('.preview').click(function(event){
        console.log("Survey preview clicked");
        event.preventDefault();

        this.previewView = new PreviewView({
          el: "#preview-view-container",
          forms: [exampleForm]
        });  

      });

    },    
  });


  SurveyViews.SurveyView = Backbone.View.extend({
    el: $("#container"),
    
    toshow: ['', 0],
    survey: null,
    bodyView: null,
    
    initialize: function(options) {
      _.bindAll(this, 'update', 'render', 'show', 'showResponses', 'showUpload', 'showSettings');

      // Set up the page and show the given survey
      this.surveyId = options.id;
      this.survey = new SurveyModels.Model({id: this.surveyId});
      this.survey.on('change', this.render, this);
      
      // Get the relevant responses    
      this.responses = new ResponseModels.Collection([], {surveyId: this.surveyId}); 

      // Get the forms
      this.forms = new FormModels.Collection({surveyId: this.surveyId});
    },

    update: function() {
      //console.log("Updating survey");
      // this.render();
    },

    render: function() {
      console.log("Rendering survey view");
      
      // Set the context & render the page
      var context = {
        'survey': this.survey.toJSON()
      };
      this.$el.html(_.template($('#survey-view').html(), context));
      
      // Show the loading state 
      events.publish('loading', [true]);

      // Render the sub components
      $('#settings-view-container').hide();
      $('#export-view-container').hide();

      // List the responses
      this.responseListView = new ResponseViews.ListView({
        el: $("#response-view-container"),
        responses: this.responses,
        forms: this.forms
      });

      // Settings view
      this.settingsView = new SettingsView({
        survey: this.survey,
        forms: this.forms
      });

      // Subnav & Export views   
      this.subnavView = new SubnavView({slug: settings.slug});  
      this.exportView = new ExportView({surveyId: this.surveyId});  

      // Render subnav, export, and settings views
      this.subnavView.render();
      this.exportView.render(); 
      this.settingsView.render();

      // By default, we show the first tab
      this.show(this.toshow[0], this.toshow[1]);
    },
    
    show: function(id, tab) {
      // This is a really bad way to show the right tab
      this.toshow = [id, tab];

      $("#content > div").hide();
      $("#content #loading-view-container").show();
      $(id).show();
      this.subnavView.setActiveTab(tab);
    },
    
    showResponses: function() {
      this.show('#response-view-container', 0);
    },
    
    showExport: function() {
      this.show('#export-view-container', 1);
    },
    
    showSettings: function() {
      this.show('#settings-view-container', 2);
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
