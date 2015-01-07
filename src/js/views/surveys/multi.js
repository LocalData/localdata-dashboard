/*jslint nomen: true */
/*globals define: true */

define(function(require, exports, module) {
  'use strict';

  // Libs
  var $ = require('jquery');
  var _ = require('lib/lodash');
  var Backbone = require('backbone');
  var util = require('util');

  var api = require('api');

  // Views
  var MapView = require('views/maps/multi-map');
  var SurveyLayer = require('views/projects/datalayers/survey');
  var CartoDBLayer = require('views/maps/cartodb-layer');
  var InfoWindow = require('views/projects/info-window');
  var projects = require('views/projects/projects');

  // Templates
  var embeddedSurveyTemplate = require('text!templates/responses/embed-multi.html');
  var layerTitleTemplate = require('text!templates/projects/surveys/layer-title.html');
  var disqusTemplate = require('text!templates/disqus.html');


  // TODO: Fetch the project configuration data from the API via a Project
  // model, which should reference Survey models, which should potentially
  // allow for pre-filtering.

  /*
   * Multi-survey, embedded view.
   *
   * CONFIGURATION:
   *   - The list of surveys controls what gets displayed
   *     If there is no filter property, all responses will be shown.
   */
  var MultiSurveyView = Backbone.View.extend({
    activeLayers: {},
    activeTileLayers: {},
    activeGridLayers: {},
    mapView: null,


    // overview vs deep-dive
    mode: 'overview',

    template: _.template(embeddedSurveyTemplate),
    layerTitleTemplate: _.template(layerTitleTemplate),
    el: '#container',

    events: {
      'click .action-show-filters': 'toggleFilters',
      'click .close-popup': 'closePopup',
      'click .popup-cover': 'closePopup',
      'click .address-search-button': 'search',
      'click .layer-callout': 'showDeepDive'
    },

    initialize: function(options) {
      // XXX TODO
      // Pull from survey options?
      // Load the right layers for each survey.
      this.slug = options.slug;
      if (this.slug === 'walkscope') {
        this.project = projects.walkscope;
      } else {
        this.project = projects.gtech;
      }

      this.mode = options.mode;

      _.bind(this.search, this);

      this.render();
    },

    // Render the response counts
    totalCount: 0,
    renderCount: function(surveyConfig, count) {
      this.totalCount += count;
      this.$el.find('.response-count .count').html(util.numberWithCommas(this.totalCount));

      if (this.activeLayers.length === 1) {
        this.$('.response-count').hide();
      } else {
        this.$('.response-count').show();
      }

      this.$('#overview-container').append(this.layerTitleTemplate({
        name: surveyConfig.layerName,
        count: util.numberWithCommas(count),
        color: surveyConfig.color
      }));

    },

    append: function ($el) {
      this.$el.find('.layers').append($el);
    },

    appendSettings: function($el) {
      // XXX TODO
      // Set up a container for each datasource + id so we know exactly
      // where to put the element?
      $el.hide();
      this.$el.find('.settings-container').append($el);
    },

    render: function () {
      var context = {
        name: this.project.name,
        description: this.project.description
      };
      this.$el.html(this.template(context));

      // Set up the map view, now that the root exists.
      if (this.mapView === null) {
        var mapOptions = {
          el: '#map-view-container',
          config: {
            center: this.project.center,
            zoom: this.project.zoom
          }
        };

        // Support a custom baselayer
        if (this.project.baselayer) {
          mapOptions.baselayer = this.project.baselayer;
        }

        this.mapView = new MapView(mapOptions);
        this.listenTo(this.mapView, 'click', this.mapClickHandler);
      }

      // Render the map
      this.mapView.render();

      // Render foreign data layers
      var mapView = this.mapView;
      if (this.project.foreignInteractive) {
        this.foreignLayers = _.map(this.project.foreignInteractive, function (layer, i) {
          if (layer.type === 'cartodb') {
            var view = new CartoDBLayer({
              mapView: mapView,
              layer: layer
            });

            // Hook item-selection up to the info window.
            this.listenTo(view, 'itemSelected', function (data) {
              this.addItemView({
                view: data.view,
                latlng: data.latlng,
                order: this.project.surveys.length + i
              });
            });

            return view;
          }
        }, this);
      }

      // Render survey layers
      _.each(this.project.surveys, function (survey, i) {
        var surveyLayer = new SurveyLayer({
          survey: survey,
          mapView: mapView,
          surveyOptions: survey.options
        });

        this.activeLayers[survey.layerId] = surveyLayer;

        this.listenTo(surveyLayer, 'rendered', this.append);
        this.listenTo(surveyLayer, 'renderedSettings', this.appendSettings);
        this.listenTo(surveyLayer, 'count', function (count) {
          this.renderCount(survey, count);
        });
        this.listenTo(surveyLayer, 'itemSelected', function (data) {
          this.addItemView({
            view: data.view,
            latlng: data.latlng,
            order: i
          });
        });
      }.bind(this));

      if (this.mode === 'deep-dive') {
        this.showDeepDive();
      } else {
        this.showOverview();
      }

      if (this.project.commentsId) {
        this.$el.append(_.template(disqusTemplate)({
          commentsId: this.project.commentsId
        }));
      }
    },

    addItemView: function (data) {
      if (this.infoWindow && !this.infoWindow.latlng.equals(data.latlng)) {
        this.infoWindow.remove();
        this.infoWindow = null;
      }

      if (!this.infoWindow) {
        // TODO: pass along streetview suppression option. We should probably
        // move streetview suppresion option to the project level.
        this.infoWindow = new InfoWindow({
          suppressStreetview: this.project.suppressStreetview,
          latlng: data.latlng
        }).render();
        var $infoWindowContainer = this.$('#info-window');
        $infoWindowContainer.append(this.infoWindow.el);
        $infoWindowContainer.show();
        this.listenToOnce(this.infoWindow, 'remove', function () {
          $infoWindowContainer.hide();
          this.infoWindow = null;
        });
      }

      this.infoWindow.addView({
        view: data.view,
        order: data.order
      });
    },

    showDeepDive: function() {
      this.mode = 'deep-dive';
      // Show the deep dive controls.
      $('.control-pane').show();
      $('#filter-view-container').show();

      // Hide the overview controls and expand the map.
      $('#overview-container').hide();
      $('#map-view-container').removeClass('b');

      this.mapView.map.invalidateSize();
    },

    showOverview: function() {
      this.mode = 'overview';

      // Hide the deep dive controls.
      $('.control-pane').hide();
      $('#filter-view-container').hide();
      if (this.selectedItemListView) {
        this.selectedItemListView.remove();
        this.selectedItemListView = null;
      }

      // Show the overview controls and restrict the map to the right-hand column.
      $('#overview-container').show();
      $('#map-view-container').addClass('b');

      this.mapView.map.invalidateSize();
    },


    mapClickHandler: function (event) {
      if (this.mode === 'overview') {
        this.showDeepDive();
      }
      // TODO: If we receive a click that doesn't hit any object, we should
      // dismiss the info window (this.infoWindow.remove()). That's nontrivial,
      // though, because we need to listen to all of the UTF Grid layer clicks
      // and determine that none of them have data.
    },

    toggleFilters: function () {
      // Render the filter
      this.$('.filters').toggle();
      //this.$('.settings-container').toggle();
    },

    /**
     * Search for an address
     */
    search: function(event) {
      event.preventDefault();
      var address = this.$('#address-search').val();
      var location = this.project.location;
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

    closePopup: function() {
      $('.popup').hide();
      $('.popup-cover').hide();
    }
  });

  return MultiSurveyView;

});
