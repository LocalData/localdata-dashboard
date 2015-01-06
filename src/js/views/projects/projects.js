/*jslint nomen: true */
/*globals define: true */

define(function(require, exports, module) {
  'use strict';

  var exploreStyles = require('text!templates/projects/surveys/explore-styles.mss');
  var simpleStyles = require('text!templates/projects/surveys/simple-styles.mss');

  function makeBasicExploration(options) {
    // name: 'Unsafe due to traffic speed/volume',
    // question: 'Do-you-feel-unsafe-because-of-a-high-volume-or-high-speed-traffic',
    // values: ['Yes', 'No'],
    // valueNames: ['Unsafe', 'No significant issue'],
    // colors: ['#d73027', '#1a9850']

    var data = {
      name: options.name,
      question: options.question,

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
          name: options.values[i],
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

  var projects = {

    // GTECH ---------------------------------------------------------------------
    gtech: {
      name: "Lots to Love",
      description: '<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>',
      location: 'Pittsburgh, PA',
      center: [-80.04,40.44],
      zoom: 16,
      commentsId: 'ptxdev', // XXX
      suppressStreetview: true,
      surveys: [{
        layerName: 'Lots to Love Projects',
        layerId: 'ac5c3b60-10dd-11e4-ad2d-2fff103144af',
        color: '#66c2a5',
        options: {
          comments: true,
          anonymous: true
        },
        countPath: 'survey.responseCount',
        query: {},
        select: {},
        styles: _.template(simpleStyles)({color: '#66c2a5'}),
        exploration: [
          makeBasicExploration({
            name: 'Building type',
            question: 'What-type-of-building-is-on-site',
            values: ['Single-family-dwelling',
                     'Multi-family-dwelling-2-4-units',
                     'Multi-family-dwelling-more-than-4-units',
                     'CommercialOffice',
                     'Industrial-',
                     'Institutional-',
                     'Mixed-use-with-residential-',
                      'Mixed-used-without-residential-'],
            valueNames: ['Single family',
                         'Multi-family 2-4 units',
                         'Multi-family >4 units',
                         'Commercial/office',
                         'Industrial',
                         'Institutional',
                         'Mixed-use w/ residential',
                         'Mixed-use w/o residential'],
            colors: ['#d73027', '#fc8d59', '#fee08b', '#d9ef8b', '#91cf60', '#1a9850', '#b7aba5', '#102030']
          })
        ]
      }],

      // Foreign layers
      foreignInteractive: [

        // Use and property info from Carto
        {
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
        },

        // Static council districts
        {
          type: 'cartodb',
          layerName: 'Pittsburgh Council Districts',
          color: '#ffad00',
          dataQuery: 'select * from pittsburgh_council_districts_2012 as _cartodbjs_alias',
          humanReadableField: 'council',
          // fieldNames: {
          //   usedesc: 'Use',
          //   propertyow: 'Property Owner'
          // },
          config: {
            version: '1.0.1',
            stat_tag: '', // 'c8c949c0-7ce7-11e4-a232-0e853d047bba',
            disableGrid: true,
            layers:[{
              type:'cartodb',
              options:{
                sql: 'select * from pittsburgh_council_districts_2012',
                cartocss: "/** simple visualization */  #pittsburgh_council_districts_2012{   polygon-fill: #FF6600;   polygon-opacity: 0;   line-color: #ffad00;   line-width: 2.5;   line-opacity: 1; }  #pittsburgh_council_districts_2012::labels {   text-name: [council];   text-face-name: 'Open Sans Regular';   text-size: 16;   text-label-position-tolerance: 0;   text-fill: #45403e;   text-halo-fill: #FFF;   text-halo-radius: 2.5;   text-dy: -15;   text-allow-overlap: true;   text-placement: point;   text-placement-type: dummy; }",
                cartocss_version: '2.1.1'
                // interactivity: ['cartodb_id']
              }
            }]
          },
          layerId: 'pittsburgh-council-districts'
        },

        // Static neighborhood bounds
        {
          type: 'cartodb',
          layerName: 'Pittsburgh Neighborhoods',
          color: '#ffad00',
          dataQuery: 'select * from pittsburgh_neighborhoods as _cartodbjs_alias',
          humanReadableField: 'neighborhood',
          // fieldNames: {
          //   usedesc: 'Use',
          //   propertyow: 'Property Owner'
          // },
          config: {
            version: '1.0.1',
            stat_tag: '', // 'c8c949c0-7ce7-11e4-a232-0e853d047bba',
            disableGrid: true,
            layers:[{
              type:'cartodb',
              options:{
                sql: 'select * from pittsburgh_neighborhoods',
                cartocss: "/** simple visualization */  #pittsburgh_neighborhoods{   polygon-fill: #FF6600;   polygon-opacity: 0;   line-color: #ffad00;   line-width: 2.5;   line-opacity: 1; }  #pittsburgh_neighborhoods::labels {   text-name: [neighborhood];   text-face-name: 'Open Sans Regular';   text-size: 12;   text-label-position-tolerance: 0;   text-fill: #45403e;   text-halo-fill: #FFF;   text-halo-radius: 1.5;   text-dy: -10;   text-allow-overlap: true;   text-placement: point;   text-placement-type: dummy; } ",
                cartocss_version: '2.1.1'
                // interactivity: ['cartodb_id']
              }
            }]
          },
          layerId: 'pittsburgh-neighborhoods'
        }
      ]
    },

    // WALKSCOPE -----------------------------------------------------------------
    walkscope: {
      name: "WALKscope Denver",
      description: '<p>WALKscope is a mobile tool developed by WalkDenver and PlaceMatters for collecting data related to sidewalks, intersections, and pedestrian counts in the Denver metro area. This information will help create an inventory of pedestrian infrastructure, identify gaps, and build the case for improvements. Use the map to explore the data collected to date.</p>',
      location: "Denver, Colorado",
      center: [-104.9831330, 39.7589070],
      zoom: 16,
      commentsId: 'ptxdev', // XXX
      surveys: [{
        layerName: 'Sidewalk Quality Reports',
        layerId: 'ec7984d0-2719-11e4-b45c-5d65d83b39b6',
        color: '#66c2a5',
        options: {
          comments: true,
          anonymous: true
        },
        countPath: 'stats.What-would-you-like-to-record.Sidewalk-Quality',
        query: {
          'entries.responses.What-would-you-like-to-record': 'Sidewalk-Quality'
        },
        select: {},
        styles: _.template(simpleStyles)({color: '#66c2a5'}),
        exploration: [
          makeBasicExploration({
            name: 'Overall Pedestrian Environment Rating',
            question: 'How-would-you-rate-the-pedestrian-environment-overall-1-5-5highest',
            values: ['5', '4', '3', '2', '1'],
            valueNames: ['5 (highest)', '4', '3', '2', '1 (Lowest)'],
            colors: ['#4dac26', '#b8e186', '#f7f7f7', '#f1b6da', '#d01c8b']
          }),
          makeBasicExploration({
            name: 'Sidewalk Type',
            question: 'What-type-of-sidewalk',
            values: ['No-sidewalk',
                     'Less-than-3-feet-rollover-curb',
                     'Less-than-5-feet-attached',
                     '5-feet-or-more-attached',
                     'Less-than-5-feet-detached',
                     '5-feet-or-more-detached',
                     'Other'],
            valueNames: ['No sidewalk',
                         'Less than 3 feet rollover curb',
                         'Less than 5 feet attached',
                         '5 feet or more attached',
                         'Less than 5 feet detached',
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
          }, {
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
        options: {
          comments: true,
          anonymous: true
        },
        countPath: 'stats.What-would-you-like-to-record.Intersection-Quality',
        query: {
          'entries.responses.What-would-you-like-to-record': 'Intersection-Quality'
        },
        select: {},
        styles: _.template(simpleStyles)({color: '#fc8d62'}),
        exploration: [
          makeBasicExploration({
            name: 'Overall Pedestrian Environment Rating',
            question: 'How-would-you-rate-the-pedestrian-environment-1-5-5highest',
            values: ['5', '4', '3', '2', '1'],
            valueNames: ['5 (highest)', '4', '3', '2', '1 (Lowest)'],
            colors: ['#4dac26', '#b8e186', '#f7f7f7', '#f1b6da', '#d01c8b']
          }),
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
            values: ['Yes.', 'No.'],
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
          }),
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
            valueNames: ['Both', 'Traffic lights only', 'Pedestrian signals only', 'Neither'],
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
        layerName: 'Pedestrian Counts',
        layerId: 'ec7984d0-2719-11e4-b45c-5d65d83b39b6',
        options: {
          comments: true,
          anonymous: true
        },
        color: '#8da0cb',
        countPath: 'stats.What-would-you-like-to-record.Number-of-Pedestrians-',
        query: {
          'entries.responses.What-would-you-like-to-record': 'Number-of-Pedestrians-'
        },
        select: {},
        styles: _.template(simpleStyles)({color: '#8da0cb'}),
        exploration: [
          makeBasicExploration({
            name: 'Overall Pedestrian Environment Rating',
            question: 'How-would-you-rate-the-pedestrian-environment-overall-1-5-5-highest',
            values: ['5', '4', '3', '2', '1'],
            valueNames: ['5 (highest)', '4', '3', '2', '1 (Lowest)'],
            colors: ['#4dac26', '#b8e186', '#f7f7f7', '#f1b6da', '#d01c8b']
          }), {
            name: 'Pedestrian activity',
            layer: {
              query: {
                'entries.responses.What-would-you-like-to-record': 'Number-of-Pedestrians-'
              },
              select: {
                'entries.responses.How-many-pedestrians-did-you-count-on-this-street-section': 1,
                'entries.responses.How-long-did-you-observe-this-street-segment': 1
              },
              styles: '@high: #88419d;@medium: #8c96c6;@low: #b3cde3;@vlow: #edf8fb;\n' +
              'Map { background-color: rgba(0,0,0,0); }\n' +
              '#localdata["responses.How-many-pedestrians-did-you-count-on-this-street-section">=15]["responses.How-long-did-you-observe-this-street-segment"="Less-than-15-minutes"],' +
              '["responses.How-many-pedestrians-did-you-count-on-this-street-section">=45]["responses.How-long-did-you-observe-this-street-segment"="15-30-minutes"],' +
              '["responses.How-many-pedestrians-did-you-count-on-this-street-section">=75]["responses.How-long-did-you-observe-this-street-segment"="30-45-minutes"],' +
              '["responses.How-many-pedestrians-did-you-count-on-this-street-section">=105]["responses.How-long-did-you-observe-this-street-segment"="45-60-minutes"],' +
              '["responses.How-many-pedestrians-did-you-count-on-this-street-section">=135]["responses.How-long-did-you-observe-this-street-segment"="more-than-60-minutes"]' +
              ' { polygon-fill: @high;polygon-opacity:0.85; }\n' +
              '#localdata["responses.How-many-pedestrians-did-you-count-on-this-street-section">=10]["responses.How-many-pedestrians-did-you-count-on-this-street-section"<15]["responses.How-long-did-you-observe-this-street-segment"="Less-than-15-minutes"],' +
              '["responses.How-many-pedestrians-did-you-count-on-this-street-section">=30]["responses.How-many-pedestrians-did-you-count-on-this-street-section"<45]["responses.How-long-did-you-observe-this-street-segment"="15-30-minutes"],' +
              '["responses.How-many-pedestrians-did-you-count-on-this-street-section">=50]["responses.How-many-pedestrians-did-you-count-on-this-street-section"<75]["responses.How-long-did-you-observe-this-street-segment"="30-45-minutes"],' +
              '["responses.How-many-pedestrians-did-you-count-on-this-street-section">=70]["responses.How-many-pedestrians-did-you-count-on-this-street-section"<105]["responses.How-long-did-you-observe-this-street-segment"="45-60-minutes"],' +
              '["responses.How-many-pedestrians-did-you-count-on-this-street-section">=90]["responses.How-many-pedestrians-did-you-count-on-this-street-section"<135]["responses.How-long-did-you-observe-this-street-segment"="more-than-60-minutes"]' +
              '{ polygon-fill: @medium;polygon-opacity:0.85; }\n' +
              '#localdata["responses.How-many-pedestrians-did-you-count-on-this-street-section">=8]["responses.How-many-pedestrians-did-you-count-on-this-street-section"<10]["responses.How-long-did-you-observe-this-street-segment"="Less-than-15-minutes"],' +
              '["responses.How-many-pedestrians-did-you-count-on-this-street-section">=23]["responses.How-many-pedestrians-did-you-count-on-this-street-section"<30]["responses.How-long-did-you-observe-this-street-segment"="15-30-minutes"],' +
              '["responses.How-many-pedestrians-did-you-count-on-this-street-section">=38]["responses.How-many-pedestrians-did-you-count-on-this-street-section"<50]["responses.How-long-did-you-observe-this-street-segment"="30-45-minutes"],' +
              '["responses.How-many-pedestrians-did-you-count-on-this-street-section">=53]["responses.How-many-pedestrians-did-you-count-on-this-street-section"<70]["responses.How-long-did-you-observe-this-street-segment"="45-60-minutes"],' +
              '["responses.How-many-pedestrians-did-you-count-on-this-street-section">=68]["responses.How-many-pedestrians-did-you-count-on-this-street-section"<90]["responses.How-long-did-you-observe-this-street-segment"="more-than-60-minutes"]' +
              '{ polygon-fill: @low;polygon-opacity:0.85; }\n' +
              '#localdata["responses.How-many-pedestrians-did-you-count-on-this-street-section"<8]["responses.How-long-did-you-observe-this-street-segment"="Less-than-15-minutes"],' +
              '["responses.How-many-pedestrians-did-you-count-on-this-street-section"<23]["responses.How-long-did-you-observe-this-street-segment"="15-30-minutes"],' +
              '["responses.How-many-pedestrians-did-you-count-on-this-street-section"<38]["responses.How-long-did-you-observe-this-street-segment"="30-45-minutes"],' +
              '["responses.How-many-pedestrians-did-you-count-on-this-street-section"<53]["responses.How-long-did-you-observe-this-street-segment"="45-60-minutes"],' +
              '["responses.How-many-pedestrians-did-you-count-on-this-street-section"<68]["responses.How-long-did-you-observe-this-street-segment"="more-than-60-minutes"]' +
              '{ polygon-fill: @vlow;polygon-opacity:0.85; }'
            },
            values: [{
              text: 'High',
              color: '#88419d',
              layer: {
                query: {
                  'entries.responses.What-would-you-like-to-record': 'Number-of-Pedestrians-'
                },
                select: {
                  'entries.responses.How-many-pedestrians-did-you-count-on-this-street-section': 1,
                  'entries.responses.How-long-did-you-observe-this-street-segment': 1
                },
                styles: '@high: #88419d;\nMap { background-color: rgba(0,0,0,0); }\n' +
                '#localdata["responses.How-many-pedestrians-did-you-count-on-this-street-section">=15]["responses.How-long-did-you-observe-this-street-segment"="Less-than-15-minutes"],' +
                '["responses.How-many-pedestrians-did-you-count-on-this-street-section">=45]["responses.How-long-did-you-observe-this-street-segment"="15-30-minutes"],' +
                '["responses.How-many-pedestrians-did-you-count-on-this-street-section">=75]["responses.How-long-did-you-observe-this-street-segment"="30-45-minutes"],' +
                '["responses.How-many-pedestrians-did-you-count-on-this-street-section">=105]["responses.How-long-did-you-observe-this-street-segment"="45-60-minutes"],' +
                '["responses.How-many-pedestrians-did-you-count-on-this-street-section">=135]["responses.How-long-did-you-observe-this-street-segment"="more-than-60-minutes"]' +
                ' { polygon-fill: @high;polygon-opacity:0.85; }'
              }
            }, {
              text: 'Medium',
              color: '#8c96c6',
              layer: {
                query: {
                  'entries.responses.What-would-you-like-to-record': 'Number-of-Pedestrians-'
                },
                select: {
                  'entries.responses.How-many-pedestrians-did-you-count-on-this-street-section': 1,
                  'entries.responses.How-long-did-you-observe-this-street-segment': 1
                },
                styles: '@medium: #8c96c6;\nMap { background-color: rgba(0,0,0,0); }\n' +
                '#localdata["responses.How-many-pedestrians-did-you-count-on-this-street-section">=10]["responses.How-many-pedestrians-did-you-count-on-this-street-section"<15]["responses.How-long-did-you-observe-this-street-segment"="Less-than-15-minutes"],' +
                '["responses.How-many-pedestrians-did-you-count-on-this-street-section">=30]["responses.How-many-pedestrians-did-you-count-on-this-street-section"<45]["responses.How-long-did-you-observe-this-street-segment"="15-30-minutes"],' +
                '["responses.How-many-pedestrians-did-you-count-on-this-street-section">=50]["responses.How-many-pedestrians-did-you-count-on-this-street-section"<75]["responses.How-long-did-you-observe-this-street-segment"="30-45-minutes"],' +
                '["responses.How-many-pedestrians-did-you-count-on-this-street-section">=70]["responses.How-many-pedestrians-did-you-count-on-this-street-section"<105]["responses.How-long-did-you-observe-this-street-segment"="45-60-minutes"],' +
                '["responses.How-many-pedestrians-did-you-count-on-this-street-section">=90]["responses.How-many-pedestrians-did-you-count-on-this-street-section"<135]["responses.How-long-did-you-observe-this-street-segment"="more-than-60-minutes"]' +
                '{ polygon-fill: @medium;polygon-opacity:0.85; }'
              }
            }, {
              text: 'Low',
              color: '#b3cde3',
              layer: {
                query: {
                  'entries.responses.What-would-you-like-to-record': 'Number-of-Pedestrians-'
                },
                select: {
                  'entries.responses.How-many-pedestrians-did-you-count-on-this-street-section': 1,
                  'entries.responses.How-long-did-you-observe-this-street-segment': 1
                },
                styles: '@low: #b3cde3;\nMap { background-color: rgba(0,0,0,0); }\n' +
                '#localdata["responses.How-many-pedestrians-did-you-count-on-this-street-section">=8]["responses.How-many-pedestrians-did-you-count-on-this-street-section"<10]["responses.How-long-did-you-observe-this-street-segment"="Less-than-15-minutes"],' +
                '["responses.How-many-pedestrians-did-you-count-on-this-street-section">=23]["responses.How-many-pedestrians-did-you-count-on-this-street-section"<30]["responses.How-long-did-you-observe-this-street-segment"="15-30-minutes"],' +
                '["responses.How-many-pedestrians-did-you-count-on-this-street-section">=38]["responses.How-many-pedestrians-did-you-count-on-this-street-section"<50]["responses.How-long-did-you-observe-this-street-segment"="30-45-minutes"],' +
                '["responses.How-many-pedestrians-did-you-count-on-this-street-section">=53]["responses.How-many-pedestrians-did-you-count-on-this-street-section"<70]["responses.How-long-did-you-observe-this-street-segment"="45-60-minutes"],' +
                '["responses.How-many-pedestrians-did-you-count-on-this-street-section">=68]["responses.How-many-pedestrians-did-you-count-on-this-street-section"<90]["responses.How-long-did-you-observe-this-street-segment"="more-than-60-minutes"]' +
                '{ polygon-fill: @low;polygon-opacity:0.85; }'
              }
            }, {
              text: 'Very Low',
              color: '#edf8fb',
              layer: {
                query: {
                  'entries.responses.What-would-you-like-to-record': 'Number-of-Pedestrians-'
                },
                select: {
                  'entries.responses.How-many-pedestrians-did-you-count-on-this-street-section': 1,
                  'entries.responses.How-long-did-you-observe-this-street-segment': 1
                },
                styles: '@vlow: #edf8fb;\nMap { background-color: rgba(0,0,0,0); }\n' +
                '#localdata["responses.How-many-pedestrians-did-you-count-on-this-street-section"<8]["responses.How-long-did-you-observe-this-street-segment"="Less-than-15-minutes"],' +
                '["responses.How-many-pedestrians-did-you-count-on-this-street-section"<23]["responses.How-long-did-you-observe-this-street-segment"="15-30-minutes"],' +
                '["responses.How-many-pedestrians-did-you-count-on-this-street-section"<38]["responses.How-long-did-you-observe-this-street-segment"="30-45-minutes"],' +
                '["responses.How-many-pedestrians-did-you-count-on-this-street-section"<53]["responses.How-long-did-you-observe-this-street-segment"="45-60-minutes"],' +
                '["responses.How-many-pedestrians-did-you-count-on-this-street-section"<68]["responses.How-long-did-you-observe-this-street-segment"="more-than-60-minutes"]' +
                '{ polygon-fill: @vlow;polygon-opacity:0.85; }'
              }
            }]
          },
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
            valueNames: ['Warm (80º; or more)', 'Mild (40-79º)', 'Cold (39º; or less)'],
            colors: ['#7bc3f4', '#408dda', '#8856a7']
          }), {
          name: 'Photos',
          layer: {
            query: {
              'entries.responses.What-would-you-like-to-record': 'Number-of-Pedestrians-',
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
                'entries.responses.What-would-you-like-to-record': 'Number-of-Pedestrians-',
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

  return projects;
});
