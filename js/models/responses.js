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

  var Responses = {};

  Responses.Model = Backbone.Model.extend({ 
  
  });

  Responses.Collection = Backbone.Collection.extend({
    model: Responses.Model,
    
    initialize: function(models, options) {
      // Ugly -- we'll need to find a nicer way to init this thing.s
      // Maybe: function(models, options)
      if(! _.isEmpty(models)) {
        this.models = models;
      }

      if(options !== undefined) {
        console.log("Getting responses");
        this.surveyId = options.surveyId;
        this.fetch();
      }
    },
    
    url: function() {
      return settings.api.baseurl + '/surveys/' + this.surveyId + '/responses';
    },
          
    parse: function(response) {
      console.log("Parsing response collection");
      console.log(response);
      return response.responses;
    },

    // Returns a list of strings of all answer keys that have been submitted so far
    getResponseKeys: function() {
      this.responseKeys = [];
      _.each(this.models, function(response) {
        var responseJSON = response.toJSON();
        if (_.has(responseJSON, 'responses')) {
          this.responseKeys = _.union(this.responseKeys, _.keys(responseJSON.responses));
        }
      }, this);

      return this.responseKeys.sort();

    },

    getUniqueAnswersForQuestion: function(question) {
      var answers = _.map(this.models, function(response){
        if(_.has(response.attributes, 'responses')) {
          if (_.has(response.attributes.responses, question)) {
            return response.attributes.responses[question];
          }
        }
      });
      var uniqueAnswers = _.unique(answers).sort();

      // Replace undefined with a string for nice rendering
      var idxOfUndefinedToReplace = _.indexOf(uniqueAnswers, undefined);
      uniqueAnswers[idxOfUndefinedToReplace] = "[empty]";
      return uniqueAnswers;
    }
    
  });

  return Responses;

}); // End Responses module


