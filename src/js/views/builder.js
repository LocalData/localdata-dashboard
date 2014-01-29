/*jslint nomen: true */
/*globals define: true */
/*globals console: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',
  'lib/kissmetrics',

  // LocalData
  'settings',
  'api',

  // Templates
  'text!templates/surveys/form-editor.html',

  'views/forms'
],

function($, _, Backbone, _kmq, settings, api, template, FormViews) {
  'use strict';

  var Builder = {};

  Builder.BuilderView = Backbone.View.extend({
    template: _.template(template),

    el: '#builder-view-container',

    boxAnswersByQuestionId: {},
    formQuestions: $('#editor'),
    questionsByParentId: {},
    repeatCounter: {},
    templates: {
      question: _.template($('#question-edit-template').html()),
      photoQuestion: _.template($('#photo-question-edit-template').html()),
      textQuestion: _.template($('#text-question-edit-template').html()),
      answer: _.template($('#answer-edit-template').html())
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

    save: function(event) {
      event.preventDefault();
      console.log('Saving form');
      _kmq.push(['record', 'Survey questions saved']);

      api.createForm(settings.formData, function(){
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
      console.log("Rendering", this.$el);

      this.$el.html(this.template({}));
      console.log(this.$el);

      // Clear out the editor, just in case.
      this.formQuestions = $('#editor');
      this.formQuestions.html('');

      // Default to a blank question if the form is empty
      if (settings.formData === undefined) {
        settings.formData = {};
        settings.formData.questions = [];
        settings.formData.questions.push(this.makeBlankQuestion());
      }

      // Render form
      _.each(settings.formData.questions, function (question, questionIndex) {
        this.renderQuestion(question, undefined, undefined, undefined, undefined, questionIndex, settings.formData.questions);
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
        console.log('Updating question');
        _kmq.push(['record', 'Question edited']);
        var text = $(event.target).val(); //$(this).val();
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
    },

    deleteQuestion: function($question, parent, questionIndex) {
      return function(event) {
        console.log("removing question");
        _kmq.push(['record', 'Question deleted']);

        // Remove it from the DOM.
        $question.remove();

        // Remove it from the json
        parent.splice(questionIndex, 1);
      };
    },

    createQuestionFactory: function(parent, questionIndex) {
      return function(event) {
        event.preventDefault();
        var type = $(event.currentTarget).attr('data-type');

        console.log("Adding a new question");
        _kmq.push(['record', 'Question added']);

        var newQuestion = this.makeBlankQuestion();
        this.setQuestionType(newQuestion, type);
        parent.splice(questionIndex + 1, 0, newQuestion);

        this.renderForm();
      };
    },

    createPhotoQuestion: function(parent, questionIndex) {
      return function(event) {
        console.log("Adding a new photo question");
        _kmq.push(['record', 'Question added']);

        var newQuestion = this.makeBlankQuestion();
        newQuestion.type = 'file';
        delete newQuestion.answers;
        parent.splice(questionIndex + 1, 0, newQuestion);

        this.renderForm();
      };
    },

    createAnswer: function(question) {
      return function(event) {
        _kmq.push(['record', 'Answer added']);
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
        _kmq.push(['record', 'Sub-question added']);

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
        _kmq.push(['record', 'Answer edited']);
        var text = $(event.target).val();
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
        _kmq.push(['record', 'Answer deleted']);

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

      // Listen for changes to the question ...................................
      // TODO: make it less verbose

      // Listen for changes to the question text
      var editQuestionProxy = $.proxy(this.editQuestionFactory(question), this);
      $question.find('> div input').keyup(editQuestionProxy);

      // Listen for a request to remove a question
      // TODO: confirm delete
      var deleteQuestionProxy = $.proxy(this.deleteQuestion($question, parent, questionIndex), this);
      $question.find('> div .remove').click(deleteQuestionProxy);


      // Add a question
      // Show add sub-question
      $question.find('.add-question').click(function(event) {
        event.preventDefault();
        $(this).parent().find('> .question-choices').slideDown();
      });

      // Hide add sub-question
      $question.find('.close-add-sub-question').click(function(event) {
        event.preventDefault();
        $(this).parents('.question-choices').slideUp();
      });

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
      return text;
    }

  }); // end BuilderView{}

  return Builder;

});
