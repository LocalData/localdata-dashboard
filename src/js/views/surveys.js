/*jslint nomen: true */
/*globals define: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',
  'lib/leaflet/leaflet.google',
  'lib/tinypubsub',
  'lib/async',

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
  'views/responses/responses',
  'views/forms',
  'views/maps/map',

  // Templates
  'text!templates/surveys/item.html',
  'text!templates/surveys/list-item.html',

  // Misc
  'misc/exampleform'

],

function(
  $,
  _,
  Backbone,
  L,
  events,
  async,

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
  MapView,

  // Templates
  surveyTemplate,
  surveyListItemTemplate,

  // Misc
  exampleForm
){
  'use strict';

  var SurveyViews = {};

  function downgrade(f) {
    return function g(data) {
      return f(null, data);
    };
  }

  SurveyViews.ListItemView = Backbone.View.extend({
    template: _.template(surveyListItemTemplate),

    initialize: function() {
      _.bindAll(this, 'render', 'map');
      this.model.bind('change', this.render);
    },

    render: function() {
      this.$el.html(this.template({
        survey: this.model.toJSON()
      }));
      return this;
    },

    map: function() {
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

        // Submit the details as a new survey.
        api.createSurvey(survey, function(survey) {
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
    bodyView: null,
    firstRun: true,
    survey: null,
    template: _.template(surveyTemplate),

    initialize: function(options) {
      _.bindAll(this,
        'update',
        'render',
        'show',
        'showResponses',
        'showForm',
        'showSettings',
        'showFilters'
      );

      // Set up the page and show the given survey
      this.surveyId = options.id;
      this.survey = new SurveyModels.Model({id: this.surveyId});

      // Get the relevant responses
      this.responses = new ResponseModels.Collection([], {surveyId: this.surveyId});

      // Get the forms
      this.forms = new FormModels.Collection({surveyId: this.surveyId});

      // Don't render the page until we have the survey and the forms, both of
      // which are necessary for the content within a SurveyView.
      var self = this;
      async.parallel([
        function (next) {
          self.survey.once('change', downgrade(next));
        },
        function (next) {
          self.forms.once('reset', downgrade(next));
        }
      ], function (error) {
        self.render();
      });
    },

    update: function () {
      // return this.render();
    },

    render: function (model) {
      var $el = $(this.el);
      console.log("Rendering survey view");
      // if (!this.firstRun) {
      //   return;
      // }
      // this.firstRun = false;

      // Remove old sub-views
      if (this.mapAndListView !== undefined) {
        this.mapAndListView.remove();
      }

      $el.html(this.template({
        survey: this.survey.toJSON()
      }));

      // List the responses
      this.mapAndListView = new ResponseViews.MapAndListView({
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
        //this.show.apply(this.activeTab);
        this.show(this.activeTab[0], this.activeTab[1]);
      }
    },

    show: function(id, tab) {
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
      this.show('#form-view-container', '#tab-survey-form');
    },

    showSettings: function() {
      this.show('#settings-view-container', 3);
    },

    showFilters: function() {
      this.show('#response-view-container', '#tab-survey-filters');
    }
  });

  return SurveyViews;

}); // End SurveyViews
