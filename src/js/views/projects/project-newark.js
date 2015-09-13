/*jslint nomen: true */
/*globals define: true */

define(function(require, exports, module) {
  'use strict';

  // Libs
  var _ = require('lib/lodash');
  var util = require('./project-utils');

  /*
  Original colors:
    '#0571b0', - blue
    '#8329cd', - purple
    '#f4c431', - yellow
    '#05b04c', - green
    '#ca0020', - red
    '#f46d31', - orange
    '#d3d3d3'  - gray
  */

  // https://app.localdata.com/api/surveys/8a340df0-87af-11e2-9485-c3fff44e7c8e/forms
  var newark = {
    name: 'South Ward Parcel Survey',
    description: '',
    // baselayer: '//a.tiles.mapbox.com/v3/matth.g93nnjc2/{z}/{x}/{y}.png',
    baselayer: '//a.tiles.mapbox.com/v3/matth.kmf6l3h1/{z}/{x}/{y}.png',
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
      exploration: [
        util.makeBasicExploration({
          name: 'Structures & lots',
          question: 'Is-there-a-structure-on-the-parcel',
          values: [
            'yes',
            'No-empty-lot'
          ],
          valueNames: [
            'Yes',
            'No (empty lot)'
          ],
          colors: ['#3782b7', '#f8b25b']
          // colors: ['#0571b0', '#f46d31']
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
          colors: ['#0571b0', '#92c5de', '#f46d31',  '#d3d3d3']
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
          colors: ['#0571b0', '#92c5de', '#ca0020', '#d3d3d3']
          // purples:
          // colors: ['#05b04c', '#a5e76b', '#d3d3d3', '#d791da', '#85048a']
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
          colors: ['#ca0020', '#92c5de', '#d3d3d3']
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
          colors: ['#b65066', '#3c97cc', '#d3d3d3']
          // colors: ['#ca0020', '#92c5de', '#d3d3d3']
        }),

        util.makeBasicExploration({
          name: 'Maintenance status',
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
          colors: ['#92c5de', '#ca0020', '#f46d31']
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
          colors: ['#0571b0', '#ca0020', '#f46d31', '#d3d3d3'],
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
            '#0571b0',
            '#8329cd',
            '#f4c431',
            '#05b04c',
            '#ca0020',
            '#f46d31',
            '#d3d3d3'
          ]
        })

        /*

        // Public building info
        util.makeBasicExploration({
          name: 'Public owner',
          question: 'deeded-own',
          values: [
            'City of Gary',
            'City of Gary Redevelopment Commission',
            'Parks Department'
          ],
          valueNames: [
            'City of Gary',
            'City of Gary Redevelopment Commission',
            'Parks Department'
          ],
          colors: ['#f46d31', '#0571b0', '#05b04c']
        })
        util.makeTextExploration({
          name: 'Assessed value',
          question: 'assessed'
        }),
        util.makeTextExploration({
          name: 'Lot square feet',
          question: 'lot_sf'
        }),
        util.makeTextExploration({
          name: 'Building square feet',
          question: 'bldg_sf'
        })*/
      ]
    }]
  };

  return newark;

});
