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
   * Multi-survey, embedded view.
   *
   * CONFIGURATION:
   *   - The list of surveys controls what gets displayed
   *     If there is no filter property, all responses will be shown.
   */
  var MultiSurveyView = Backbone.View.extend({
    activeLayers: [],
    mapView: null,

    title: 'Walkscope Survey',
    description: '<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>',

    surveys: [{
      surveyId: '44f94b00-4005-11e4-b627-69499f28b4e5',
      filter: {
        question: 'Is-the-property-maintained',
        answer: 'Yes',
        legend: 'Maintained properties',
        color: '#f15a24'
      }
    }, {
      surveyId: '44f94b00-4005-11e4-b627-69499f28b4e5',
      filter: {
        question: 'Is-there-dumping-on-the-property',
        answer: 'No',
        legend: 'No dumping',
        color: '#a743c3'
      }
    }],

    template: _.template(embeddedSurveyTemplate),
    el: '#container',

    events: {
      'click .action-show-filters': 'toggleFilters'
    },

    initialize: function(options) {
      _.bindAll(this,
        'mapClickHandler',
        'totalUp'
      );

      this.render();
    },

    totalUp: function() {
      var totaled = [];
      var total = 0;
      _.each(this.activeLayers, function(surveyView) {
        var id = surveyView.survey.get('id');

        // Don't double-count surveys
        if (_.contains(totaled, id)) {
          return;
        }

        total = total + surveyView.survey.get('responseCount') || 0;
        totaled.push(id);
      });

      this.$el.find('.response-count .count').html(total);
    },

    render: function () {
      // Actually render the page
      var context = {
        title: this.title,
        description: this.description
      };
      this.$el.html(this.template(context));

      // Set up the map view, now that the root exists.
      if (this.mapView === null) {
        console.log("Creating map view map-view-container", $('#map-view-container'));
        this.mapView = new MapView({
          $el: $('#map-view-container'),
          config: {
            center: [40.715678,-74.213848],
            zoom: 15
          },
          clickHandler: this.mapClickHandler
        });
      }

      // Render the map
      this.mapView.render();

      _.each(this.surveys, function(survey) {
        // Create a model
        var surveyLayer = new SurveyView({
          $el: this.$el.find('.layers'),
          map: this.mapView.map,
          layerId: survey.surveyId,
          filter: survey.filter
        });

        surveyLayer.survey.on('change', this.totalUp);


        // Add the survey to the list
        this.$el.find('.layers').append(surveyLayer.$el);

        // Save it to activeLayers for future reference.
        this.activeLayers.push(surveyLayer);
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
    }
  });

  return MultiSurveyView;

});
