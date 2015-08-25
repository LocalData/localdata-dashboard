/*jslint nomen: true */
/*globals define: true */

define(function(require, exports, module) {
  'use strict';

  // Libs
  var _ = require('lib/lodash');
  var util = require('./project-utils');

  // https://app.localdata.com/api/surveys/8a340df0-87af-11e2-9485-c3fff44e7c8e/forms
  var gary = {
    name: 'Gary Parcel Survey',
    description: '',
    baselayer: '//a.tiles.mapbox.com/v3/matth.kmf6l3h1/{z}/{x}/{y}.png',
    location: 'Gary, IN',
    center: [-87.346427, 41.59337],
    zoom: 13,
    scrollWheelZoom: false,
    surveys: [{
      layerName: 'Parcels surveyed',
      layerId: '2012edd0-b17c-11e4-b2e2-af76412575df',
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
          name: 'Is there a structure?',
          question: 'structure',
          values: [
            'yes',
            'no'
          ],
          valueNames: [
            'Yes',
            'No structure'
          ],
          colors: ['#0571b0', '#05b04c']
        }),
        util.makeBasicExploration({
          name: 'Occupancy',
          question: 'vacant-abandoned',
          values: [
            'occupied-structure',
            'vacant-abandoned-structure'
          ],
          valueNames: [
            'Occupied',
            'Vacant'
          ],
          colors: ['#0571b0', '#f46d31']
        }),
        util.makeBasicExploration({
          name: 'Property condition',
          question: 'structure-grade',
          values: [
            'excellent',
            'good',
            'fair',
            'poor',
            'dangerous'
          ],
          valueNames: [
            'Excellent',
            "Good",
            'Fair',
            'Poor',
            'Dangerous'
          ],
          colors: ['#0571b0', '#92c5de', '#d3d3d3', '#f46d31', '#ca0020']
          // purples:
          // colors: ['#05b04c', '#a5e76b', '#d3d3d3', '#d791da', '#85048a']
        }),
        util.makeBasicExploration({
          name: 'Fire damage on blighted buildings',
          question: 'structural-damage',
          values: [
            'none',
            'some-damage',
            'significant-damage',
            'no response'
          ],
          valueNames: [
            'No damage',
            "Some fire damage",
            'Significant fire damage',
            'Not applicable'
          ],
          colors: ['#0571b0', '#f46d31', '#ca0020', '#d3d3d3'],
          showNoResponse: true
        }),
        // util.makeBasicExploration({
        //   name: 'Enclosed buildings',
        //   question: 'enclosed-secure',
        //   values: [
        //     'yes',
        //     'no'
        //   ],
        //   valueNames: [
        //     'Building Enclosed/Secure',
        //     "Building Not Enclosed/Secure"
        //   ],
        //   colors: ['#0571b0', '#ca0020']
        // }),
        // util.makeBasicExploration({
        //   name: 'Parking lot',
        //   question: 'parking-lot',
        //   values: [
        //     'yes',
        //     'no'
        //   ],
        //   valueNames: [
        //     'Yes',
        //     'No'
        //   ],
        //   colors: ['#0571b0', '#535353']
        // }),

        util.makeBasicExploration({
          name: 'Residential use structures',
          question: 'residential',
          values: [
            'yes'
          ],
          valueNames: [
            'Yes'
          ],
          colors: ['#0571b0']
        }),

        util.makeBasicExploration({
          name: 'Commercial use structures',
          question: 'commercial',
          values: [
            'yes'
          ],
          valueNames: [
            "Yes"
          ],
          colors: ['#0571b0']
        }),

        util.makeBasicExploration({
          name: 'Public use structures',
          question: 'public-gov',
          values: [
            'yes'
          ],
          valueNames: [
            'Yes'
          ],
          colors: ['#0571b0']
        }),

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
          colors: ['#f46d31', '#45403e', '#92c5de', '#ca0020', '#0571b0', '#05b04c']
        }),
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
        })
      ]
    }]
  };

  return gary;

});
