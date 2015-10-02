/*jslint nomen: true */
/*globals define: true */

define(function (require) {
  'use strict';
  var $ = require('jquery');
  var _ = require('lib/lodash');
  var Autolinker = require('lib/autolinker');
  var Backbone = require('backbone');

  // LocalData
  var settings = require('settings');
  var util = require('util');

  // Templates
  var template = require('text!templates/responses/item.html');

  var ResponseView = Backbone.View.extend({
    className: 'response',

    template: _.template(template, {
      imports: {
        autolinker: new Autolinker() // Create links from urls in text fields
      }
    }),

    responseEdits: {}, // changes to make to the responses object.

    events: {
      // Deleting
      'click .action-show-confirm': 'confirm',
      'click .action-delete': 'destroy',
      'click .cancel': 'cancel',

      // Editing
      'click .action-show-edit': 'edit',
      'click .action-save-edit': 'save',
      'click .action-cancel-edit': 'cancelEdit',
      'change .edit': 'questionEdited',

      // Flagging
      'click .action-flag': 'flag',
      'click .action-accept': 'accept'
    },

    initialize: function(options) {
      this.listenTo(this.model, "sync", this.render);
      this.listenTo(this.model, "destroy", this.remove);

      this.surveyOptions = options.surveyOptions || {};
      this.exploration = options.exploration;
      this.labels = options.labels;
      this.forms = options.forms;
    },

    makeAnswerLabels: function() {
      var form = this.forms.getFlattenedForm();
      var questions = {};
      _.each(form, function(question, key) {
        questions[key] = {};
        _.each(question.answers, function(answer) {
          questions[key][answer.value] = answer.text;
        });
      });
      return questions;
    },

    render: function() {
      var $el = $(this.el);

      // If this is meant for anonymous consumption, then ignore the fact
      // that the user might be logged in through the primary dashboard.
      // TODO: If the entire interface is meant for anonymous consumption,
      // then we should not even be asking the API for the user's info.
      if (this.surveyOptions.anonymous) {
        this.surveyOptions.loggedIn = false;
      } else {
        this.surveyOptions.loggedIn = settings.user && settings.user.isLoggedIn();
      }

      var responses = this.model.get('responses') || {};
      var form = this.forms.getMostRecentForm().getFormV2();
      var fields = [];
      var processed = {};

      // Go through the questions in the latest form and map the question-answer
      // slug pairs to text pairs.
      _.forEach(form.questions, function (question) {
        console.log("Processing", question);
        var valueSlug = responses[question.slug];
        var value;
        var key;

        // Don't display a question/answer pair twice.
        // Don't process group questions
        if (!processed[question.slug] && question.type !== 'group') {
          key = question.text;

          // If the value slug matches an answer, then we can also use the text
          // for that answer.
          value = _.pluck(_.where(question.answers, { value: valueSlug}), 'text')[0];
          if (!value) {
            value = valueSlug;
          }

          // Set up the answers with a slug, if they don't already have one
          var answers = [];
          _.each(question.answers, function(answer) {
            if (!_.has(answer, 'slug')) {
              answer.slug = answer.value;
            }
            answers.push(answer);
          });

          if(question.type === 'checkbox') {
            answers.push({
              slug: 'no',
              text: 'No'
            });
            answers.push({
              slug: 'yes',
              text: 'Yes'
            });
          }

          fields.push({
            question: key,
            questionSlug: question.slug,
            type: question.type,
            answer: value,
            answerSlug: valueSlug,
            answerOptions: answers
          });

          processed[question.slug] = true;
        } else if (question.type === 'text') {
          value = _.pluck(_.where(question.answers, { value: valueSlug}), 'text')[0];

          fields.push({
            question: question.text,
            questionSlug: question.slug,
            type: question.type,
            answer: value
          });
        }
      });

      // Go through the full set of question-answer slug pairs in this entry and
      // add any that didn't map to the form.
      _.forEach(_.keys(responses).reverse(), function (key) {
        if (!processed[key]) {
          fields.push({
            question: key,
            questionSlug: key,
            answer: responses[key]
          });
        }
      });

      var r = this.model.toJSON();
      if (!r.responses) {
        r.responses = {};
      }

      var options = {
        r: r,
        fields: fields,
        surveyOptions: this.surveyOptions,
        exploration: this.exploration
      };
      console.log("Rendering with options", options);
      $el.html(this.template(options));
      return this;
    },

    // Deleting
    confirm: function(event) {
      event.preventDefault();
      this.$('.action-show-confirm').hide();
      this.$('.confirm-delete').show();
    },

    cancel: function(event) {
      event.preventDefault();
      this.$('.confirm-delete').hide();
      this.$('.action-show-confirm').show();
    },

    destroy: function(event) {
      event.preventDefault();

      function success(model, repsonse) {
      }

      function error(model, xhr, options) {
        console.log("Error destroying", xhr, options);
        console.log($('.error'));
        $('.error').show();
      }

      this.model.destroy({
        success: success,
        error: error,
        // Wait for the response before issuing the destroy event, otherwise we
        // have a race condition.
        wait: true
      });

      util.track('survey.response.delete');
    },


    // Editing
    edit: function(event) {
      event.preventDefault();
      util.track('survey.response.edit');

      this.$('.value').hide();
      this.$('.action-show-edit').hide();

      this.$('.editanswers').show();
      this.$('.answers').hide();
      this.$('.action-save-edit').show();
      this.$('.action-cancel-edit').show();
    },

    questionEdited: function(event) {
      var question = $(event.target).attr('data-question');
      var answer = $(event.target).val();

      this.responseEdits[question] = answer;
    },

    cancelEdit: function(event) {
      event.preventDefault();
      util.track('survey.response.edit.cancel');

      // Show the values and edit button
      this.$('.value').show();
      this.$('.action-show-edit').show();

      // Hide the form and save / cancel buttons
      this.$('.editanswers').hide();
      this.$('.answers').show();
      this.$('.action-save-edit').hide();
      this.$('.action-cancel-edit').hide();

      // Fetch the attributes to make sure we have the latest version.
      this.model.fetch();
    },

    save: function(event) {
      event.preventDefault();
      util.track('survey.response.edit.save');

      this.model.save({
        responses: this.responseEdits
      }, {
        patch: true,
        wait: true, // wait until sync to update attributes
        success: function (event) {
          // We need to fetch the model because patch resets the local
          // attributes.
          this.model.fetch({ reset: true });
        }.bind(this)
      });
    },


    // Flagging
    flag: function(event) {
      event.preventDefault();
      util.track('survey.response.flag');

      this.model.save({
        responses: {
          reviewed: 'flagged'
        }
      }, {
        patch: true,
        wait: true, // wait until sync to update attributes
        success: function (event) {
          // We need to fetch the model because patch resets the local
          // attributes.
          this.model.fetch({ reset: true });
        }.bind(this)
      });
    },

    accept: function(event) {
      event.preventDefault();
      util.track('survey.response.accept');

      this.model.save({
        responses: {
          reviewed: 'accepted'
        }
      }, {
        patch: true,
        wait: true,
        success: function (event) {
          this.model.fetch({ reset: true });
        }.bind(this)
      });
    }
  });

  return ResponseView;
});
