/*jslint nomen: true */
/*globals define: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',
  'settings'
],

function($, _, Backbone, settings) {
  'use strict';

  var Stats = {};

  Stats.Model = Backbone.Model.extend({
    urlRoot: settings.api.baseurl + "/surveys/",

    url: function() {
      console.log("URL", this.urlRoot + this.id + '/stats/');
      return this.urlRoot + this.id + '/stats/';
    },

    initialize: function(options) {
      _.bindAll(this, 'parse', 'url');
      this.fetch();
    },

    parse: function(response) {
      var stats = {};

      // Go over each question
      var questions = _.keys(response.stats);
      _.each(questions, function(question) {
        var answers = _.keys(response.stats[question]);
        var answerObjects = {};

        // Go over each answer
        _.each(answers, function(answer, index) {

          // And associate a count and color
          answerObjects[answer] = {
            val: response.stats[question][answer],
            color: settings.colorRange[index]
          };
        });
        stats[question] = answerObjects;
      });
      return stats;
    }

  });

  return Stats;
});
