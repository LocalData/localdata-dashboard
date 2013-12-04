/*jslint nomen: true */
/*globals define: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',
  'lib/leaflet/leaflet',
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
  'text!templates/surveys/new.html',
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
  newSurveyTemplate,
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

  function flip(a) {
    return [a[1], a[0]];
  }

  SurveyViews.ListItemView = Backbone.View.extend({
    template: _.template(surveyListItemTemplate),

    initialize: function() {
      _.bindAll(this, 'render', 'addTileLayer');
      this.model.bind('change', this.render);
    },

    addTileLayer: function(tilejson) {
      if (this.tileLayer) this.map.removeLayer(this.tileLayer);
      this.tileLayer = new L.TileJSON.createTileLayer(tilejson);

      // Listen to see if we're loading the map
      // this.tileLayer.on('loading', this.loading);
      // this.tileLayer.on('load', this.done);

      this.map.addLayer(this.tileLayer);
      this.tileLayer.bringToFront();
    },

    render: function() {
      this.$el.html(this.template({
        survey: this.model.toJSON()
      }));

      var map = this.map = L.map(this.$('.map')[0], {
        zoom: 15,
        center: [37.77585785035733, -122.41362811351655],
        scrollWheelZoom: false,
        zoomControl: false,
        attributionControl: false
      });

      // Center the map
      var bounds = this.model.get('responseBounds');
      if (bounds) {
        bounds = [flip(bounds[0]), flip(bounds[1])];
        if (bounds[0][0] === bounds[1][0] || bounds[0][1] === bounds[1][1]) {
          map.setView(bounds[0], 15);
        } else {
          map.fitBounds(bounds);
        }
      }

      // Add our baselayer
      var baseLayer = L.tileLayer(settings.baseLayer);
      map.addLayer(baseLayer);

      // Add the survey data
      var url = '/tiles/' + this.model.get('id');
      url = url + '/tile.json';
      // Get TileJSON
      $.ajax({
        url: url,
        type: 'GET',
        dataType: 'json'
      }).done(this.addTileLayer);

      // Fix over-zoom from fitBounds
      if (map.getZoom() > baseLayer.options.maxZoom) {
        map.setZoom(18);
      }
      return this;
    }
  });

  SurveyViews.NewSurveyView = Backbone.View.extend({
    template: _.template(newSurveyTemplate),

    el: $("#container"),

    events: {
      'submit #new-survey-form': 'submit'
    },

    initialize: function(options) {
    },

    update: function() {
      this.render();
    },

    render: function() {
      // Set the context & render the page
      var context = {};
      this.$el.html(this.template(context));

      $('#new-survey-form .show-advanced').click(function() {
        $('#new-survey-form .advanced').show();
      });
    },

    submit: function(event) {
      event.preventDefault();

      // Hide the submit button so it doesn't get over-clicked
      $("#new-survey-form .submit").hide();
      $("#new-survey-form .error").hide();

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
      api.createSurvey(survey, function(error, survey) {
        // LD.router._router.navigate("surveys/" + survey.slug, {trigger: true});
        if(error) {
          $("#new-survey-form .submit").fadeIn();
          $("#new-survey-form .error").fadeIn();
          return;
        }

        // TODO -- use the router
        location.href = "/#surveys/" + survey.slug + "/form";
      });
    }
  });


  SurveyViews.SurveyView = Backbone.View.extend({
    el: $("#container"),

    activeTab: undefined,
    filters: false,
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
      // this.responses = new ResponseModels.Collection([], {surveyId: this.surveyId});

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

      // Remove old sub-views
      if (this.mapAndListView !== undefined) {
        this.mapAndListView.remove();
      }

      $el.html(this.template({
        survey: this.survey.toJSON()
      }));

      // Map the responses
      this.mapAndListView = new ResponseViews.MapAndListView({
        // responses: this.responses,
        forms: this.forms,
        survey: this.survey
      });

      if(this.filters) {
        this.mapAndListView.showFilters();
      }

      // Form view
      this.formView = new FormViews.FormView({
        survey: this.survey,
        forms: this.forms
      });

      // Export, Settings views
      this.exportView = new ExportView({surveyId: this.surveyId});
      this.settingsView = new SettingsView({
        survey: this.survey,
        forms: this.forms
      });

      this.exportView.render();
      this.formView.render();
      this.settingsView.render();

      if(this.activeTab !== undefined) {
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
      this.filters = false;
      if (this.mapAndListView) this.mapAndListView.hideFilters();
    },

    showExport: function() {
      this.show('#export-view-container', '#tab-survey-export');
    },

    showForm: function() {
      this.show('#form-view-container', '#tab-survey-form');
    },

    showSettings: function() {
        this.show('#settings-view-container', '#tab-survey-settings');
    },

    showFilters: function() {
      this.show('#response-view-container', '#tab-survey-filters');
      this.filters = true;
      if (this.mapAndListView) this.mapAndListView.showFilters();
    }
  });

  return SurveyViews;

}); // End SurveyViews
