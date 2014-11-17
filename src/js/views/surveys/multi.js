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

    surveyIds: [],

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

      _.each(this.surveyId, function(surveyId) {
        // Create a model

        // Listen for changes
      });



      /*
      XXX CREATE AND EDIT A SURVEY
      var self = this;
      // Dispatch the correct layers
      this.activeLayers[layerType] = new this.layers[layerType]({

        // Pass in the map and table views, so the layer can add itself
        map: this.mapView.map,
        tableView: this.tableView,

        // Set the specific layer to create
        layerId: layerId,

        // Optional click handler
        // TODO: not sure why we have this.
        clickHandler: function (data) {
          self.setupWideGraph(data);
        }
      });

      */

      // Append to the list of active layers
      // TODO: use a model
      this.$el.find('.layers').append(this.activeLayers[layerType].render());
      // Set up the response count view.
      // this.countView = new ResponseCountView({
      //   el: '#response-count-container',
      //   model: this.survey
      // }).render();
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
