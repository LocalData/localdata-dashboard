/*jslint nomen: true */
/*globals define: true */

define(function(require, exports, module) {
  'use strict';

  var _ = require('lib/lodash');
  var exploreStylesTemplate = require('text!templates/projects/surveys/explore-styles.mss');
  var simpleStylesTemplate = require('text!templates/projects/surveys/simple-styles.mss');
  var complexStylesTemplate = require('text!templates/projects/surveys/explore-complex-styles.mss');
  var keyValueStylesTemplate = require('text!templates/projects/surveys/key-value-styles.mss');
  var checkboxStylesTemplate = require('text!templates/projects/surveys/checkbox-styles.mss');

  var exploreStyles = (function (template) {
    return function (options) {
      return template(_.defaults(options, { pointSize: 18 }));
    };
  }(_.template(exploreStylesTemplate)));

  var simpleStyles = (function (template) {
    return function (options) {
      return template(_.defaults(options, { pointSize: 18 }));
    };
  }(_.template(simpleStylesTemplate)));

  var complexStyles = (function (template) {
    return function (options) {
      return template(_.defaults(options, { pointSize: 18 }));
    };
  }(_.template(complexStylesTemplate)));

  var keyValueStyles = (function (template) {
    return function (options) {
      return template(_.defaults(options, { pointSize: 18 }));
    };
  }(_.template(keyValueStylesTemplate)));

  var checkboxStyles = (function (template) {
    return function (options) {
      return template(_.defaults(options, { pointSize: 18 }));
    };
  }(_.template(checkboxStylesTemplate)));

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
        query: options.query,
        select: { 'entries.responses': 1 },
        styles: exploreStyles({
          showNoResponse: !!options.showNoResponse,
          pairs: _.map(options.values, function (val, i) {
            var ret = {
              key: 'responses.' + options.question,
              value: options.values[i],
              color: options.colors[i]
            };
            return ret;
          }),
          pointSize: options.pointSize
        })
      },
      values:  _.map(options.values, function (val, i) {

        // These are the styles used when a particular
        // sublayer is selected.
        var ret = {
          text: options.valueNames[i],
          name: options.values[i],
          color: options.colors[i],
          layer: {
            query: {},
            select: { 'entries.responses': 1 },
            styles: keyValueStyles({
              color: options.colors[i],
              pointSize: options.pointSize,
              filter: {
                key: 'responses.' + options.question,
                value: options.values[i]
              }
            })
          },
          pointSize: options.pointSize
        };

        ret.layer.query['entries.responses.' + options.question] = val;
        ret.layer.query = _.defaults(ret.layer.query, options.query);

        // If this is a no response filter, we need to handle it differently
        if (val === 'no response') {
          // We don't want the full response array anymore:
          ret.layer.select = {};

          // Query for responses that don't have the key:
          ret.layer.query['entries.responses.' + options.question] = {
            '$exists': false
          };

          // We need to use simple styles, since this is the _absence_ of a
          // key-value match:
          ret.layer.styles = simpleStyles({
            color: options.colors[i],
            pointSize: options.pointSize
          });
        }

        return ret;
      })
    };

    return data;
  }

  /*
  Make an exploration that combines multiple facets and multiple questions.
  For example: Properties that are vacant and have fire damage.

  options = {
    name: 'Vacant properties by condition',
    choices: [{
      name: 'Good '
      select: [{
        key: 'vacancy-status',
        value: 'vacant'
      }, {
        key: 'condition',
        value: 'good'
      }],
      color: 'green'
    }, {
      name: 'Bad'
      select: [{
        key: 'vacancy-status',
        value: 'vacant'
      }, {
        key: 'condition',
        value: 'bad'
      }],
      color: 'red'
    }]
  }]
  */
  function makeComplexExploration(options) {
    console.log("Making complex ex with options", options);
    var data = {
      name: options.name,
      layer: {
        query: options.query,
        select: { 'entries.responses': 1 },
        styles: complexStyles({
          showNoResponse: !!options.showNoResponse,
          choices: options.choices,
          pointSize: options.pointSize
        })
      },

      // TODO
      values:  _.map(options.choices, function (choice, i) {

        // These are the styles used when a particular
        // sublayer is selected.
        var ret = {
          text: choice.name,
          name: choice.name,
          color: choice.color,
          layer: {
            query: {},
            select: { 'entries.responses': 1 },
            styles: complexStyles({
              showNoResponse: !!options.showNoResponse,
              choices: [choice],
              pointSize: options.pointSize
            })
          },
          pointSize: options.pointSize
        };

        // ret.layer.query['entries.responses.' + options.question] = val;
        // ret.layer.query = _.defaults(ret.layer.query, options.query);

        return ret;
      })
    };

    return data;
  }


  function makeTextExploration(options) {
    // name: 'Unsafe due to traffic speed/volume',
    // question: 'Do-you-feel-unsafe-because-of-a-high-volume-or-high-speed-traffic',
    // values: ['Yes', 'No'],
    // valueNames: ['Unsafe', 'No significant issue'],
    // colors: ['#d73027', '#1a9850']

    var data = {
      name: options.name,
      question: options.question,

      layer: {
        query: options.query,
        select: { 'entries.responses': 1 },
        styles: exploreStyles({
          showNoResponse: !!options.showNoResponse,
          pairs: _.map(options.values, function (val, i) {
            var ret = {
              key: 'responses.' + options.question,
              value: options.values[i],
              color: options.colors[i]
            };
            return ret;
          }),
          pointSize: options.pointSize
        })
      }
    };
    return data;
  }

  function makeCheckboxExploration(options) {
    // name: 'Sidewalk obstructions ',
    // question: 'Are-there-any-problems-with-the-sidewalk--Select-all-that-apply-Obstructions-in-the-sidewalk',
    // query: {
    //   'entries.responses.What-would-you-like-to-record': 'Sidewalk-Quality'
    // },
    // values: ['yes', 'no'],
    // valueNames: ['Yes', 'No'],
    // colors: ['#c51b7d', '#4d9221']

    var query = {};
    query['entries.responses.' + options.predicate[0]] = options.predicate[1];

    var queryYes = {};
    queryYes['entries.responses.' + options.question] = 'yes';
    queryYes = _.defaults(queryYes, query);

    var queryNo = {};
    queryNo['entries.responses.' + options.question] = {
      $ne: 'yes'
    };
    queryNo = _.defaults(queryNo, query);

    var data = {
      type: 'checkbox',
      countPath: 'stats.' + options.predicate.join('.'),
      name: options.name,
      question: options.question,

      layer: {
        query: query,
        select: { 'entries.responses': 1 },
        styles: checkboxStyles({
          key: 'responses.' + options.question,
          colorYes: options.colors[0],
          colorNo: options.colors[1],
          pointSize: options.pointSize
        })
      },
      values: [ {
        text: options.valueNames[0],
        name: 'yes',
        color: options.colors[0],
        layer: {
          query: queryYes,
          select: {},
          styles: simpleStyles({ color: options.colors[0], pointSize: options.pointSize })
        },
        pointSize: options.pointSize
      }, {
        text: options.valueNames[1],
        name: 'no',
        color: options.colors[1],
        layer: {
          query: queryNo,
          select: {},
          styles: simpleStyles({ color: options.colors[1], pointSize: options.pointSize })
        },
        pointSize: options.pointSize
      } ]
    };

    return data;
  }

  return {
    exploreStyles: exploreStyles,
    simpleStyles: simpleStyles,
    checkboxStyles: checkboxStyles,
    makeBasicExploration: makeBasicExploration,
    makeComplexExploration: makeComplexExploration,
    makeTextExploration: makeTextExploration,
    makeCheckboxExploration: makeCheckboxExploration
  };

});
