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

    // Return a v2-structured form:
    // Form is an array of questions
    // Question has a slug, id, type, text, possibly a group, possibly array of answers, and possibly a condition.
    // Answer has a slug, id, and text.
    // IDs are unique and are format-wise valid as slugs. Slugs are not necessarily unique.
    // Condition has a type and type-specific fields.
    getFormV2: function getFormV2() {
      var list = [];

      var ids = {};
      function uniqueId(slug) {
        var id = slug;
        var dupe = ids[id];
        var i = 0;
        while (dupe) {
          i += 1;
          id = slug + '-' + i;
          dupe = ids[id];
        }
        ids[id] = true;
        return id;
      }

      function transformAnswer(old) {
        return {
          value: old.value,
          id: uniqueId(old.value),
          text: old.text
        };
      }

      function transformQuestion(old, condition) {
        var type = old.type;
        if (!type) {
          type = 'radio';
        }
        var question = {};

        if (condition) {
          question.condition = condition;
        }

        if (type !== 'checkbox') {
          question.type = type;
          question.slug = old.name;
          question.id = uniqueId(question.slug);
          question.text = old.text;

          list.push(question);
          if (old.answers) {
            // For each answer, create a v2 answer object.
            question.answers = _.map(old.answers, transformAnswer);

            // Process each answer's sub-questions with transformQuestion.
            _.each(old.answers, function (answer, i) {
              if (answer.questions) {
                _.forEach(answer.questions, _.curry(transformQuestion)(_, {
                  type: 'answer-selection',
                  question: question.id,
                  answer: question.answers[i].id
                }));
              }
            });
          }
        } else {
          // Checkbox questions were previously organized as one question with
          // multiple answers. For storing the responses, we would merge the
          // question and answer slug into a synthetic question slug, and the
          // answer would be "Yes".
          // For v2, we treat each checkbox as an independent question from the
          // beginning, and we make them part of a single group.

          // Group
          list.push({
            type: 'group',
            slug: old.name,
            id: uniqueId(old.name),
            text: old.text
          });

          var subs = [];
          // Individual checkboxes.
          _.forEach(old.answers, function (item) {
            var id = uniqueId(item.name);
            list.push({
              type: 'checkbox',
              slug: item.name,
              id: id,
              text: item.text,
              parentName: old.text
            });
            subs.push({
              questions: item.questions,
              id: id,
              answer: 'yes'
            });
          });

          // Sub-questions
          _.forEach(subs, function (item) {
            if (item.questions) {
              _.forEach(item.questions, _.curry(transformQuestion)(_, {
                type: 'answer-selection',
                question: item.id,
                answer: item.answer
              }));
            }
          });
        }
      }

      _.forEach(this.get('questions'), transformQuestion);
      return { questions: list };
    },

    // Flatten the most recent form into a mapping of question names to
    // immediate question info (text and possible answers)
    // { 'are-you-cool': {text: 'Are you cool?', answers: [{value: 'yes', text: 'Yes'}, {value: 'no', text: 'No'}]}}
    // TODO: It may be better to return an array of questions.
    getFlattenedForm: function getFlattenedForm(questions) {
      var result = {};

      if(!questions) {
        questions = this.get('questions');
      }

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
        if (question.type === 'checkbox') {
          _.each(question.answers, function (answer) {
            var name = makeUnique(answer.name);
            result[name] = {
              text: question.text + ': ' + answer.text,
              answers: [
                {
                  value: answer.value,
                  text: answer.value
                },
                {
                  value: NOANSWER,
                  text: NOANSWER
                }
              ]
            };

            if (answer.questions) {
              _.each(answer.questions, flattenHelper);
            }
          });
          return;
        }

        var name = question.name;
        var type;
        var answerInfo = [];
        if (question.answers && question.answers.length > 0) {
          _.each(question.answers, function (answer) {
            answerInfo.push({
              value: answer.value,
              text: answer.text
            });
          });
        } else {
          type = question.type;
          answerInfo.push({
            value: ANSWER,
            text: ANSWER
          });
        }

        answerInfo.push({
          value: NOANSWER,
          text: NOANSWER
        });

        var questionInfo = {
          text: question.text,
          answers: answerInfo
        };

        if (type) {
          questionInfo.type = type;
        }

        if (result[name] === undefined) {
          result[name] = questionInfo;
        } else {
          // The question name is not unique.
          var i = 1;
          while (result[name + '-' + i] !== undefined) {
            i += 1;
          }
          result[name + '-' + i] = questionInfo;
        }

        if (question.answers) {
          _.each(question.answers, function (answer) {
            if (answer.questions) {
              _.each(answer.questions, flattenHelper);
            }
          });
        }
      }

      _.each(questions, flattenHelper);

      return result;
    },

    /**
     * Return the flattened form for subquestions of a particular question.
     * Only works for top-level questions.
     * @param  {String} question
     * @param  {String} answer
     * @return {Object}          Flattened form
     */
    getSubquestionsFor: function(question, answer) {
      var questions = this.get('questions');
      var q = _.findWhere(questions, { name: question} );
      var a = _.findWhere(q.answers, { value: answer } );
      var subquestions = a.questions;
      console.log("GOT QUESTION....", q);
      return this.getFlattenedForm(subquestions);
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
        return [];
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
      var form = this.getMostRecentForm();
      if (!form) {
        return undefined;
      }
      return form.getFlattenedForm();
    },

    getQuestions: function() {
      var flattenedForm = this.getFlattenedForm();
      var questions = {};
      _.each(_.keys(flattenedForm), function (name) {
        questions[name] = flattenedForm[name].text;
      });
      return questions;
    },

    getSubquestionsFor: function(question, answer) {
      if (!this.getMostRecentForm()) {
        return undefined;
      }
      return this.getMostRecentForm().getSubquestionsFor(question, answer);
    }
  });

  return Forms;

}); // End Forms module
