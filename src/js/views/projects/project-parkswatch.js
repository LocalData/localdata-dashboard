/*jslint nomen: true */
/*globals define: true */

define(function(require, exports, module) {
  'use strict';

  // Libs
  var _ = require('lib/lodash');
  var util = require('./project-utils');

  var parkswatch = {
    name: 'Parkswatch 2015',
    description: '',
    baselayer: '//a.tiles.mapbox.com/v3/matth.kmf6l3h1/{z}/{x}/{y}.png',
    location: 'Detroit, MI',
    center: [-83.067198, 42.362125],
    zoom: 14,
    scrollWheelZoom: false,
    surveys: [{
      layerName: 'Parks surveyed',
      layerId: '9ec5a050-08b6-11e5-9ef2-9bc394c573ea',
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
      // filters: {
      //   question: 'Property condition'
      // },
      styles: util.simpleStyles({color: '#45403e'}),
      exploration: [
        util.makeTextExploration({
          name: 'Park or Greenway Name',
          question: 'Park-or-Greenway-Name'
        }),

        // Weather
        util.makeBasicExploration({
          name: 'Sunny weather',
          question: 'Weather-check-all-that-apply-Sunny',
          values: ['yes'],
          valueNames: ['Yes'],
          colors: ['#e64212']
        }),
        util.makeBasicExploration({
          name: 'Cloudy weather',
          question: 'Weather-check-all-that-apply-Cloudy',
          values: ['yes'],
          valueNames: ['Yes'],
          colors: ['#e64212']
        }),
        util.makeBasicExploration({
          name: 'Rainy weather',
          question: 'Weather-check-all-that-apply-Rainy',
          values: ['yes'],
          valueNames: ['Yes'],
          colors: ['#e64212']
        }),
        util.makeBasicExploration({
          name: 'Hot weather',
          question: 'Weather-check-all-that-apply-Hot',
          values: ['yes'],
          valueNames: ['Yes'],
          colors: ['#e64212']
        }),
        util.makeBasicExploration({
          name: 'Cold weather',
          question: 'Weather-check-all-that-apply-Cold',
          values: ['yes'],
          valueNames: ['Yes'],
          colors: ['#e64212']
        }),
        util.makeBasicExploration({
          name: 'Other weather',
          question: 'Weather-check-all-that-apply-Other',
          values: ['yes'],
          valueNames: ['Yes'],
          colors: ['#e64212']
        }),

        util.makeTextExploration({
          name: 'How many people are at the park?',
          question: 'About-how-many-people-do-you-see-at-the-park'
        }),
        util.makeTextExploration({
          name: 'How many kids (age 0-16)?',
          question: 'About-how-many-kids-do-you-see-at-the-park-age-0-16'
        }),
        util.makeTextExploration({
          name: 'How many older adults? (55+)',
          question: 'About-how-many-older-adults-do-you-see-at-the-park-age-55'
        }),
        util.makeTextExploration({
          name: 'How many bikes?',
          question: 'About-how-many-bikes-do-you-see-at-the-park'
        }),
        util.makeTextExploration({
          name: 'How many cars?',
          question: 'About-how-many-cars-do-you-see-at-the-park'
        }),

        util.makeBasicExploration({
          name: 'People Picnicking/BBQing',
          question: 'What-are-people-doing-PicnickingBBQing',
          values: ['yes'],
          valueNames: ['Yes'],
          colors: ['#e64212']
        }),
        util.makeBasicExploration({
          name: 'People playing pick-up sports',
          question: 'What-are-people-doing-Pick-up-sports',
          values: ['yes'],
          valueNames: ['Yes'],
          colors: ['#e64212']
        }),
        util.makeBasicExploration({
          name: 'People playing organized sports',
          question: 'What-are-people-doing-Organized-sports',
          values: ['yes'],
          valueNames: ['Yes'],
          colors: ['#e64212']
        }),
        util.makeBasicExploration({
          name: 'People walking/jogging',
          question: 'What-are-people-doing-Walkingjogging',
          values: ['yes'],
          valueNames: ['Yes'],
          colors: ['#e64212']
        }),
        util.makeBasicExploration({
          name: 'People biking',
          question: 'What-are-people-doing-Biking',
          values: ['yes'],
          valueNames: ['Yes'],
          colors: ['#e64212']
        }),
        util.makeBasicExploration({
          name: 'People enjoying nature',
          question: 'What-are-people-doing-Enjoying-nature',
          values: ['yes'],
          valueNames: ['Yes'],
          colors: ['#e64212']
        }),
        util.makeBasicExploration({
          name: 'People playing games like checkers or chess',
          question: 'What-are-people-doing-Playing-games-like-checkers-or-chess',
          values: ['yes'],
          valueNames: ['Yes'],
          colors: ['#e64212']
        }),
        util.makeBasicExploration({
          name: 'Other',
          question: 'What-are-people-doing-Other',
          values: ['yes'],
          valueNames: ['Yes'],
          colors: ['#e64212']
        }),
        util.makeTextExploration({
          name: 'What else are people doing?',
          question: 'Describe'
        }),


        util.makeBasicExploration({
          name: 'Lots of litter and garbage',
          question: 'Do-you-see-any-of-these-problems-Lots-of-litter-and-garbage',
          values: ['yes'],
          valueNames: ['Yes'],
          colors: ['#e64212']
        }),
        util.makeBasicExploration({
          name: 'Grass needs mowing',
          question: 'Do-you-see-any-of-these-problems-Grass-needs-mowing',
          values: ['yes'],
          valueNames: ['Yes'],
          colors: ['#e64212']
        }),
        util.makeBasicExploration({
          name: 'Flooding/erosion',
          question: 'Do-you-see-any-of-these-problems-Floodingerosion',
          values: ['yes'],
          valueNames: ['Yes'],
          colors: ['#e64212']
        }),
        util.makeBasicExploration({
          name: 'Problems with play or sports equipment',
          question: 'Do-you-see-any-of-these-problems-Problems-with-play-or-sports-equipment',
          values: ['yes'],
          valueNames: ['Yes'],
          colors: ['#e64212']
        }),
        util.makeBasicExploration({
          name: 'Broken pavement',
          question: 'Do-you-see-any-of-these-problems-Broken-pavement',
          values: ['yes'],
          valueNames: ['Yes'],
          colors: ['#e64212']
        }),
        util.makeBasicExploration({
          name: 'Problem with a permanent structure',
          question: 'Do-you-see-any-of-these-problems-Problem-with-a-permanent-structure',
          values: ['yes'],
          valueNames: ['Yes'],
          colors: ['#e64212']
        }),
        util.makeBasicExploration({
          name: 'A building that needs repairing',
          question: 'Do-you-see-any-of-these-problems-A-building-that-needs-repairing',
          values: ['yes'],
          valueNames: ['Yes'],
          colors: ['#e64212']
        }),


        util.makeBasicExploration({
          name: 'Excessive noise',
          question: 'What-safety-issues-if-any-do-you-see-at-the-park-Call-911-in-an-emergency-call-DPD-313-267-4600-to-report-a-crime-Excessive-noise',
          values: ['yes'],
          valueNames: ['Yes'],
          colors: ['#e64212']
        }),
        util.makeBasicExploration({
          name: 'Evidence of too much drinking',
          question: 'What-safety-issues-if-any-do-you-see-at-the-park-Call-911-in-an-emergency-call-DPD-313-267-4600-to-report-a-crime-Evidence-of-too-much-drinking',
          values: ['yes'],
          valueNames: ['Yes'],
          colors: ['#e64212']
        }),
        util.makeBasicExploration({
          name: 'Drug use/trafficking',
          question: 'What-safety-issues-if-any-do-you-see-at-the-park-Call-911-in-an-emergency-call-DPD-313-267-4600-to-report-a-crime-Drug-usetrafficking',
          values: ['yes'],
          valueNames: ['Yes'],
          colors: ['#e64212']
        }),
        util.makeBasicExploration({
          name: 'Prostitution',
          question: 'What-safety-issues-if-any-do-you-see-at-the-park-Call-911-in-an-emergency-call-DPD-313-267-4600-to-report-a-crime-Prostitution',
          values: ['yes'],
          valueNames: ['Yes'],
          colors: ['#e64212']
        }),
        util.makeBasicExploration({
          name: 'Vandalism',
          question: 'What-safety-issues-if-any-do-you-see-at-the-park-Call-911-in-an-emergency-call-DPD-313-267-4600-to-report-a-crime-Vandalism',
          values: ['yes'],
          valueNames: ['Yes'],
          colors: ['#e64212']
        }),
        util.makeBasicExploration({
          name: 'Vagrancy',
          question: 'What-safety-issues-if-any-do-you-see-at-the-park-Call-911-in-an-emergency-call-DPD-313-267-4600-to-report-a-crime-Vagrancy',
          values: ['yes'],
          valueNames: ['Yes'],
          colors: ['#e64212']
        }),
        util.makeBasicExploration({
          name: 'Parking in illegal areas',
          question: 'What-safety-issues-if-any-do-you-see-at-the-park-Call-911-in-an-emergency-call-DPD-313-267-4600-to-report-a-crime-Parking-in-illegal-areas',
          values: ['yes'],
          valueNames: ['Yes'],
          colors: ['#e64212']
        }),


        util.makeTextExploration({
          name: 'What would make the park a little better on this day?',
          question: 'What-would-make-the-park-a-little-better-on-this-day'
        }),
        util.makeTextExploration({
          name: 'Anything else to share?',
          question: 'Anything-else-to-share'
        })
      ]
    }]
  };

  return parkswatch;

});
