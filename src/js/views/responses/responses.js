/*jslint nomen: true */
/*globals define: true */

define(function(require, exports, module) {
  'use strict';

  // Libs
  var $ = require('jquery');
  var _ = require('lib/lodash');
  var Backbone = require('backbone');
  var events = require('lib/tinypubsub');
  var moment = require('moment');
  
  var api = require('api');

  // Models
  var Responses = require('models/responses');

  // Views
  var ResponseCountView = require('views/surveys/count');
  var ResponseListView = require('views/responses/list');
  var FilterView = require('views/responses/filter');
  var MapView = require('views/map');
  var CollectorStatsView = require('views/surveys/stats-collector');

  // Templates
  var mapListTemplate = require('text!templates/responses/map-list.html');
  var embeddedResponseMapTemplate = require('text!templates/responses/embed-map-list.html');


  var ResponseViews = {};

  ResponseViews.MapAndListView = Backbone.View.extend({
    filters: {},
    firstRun: true,
    mapView: null,
    listView: null,
    responses: null,
    survey: null,
    mode: 'overview',

    template: _.template(mapListTemplate),

    el: '#response-view-container',

    events: {
      'click .action-show-filters': 'toggleFilters',
      'click .refresh': 'getNew',
      'click .address-search-button': 'search'
    },

    initialize: function(options) {
      _.bindAll(this,
        'render',
        'update',

        // Filtering
        'showFilters',
        'hideFilters',

        // Updating
        'getNew',
        'lastUpdated',

        'search',
        'mapClickHandler'
      );

      // XXX I don't think we need this
      this.responses = options.responses;

      this.forms = options.forms;
      this.forms.on('reset', this.updateFilterChoices, this);

      this.survey = options.survey;

      if (options.mode) {
        this.mode = options.mode;
      }

      this.render();
    },

    render: function() {
      console.log("Rendering response view");
      if (this.firstRun) {
        this.firstRun = false;
      } else {
        // If this is not the first time, then we need to remove the current
        // map and list views, since we'll create new ones.
        this.mapView.remove();
        this.mapView = null;
        this.listView.remove();
        this.listView = null;
      }

      // Actually render the page
      var context = {
        survey: this.survey.toJSON()
      };
      this.$el.html(this.template(context));

      // Show collector stats
      this.collectorStatsView = new CollectorStatsView({
        survey: this.survey
      });

      // Set up the map view, now that the root exists.
      if (this.mapView === null) {
        this.mapView = new MapView({
          el: $('#map-view-container'),
          survey: this.survey,
          clickHandler: this.mapClickHandler
        });
      }

      // Render the map
      this.mapView.render();

      this.filterView = new FilterView({
        el: $('#filter-view-container'),
        survey: this.survey,
        forms: this.forms,
        map: this.mapView
      }).render();

      // Listen for a change in map view size
      this.$el.on('transitionend', function(event) {
        this.mapView.map.invalidateSize();
      }.bind(this));

      if (this.mode === 'deep-dive') {
        // Deep dive
        this.showFilters();
      } else {
        // Overview
        this.hideFilters();
      }
    },

    /**
     * Search for an address
     */
    search: function(event) {
      event.preventDefault();
      var address = this.$('#address-search').val();
      var location = this.survey.get('location');
      var $error = this.$('#map-tools .error');
      var mapView = this.mapView;
      api.codeAddress(address, location, function (error, results) {
        if (error) {
          $error.html(error.message);
        } else {
          $error.html('');
        }
        
        mapView.goToLatLng(results.coords);
      });
    },

    selectItem: function (objectId) {
      // FIXME: If this gets called because of a direct navigation to a
      // surveys/:slug/dive/:oid URL, then there was never a click on the
      // map, and so the object in question hasn't been highlighted on the map.
      var rc = new Responses.Collection({
        surveyId: this.survey.get('id'),
        objectId: objectId
      });

      var surveyOptions = this.survey.get('surveyOptions') || {};
      this.selectedItemListView = new ResponseListView({
        el: '#responses-list',
        collection: rc,
        labels: this.forms.getQuestions(),
        forms: this.forms,
        surveyOptions: surveyOptions
      });

      this.selectedItemListView.on('remove', function() {
        this.mapView.deselectObject();
        events.publish('navigate', [
          'surveys/' + this.survey.get('slug') + '/dive',
          { trigger: false }
        ]);
      }.bind(this));

      rc.on('destroy', function() {
        this.mapView.update();
      }.bind(this));
    },

    mapClickHandler: function (event) {
      var objectId;

      if (event.data) {
        objectId = event.data.object_id;
      }
      
      if (this.mode === 'overview') {
        if (objectId) {  
          events.publish('navigate', ['surveys/' + this.survey.get('slug') + '/dive/' + objectId]);
        } else {
          events.publish('navigate', ['surveys/' + this.survey.get('slug') + '/dive']);
        }
      } else if (objectId) {
        // Update the URL
        events.publish('navigate', [
          'surveys/' + this.survey.get('slug') + '/dive/' + objectId,
          { trigger: false }
        ]);
        this.selectItem(objectId);
      }
    },

    update: function() {
      if (this.firstRun) {
        // FIXME: Do we ever end up here?
        this.render();
      }
    },

    showFilters: function() {
      this.mode = 'deep-dive';
      // Show the deep dive controls.
      $('.control-pane').show();
      //$('#filter-view-container').show();

      // Hide the overview controls and expand the map.
      $('#overview-container').hide();
      $('#map-view-container').removeClass('b');
      //this.$('.map-list-view').addClass('gutter');

      // Set up the response count view.
      this.countView = new ResponseCountView({
        el: '#deep-dive-count-container',
        model: this.survey,
        small: true
      }).render();

      this.mapView.map.invalidateSize();
    },

    hideFilters: function() {
      this.mode = 'overview';
      this.update();

      // Hide the deep dive controls.
      $('.control-pane').hide();
      $('#filter-view-container').hide();
      if (this.selectedItemListView) {
        this.selectedItemListView.remove();
        this.selectedItemListView = null;
      }

      // Show the overview controls and restrict the map to the right-hand column.sldfjlsdkjfldkf sfdlkj slfdj 
      $('#overview-container').show();
      $('#map-view-container').addClass('b');

      // Set up the response count view.
      this.overviewCountView = new ResponseCountView({
        el: '#overview-count-container',
        model: this.survey
      }).render();

      this.mapView.map.invalidateSize();
    },

    toggleFilters: function () {
      // Render the filter
      this.$('.filters').toggle();
    },


    remove: function () {
      this.$el.remove();
      this.stopListening();
      this.responses.off('reset', this.render, this);
      this.responses.off('add', this.update, this);
      this.responses.off('addSet', this.update, this);
      if (this.mapView) {
        this.mapView.remove();
      }
      if (this.listView) {
        this.listView.remove();
      }
      return this;
    },

    /**
     * Get new responses
     */
    getNew: function(event) {
      console.log("Getting new responses");
      event.preventDefault();
      var $checking = $('.checking');
      $checking.fadeIn(250);
      this.mapView.update();

      this.survey.fetch().always(function () {
        $checking.fadeOut(500);
      });
    },

    /**
     * Show the time of the last response collection update
     */
    lastUpdated: function () {
      if(this.responses.lastUpdate !== undefined) {
        var time = moment(this.responses.lastUpdate).format("Do h:mma");
        $('#last-updated').html('Last updated: ' + time);
      }
    }

  });

  /*
   * Map-oriented view for embedded pages.
   */
  ResponseViews.EmbeddedResponseMapView = Backbone.View.extend({
    filters: {},
    firstRun: true,
    mapView: null,
    listView: null,
    responses: null,
    survey: null,

    template: _.template(embeddedResponseMapTemplate),

    el: '#response-view-container',

    events: {
      'click .action-show-filters': 'toggleFilters',
      'click .address-search-button': 'search'
    },

    initialize: function(options) {
      _.bindAll(this,
        'toggleFilters',
        'mapClickHandler',
        'search'
      );

      this.responses = options.responses;

      this.forms = options.forms;
      this.forms.on('reset', this.updateFilterChoices, this);

      this.survey = options.survey;

      this.showFilter = options.showFilter;

      this.render();
    },

    render: function () {
      // Actually render the page
      var context = {
        survey: this.survey.toJSON()
      };
      this.$el.html(this.template(context));

      // XXX
      //// Show collector stats
      //this.collectorStatsView = new CollectorStatsView({
      //  survey: this.survey
      //});

      // Set up the map view, now that the root exists.
      if (this.mapView === null) {
        this.mapView = new MapView({
          el: $('#map-view-container'),
          survey: this.survey,
          clickHandler: this.mapClickHandler
        });
      }

      // Render the map
      this.mapView.render();

      this.filterView = new FilterView({
        el: $('#filter-view-container'),
        collection: this.responses,
        survey: this.survey,
        forms: this.forms,
        map: this.mapView
      }).render();

      // Set up the response count view.
      this.countView = new ResponseCountView({
        el: '#response-count-container',
        model: this.survey
      }).render();

      $('.factoid').addClass('small-factoid');
      this.$el.addClass('bigb');
    },
    
    search: function(event) {
      event.preventDefault();
      var address = this.$('#address-search').val();
      var location = this.survey.get('location');
      var $error = this.$('#map-tools .error');
      var mapView = this.mapView;
      api.codeAddress(address, location, function (error, results) {
        if (error) {
          $error.html(error.message);
        } else {
          $error.html('');
        }
        
        mapView.goToLatLng(results.coords);
      });
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
      // FIXME: respect the actual configured options
      surveyOptions.comments = true;
      var selectedItemListView = new ResponseListView({
        el: '#responses-list',
        collection: rc,
        labels: this.forms.getQuestions(),
        surveyOptions: surveyOptions,
        surveyId: this.survey.get('id'),
        objectId: event.data.object_id
      });

      selectedItemListView.on('remove', function () {
        this.mapView.deselectObject();
      }.bind(this));

      rc.on('destroy', function () {
        this.mapView.update();
      }.bind(this));
    },

    toggleFilters: function () {
      // Render the filter
      $('.filters').toggle();
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


  return ResponseViews;

});
