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

  var Forms = {};

  // Forms model
  Forms.Model = Backbone.Model.extend({
    initialize: function(options) {
      this.surveyId = options.surveyId;
    },

    url: function() {
      if (this.get("id") !== undefined) {
        return settings.api.baseurl + '/surveys/' + this.surveyId + '/forms';
      }
      return settings.api.baseurl + '/surveys/' + this.surveyId + '/forms';
    }
  });


  // Forms collection
  Forms.Collection = Backbone.Collection.extend({
    model: Forms.Model,

    initialize: function(options) {
      this.surveyId = options.surveyId;
      this.fetch({ reset: true });
    },

    url: function() {
      return settings.api.baseurl + '/surveys/' + this.surveyId + '/forms';
    },

    parse: function(response) {
      if (response.forms.length === 0) {
        var newForm = new Forms.Model({ 'questions': [] });
        return [ newForm ];
      }

      return response.forms;
    },

    // Find the most recent form of the given type (usually "mobile" or "paper")
    getMostRecentForm: function(type) {
      var i;

      // find mobile forms by default
      if (type === undefined) {
        type = "mobile";
      }

      for (i = 0; i < this.models.length; i += 1) {
        if (this.models[i].get('type') === type) {
          return this.models[i];
        }
      }
    },

    // Helper method used by the recursive getFlattenedForm
    flattenForm: function(question, flattenedForm) {

      // Add the question to the list of questions
      // Naive -- takes more space than needed (because it includes subquestions)
      if(question.type !== 'checkbox') {
        flattenedForm.push(question);
      }

      // Check if there are sub-questions associated with any of the answers
      _.each(question.answers, function(answer){

        // Add each checkbox answer as a separate question
        if(question.type === 'checkbox') {
          flattenedForm.push({
            name: answer.name,
            answers: ['yes'],
            text: question.text + ': ' + answer.text
          });
        }

        if (answer.questions !== undefined) {
          _.each(answer.questions, function(question) {
            // Recusively call flattenForm to process those questions.
            return this.flattenForm(question, flattenedForm);

          }, this);
        }
      }, this);

      return flattenedForm;
    },

    // Returns the most recent form as a flat list of question objects
    // Objects have name (functions as id), text (label of the question)
    getFlattenedForm: function() {
      var mostRecentForm = this.getMostRecentForm();

      var flattenedForm = [];
      var distinctQuestions = [];

      // Process the form if we have one
      if (mostRecentForm !== undefined) {
        _.each(mostRecentForm.get("questions"), function(question) {
          flattenedForm = flattenedForm.concat(this.flattenForm(question, flattenedForm));
        }, this);

        // Make sure there's only one question per ID.
        var questionNames = [];
        _.each(flattenedForm, function(question) {
          if (! _.contains(questionNames, question.name)) {
            questionNames.push(question.name);
            distinctQuestions.push(question);
          }
        });
      }

      return distinctQuestions;
    }
  });


  return Forms;

}); // End Forms module




