/*jslint nomen: true */
/*globals define, location: true */

define(function(require, exports, module) {
  'use strict';

  // Libs
  var $ = require('jquery');
  var _ = require('lib/lodash');
  var Backbone = require('backbone');
  var L = require('lib/leaflet/leaflet');
  var async = require('lib/async');

  // LocalData
  var settings = require('settings');
  var api = require('api');

  // Models
  var SurveyModels = require('models/surveys');
  var ResponseModels = require('models/responses');
  var FormModels = require('models/forms');

  // Views
  var ExportView = require('views/export');
  var SettingsView = require('views/settings');
  var ResponseViews = require('views/responses/responses');
  var ReviewView = require('views/responses/review');
  var FormViews = require('views/forms');
  var MapView = require('views/maps/map');

  // Templates
  var newSurveyTemplate = require('text!templates/surveys/new.html');
  var surveyTemplate = require('text!templates/surveys/item.html');
  var surveyListItemTemplate = require('text!templates/surveys/list-item.html');

  // Misc
  var exampleform = require('misc/exampleform');


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
      if (this.tileLayer) {
        this.map.removeLayer(this.tileLayer);
      }
      this.tileLayer = new L.TileJSON.createTileLayer(tilejson);

      this.map.addLayer(this.tileLayer);
      this.tileLayer.bringToFront();
    },

    render: function() {

      this.$el.html(this.template({
        survey: this.model.toJSON(),
        count: this.model.getCount()
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
      if(this.model.get('render')) {
        var url = '/tiles/' + this.model.get('id');
        url = url + '/tile.json';
        // Get TileJSON
        $.ajax({
          url: url,
          type: 'GET',
          dataType: 'json'
        }).done(this.addTileLayer)
        .fail(function(error) {console.log(error);});
      }

      // Fix over-zoom from fitBounds
      if (map.getZoom() > baseLayer.options.maxZoom) {
        map.setZoom(18);
      }
      return this;
    }
  });

  SurveyViews.NewSurveyView = Backbone.View.extend({
    template: _.template(newSurveyTemplate),

    el: '#container',

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
      if (geoObjectSource) {
        survey.geoObjectSource = $.parseJSON(geoObjectSource);
      } else {
        survey.geoObjectSource = {
          type: 'LocalData',
          source: '/api/features?type=parcels&bbox={{bbox}}'
        };
      }

      // Custom survey type
      // (Right now, only "point" is a real option)
      var type = $("input[name=type]:checked").val();
      if(type) {
        survey.type = type;
      }

      // Submit the details as a new survey.
      api.createSurvey(survey, function(error, survey) {
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
    el: '#container',

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
      // Remove old sub-views
      if (this.mapAndListView !== undefined) {
        this.mapAndListView.remove();
      }

      this.$el.html(this.template({
        survey: this.survey.toJSON()
      }));

      // Form view
      this.formView = new FormViews.FormView({
        survey: this.survey,
        forms: this.forms
      });

      var surveyFullyCreated = (this.forms &&
                                this.forms.models &&
                                this.forms.models.length > 0);

      if (surveyFullyCreated) {
        // Map the responses
        var mode = 'overview';
        if (this.filters) {
          mode = 'deep-dive';
        }
        this.mapAndListView = new ResponseViews.MapAndListView({
          // responses: this.responses,
          forms: this.forms,
          survey: this.survey,
          mode: mode
        });

        if (this.selectedObject) {
          this.mapAndListView.selectItem(this.selectedObject);
        }

        // Review view
        this.reviewView = new ReviewView({
          survey: this.survey,
          forms: this.forms
        });
      } else {
        // Once the form has been created, we should rerender, so we can display all of the other components.
        this.listenToOnce(this.forms, 'add', function () {
          this.render();
        });
      }

      // Export, Settings views
      this.exportView = new ExportView({survey: this.survey });
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

      // Hide some of the tabs if the user isn't logged in
      if(!settings.user.isLoggedIn()) {
        $('#tab-survey-form').hide();
        $('#tab-survey-export').hide();
        $('#tab-survey-settings').hide();
        $('#tab-survey-app').hide();
      }

      if (!surveyFullyCreated) {
        location.href = '/#surveys/' + settings.slug + '/form';
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
      if (this.mapAndListView) {
        this.mapAndListView.hideFilters();
      }
    },

    showExport: function() {
      this.show('#export-view-container', '#tab-survey-export');
    },

    showForm: function() {
      this.show('#form-view-container', '#tab-survey-form');
    },

    showReview: function() {
      this.show('#review-view-container', '#tab-survey-live');
    },

    showSettings: function() {
        this.show('#settings-view-container', '#tab-survey-settings');
    },

    showFilters: function (options) {
      this.show('#response-view-container', '#tab-survey-filters');
      this.filters = true;
      if (this.mapAndListView) {
        this.mapAndListView.showFilters();
        this.mapAndListView.selectItem(options.objectId);
      } else {
        this.selectedObject = options.objectId;
      }
    }
  });

  return SurveyViews;

}); // End SurveyViews
