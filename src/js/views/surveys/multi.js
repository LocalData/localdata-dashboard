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

  // Templates
  var embeddedSurveyTemplate = require('text!templates/responses/embed-multi.html');
  var exploreStyles = require('text!templates/projects/surveys/explore-styles.mss');
  var simpleStyles = require('text!templates/projects/surveys/simple-styles.mss');


  function makeBasicExploration(options) {
    var data = {
      name: options.name,
      layer: {
        query: {},
        select: { 'entries.responses': 1 },
        styles: _.template(exploreStyles)({
          showNoResponse: false,
          pairs: _.map(options.values, function (val, i) {
            var ret = {
              key: 'responses.' + options.question,
              value: options.values[i],
              color: options.colors[i]
            };
            return ret;
          })
        })
      },
      values:  _.map(options.values, function (val, i) {
        var ret = {
          text: options.valueNames[i],
          color: options.colors[i],
          layer: {
            query: {},
            select: {},
            styles: _.template(simpleStyles)({ color: options.colors[i] })
          }
        };
        ret.layer.query['entries.responses.' + options.question] = val;
        return ret;
      })
    };
    return data;
  }

  // TODO: Fetch the project configuration data from the API via a Project
  // model, which should reference Survey models, which should potentially
  // allow for pre-filtering.
  var projects = {
    gtech: {
      description: '<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>',
      location: 'Pittsburgh, PA',
      surveys: [{
        surveyId: 'ac5c3b60-10dd-11e4-ad2d-2fff103144af'
//        filter: {
//          question: 'Is-the-property-maintained',
//          answer: 'Yes',
//          legend: 'Maintained properties',
//          color: '#f15a24'
//        }
//      }, {
//        surveyId: '44f94b00-4005-11e4-b627-69499f28b4e5',
//        filter: {
//          question: 'Is-there-dumping-on-the-property',
//          answer: 'No',
//          legend: 'No dumping',
//          color: '#a743c3'
//        }
      }],
      foreignInteractive: [{
        type: 'cartodb',
        dataQuery: 'select usedesc, property_2, propertyow, ST_AsGeoJSON(ST_Centroid(the_geom)) AS centroid from (select * from allegheny_assessed_parcels) as _cartodbjs_alias where cartodb_id = <%= cartodb_id %>',
        humanReadableField: 'property_2',
        fieldNames: {
          usedesc: 'Use',
          propertyow: 'Property Owner'
        },
        config: {
          version: '1.0.1',
          stat_tag:'c8c949c0-7ce7-11e4-a232-0e853d047bba',
          layers:[{
            type:'cartodb',
            options:{
              sql: 'select * from allegheny_assessed_parcels',
              cartocss: '/** category visualization */ #allegheny_assessed_parcels { polygon-opacity: 0.3; line-color: #FFF; line-width: 1; line-opacity: 0.7; }\n #allegheny_assessed_parcels[usecode!=100] { polygon-fill: #dddddd; }\n #allegheny_assessed_parcels[usecode=100] { polygon-fill: #101010; polygon-opacity: 0.6; }\n #allegheny_assessed_parcels { polygon-fill: #DDDDDD; }',
              cartocss_version: '2.1.1',
              interactivity: ['cartodb_id']
            }
          }]
        },
        layerId: 'b7860d2e2bc29ae2702f611e2044284a:1418115328687.24'
      }]
    },
    walkscope: {
      description: '<p>WALKscope is a mobile tool developed by WalkDenver and PlaceMatters for collecting data related to sidewalks, intersections, and pedestrian counts in the Denver metro area. This information will help create an inventory of pedestrian infrastructure, identify gaps, and build the case for improvements.  Click on the map or one of the categories below to explore the data collected to date.</p>',
      surveys: [{
        layerName: 'Sidewalk Quality Reports',
        layerId: 'ec7984d0-2719-11e4-b45c-5d65d83b39b6',
        color: '#66c2a5',
        query: {
          'entries.responses.What-would-you-like-to-record': 'Sidewalk-Quality'
        },
        select: {},
        styles: _.template(simpleStyles)({color: '#66c2a5'}),
        exploration: [
          makeBasicExploration({
            name: 'Sidewalk Type',
            question: 'What-type-of-sidewalk',
            values: ['No-sidewalk',
                     'Less-than-3-feet-rollover-curb',
                     'Less-than-5-feet-attached',
                     'Less-than-5-feet-detached',
                     '5-feet-or-more-attached',
                     '5-feet-or-more-detached',
                     'Other'],
            valueNames: ['No sidewalk',
                         'Less than 3 feet rollover curb',
                         'Less than 5 feet attached',
                         'Less than 5 feet detached',
                         '5 feet or more attached',
                         '5 feet or more detached',
                         'Other'],
            colors: ['#d73027', '#fc8d59', '#fee08b', '#d9ef8b', '#91cf60', '#1a9850', '#b7aba5']
          }),
          makeBasicExploration({
            name: 'Sidewalk obstructions',
            question: 'Are-there-obstructions-in-the-sidewalk',
            values: ['Yes', 'No'],
            valueNames: ['Obstructed', 'Unobstructed'],
            colors: ['#d73027', '#1a9850']
          }),
          makeBasicExploration({
            name: 'Significantly cracked or uneven sidewalks',
            question: 'Is-the-sidewalk-significantly-cracked-or-uneven',
            values: ['Yes', 'No'],
            valueNames: ['Significantly cracked/uneven', 'No significant issue'],
            colors: ['#d73027', '#1a9850']
          }),
          makeBasicExploration({
            name: 'Unsafe due to poor visibility/lighting',
            question: 'Do-you-feel-unsafe-because-of-poor-visibility-or-lighting',
            values: ['Yes', 'No'],
            valueNames: ['Unsafe', 'No significant issue'],
            colors: ['#d73027', '#1a9850']
          }),
          makeBasicExploration({
            name: 'Unsafe due to traffic speed/volume',
            question: 'Do-you-feel-unsafe-because-of-a-high-volume-or-high-speed-traffic',
            values: ['Yes', 'No'],
            valueNames: ['Unsafe', 'No significant issue'],
            colors: ['#d73027', '#1a9850']
          }), {
          name: 'Photos',
          layer: {
            query: {
              'entries.responses.What-would-you-like-to-record': 'Sidewalk-Quality',
              'entries.files.0': {
                $type: 2
              }
            },
            select: {},
            styles: _.template(simpleStyles)({ color: '#810f7c' })
          },
          values: [{
            text: 'Photo',
            color: '#810f7c',
            layer: {
              query: {
                'entries.responses.What-would-you-like-to-record': 'Sidewalk-Quality',
                'entries.files.0': {
                  $type: 2
                }
              },
              select: {},
              styles: _.template(simpleStyles)({color: '#810f7c'})
            }
          }]
        }]
      }, {
        layerName: 'Intersection Quality Reports',
        layerId: 'ec7984d0-2719-11e4-b45c-5d65d83b39b6',
        color: '#fc8d62',
        query: {
          'entries.responses.What-would-you-like-to-record': 'Intersection-Quality'
        },
        select: {},
        styles: _.template(simpleStyles)({color: '#fc8d62'}),
        exploration: [
          makeBasicExploration({
            name: 'Lanes to cross',
            question: 'How-many-lanes-are-there-to-cross',
            values: ['1', '2', '3', '4', '5', '6', '7-or-more'],
            valueNames: ['1', '2', '3', '4', '5', '6', '7 or more'],
            colors: ['#1a9850', '#91cf60', '#d9ef8b', '#ffffbf', '#fee08b', '#fc8d59', '#d73027']
          }),
          makeBasicExploration({
            name: 'Painted crosswalks',
            question: 'Are-there-painted-crosswalks',
            values: ['Yes', 'No'],
            valueNames: ['Yes', 'No'],
            colors: ['#1a9850', '#d73027']
          }),
          makeBasicExploration({
            name: 'Stop sign obedience',
            question: 'Are-drivers-obeying-stop-signs',
            values: ['Yes', 'No'],
            valueNames: ['Drivers obeying stop signs', 'Drivers disobeying stop signs'],
            colors: ['#1a9850', '#d73027']
          }),
          makeBasicExploration({
            name: 'Speed limit obedience',
            question: 'Are-drivers-generally-following-speed-limits',
            values: ['Yes', 'No'],
            valueNames: ['Drivers obeying speed limits', 'Drivers disobeying speed limits'],
            colors: ['#1a9850', '#d73027']
          }),
          makeBasicExploration({
            name: 'Drivers yielding to pedestrians',
            question: 'Are-drivers-generally-yielding-to-pedestrians',
            values: ['Yes', 'No'],
            valueNames: ['Yes', 'No'],
            colors: ['#1a9850', '#d73027']
          }),
          makeBasicExploration({
            name: 'Stop signs',
            question: 'Are-there-stop-signs',
            values: ['Yes-all-way-stop-signs', 'Yes-two-way-stop-signs', 'No'],
            valueNames: ['All-way stop sign', 'Two-way stop sign', 'No stop sign'],
            colors: ['#1a9850', '#fee08b', '#b7aba5']
          }), {
          name: 'Other safety concerns',
          layer: {
            query: {
              'entries.responses.Are-there-other-safety-concerns': {
                $type: 2
              }
            },
            select: {},
            styles: _.template(simpleStyles)({ color: '#d73027' })
          },
          values: [{
            text: 'Safety concerns',
            color: '#d73027',
            layer: {
              query: {
                'entries.responses.Are-there-other-safety-concerns': {
                  $type: 2
                }
              },
              select: {},
              styles: _.template(simpleStyles)({color: '#d73027'})
            }
          }]
          },
          makeBasicExploration({
            name: 'Median islands/bulb-outs',
            question: 'Are-there-median-islands-or-bulb-outs',
            values: ['Yes-both', 'Yes-median-islands', 'Yes-bulb-outs', 'No'],
            valueNames: ['Both', 'Median islands', 'Bulb-outs', 'Neither'],
            colors: ['#1a9641', '#92c5de', '#b2abd2' ,'#d7191c']
          }),
          makeBasicExploration({
            name: 'Traffic lights/crossing signals',
            question: 'Are-there-traffic-lights-andor-pedestrian-crossing-signals',
            values: ['Yes-both-traffic-lights-and-pedestrian-crossing-signals', 'Yes-traffic-lights-only', 'Yes-pedestrian-crossing-signals-only', 'No'],
            valueNames: ['Both', 'Traffic lights', 'Pedestrian signals', 'Neither'],
            colors: ['#1a9641', '#92c5de', '#b2abd2' ,'#d7191c']
          }), {
          name: 'Photos',
          layer: {
            query: {
              'entries.responses.What-would-you-like-to-record': 'Intersection-Quality',
              'entries.files.0': {
                $type: 2
              }
            },
            select: {},
            styles: _.template(simpleStyles)({ color: '#810f7c' })
          },
          values: [{
            text: 'Photo',
            color: '#810f7c',
            layer: {
              query: {
                'entries.responses.What-would-you-like-to-record': 'Intersection-Quality',
                'entries.files.0': {
                  $type: 2
                }
              },
              select: {},
              styles: _.template(simpleStyles)({color: '#810f7c'})
            }
          }]
        }]
      }, {
        layerName: 'Pedestrian Observations',
        layerId: 'ec7984d0-2719-11e4-b45c-5d65d83b39b6',
        color: '#8da0cb',
        query: {
          'entries.responses.What-would-you-like-to-record': 'Number-of-Pedestrians'
        },
        select: {},
        styles: _.template(simpleStyles)({color: '#8da0cb'}),
        exploration: [
          makeBasicExploration({
            name: 'Overall Pedestrian Environment Rating',
            question: 'How-would-you-rate-the-pedestrian-environment-overall-1-5-5highest',
            values: ['5', '4', '3', '2', '1'],
            valueNames: ['5 (highest)', '4', '3', '2', '1 (Lowest)'],
            colors: ['#1a9641', '#a6d96a', '#ffffbf', '#fdae61', '#d7191c']
          }),
          makeBasicExploration({
            name: 'Observeration duration',
            question: 'How-long-did-you-observe-this-street-segment',
            values: ['Less-than-15-minutes', '15-30-minutes', '30-45-minutes', '45-60-minutes', 'more-than-60-minutes'],
            valueNames: ['Less than 15 minutes', '15-30 minutes', '30-45 minutes', '45-60 minutes', 'More than 60 minutes'],
            colors: ['#edf8fb', '#b3cde3', '#8c96c6', '#8856a7', '#810f7c']
          }),
          makeBasicExploration({
            name: 'Temperature during observation',
            question: 'What-is-the-temperature-like',
            values: ['Warm-80-or-more', 'Mild-40-79', 'Cold-39-or-less'],
            valueNames: ['Warm (80&deg; or more)', 'Mild (40-79&deg;)', 'Cold (39&deg; or less)'],
            colors: ['#e0ecf4', '#9ebcda', '#8856a7']
          }), {
          name: 'Photos',
          layer: {
            query: {
              'entries.responses.What-would-you-like-to-record': 'Number-of-Pedestrians',
              'entries.files.0': {
                $type: 2
              }
            },
            select: {},
            styles: _.template(simpleStyles)({ color: '#810f7c' })
          },
          values: [{
            text: 'Photo',
            color: '#810f7c',
            layer: {
              query: {
                'entries.responses.What-would-you-like-to-record': 'Number-of-Pedestrians',
                'entries.files.0': {
                  $type: 2
                }
              },
              select: {},
              styles: _.template(simpleStyles)({color: '#810f7c'})
            }
          }]
        }]
      }]
    }
  };
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
    el: '#container',

    events: {
      'click .action-show-filters': 'toggleFilters',
      'click .address-search-button': 'search'
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

    // Get a total count of responses so far
    // XXX TODO
    // This should ask the view for a count, not address the view's model
    // directly.
    totalUp: function() {
      if (this.activeLayers.length === 1) {
        this.$('.response-count').hide();
        return;
      } else {
        this.$('.response-count').show();
      }

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

      this.$el.find('.response-count .count').html(util.numberWithCommas(total));
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
      console.log("Got settings to append", $el);
    },

    appendDetails: function($el) {
      this.$el.find('details').append($el);
      console.log("Got details to append", $el);
    },

    render: function () {
      var context = {
        description: this.project.description
      };
      this.$el.html(this.template(context));

      // Set up the map view, now that the root exists.
      if (this.mapView === null) {
        this.mapView = new MapView({
          el: '#map-view-container',
          config: {
            center: [40.715678,-74.213848],
            zoom: 15
          }
        });
        this.listenTo(this.mapView, 'click', this.mapClickHandler);
      }

      // Render the map
      this.mapView.render();

      // Render foreign data layers
      var mapView = this.mapView;
      if (this.project.foreignInteractive) {
        this.foreignLayers = _.map(this.project.foreignInteractive, function (layer) {
          if (layer.type === 'cartodb') {
            return new CartoDBLayer({
              mapView: mapView,
              layer: layer,
              el: '#responses-list'
            });
          }
        });
      }

      // Render survey layers
      _.each(this.project.surveys, function (survey) {
        var surveyLayer = new SurveyLayer({
          survey: survey,
          mapView: mapView
        });

        this.activeLayers[survey.layerId] = surveyLayer;

        this.listenTo(surveyLayer, 'rendered', this.append);
        this.listenTo(surveyLayer, 'renderedSettings', this.appendSettings);
        this.listenTo(surveyLayer, 'renderedDetails', this.appendDetails);
      }.bind(this));

      if (this.mode === 'deep-dive') {
        this.showDeepDive();
      } else {
        this.showOverview();
      }
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

      // Show the overview controls and restrict the map to the right-hand column.sldfjlsdkjfldkf sfdlkj slfdj
      $('#overview-container').show();
      $('#map-view-container').addClass('b');

      this.mapView.map.invalidateSize();
    },


    mapClickHandler: function (event) {
      if (this.mode === 'overview') {
        this.showDeepDive();
      }

      if (!event.data || !event.data.object_id) {
        return;
      }

      return;
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
    }
  });

  return MultiSurveyView;

});
