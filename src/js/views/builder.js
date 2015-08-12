/*jslint nomen: true */
/*globals define: true */
/*globals console: true */

define(function (require) {
  'use strict';

  var $ = require('jquery');
  var _ = require('lib/lodash');
  var Backbone = require('backbone');

  var util = require('util');
  var api = require('api');

  var template = require('text!templates/surveys/form-editor.html');
  var addTopQuestionTemplate = require('text!templates/surveys/editor/add-top-question.html');
  var photoQuestionTemplate = require('text!templates/surveys/editor/photo-question.html');
  var textQuestionTemplate = require('text!templates/surveys/editor/text-question.html');
  var counterQuestionTemplate = require('text!templates/surveys/editor/counter-question.html');
  var multipleChoiceTemplate = require('text!templates/surveys/editor/multiple-choice.html');
  var answerTemplate = require('text!templates/surveys/editor/answer.html');

  var Form = require('models/forms');


  var Builder = {};

  Builder.BuilderView = Backbone.View.extend({
    template: _.template(template),

    el: '#builder-view-container',

    boxAnswersByQuestionId: {},
    formQuestions: $('#editor'),
    questionsByParentId: {},
    repeatCounter: {},
    templates: {
      addTopQuestion: _.template(addTopQuestionTemplate),
      question: _.template(multipleChoiceTemplate),
      photoQuestion: _.template(photoQuestionTemplate),
      textQuestion: _.template(textQuestionTemplate),
      counterQuestion: _.template(counterQuestionTemplate),
      answer: _.template(answerTemplate)
    },

    events: {
      'click .save': 'save'
    },

    initialize: function(options) {
      _.bindAll(this,
        'render',
        'save',

        'makeBlankQuestion',
        'renderForm',
        'suffix',
        'slugify',

        'editQuestionFactory',
        'setQuestionType',
        'deleteQuestion',
        'createQuestionFactory',
        'createPhotoQuestion',
        'addSubQuestionFactory',
        'renderQuestion',

        'createAnswer',
        'editAnswer',
        'deleteAnswer'
      );

      this.forms = options.forms;
    },

    render: function() {
      this.renderForm();
    },

    formIsValid: function() {
      // Find questions without answers
      var emptyQuestions = this.formQuestions.find('input:text[value=""]');
      if (emptyQuestions.length === 0) {
        return true;
      }

      emptyQuestions.addClass('blank');
      emptyQuestions.keyup(function(event) {
        $(event.target).removeClass('blank');
      });
      return false;
    },

    save: function(event) {
      event.preventDefault();
      console.log('Saving form');
      $('.formSaveError').html('').hide();

      var valid = this.formIsValid();
      if (!valid) {
        $('.formSaveError').html('Please ensure all questions and answers have text.');
        $('.formSaveError').fadeIn();
        return;
      }

      util.track('survey.form.save');

      api.createForm(this.forms.getMostRecentForm().toJSON(), function(){
        console.log('Form successfully saved');
        $(".saved").fadeIn().css("display","inline-block").delay(2000).fadeOut();
      });
    },

    // The blank question template.
    makeBlankQuestion: function(){
      return {
        "text": "",
        "value": "",
        "answers": [
          {
            "text": "",
            "value": ""
          },
          {
            "text": "",
            "value": ""
          }
        ]
      };
    },

    renderForm: function() {
      // Render the editor template
      this.$el.html(this.template({}));

      // Clear out the editor, just in case.
      this.formQuestions = $('#editor');
      this.formQuestions.html('');

      var form = this.forms.getMostRecentForm();
      var formData;

      // Default to a blank question if the form is empty
      if (form === undefined) {
        formData = {};
        formData.questions = [];
        formData.questions.push(this.makeBlankQuestion());
        this.forms.add(new Form.Model({ questions: formData.questions }));
      } else {
        formData = {
          questions: form.get('questions')
        };
      }


      // Handle showing/hiding the add-question interfaces through
      // delegated events.
      this.$el.on('click', '.add-question', function (event) {
        event.preventDefault();
        $(this).parent().find('> .question-choices').slideDown();
      });

      this.$el.on('click', '.close-add-sub-question', function(event) {
        event.preventDefault();
        $(this).parents('.question-choices').slideUp();
      });

      // Render the initial add-question interface.
      var createQuestionProxy = $.proxy(this.createQuestionFactory(formData.questions, -1), this);
      $(this.templates.addTopQuestion())
      .appendTo(this.formQuestions)
      .find('.add-sub-question').click(createQuestionProxy);

      // Render form
      _.each(formData.questions, function (question, questionIndex) {
        this.renderQuestion(question, undefined, undefined, undefined, undefined, questionIndex, formData.questions);
      }, this);
    },

    suffix: function(name) {
      if(_.has(this.repeatCounter, name)) {
        this.repeatCounter[name] += 1;
        return '-' + this.repeatCounter[name].toString();
      }

      this.repeatCounter[name] = 1;
      return '';
    },

    editQuestionFactory: function(question) {
      return function(event) {
        util.track('survey.form.question.edit');

        var text = _.trim($(event.target).val());
        var name = this.slugify(text);
        question.text = text;
        question.name = name;

        if(question.type === 'checkbox') {
          _.each(question.answers, function(answer){
            answer.name = question.name + '-' + this.slugify(answer.text);
            answer.value = 'yes';
          }.bind(this));
        }
      };
    },

    setQuestionType: function(question, dataRole) {
      console.log(dataRole);

      if (dataRole === 'radio-question') {
        delete question.type;
        _.each(question.answers, function(answer){
          answer.value = this.slugify(answer.text);
        }.bind(this));
      }

      if (dataRole === 'checkbox-question') {
        question.type = "checkbox";
        // Make sure each answer has a name
        _.each(question.answers, function(answer){
          answer.name = question.name + '-' + this.slugify(answer.text);
          answer.value = 'yes';
        }.bind(this));
      }

      if (dataRole === 'file-question') {
        question.type = 'file';
        delete question.answers;
      }

      if (dataRole === 'text-question') {
        question.type = 'text';
        delete question.answers;
      }

      if (dataRole === 'counter-question') {
        question.type = 'counter';
        delete question.answers;
      }
    },

    deleteQuestion: function($question, parent, questionIndex) {
      return function(event) {
        util.track('survey.form.question.delete');

        // Remove it from the DOM.
        $question.remove();

        // Remove it from the json
        parent.splice(questionIndex, 1);

        this.renderForm();
      };
    },

    createQuestionFactory: function(parent, questionIndex) {
      return function(event) {
        event.preventDefault();
        var type = $(event.currentTarget).attr('data-type');

        console.log("Adding a new question");
        util.track('survey.form.question.add');

        var newQuestion = this.makeBlankQuestion();
        this.setQuestionType(newQuestion, type);
        parent.splice(questionIndex + 1, 0, newQuestion);

        this.renderForm();
      };
    },

    createPhotoQuestion: function(parent, questionIndex) {
      return function(event) {
        console.log("Adding a new photo question");
        util.track('survey.form.question.add');

        var newQuestion = this.makeBlankQuestion();
        newQuestion.type = 'file';

        delete newQuestion.answers;
        parent.splice(questionIndex + 1, 0, newQuestion);

        this.renderForm();
      };
    },

    createAnswer: function(question) {
      return function(event) {
        util.track('survey.form.answer.add');

        question.answers.push({
          'text': '',
          'value': ''
        });
        this.setQuestionLayout(question);

        this.renderForm();
      };
    },

    addSubQuestionFactory: function(question, index) {
      return function(event) {
        event.preventDefault();
        var type = $(event.currentTarget).attr('data-type');

        console.log("Adding sub-question", type);
        util.track('survey.form.subquestion.add');

        var newQuestion = this.makeBlankQuestion();
        this.setQuestionType(newQuestion, type);

        // Add the question to the end of the array, or create a new array
        if (_.has(question.answers[index], 'questions')) {
          question.answers[index].questions.unshift(newQuestion);
        }else {
          question.answers[index].questions = [newQuestion];
        }

        this.renderForm();
      };
    },

    editAnswer: function(question, index) {
      return function(event){
        util.track('survey.form.answer.edit');
        var text = _.trim($(event.target).val());
        question.answers[index].text = text;
        question.answers[index].value = this.slugify(text);

        this.setQuestionLayout(question);
        if(question.type === 'checkbox') {
          question.answers[index].name = question.name + '-' + this.slugify(text);
          question.answers[index].value = 'yes';
        }

      };
    },

    deleteAnswer: function(question, index, $answer) {
      return function(event) {
        console.log("removing answer");

        // Remove it from the json
        question.answers.splice(index, 1);

        this.setQuestionLayout(question);

        // Remove it from the DON.
        $answer.remove();
      };
    },

    // Display a question horizontally if it doesn't have many answers.
    setQuestionLayout: function(question) {
      if (question.answers.length !== 2) {
        delete question.layout;
      }else {
        if (question.type !== 'checkbox') {
          question.layout = 'horizontal';
        }
      }
    },

    renderQuestion: function(question, visible, parentID, triggerID, appendTo, questionIndex, parent) {
      // TODO:
      // This should pass around a well-documented options object
      // Instead of 30 different parameters
      // var options = {
      //   visible:
      //   parentId:
      //   triggerId:
      //   appendTo:
      //   questionIndex:
      //   parent:
      // }

      // Set default values for questions
      if (visible === undefined) {
        visible = true;
      }
      if (parentID === undefined) {
        parentID = '';
      }
      if (triggerID === undefined) {
        triggerID = '';
      }

      // Give the question an ID based on its name
      var id = _.uniqueId(question.name);

      // Render the questions .................................................
      var $question = $(this.templates.question({question: question}));
      if(question.type === 'file') {
        $question = $(this.templates.photoQuestion({question: question}));
      }
      if(question.type === 'text') {
        $question = $(this.templates.textQuestion({question: question}));
      }
      if(question.type === 'counter') {
        $question = $(this.templates.counterQuestion({question: question}));
      }

      // Listen for changes to the question ...................................
      // TODO: make it less verbose

      // Listen for changes to the question text
      var editQuestionProxy = $.proxy(this.editQuestionFactory(question), this);
      $question.find('> div input').keyup(editQuestionProxy);

      // Listen for a request to remove a question
      // TODO: confirm delete
      var deleteQuestionProxy = $.proxy(this.deleteQuestion($question, parent, questionIndex), this);
      $question.find('> div .remove').click(deleteQuestionProxy);


      // Listen for a request to add a question
      var createQuestionProxy = $.proxy(this.createQuestionFactory(parent, questionIndex), this);
      $question.find('.add-sub-question').click(createQuestionProxy);

      // // Add a sub-question
      // var $addSubQuestion = $answer.find('.add-sub-question');
      // var addSubQuestionProxy = $.proxy(this.addSubQuestionFactory(question, index), this);
      // $addSubQuestion.click(addSubQuestionProxy);

      // // Listen for a request to add a photo question
      // var createPhotoQuestionProxy = $.proxy(this.createPhotoQuestion(parent, questionIndex), this);
      // $question.find('.add-photo-question').click(createPhotoQuestionProxy);

      // Listen for a request to add an answer
      var createAnswerProxy = $.proxy(this.createAnswer(question), this);
      $question.find('.add-answer').click(createAnswerProxy);

      // Some stuff with siblings -- forget what this does.
      var siblings = this.questionsByParentId[parentID];
      if (siblings === undefined) {
        siblings = [];
        this.questionsByParentId[parentID] = siblings;
      }
      siblings.push($question);

      // Figure out the right place to append the rendered template
      if (appendTo !== undefined) {
        $(appendTo).append($question);
      }else {
        this.formQuestions.append($question);
      }

      var suffixed_name = question.name + this.suffix(question.name);

      // TODO Infoboxes (aka help text for questions)
      // if(question.info !== undefined) {
      // }

      // Show question tools on hover
      // TODO: this selector sucks. Let's try to make it generic.
      $question.hover(function(event) {
        // if (event.currentTarget !== event.target) return;
        $(this).find('> .input-append .remove').fadeIn(150);
      }, function() {
        $(this).find('> .input-append.remove').fadeOut(150);
      });

      // Deal with answers ....................................................
      var questionID = id;

      // Add each answer to the question
      _.each(question.answers, function (answer, index) {
        // The triggerID is used to hide/show other question groups
        var triggerID = _.uniqueId(question.name);

        if(question.type === "checkbox") {
          suffixed_name = answer.name + this.suffix(answer.name);
          triggerID = suffixed_name;
          id = suffixed_name;
        }

        // Set the data used to render the answer
        var answerData = {
          questionName: suffixed_name,
          question: question,
          id: triggerID,
          theme: (answer.theme || "c"),
          value: answer.value,
          text: answer.text
        };

        // Render the answer template...
        var $answer;
        var referencesToAnswersForQuestion;

        $answer = $(this.templates.answer(answerData));
        referencesToAnswersForQuestion = this.boxAnswersByQuestionId[questionID];
        if (referencesToAnswersForQuestion === undefined) {
          referencesToAnswersForQuestion = [];
          this.boxAnswersByQuestionId[questionID] = referencesToAnswersForQuestion;
        }

        // ... and append it to the fieldset.
        $question.find('> .answers').append($answer);

        // Tools related to editing answers ------------------------------------

        // Change the answer text when updated
        var $input = $answer.find('input');
        var editAnswerProxy = $.proxy(this.editAnswer(question, index), this);
        $input.keyup(editAnswerProxy);

        // Show tools on hover
        $answer.hover(function() {
          $(this).find('> .btn').fadeIn(150);
        }, function() {
          $(this).find('> .btn').fadeOut(150);
        });

        $answer.find('> .show-add-sub-question').hover(function() {
          $(this).find('span').fadeIn(150);
        }, function() {
          $(this).find('span').fadeOut(150);
        });

        // Show add sub-question
        $answer.find('.show-add-sub-question').click(function(event) {
          event.preventDefault();
          $(this).parent().find('> .question-choices').slideDown();
        });

        // Hide add sub-question
        $answer.find('.close-add-sub-question').click(function(event) {
          event.preventDefault();
          $(this).parents('.question-choices').slideUp();
        });

        // Add a sub-question
        var $addSubQuestion = $answer.find('.add-sub-question');
        var addSubQuestionProxy = $.proxy(this.addSubQuestionFactory(question, index), this);
        $addSubQuestion.click(addSubQuestionProxy);

        // Remove an answer
        var $removeButton = $answer.find('.remove');
        var deleteAnswerProxy = $.proxy(this.deleteAnswer(question, index, $answer), this);
        $removeButton.click(deleteAnswerProxy);

        // If there are conditional questions, add them. -----------------------
        if (answer.questions !== undefined) {
          appendTo = $answer;
          _.each(answer.questions, function (subq, questionIndex) {
            // Add the sub questions before the repeatButton
            if(appendTo !== undefined){
              this.renderQuestion(subq, false, id, triggerID, appendTo, questionIndex, answer.questions);
            }else {
              this.renderQuestion(subq, false, id, triggerID, undefined, questionIndex, answer.questions);
            }
          }, this);
        } // end check for sub-answers

      }, this);
    }, // end renderQuestion

    // Slugify a string
    // Used to generate the name attribute of forms
    slugify: function(text) {
      text = text.replace(/[^-a-zA-Z0-9,&\s]+/ig, '');
      text = text.replace(/\s/gi, "-");
      text = text.replace(/,/gi, '');
      text = text.replace(/&/g, 'and');
      return text;
    }

  }); // end BuilderView{}

  return Builder;

});
