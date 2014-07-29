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

  var ANSWER = 'response';
  var NOANSWER = 'no response';

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
    },

    // Flatten the most recent form into a mapping of question names to
    // immediate question info (text and possible answers)
    // TODO: It may be better to return an array of questions.
    getFlattenedForm: function getFlattenedForm() {
      var result = {};

      function makeUnique(name) {
        if (result[name] === undefined) {
          return name;
        }
        // The question name is not unique.
        var i = 1;
        while (result[name + '-' + i] !== undefined) {
          i += 1;
        }
        return name + '-' + i;
      }

      function flattenHelper(question) {

        // We need to rearrange checkbox questions a little
        //if (question.type === 'checkbox') {
        //  _.each(question.answers, function (answer) {
        //    var name = makeUnique(answer.name);

        //    if (result[name]) {
        //      result[name]
        //    }

        //    result[name] = {
        //      text: question.text + ': ' + answer.text,
        //      answers: [
        //        {
        //          value: answer.value,
        //          text: answer.value
        //        },
        //        {
        //          value: NOANSWER,
        //          text: NOANSWER
        //        }
        //      ]
        //    };

        //    if (answer.questions) {
        //      _.each(answer.questions, flattenHelper);
        //    }
        //  });
        //  return;
        //}

        var name = question.name;
        var type;
        var answerInfo = [];

        // If the question has answers, let's get them out.
        if (question.answers && question.answers.length > 0) {
          _.each(question.answers, function (answer) {
            answerInfo.push({
              name: answer.name || undefined,
              value: answer.value,
              text: answer.text
            });
          });
        } else {
          // Some "questions", like Photo fields, don't have distinct answers
          // We only mark if they have been completed or not.
          type = question.type;
          answerInfo.push({
            value: ANSWER,

            text: ANSWER
          });
        }

        // Add in a default placeholder for answers that have "No response"
        answerInfo.push({
          value: NOANSWER,
          text: NOANSWER
        });

        // Start setting up the flattened question
        var questionInfo = {
          text: question.text,
          answers: answerInfo
        };

        // Some questions don't have a type -- legacy?
        if (type) {
          questionInfo.type = type;
        }


        name = makeUnique(name);
        result[name] = questionInfo;
        console.log("SAVED", name, questionInfo);

        // If the answers to this question have subquestions, process them.
        if (question.answers) {
          _.each(question.answers, function (answer) {
            if (answer.questions) {
              _.each(answer.questions, flattenHelper);
            }
          });
        }
      }

      _.each(this.get('questions'), flattenHelper);

      return result;
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

    // Flatten the most recent form into a mapping of question names to
    // immediate question info.
    // { 'are-you-cool': {text: 'Are you cool?', answers: [{value: 'yes', text: 'Yes'}, {value: 'no', text: 'No'}]}}
    getFlattenedForm: function getFlattenedForm() {
      return this.getMostRecentForm().getFlattenedForm();
    },

    getQuestions: function() {
      var flattenedForm = this.getFlattenedForm();
      var questions = {};
      _.each(_.keys(flattenedForm), function (name) {
        questions[name] = flattenedForm[name].text;
      });
      return questions;
    }
  });

  return Forms;

}); // End Forms module




