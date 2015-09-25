/*jslint nomen: true */
/*globals define: true */

define(function(require, exports, module) {
  'use strict';

  // Libs
  var _ = require('lib/lodash');
  var util = require('./project-utils');

  /*
  Original colors:
    '#3567a4', - blue
    '#8329cd', - purple
    '#f4c431', - yellow
    '#05b04c', - green
    '#d84e6c', - red
    '#d79b3b', - orange
    '#d3d3d3'  - gray
  */

  // https://app.localdata.com/api/surveys/8a340df0-87af-11e2-9485-c3fff44e7c8e/forms
  var newark = {
    name: 'South Ward Parcel Survey',
    description: '',
    baselayer: '//a.tiles.mapbox.com/v3/matth.g93nnjc2/{z}/{x}/{y}.png', // light
    // baselayer: '//a.tiles.mapbox.com/v3/matth.kmf6l3h1/{z}/{x}/{y}.png',
    location: 'Newark, NJ',
    center: [-74.209213, 40.717719],
    zoom: 15,
    scrollWheelZoom: false,
    surveys: [{
      layerName: 'Parcels surveyed',
      layerId: '44f94b00-4005-11e4-b627-69499f28b4e5',
      color: '#45403e',
      options: {
        anonymous: true,
        exploreButton: true,
        quickViews: true,
        hideCollectorNames: true,
        explorationControlsItem: true
      },
      countPath: 'survey.responseCount',
      query: {},
      select: {},
      filters: {
        question: 'Property condition'
      },
      styles: util.simpleStyles({color: '#45403e'}),
      quickViews: [{
        title: 'Condition of vacant properties',
        question: 'Condition of vacant properties'
      }, {
        title: 'Maintenance of vacant properties',
        question: 'Maintenance of vacant properties'
      }, {
        title: 'Commercial usage',
        question: 'Commercial usage'
      }],
      exploration: [
        util.makeBasicExploration({
          name: 'Structures & lots',
          question: 'How-is-the-lot-being-used',
          values: [
            'no response',
            'Vacant-lot-or-open-space',
            'Park-or-garden',
            'Formal-parking-lot-paved-or-graveled',
            'Informal-parking-lot-unpaved',
            'Utilities',
            'Junkyard-or-scrapyard',
            'Unsure'
          ],
          valueNames: [
            'Structure',
            'Vacant or open space',
            'Park or garden',
            'Formal parking lot (paved or graveled)',
            'Informal parking lot (unpaved)',
            'Utilities',
            'Junkyard or scrapyard',
            'Unsure'
          ],
          colors: ['#3567a4', '#c7e9a7', '#84b655', '#d79b3b', '#f8be76', '#9756cd', '#b65066', '#d3d3d3'],
          showNoResponse: true
        }),

        util.makeBasicExploration({
          name: 'Occupancy',
          question: 'Does-the-structure-appear-vacant-or-occupied',
          values: [
            'Occupied',
            'Partially-occupied--one-floor-may-appear-vacant-but-other-floors-may-appear-occupied',
            'Possibly-Vacant',
            'Unsure'
          ],
          valueNames: [
            'Occupied',
            'Partially Occupied (one floor may appear vacant)',
            'Possibly Vacant',
            'Unusure'
          ],
          colors: ['#3567a4', '#92c5de', '#d79b3b',  '#d3d3d3']
        }),

        util.makeBasicExploration({
          name: 'Property condition',
          question: 'What-is-the-overall-condition-of-the-structure',
          values: [
            'Good-condition',
            'Fair-condition',
            'Severe-condition',
            'Unsure'
          ],
          valueNames: [
            "Good",
            'Fair',
            'Severe',
            'Unsure'
          ],
          colors: ['#3567a4', '#92c5de', '#d84e6c', '#d3d3d3']
          // purples:
          // colors: ['#05b04c', '#a5e76b', '#d3d3d3', '#d791da', '#85048a']
        }),

        util.makeComplexExploration({
          name: 'Condition of vacant properties',
          choices: [{
            name: 'Good',
            select: [{
              key: 'Does-the-structure-appear-vacant-or-occupied',
              value: 'Possibly-Vacant'
            }, {
              key: 'What-is-the-overall-condition-of-the-structure',
              value: 'Good-condition'
            }],
            color: '#3567a4'
          }, {
            name: 'Fair',
            select: [{
              key: 'Does-the-structure-appear-vacant-or-occupied',
              value: 'Possibly-Vacant'
            }, {
              key: 'What-is-the-overall-condition-of-the-structure',
              value: 'Fair-condition'
            }],
            color: '#f4c431'
          }, {
            name: 'Bad',
            select: [{
              key: 'Does-the-structure-appear-vacant-or-occupied',
              value: 'Possibly-Vacant'
            }, {
              key: 'What-is-the-overall-condition-of-the-structure',
              value: 'Severe-condition'
            }],
            color: '#d84e6c'
          }]
        }),

        util.makeComplexExploration({
          name: 'Maintenance of vacant properties',
          choices: [{
            name: 'Maintained',
            select: [{
              key: 'Does-the-structure-appear-vacant-or-occupied',
              value: 'Possibly-Vacant'
            }, {
              key: 'Is-the-property-maintained',
              value: 'Yes'
            }],
            color: '#3567a4'
          }, {
            name: 'Unmaintained',
            select: [{
              key: 'Does-the-structure-appear-vacant-or-occupied',
              value: 'Possibly-Vacant'
            }, {
              key: 'Is-the-property-maintained',
              value: 'No'
            }],
            color: '#d84e6c'
          }, {
            name: 'Unsure',
            select: [{
              key: 'Does-the-structure-appear-vacant-or-occupied',
              value: 'Possibly-Vacant'
            }, {
              key: 'Is-the-property-maintained',
              value: 'Unsure'
            }],
            color: '#d3d3d3'
          }]
        }),

        util.makeBasicExploration({
          name: 'Structures needing boarding',
          question: 'Is-the-structure-in-need-of-boarding',
          values: [
            'Yes-one-or-more-window-or-door-is-open',
            'No-windows-and-doors-are-boarded',
            'No-windows-and-doors-are-in-good-condition',
            'Unsure'
          ],
          valueNames: [
            'Yes - one or more window or door is open',
            'No - structure is boarded',
            'No - structure is in good condition',
            'Unusure'
          ],
          colors: ['#d84e6c', '#d79b3b', '#92c5de',  '#d3d3d3']
        }),

        util.makeBasicExploration({
          name: 'Sites with dumping',
          question: 'Is-there-dumping-on-the-property',
          values: [
            'Yes',
            'No'
          ],
          valueNames: [
            'Dumping observed',
            'No dumping observed'
          ],
          colors: ['#d84e6c', '#92c5de', '#d3d3d3']
        }),

        util.makeBasicExploration({
          name: 'Sites with accumulated trash',
          question: 'Is-there-a-significant-accumulation-of-trash-or-tossables-on-the-property',
          values: [
            'Yes',
            'No',
            'Unsure'
          ],
          valueNames: [
            'Trash observed',
            'No trash observed',
            'Unsure'
          ],
          colors: ['#d84e6c', '#3c97cc', '#d3d3d3']
          // colors: ['#d84e6c', '#92c5de', '#d3d3d3']
        }),

        util.makeBasicExploration({
          name: 'Property maintenance status',
          question: 'Is-the-property-maintained',
          values: [
            'Yes',
            'No',
            'Unsure'
          ],
          valueNames: [
            'Maintained',
            'Unmaintained',
            'Unsure'
          ],
          colors: ['#92c5de', '#d84e6c', '#d79b3b']
        }),

        util.makeBasicExploration({
          name: 'Fire-damaged structures',
          question: 'Is-there-evidence-of-fire-damage',
          values: [
            'No',
            'Yes',
            'Unsure',
            'no response'
          ],
          valueNames: [
            'No damage',
            "Yes",
            'Unsure',
            'Not applicable'
          ],
          colors: ['#92c5de', '#d84e6c', '#d79b3b', '#d3d3d3'],
          showNoResponse: true
        }),

        util.makeBasicExploration({
          name: 'Property use',
          question: 'What-is-the-structures-use',
          values: [
            'Residential',
            'Commercial',
            'Industrial',
            'Institutional',
            'Utilities-or-Infrastructure',
            'Under-Construction',
            'Unsure'
          ],
          valueNames: [
            'Residential',
            'Commercial',
            'Industrial',
            'Institutional',
            'Utilities or Infrastructure',
            'Under Construction',
            'Unsure'
          ],
          colors:  [
            '#3567a4',
            '#9756cd',
            '#f8b868',
            '#92b670',
            '#d84e6c',
            '#d79b3b',
            '#d3d3d3'
          ]
        }),

        util.makeComplexExploration({
          name: 'Commercial property use',
          choices: [{
            name: 'Supermarket',
            select: [{
              key: 'Which-of-the-following-best-describes-the-Commercial-structure-Supermarket',
              value: 'yes'
            }],
            color: '#3567a4'
          }, {
            name: 'Small grocery store (corner store or convenience store)',
            select: [{
              key: 'Which-of-the-following-best-describes-the-Commercial-structure-Small-grocery-store-corner-store-or-convenience-store',
              value: 'yes'
            }],
            color: '#4e91c5'
          }, {
            name: 'Specialty food store',
            select: [{
              key: 'Which-of-the-following-best-describes-the-Commercial-structure-Specialty-food-store',
              value: 'yes'
            }],
            color: '#b5d7f1'
          }, {
            name: 'Liquor, wine, or beer store',
            select: [{
              key: 'Which-of-the-following-best-describes-the-Commercial-structure-Liquor-wine-or-beer-store',
              value: 'yes'
            }],
            color: '#f8b868'
          }, {
            name: 'Fast-food restaurant',
            select: [{
              key: 'Which-of-the-following-best-describes-the-Commercial-structure-Fast-food-restaurant',
              value: 'yes'
            }],
            color: '#c7e9a7'
          }, {
            name: 'Dine-in restaurant',
            select: [{
              key: 'Which-of-the-following-best-describes-the-Commercial-structure-Dine-in-restaurant',
              value: 'yes'
            }],
            color: '#92b670'
          }, {
            name: 'Doctor’s or dentist’s office',
            select: [{
              key: 'Which-of-the-following-best-describes-the-Commercial-structure-Doctors-or-dentists-office',
              value: 'yes'
            }],
            color: '#9756cd'
          }, {
            name: 'Automotive oriented business',
            select: [{
              key: 'Which-of-the-following-best-describes-the-Commercial-structure-Automotive-oriented-business',
              value: 'yes'
            }],
            color: '#b65066'
          }, {
            name: 'Retail sales, general commercial, and office uses',
            select: [{
              key: 'Which-of-the-following-best-describes-the-Commercial-structure-Retail-sales-general-commercial-and-office-uses',
              value: 'yes'
            }],
            color: '#d7890d'
          }, {
            name: 'Other commercial use / Unsure',
            select: [{
              key: 'Which-of-the-following-best-describes-the-Commercial-structure-Other-commercial-use--Unsure',
              value: 'yes'
            }],
            color: '#d3d3d3'
          }]
        })

      ]
    }],

    // Foreign layers
    foreignInteractive: [
      // Static council districts
      {
        type: 'cartodb',
        layerName: 'Schools',
        attribution: '',
        color: '#ff7a00',
        zIndex: 20,
        dataQuery: 'select * from newark_schools as _cartodbjs_alias where cartodb_id = <%= cartodb_id %>',
        humanReadableField: 'name',
        handleMouseover: true, // requires humanReadableField
        // fieldNames: {
        //   usedesc: 'Use',
        //   propertyow: 'Property Owner'
        // },
        config: {
          version: '1.0.1',
          stat_tag: '', // 'c8c949c0-7ce7-11e4-a232-0e853d047bba',
          // disableGrid: true,
          layers:[{
            type:'cartodb',
            options:{
              sql: 'select * from newark_schools',

              cartocss: "/** simple visualization */#newark_schools{  marker-type: ellipse; marker-width: 10; marker-allow-overlap: true; marker-fill: #ff9823; marker-line-color: #fff; marker-fill-opacity: 1; marker-line-width: 2.5; marker-line-opacity: 1;}",
              cartocss_version: '2.1.1',
              interactivity: ['cartodb_id']
            }
          }]
        },
        layerId: 'newark-schools'
      }
    ]
  };

  return newark;

});
