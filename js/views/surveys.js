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

        // Hide the submit button so it doesn't get over-clicked
        $("#new-survey-form .submit").hide();

        // Get the name and other basic details
        // TODO: this should probably be a new Survey model?
        var survey = {
          "type": $('input[name=type]:checked', '#new-survey-form').val(),
          "name": $("#new-survey-form input.survey-name").val(),
          "location": $("#new-survey-form input.survey-location").val()
        };

        // Get some of the optional parameters
        // Custom geoObjectSource
        var geoObjectSource = $(".survey-geoObjectSource").val();
        if(geoObjectSource) {
          survey.geoObjectSource = $.parseJSON(geoObjectSource);
        }

        // Custom survey type
        // (Right now, only "point" is a real option)
        var type = $("input[name=type]:checked").val();
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

    activeTab: undefined,
    survey: null,
    bodyView: null,

    initialize: function(options) {
      _.bindAll(this, 'update', 'render', 'show', 'showResponses', 'showUpload', 'showForm', 'showSettings');

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
      // return this.render();
    },

    render: function (model) {
      console.log("Rendering survey view");

      // Remove old sub-views
      if (this.responseListView !== undefined) {
        this.responseListView.remove();
      }

      // Set the context & render the page
      console.log("SURVEY", this.survey.toJSON());
      var context = {
        survey: this.survey.toJSON()
      };
      this.$el.html(_.template($('#survey-view').html(), context));

      // List the responses
      this.responseListView = new ResponseViews.MapAndListView({
        el: $("#response-view-container"),
        responses: this.responses,
        forms: this.forms,
        survey: this.survey
      });

      // Form view
      this.formView = new FormViews.FormView({
        survey: this.survey,
        forms: this.forms
      });

      // Nav, Export, Settings views
      this.exportView = new ExportView({surveyId: this.surveyId});
      this.settingsView = new SettingsView({
        survey: this.survey,
        forms: this.forms
      });

      // Render navigation, export, and settings views
      this.exportView.render();
      this.formView.render();
      this.settingsView.render();

      if(this.activeTab !== undefined) {
        console.log("ACTIVE TAB", this.activeTab);
        //this.show.apply(this.activeTab);
        this.show(this.activeTab[0], this.activeTab[1]);
      }
    },

    show: function(id, tab) {
      console.log("SHOWING", id, tab);
      console.log(this.activeTab);
      // This is a really bad way to show the right tab
      this.activeTab = [id, tab];

      $("#survey-tabs .tab").hide();
      $(id).show();

      $('#nav li').removeClass('active');
      $(tab).addClass('active');
    },

    showResponses: function() {
      this.show('#response-view-container', '#tab-survey-home');
    },

    showExport: function() {
      this.show('#export-view-container', '#tab-survey-export');
    },

    showForm: function() {
      console.log("SHOW FORM-----");
      this.show('#form-view-container', '#tab-survey-form');
    },

    showSettings: function() {
      this.show('#settings-view-container', 3);
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
