/*jslint nomen: true */
/*globals define: true */

define(function(require, exports, module) {
  'use strict';

  var _ = require('lib/lodash');

  var util = require('./project-utils');
  var parkswatch = require('./project-parkswatch');
  var gary = require('./project-gary');
  var newark = require('./project-newark');

  var projects = {
    gary: gary,
    newark: newark,
    parkswatch: parkswatch,

    // GTECH ---------------------------------------------------------------------
    gtech: {
      name: "Lots to Love",
      description: '<p></p>',
      location: 'Pittsburgh, PA',
      center: [-79.995886, 40.440625],
      zoom: 14,
      commentsId: 'lots2lovepgh',
      scrollWheelZoom: false,
      suppressStreetview: false,
      baselayer: '//a.tiles.mapbox.com/v3/matth.kmf6l3h1/{z}/{x}/{y}.png',
      // baselayer: 'http://c.tile.stamen.com/toner-lite/{z}/{x}/{y}.png', // toner-light
      surveys: [{
        layerName: 'Lots to Love Projects',
        layerId: 'fb6dbc30-7bd9-11e4-abaf-a39ffd5c50e6',
        color: '#cddc29',
        zIndex: 30,
        options: {
          comments: true,
          anonymous: true,
          titleField: 'Project-Name'
        },
        countPath: 'survey.responseCount',
        query: {},
        select: {},
        filters: {
          question: 'Project Status'
        },
        styles: util.simpleStyles({color: '#cddc29'}),
        exploration: [
          util.makeBasicExploration({
            sparse: true,
            name: 'Project Status',
            question: 'What-stage-of-project-are-you-registering',
            values: [
              'An-idea-for-a-lot',
              'A-project-that-is-in-progress-',
              'A-project-that-has-been-implemented-'
            ],
            valueNames: [
              'Idea',
              'In progress',
              'Implemented'
            ],
            colors: ['#F0532D', '#00C1f3', '#12B259']
          }),
          util.makeBasicExploration({
            sparse: true,
            name: 'Project Type',
            question: 'Project-Type',
            values: [
              'Flower-Garden',
              'Trail--Pathway',
              'Park--Parklet',
              'Rain-Garden--Stormwater-Project',
              'Food-Garden',
              'Playspace',
              'Public-Art',
              'Green--Screen--Infill',
              'Greenway--Wooded-Lot',
              'Bike-Infrastructure'
            ],
            valueNames: [
              'Flower Garden',
              'Trail | Pathway',
              'Park | Parklet',
              'Rain Garden | Stormwater Project',
              'Food Garden',
              'Playspace',
              'Public Art',
              'Green + Screen | Infill',
              'Greenway | Wooded Lot',
              'Bike Infrastructure'
            ],
            colors: ['#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#8dd5ea', '#fdb462', '#b3de69', '#be76b1', '#d9d9d9', '#9cf3e3']
          })
        ]
      }],

      // Foreign layers
      foreignInteractive: [
        // Use and property info from LocalData features db/tileserver
        {
          type: 'feature-tiles',
          layerName: 'Vacant Parcels',
          attribution: 'Pennsylvania Spatial Data Access',
          state: 'inactive',
          color: '#505050',
          zIndex: 25,
          handleClick: true,
          staticLegend: '<div><i class="fa fa-square" style="color:#005e20;opacity:0.6;"></i> Side Yards</div> <div><i class="fa fa-square" style="color:#101010;opacity:0.6;"></i> Publicly owned</div> <div><i class="fa fa-square" style="color:#777777;opacity:0.6;"></i> Privately owned</div>',
          fieldNames: {
            mapblolot: 'Parcel ID',
            mundesc: 'Municipality',
            usedesc: 'Use',
            propertyow: 'Property Owner',
            delinquent: 'Is the property delinquent?'
          },
          layer: {
            query: { source: 'allegheny-assessed-parcels' },
            select: { },
            styles: '["info.vacancy"="Y"]{ polygon-fill: #777; polygon-opacity: 0.6; background-color: #777; }\n ["info.vacancy"="Y"]["info.publicowne" >= 1] { polygon-fill: #101010; polygon-opacity: 0.6; background-color: #101010; } ["info.sidelot" >= 1]{ polygon-fill: #005e20; polygon-opacity: 0.6; background-color: #005e20; }\n [zoom >= 15] { line-color: #FFF; line-width: 0.5; line-opacity: 0.7; }\n polygon-opacity: 0; line-width: 0; line-opacity: 0;'
          },
          layerId: 'allegheny-assessed-parcels'
        },

        // Allegheny municipalities from LocalData features db/tileserver
        {
          type: 'feature-tiles',
          layerName: 'Municipalities',
          attribution: 'Pennsylvania Spatial Data Access',
          state: 'active',
          color: '#ff7a00',
          zIndex: 20,
          humanReadableField: 'label',
          handleMouseover: true, // requires humanReadableField
          layer: {
            query: { source: 'pitt-municipalities' },
            select: { info: { label: 1 } },
            styles: 'Map { background-color: rgba(0,0,0,0); }\n#localdata{ polygon-fill: #FF6600; polygon-opacity: 0; line-color: #ff7a00; line-width: 2.5; line-opacity: 1; }',
          },
          layerId: 'pittsburgh-neighborhoods'
        },

        // Static neighborhood bounds from LocalData features db/tileserver
        {
          type: 'feature-tiles',
          layerName: 'Pittsburgh Neighborhoods',
          attribution: 'Pennsylvania Spatial Data Access',
          state: 'inactive',
          color: '#ffad00',
          zIndex: 15,
          humanReadableField: 'neighborhood',
          handleMouseover: true, // requires humanReadableField
          layer: {
            query: { source: 'pitt-neighborhoods' },
            select: { info: { neighborhood: 1 } },
            styles: 'Map { background-color: rgba(0,0,0,0); }\n#localdata{ polygon-fill: #FF6600; polygon-opacity: 0; line-color: #ffad00; line-width: 2.5; line-opacity: 1; }',
          },
          layerId: 'pittsburgh-neighborhoods'
        },

        // Static council districts from LocalData features db/tileserver
        {
          type: 'feature-tiles',
          layerName: 'Pittsburgh Council Districts',
          state: 'inactive',
          color: '#ffcf00',
          zIndex: 10,
          humanReadableField: 'council',
          handleMouseover: true, // requires humanReadableField
          layer: {
            query: { source: 'pitt-council' },
            select: { info: { council: 1 } },
            styles: 'Map { background-color: rgba(0,0,0,0); }\n#localdata{ polygon-fill: #FF6600; polygon-opacity: 0; line-color: #ffcf00; line-width: 2.5; line-opacity: 1; }',
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
      commentsId: 'walkscope',
      welcomeMessage: true, // Show a welcome popup using the description text.
      surveys: [{
        layerName: 'Sidewalk Quality Reports',
        layerId: 'ec7984d0-2719-11e4-b45c-5d65d83b39b6',
        color: '#66c2a5',
        options: {
          comments: true,
          anonymous: true
        },
        filters: {
          question: 'Overall Pedestrian Environment Rating'
        },
        countPath: 'stats.What-would-you-like-to-record.Sidewalk-Quality',
        query: {
          'entries.responses.What-would-you-like-to-record': 'Sidewalk-Quality'
        },
        select: {},
        styles: util.simpleStyles({color: '#66c2a5'}),
        exploration: [
          util.makeBasicExploration({
            name: 'Overall Pedestrian Environment Rating',
            question: 'How-would-you-rate-the-pedestrian-environment-overall-1-5-5highest',
            // This question is repeated among sidewalk/intersection/pedestrian
            // observations with the same ID, so we need to avoid mapping data
            // from the wrong virtual layer.
            query: {
              'entries.responses.What-would-you-like-to-record': 'Sidewalk-Quality'
            },
            values: ['5-highest', '4', '3', '2', '1-lowest'],
            valueNames: ['5 (highest)', '4', '3', '2', '1 (Lowest)'],
            colors: ['#05A17D', '#8BB272', '#ead02b', '#ef8e3a', '#e94027']
          }),
          util.makeBasicExploration({
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
            colors: ['#e94027', '#ec6d39', '#CF9F15', '#ABB070', '#9ec74c', '#04b485', '#b7aba5']
          }),
          util.makeCheckboxExploration({
            name: 'Sidewalk obstructions',
            question: 'Are-there-any-problems-with-the-sidewalk--Select-all-that-apply-Obstructions-in-the-sidewalk',
            predicate: ['What-would-you-like-to-record', 'Sidewalk-Quality'],
            values: ['yes', 'no'],
            valueNames: ['Yes', 'No'],
            colors: ['#e64212', '#78706d']
          }),
          util.makeCheckboxExploration({
            name: 'Significantly cracked or uneven sidewalks',
            question: 'Are-there-any-problems-with-the-sidewalk--Select-all-that-apply-The-sidewalk-is-significantly-cracked-or-uneven',
            predicate: ['What-would-you-like-to-record', 'Sidewalk-Quality'],
            values: ['yes', 'no'],
            valueNames: ['Significantly cracked/uneven', 'No significant issue'],
            colors: ['#e64212', '#78706d']
          }),
          util.makeCheckboxExploration({
            name: 'Other sidewalk issues',
            question: 'Are-there-any-problems-with-the-sidewalk--Select-all-that-apply-Other',
            predicate: ['What-would-you-like-to-record', 'Sidewalk-Quality'],
            values: ['yes', 'no'],
            valueNames: ['Yes', 'No'],
            colors: ['#e64212', '#78706d']
          }),
          util.makeCheckboxExploration({
            name: 'Unsafe due to poor visibility/lighting',
            question: 'Do-you-feel-unsafe-for-any-reason--Select-all-that-apply-Poor-visibility-or-lighting',
            predicate: ['What-would-you-like-to-record', 'Sidewalk-Quality'],
            values: ['yes', 'no'],
            valueNames: ['Yes', 'No'],
            colors: ['#e64212', '#78706d']
          }),
          util.makeCheckboxExploration({
            name: 'Unsafe due to traffic speed/volume',
            question: 'Do-you-feel-unsafe-for-any-reason--Select-all-that-apply-High-volume-or-speed-of-traffic',
            predicate: ['What-would-you-like-to-record', 'Sidewalk-Quality'],
            values: ['yes', 'no'],
            valueNames: ['Yes', 'No'],
            colors: ['#e64212', '#78706d']
          }),
          util.makeCheckboxExploration({
            name: 'Other safety concerns',
            question: 'Do-you-feel-unsafe-for-any-reason--Select-all-that-apply-Other',
            predicate: ['What-would-you-like-to-record', 'Sidewalk-Quality'],
            values: ['yes', 'no'],
            valueNames: ['Yes', 'No'],
            colors: ['#e64212', '#78706d']
          }),
          util.makeCheckboxExploration({
            name: 'Shade trees',
            question: 'Are-there-pedestrian-amenities-Select-all-that-apply-Shade-trees',
            predicate: ['What-would-you-like-to-record', 'Sidewalk-Quality'],
            values: ['yes', 'no'],
            valueNames: ['Yes', 'No/No Data'],
            colors: ['#0eb308', '#78706d']
          }),
          util.makeCheckboxExploration({
            name: 'Nice landscaping',
            question: 'Are-there-pedestrian-amenities-Select-all-that-apply-Nice-landscaping',
            predicate: ['What-would-you-like-to-record', 'Sidewalk-Quality'],
            values: ['yes', 'no'],
            valueNames: ['Yes', 'No/No Data'],
            colors: ['#0eb308', '#78706d']
          }),
          util.makeCheckboxExploration({
            name: 'Benches',
            question: 'Are-there-pedestrian-amenities-Select-all-that-apply-Benches',
            predicate: ['What-would-you-like-to-record', 'Sidewalk-Quality'],
            values: ['yes', 'no'],
            valueNames: ['Yes', 'No/No Data'],
            colors: ['#0eb308', '#78706d']
          }),
          util.makeCheckboxExploration({
            name: 'Public art',
            question: 'Are-there-pedestrian-amenities-Select-all-that-apply-Public-art',
            predicate: ['What-would-you-like-to-record', 'Sidewalk-Quality'],
            values: ['yes', 'no'],
            valueNames: ['Yes', 'No/No Data'],
            colors: ['#0eb308', '#78706d']
          }),
          util.makeCheckboxExploration({
            name: 'Other pedestrian amenities',
            question: 'Are-there-pedestrian-amenities-Select-all-that-apply-Other',
            predicate: ['What-would-you-like-to-record', 'Sidewalk-Quality'],
            values: ['yes', 'no'],
            valueNames: ['Yes', 'No/No Data'],
            colors: ['#0eb308', '#78706d']
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
              styles: util.simpleStyles({ color: '#810f7c' })
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
              styles: util.simpleStyles({color: '#810f7c'})
            }
          }]
        }]
      }, {
        layerName: 'Intersection Quality Reports',
        layerId: 'ec7984d0-2719-11e4-b45c-5d65d83b39b6',
        color: '#fc8d62',
        state: 'inactive',
        options: {
          comments: true,
          anonymous: true
        },
        countPath: 'stats.What-would-you-like-to-record.Intersection-Quality',
        query: {
          'entries.responses.What-would-you-like-to-record': 'Intersection-Quality'
        },
        select: {},
        styles: util.simpleStyles({color: '#fc8d62'}),
        exploration: [
          util.makeBasicExploration({
            name: 'Overall Pedestrian Environment Rating',
            question: 'How-would-you-rate-the-pedestrian-environment-overall-1-5-5highest',
            // This question is repeated among sidewalk/intersection/pedestrian
            // observations with the same ID, so we need to avoid mapping data
            // from the wrong virtual layer.
            query: {
              'entries.responses.What-would-you-like-to-record': 'Intersection-Quality'
            },
            values: ['5-highest', '4', '3', '2', '1-lowest'],
            valueNames: ['5 (highest)', '4', '3', '2', '1 (Lowest)'],
            colors: ['#05A17D', '#8BB272', '#ead02b', '#ef8e3a', '#e94027']
          }),
          util.makeBasicExploration({
            name: 'Lanes to cross',
            question: 'How-many-lanes-are-there-to-cross',
            values: ['1', '2', '3', '4', '5', '6', '7-or-more'],
            valueNames: ['1', '2', '3', '4', '5', '6', '7 or more'],
            colors: ['#04b485', '#9ec74c', '#ABB070', '#e5de0d', '#CF9F15', '#ec6d39', '#e94027']
          }),
          util.makeBasicExploration({
            name: 'Painted crosswalks',
            question: 'Are-there-painted-crosswalks',
            values: ['Yes-for-all-crossing-directions', 'Yes-for-some-crossing-directions', 'No'],
            valueNames: ['All crossing directions', 'Some crossing directions', 'No crosswalks'],
            colors: ['#04b485', '#e5de0d', '#e94027']
          }),
          util.makeCheckboxExploration({
            name: 'Median islands',
            question: 'Are-there-pedestrian-amenities-Select-all-that-apply-Median-islands',
            predicate: ['What-would-you-like-to-record', 'Intersection-Quality'],
            values: ['yes', 'no'],
            valueNames: ['Yes', 'No'],
            colors: ['#0eb308', '#78706d']
          }),
          util.makeCheckboxExploration({
            name: 'Bulb-outs',
            question: 'Are-there-pedestrian-amenities-Select-all-that-apply-Bulb-outs',
            predicate: ['What-would-you-like-to-record', 'Intersection-Quality'],
            values: ['yes', 'no'],
            valueNames: ['Yes', 'No'],
            colors: ['#0eb308', '#78706d']
          }),
          util.makeCheckboxExploration({
            name: 'Accessible curb ramps',
            question: 'Are-there-pedestrian-amenities-Select-all-that-apply-Accessible-curb-ramps-for-wheelchairs',
            predicate: ['What-would-you-like-to-record', 'Intersection-Quality'],
            values: ['yes', 'no'],
            valueNames: ['Yes', 'No/No Data'],
            colors: ['#0eb308', '#78706d']
          }),
          util.makeCheckboxExploration({
            name: 'Other pedestrian amenities',
            question: 'Are-there-pedestrian-amenities-Select-all-that-apply-Other',
            predicate: ['What-would-you-like-to-record', 'Intersection-Quality'],
            values: ['yes', 'no'],
            valueNames: ['Yes', 'No/No Data'],
            colors: ['#0eb308', '#78706d']
          }),
          util.makeCheckboxExploration({
            name: 'Traffic signals',
            question: 'Are-there-traffic-controls-Select-all-that-apply-Traffic-signal',
            predicate: ['What-would-you-like-to-record', 'Intersection-Quality'],
            values: ['yes', 'no'],
            valueNames: ['Yes', 'No'],
            colors: ['#0eb308', '#78706d']
          }),
          util.makeCheckboxExploration({
            name: 'Pedestrian signals',
            question: 'Are-there-traffic-controls-Select-all-that-apply-Pedestrian-signal',
            predicate: ['What-would-you-like-to-record', 'Intersection-Quality'],
            values: ['yes', 'no'],
            valueNames: ['Yes', 'No'],
            colors: ['#0eb308', '#78706d']
          }),
          util.makeBasicExploration({
            name: 'Stop signs',
            query: {
              'entries.responses.What-would-you-like-to-record': 'Intersection-Quality'
            },
            question: 'How-many-stop-signs',
            values: ['All-way', '2-way', 'Other'],
            valueNames: ['All-way stop sign', 'Two-way stop sign', 'Other stop sign'],
            colors: ['#0eb308', '#7570b3', '#386cb0'],
            showNoResponse: true
          }),
          util.makeCheckboxExploration({
            name: 'Shade trees',
            question: 'Are-there-pedestrian-amenities-Select-all-that-apply-Shade-trees',
            predicate: ['What-would-you-like-to-record', 'Intersection-Quality'],
            values: ['yes', 'no'],
            valueNames: ['Yes', 'No/No Data'],
            colors: ['#0eb308', '#78706d']
          }),
          util.makeCheckboxExploration({
            name: 'Nice landscaping',
            question: 'Are-there-pedestrian-amenities-Select-all-that-apply-Nice-landscaping',
            predicate: ['What-would-you-like-to-record', 'Intersection-Quality'],
            values: ['yes', 'no'],
            valueNames: ['Yes', 'No/No Data'],
            colors: ['#0eb308', '#78706d']
          }),
          util.makeCheckboxExploration({
            name: 'Benches',
            question: 'Are-there-pedestrian-amenities-Select-all-that-apply-Benches',
            predicate: ['What-would-you-like-to-record', 'Intersection-Quality'],
            values: ['yes', 'no'],
            valueNames: ['Yes', 'No/No Data'],
            colors: ['#0eb308', '#78706d']
          }),
          util.makeCheckboxExploration({
            name: 'Public art',
            question: 'Are-there-pedestrian-amenities-Select-all-that-apply-Public-art',
            predicate: ['What-would-you-like-to-record', 'Intersection-Quality'],
            values: ['yes', 'no'],
            valueNames: ['Yes', 'No/No Data'],
            colors: ['#0eb308', '#78706d']
          }),
          util.makeCheckboxExploration({
            name: 'Other pedestrian amenities',
            question: 'Are-there-pedestrian-amenities-Select-all-that-apply-Other',
            predicate: ['What-would-you-like-to-record', 'Intersection-Quality'],
            values: ['yes', 'no'],
            valueNames: ['Yes', 'No/No Data'],
            colors: ['#0eb308', '#78706d']
          }),
          util.makeCheckboxExploration({
            name: 'Drivers disobeying stop signs/traffic signals',
            question: 'Are-there-problems-with-driver-behavior-Select-all-that-apply-Not-obeying-stop-signs-or-traffic-signals',
            predicate: ['What-would-you-like-to-record', 'Intersection-Quality'],
            values: ['yes', 'no'],
            valueNames: ['Yes', 'No'],
            colors: ['#e64212', '#78706d']
          }),
          util.makeCheckboxExploration({
            name: 'Drivers disobeying speed limit',
            question: 'Are-there-problems-with-driver-behavior-Select-all-that-apply-Not-obeying-the-speed-limit',
            predicate: ['What-would-you-like-to-record', 'Intersection-Quality'],
            values: ['yes', 'no'],
            valueNames: ['Yes', 'No'],
            colors: ['#e64212', '#78706d']
          }),
          util.makeCheckboxExploration({
            name: 'Drivers not yielding to pedestrians',
            question: 'Are-there-problems-with-driver-behavior-Select-all-that-apply-Not-yielding-to-pedestrians',
            predicate: ['What-would-you-like-to-record', 'Intersection-Quality'],
            values: ['yes', 'no'],
            valueNames: ['Yes', 'No'],
            colors: ['#e64212', '#78706d']
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
            styles: util.simpleStyles({ color: '#810f7c' })
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
              styles: util.simpleStyles({color: '#810f7c'})
            }
          }]
        }]
      }, {
        layerName: 'Pedestrian Counts',
        layerId: 'ec7984d0-2719-11e4-b45c-5d65d83b39b6',
        state: 'inactive',
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
        styles: util.simpleStyles({color: '#8da0cb', pointSize: 15}),
        exploration: [
          util.makeBasicExploration({
            name: 'Overall Pedestrian Environment Rating',
            question: 'How-would-you-rate-the-pedestrian-environment-overall-1-5-5highest',
            // This question is repeated among sidewalk/intersection/pedestrian
            // observations with the same ID, so we need to avoid mapping data
            // from the wrong virtual layer.
            query: {
              'entries.responses.What-would-you-like-to-record': 'Number-of-Pedestrians-'
            },
            values: ['5-highest', '4', '3', '2', '1-lowest'],
            valueNames: ['5 (highest)', '4', '3', '2', '1 (Lowest)'],
            colors: ['#05A17D', '#8BB272', '#ead02b', '#ef8e3a', '#e94027'],
            pointSize: 15
          }), {
            name: 'Pedestrian activity',
            layer: {
              query: {
                'entries.responses.What-would-you-like-to-record': 'Number-of-Pedestrians-'
              },
              select: {
                'entries.responses.How-many-pedestrians-did-you-count-at-this-location': 1,
                'entries.responses.How-long-did-you-observe-this-street-segment': 1
              },
              styles: '@high: #4d004b;@medium: #8c6bb1;@low: #8c96c6;@vlow: #9ebcda;\n' +
              'Map { background-color: rgba(0,0,0,0); }\n' +
              '#localdata{\n' +
              'marker-line-width: 1; marker-width: 10; marker-fill-opacity: 0.9; marker-line-opacity: 1;\n' +
              '[zoom >= 16] { marker-line-width: 2; marker-width: 15; }\n' +
              '}\n' +
              '#localdata["responses.How-many-pedestrians-did-you-count-at-this-location">=15]["responses.How-long-did-you-observe-this-street-segment"="Less-than-15-minutes"],' +
              '["responses.How-many-pedestrians-did-you-count-at-this-location">=45]["responses.How-long-did-you-observe-this-street-segment"="15-30-minutes"],' +
              '["responses.How-many-pedestrians-did-you-count-at-this-location">=75]["responses.How-long-did-you-observe-this-street-segment"="30-45-minutes"],' +
              '["responses.How-many-pedestrians-did-you-count-at-this-location">=105]["responses.How-long-did-you-observe-this-street-segment"="45-60-minutes"],' +
              '["responses.How-many-pedestrians-did-you-count-at-this-location">=135]["responses.How-long-did-you-observe-this-street-segment"="more-than-60-minutes"]' +
              '{ marker-type: ellipse; marker-line-color: @high; marker-fill: @high;}\n' +
              '#localdata["responses.How-many-pedestrians-did-you-count-at-this-location">=10]["responses.How-many-pedestrians-did-you-count-at-this-location"<15]["responses.How-long-did-you-observe-this-street-segment"="Less-than-15-minutes"],' +
              '["responses.How-many-pedestrians-did-you-count-at-this-location">=30]["responses.How-many-pedestrians-did-you-count-at-this-location"<45]["responses.How-long-did-you-observe-this-street-segment"="15-30-minutes"],' +
              '["responses.How-many-pedestrians-did-you-count-at-this-location">=50]["responses.How-many-pedestrians-did-you-count-at-this-location"<75]["responses.How-long-did-you-observe-this-street-segment"="30-45-minutes"],' +
              '["responses.How-many-pedestrians-did-you-count-at-this-location">=70]["responses.How-many-pedestrians-did-you-count-at-this-location"<105]["responses.How-long-did-you-observe-this-street-segment"="45-60-minutes"],' +
              '["responses.How-many-pedestrians-did-you-count-at-this-location">=90]["responses.How-many-pedestrians-did-you-count-at-this-location"<135]["responses.How-long-did-you-observe-this-street-segment"="more-than-60-minutes"]' +
              '{ marker-type: ellipse; marker-line-color: @medium; marker-fill: @medium;}\n' +
              '#localdata["responses.How-many-pedestrians-did-you-count-at-this-location">=8]["responses.How-many-pedestrians-did-you-count-at-this-location"<10]["responses.How-long-did-you-observe-this-street-segment"="Less-than-15-minutes"],' +
              '["responses.How-many-pedestrians-did-you-count-at-this-location">=23]["responses.How-many-pedestrians-did-you-count-at-this-location"<30]["responses.How-long-did-you-observe-this-street-segment"="15-30-minutes"],' +
              '["responses.How-many-pedestrians-did-you-count-at-this-location">=38]["responses.How-many-pedestrians-did-you-count-at-this-location"<50]["responses.How-long-did-you-observe-this-street-segment"="30-45-minutes"],' +
              '["responses.How-many-pedestrians-did-you-count-at-this-location">=53]["responses.How-many-pedestrians-did-you-count-at-this-location"<70]["responses.How-long-did-you-observe-this-street-segment"="45-60-minutes"],' +
              '["responses.How-many-pedestrians-did-you-count-at-this-location">=68]["responses.How-many-pedestrians-did-you-count-at-this-location"<90]["responses.How-long-did-you-observe-this-street-segment"="more-than-60-minutes"]' +
              '{ marker-type: ellipse; marker-line-color: @low; marker-fill: @low;}\n' +
              '#localdata["responses.How-many-pedestrians-did-you-count-at-this-location"<8]["responses.How-long-did-you-observe-this-street-segment"="Less-than-15-minutes"],' +
              '["responses.How-many-pedestrians-did-you-count-at-this-location"<23]["responses.How-long-did-you-observe-this-street-segment"="15-30-minutes"],' +
              '["responses.How-many-pedestrians-did-you-count-at-this-location"<38]["responses.How-long-did-you-observe-this-street-segment"="30-45-minutes"],' +
              '["responses.How-many-pedestrians-did-you-count-at-this-location"<53]["responses.How-long-did-you-observe-this-street-segment"="45-60-minutes"],' +
              '["responses.How-many-pedestrians-did-you-count-at-this-location"<68]["responses.How-long-did-you-observe-this-street-segment"="more-than-60-minutes"]' +
              '{ marker-type: ellipse; marker-line-color: @vlow; marker-fill: @vlow;}'
            },
            values: [{
              text: 'High',
              name: 'high',
              color: '#4d004b',
              layer: {
                query: {
                  'entries.responses.What-would-you-like-to-record': 'Number-of-Pedestrians-'
                },
                select: {
                  'entries.responses.How-many-pedestrians-did-you-count-at-this-location': 1,
                  'entries.responses.How-long-did-you-observe-this-street-segment': 1
                },
                styles: '@high: #4d004b;\nMap { background-color: rgba(0,0,0,0); }\n' +
                '#localdata["responses.How-many-pedestrians-did-you-count-at-this-location">=15]["responses.How-long-did-you-observe-this-street-segment"="Less-than-15-minutes"],' +
                '["responses.How-many-pedestrians-did-you-count-at-this-location">=45]["responses.How-long-did-you-observe-this-street-segment"="15-30-minutes"],' +
                '["responses.How-many-pedestrians-did-you-count-at-this-location">=75]["responses.How-long-did-you-observe-this-street-segment"="30-45-minutes"],' +
                '["responses.How-many-pedestrians-did-you-count-at-this-location">=105]["responses.How-long-did-you-observe-this-street-segment"="45-60-minutes"],' +
                '["responses.How-many-pedestrians-did-you-count-at-this-location">=135]["responses.How-long-did-you-observe-this-street-segment"="more-than-60-minutes"]' +
                '{marker-type: ellipse; marker-line-color: @high; marker-fill: @high;' +
                'marker-line-width: 1; marker-width: 10; marker-fill-opacity: 0.9; marker-line-opacity: 1;\n' +
                '[zoom >= 16] { marker-line-width: 2; marker-width: 15; }\n' +
                '}\n'
              }
            }, {
              text: 'Medium',
              name: 'medium',
              color: '#8c6bb1',
              layer: {
                query: {
                  'entries.responses.What-would-you-like-to-record': 'Number-of-Pedestrians-'
                },
                select: {
                  'entries.responses.How-many-pedestrians-did-you-count-at-this-location': 1,
                  'entries.responses.How-long-did-you-observe-this-street-segment': 1
                },
                styles: '@medium: #8c6bb1;\nMap { background-color: rgba(0,0,0,0); }\n' +
                '#localdata["responses.How-many-pedestrians-did-you-count-at-this-location">=10]["responses.How-many-pedestrians-did-you-count-at-this-location"<15]["responses.How-long-did-you-observe-this-street-segment"="Less-than-15-minutes"],' +
                '["responses.How-many-pedestrians-did-you-count-at-this-location">=30]["responses.How-many-pedestrians-did-you-count-at-this-location"<45]["responses.How-long-did-you-observe-this-street-segment"="15-30-minutes"],' +
                '["responses.How-many-pedestrians-did-you-count-at-this-location">=50]["responses.How-many-pedestrians-did-you-count-at-this-location"<75]["responses.How-long-did-you-observe-this-street-segment"="30-45-minutes"],' +
                '["responses.How-many-pedestrians-did-you-count-at-this-location">=70]["responses.How-many-pedestrians-did-you-count-at-this-location"<105]["responses.How-long-did-you-observe-this-street-segment"="45-60-minutes"],' +
                '["responses.How-many-pedestrians-did-you-count-at-this-location">=90]["responses.How-many-pedestrians-did-you-count-at-this-location"<135]["responses.How-long-did-you-observe-this-street-segment"="more-than-60-minutes"]' +
                '{marker-type: ellipse; marker-line-color: @medium; marker-fill: @medium;' +
                'marker-line-width: 1; marker-width: 10; marker-fill-opacity: 0.9; marker-line-opacity: 1;\n' +
                '[zoom >= 16] { marker-line-width: 2; marker-width: 15; }\n' +
                '}\n'
              }
            }, {
              text: 'Low',
              name: 'low',
              color: '#8c96c6',
              layer: {
                query: {
                  'entries.responses.What-would-you-like-to-record': 'Number-of-Pedestrians-'
                },
                select: {
                  'entries.responses.How-many-pedestrians-did-you-count-at-this-location': 1,
                  'entries.responses.How-long-did-you-observe-this-street-segment': 1
                },
                styles: '@low: #8c96c6;\nMap { background-color: rgba(0,0,0,0); }\n' +
                '#localdata["responses.How-many-pedestrians-did-you-count-at-this-location">=8]["responses.How-many-pedestrians-did-you-count-at-this-location"<10]["responses.How-long-did-you-observe-this-street-segment"="Less-than-15-minutes"],' +
                '["responses.How-many-pedestrians-did-you-count-at-this-location">=23]["responses.How-many-pedestrians-did-you-count-at-this-location"<30]["responses.How-long-did-you-observe-this-street-segment"="15-30-minutes"],' +
                '["responses.How-many-pedestrians-did-you-count-at-this-location">=38]["responses.How-many-pedestrians-did-you-count-at-this-location"<50]["responses.How-long-did-you-observe-this-street-segment"="30-45-minutes"],' +
                '["responses.How-many-pedestrians-did-you-count-at-this-location">=53]["responses.How-many-pedestrians-did-you-count-at-this-location"<70]["responses.How-long-did-you-observe-this-street-segment"="45-60-minutes"],' +
                '["responses.How-many-pedestrians-did-you-count-at-this-location">=68]["responses.How-many-pedestrians-did-you-count-at-this-location"<90]["responses.How-long-did-you-observe-this-street-segment"="more-than-60-minutes"]' +
                '{marker-type: ellipse; marker-line-color: @low; marker-fill: @low;' +
                'marker-line-width: 1; marker-width: 10; marker-fill-opacity: 0.9; marker-line-opacity: 1;\n' +
                '[zoom >= 16] { marker-line-width: 2; marker-width: 15; }\n' +
                '}\n'
              }
            }, {
              text: 'Very Low',
              name: 'very-low',
              color: '#9ebcda',
              layer: {
                query: {
                  'entries.responses.What-would-you-like-to-record': 'Number-of-Pedestrians-'
                },
                select: {
                  'entries.responses.How-many-pedestrians-did-you-count-at-this-location': 1,
                  'entries.responses.How-long-did-you-observe-this-street-segment': 1
                },
                styles: '@vlow: #9ebcda;\nMap { background-color: rgba(0,0,0,0); }\n' +
                '#localdata["responses.How-many-pedestrians-did-you-count-at-this-location"<8]["responses.How-long-did-you-observe-this-street-segment"="Less-than-15-minutes"],' +
                '["responses.How-many-pedestrians-did-you-count-at-this-location"<23]["responses.How-long-did-you-observe-this-street-segment"="15-30-minutes"],' +
                '["responses.How-many-pedestrians-did-you-count-at-this-location"<38]["responses.How-long-did-you-observe-this-street-segment"="30-45-minutes"],' +
                '["responses.How-many-pedestrians-did-you-count-at-this-location"<53]["responses.How-long-did-you-observe-this-street-segment"="45-60-minutes"],' +
                '["responses.How-many-pedestrians-did-you-count-at-this-location"<68]["responses.How-long-did-you-observe-this-street-segment"="more-than-60-minutes"]' +
                '{marker-type: ellipse; marker-line-color: @vlow; marker-fill: @vlow;' +
                'marker-line-width: 1; marker-width: 10; marker-fill-opacity: 0.9; marker-line-opacity: 1;\n' +
                '[zoom >= 16] { marker-line-width: 2; marker-width: 15; }\n' +
                '}\n'
              }
            }]
          },
          util.makeBasicExploration({
            name: 'Observation duration',
            question: 'How-long-did-you-observe-this-street-segment',
            values: ['Less-than-15-minutes', '15-30-minutes', '30-45-minutes', '45-60-minutes', 'more-than-60-minutes'],
            valueNames: ['Less than 15 minutes', '15-30 minutes', '30-45 minutes', '45-60 minutes', 'More than 60 minutes'],
            colors: ['#9ebcda', '#8c96c6', '#8c6bb1', '#88419d', '#6e016b'],
            pointSize: 15
          }),
          util.makeBasicExploration({
            name: 'Temperature during observation',
            question: 'What-is-the-temperature-like',
            values: ['Warm-80-or-more', 'Mild-40-79', 'Cold-39-or-less'],
            valueNames: ['Warm (80º; or more)', 'Mild (40-79º)', 'Cold (39º; or less)'],
            colors: ['#7bc3f4', '#408dda', '#8856a7'],
            pointSize: 15
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
            styles: util.simpleStyles({ color: '#810f7c', pointSize: 15 })
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
              styles: util.simpleStyles({color: '#810f7c', pointSize: 15})
            }
          }]
        }]
      }]
    }
  };

  return projects;
});
