/*jslint nomen: true */
/*globals define: true */

define(function(require, exports, module) {
  'use strict';

  // Libs
  var $ = require('jquery');
  var _ = require('lib/lodash');
  var Backbone = require('backbone');
  var moment = require('moment');

  // Models
  var Responses = require('models/responses');

  // Views
  var ResponseCountView = require('views/surveys/count');
  var ResponseListView = require('views/responses/list');
  var FilterView = require('views/responses/filter');
  var MapView = require('views/maps/multi-map');
  var CollectorStatsView = require('views/surveys/stats-collector');

  var SurveyView = require('views/surveys/survey');

  // Templates
  var embeddedSurveyTemplate = require('text!templates/responses/embed-multi.html');


  /*
   * Map-oriented view for embedded pages.
   */
  var MultiSurveyView = Backbone.View.extend({
    filters: {},
    firstRun: true,
    mapView: null,
    listView: null,
    responses: null,

    surveyIds: ['06a311f0-4b1a-11e3-aca4-1bb74719513f', '44f94b00-4005-11e4-b627-69499f28b4e5'],
    activeLayers: {},

    template: _.template(embeddedSurveyTemplate),

    el: '#container',

    events: {
      'click .action-show-filters': 'toggleFilters'
    },

    initialize: function(options) {
      _.bindAll(this,
        'mapClickHandler'
      );

      this.render();
    },

    render: function () {
      // Actually render the page
      var context = {
        //survey: this.survey.toJSON()
      };
      this.$el.html(this.template(context));

      // Set up the map view, now that the root exists.
      if (this.mapView === null) {
        console.log("Creating map view map-view-container", $('#map-view-container'));
        this.mapView = new MapView({
          $el: $('#map-view-container'),
          clickHandler: this.mapClickHandler
        });
      }

      // Render the map
      this.mapView.render();

      _.each(this.surveyIds, function(surveyId) {
        // Create a model
        var surveyLayer = new SurveyView({
          map: this.mapView.map,
          layerId: surveyId
        });


        // Add the survey to the list
        this.$el.find('.layers').append(surveyLayer.render());

        // Save it to activeLayers for future reference.
        this.activeLayers[surveyId] = surveyLayer;
      }.bind(this));
    },

    mapClickHandler: function (event) {
      if (!event.data || !event.data.object_id) {
        return;
      }

      var rc = new Responses.Collection({
        surveyId: this.survey.get('id'),
        objectId: event.data.object_id
      });

      var surveyOptions = this.survey.get('surveyOptions') || {};
      var selectedItemListView = new ResponseListView({
        el: '#responses-list-container',
        collection: rc,
        labels: this.forms.getQuestions(),
        surveyOptions: surveyOptions
      });

      selectedItemListView.on('remove', function () {
        this.mapView.deselectObject();
      }.bind(this));

      rc.on('destroy', function () {
        this.mapView.update();
      }.bind(this));
    },

    remove: function () {
      this.$el.remove();
      this.stopListening();

      // XXX
      this.responses.off('reset', this.render, this);
      this.responses.off('add', this.update, this);
      this.responses.off('addSet', this.update, this);

      if (this.mapView) {
        this.mapView.remove();
        this.mapView = null;
      }

      if (this.listView) {
        this.listView.remove();
        this.listView = null;
      }

      return this;
    }
  });

  return MultiSurveyView;

});
