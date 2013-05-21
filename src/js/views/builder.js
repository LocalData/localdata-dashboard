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

  'views/forms'
],

function($, _, Backbone, _kmq, settings, api, FormViews) {
  'use strict';

  var Builder = {};

  Builder.BuilderView = Backbone.View.extend({

    el: '#builder-view-container',

    boxAnswersByQuestionId: {},
    formQuestions: $('#editor'),
    questionsByParentId: {},
    repeatCounter: {},
    templates: {
      question: _.template($('#question-edit-template').html()),
      photoQuestion: _.template($('#photo-question-edit-template').html()),
      answer: _.template($('#answer-edit-template').html())
    },

    initialize: function(options) {
      _.bindAll(this, 'render', 'save', 'done', 'makeBlankQuestion', 'renderForm',
        'suffix', 'editQuestion', 'editQuestionType', 'deleteQuestion',
        'createQuestion', 'createPhotoQuestion', 'createAnswer', 'addSubQuestion', 'addSubPhotoQuestion',
        'renderQuestion', 'editAnswer', 'deleteAnswer', 'slugify', 'updatePreview');

      this.forms = options.forms;
    },

    render: function() {
      this.renderForm();
      this.updatePreview();
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

    done: function(event) {
      event.preventDefault();
      console.log('Done editing');
      _kmq.push(['record', 'Done editing survey questions']);
      this.trigger("done");
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
      $(this.el).html(_.template($('#form-editor-template').html(), {}));

      // Clear out the editor, just in case.
      this.formQuestions = $('#editor');
      this.formQuestions.html('');

      // Handle save events
      $(this.el).find('.save').click(this.save);
      $(this.el).find('.done').click(this.done);

      // Default to a blank question if the form is empty
      if (settings.formData === undefined) {
        settings.formData = {};
        settings.formData.questions = [];
        settings.formData.questions.push(this.makeBlankQuestion());
      }

      // Render form
      _.each(settings.formData.questions, function (question, questionIndex) {
        this.renderQuestion(question, undefined, undefined, undefined, undefined, questionIndex, settings.formData.questions);

        // last param was settings.formData.questions
      }, this);
      this.updatePreview();
    },

    suffix: function(name) {
      if(_.has(this.repeatCounter, name)) {
        this.repeatCounter[name] += 1;
        return '-' + this.repeatCounter[name].toString();
      }

      this.repeatCounter[name] = 1;
      return '';
    },

    editQuestion: function(question) {
      // TODO:
      // What if we do:
      // view = this;
      // return function(event) {
      //  view.slugify(text)
      //  ...
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

        this.updatePreview();
      };
    },

    editQuestionType: function(question) {
      return function(event) {
        _kmq.push(['record', 'Question type changed']);

        var dataRole = $(event.target).attr('data-role');
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
        }

        // Update the styling
        var $pills = $(event.target).parent().find('.question-type');
        $pills.removeClass('btn-info');
        $(event.target).addClass('btn-info');

        this.updatePreview();
      };
    },

    deleteQuestion: function($question, parent, questionIndex) {
      return function(event) {
        console.log("removing question");
        _kmq.push(['record', 'Question deleted']);

        // Remove it from the DON.
        $question.remove();

        // Remove it from the json
        parent.splice(questionIndex, 1);
        this.updatePreview();
      };
    },

    createQuestion: function(parent, questionIndex) {
      return function(event) {
        console.log("Adding a new question");
        _kmq.push(['record', 'Question added']);

        var newQuestion = this.makeBlankQuestion();
        parent.splice(questionIndex + 1, 0, newQuestion);

        this.updatePreview();
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

        this.updatePreview();
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

        this.updatePreview();
        this.renderForm();
      };
    },

    addSubQuestion: function(question, index) {
      return function(event) {
        console.log("Adding sub-question");
        _kmq.push(['record', 'Sub-question added']);

        if (_.has(question.answers[index], 'questions')) {
          question.answers[index].questions.unshift(this.makeBlankQuestion());
        }else {
          question.answers[index].questions = [this.makeBlankQuestion()];
        }

        this.updatePreview();
        this.renderForm();
      };
    },

    addSubPhotoQuestion: function(question, index) {
      return function(event) {
        console.log("Adding sub-photo-question");
        _kmq.push(['record', 'Sub-question added']);
        var q = this.makeBlankQuestion();
        q.type = 'file';
        delete q.answers;

        if (_.has(question.answers[index], 'questions')) {
          question.answers[index].questions.unshift(q);
        }else {
          question.answers[index].questions = [q];
        }

        this.updatePreview();
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

        this.updatePreview();
      };
    },

    deleteAnswer: function(question, index, $answer) {
      return function(event) {
        console.log("removing answer");
        _kmq.push(['record', 'Answer deleted']);

        // Remove it from the json
        question.answers.splice(index, 1);
        this.updatePreview();

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
      // This should pass around a well-document options object
      // Instead of 30 different parameters

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

      // Listen for changes to the question ...................................
      // TODO: make it less verbose

      // Listen for changes to the question text
      var editQuestionProxy = $.proxy(this.editQuestion(question), this);
      $question.find('> div input').keyup(editQuestionProxy);

      // Listen for changes of the question type
      var editQuestionTypeProxy = $.proxy(this.editQuestionType(question), this);
      $question.find('.question-type').click(editQuestionTypeProxy);

      // Listen for a request to remove a question
      var deleteQuestionProxy = $.proxy(this.deleteQuestion($question, parent, questionIndex), this);
      $question.find('> div .remove').click(deleteQuestionProxy);

      // Listen for a request to add a question
      var createQuestionProxy = $.proxy(this.createQuestion(parent, questionIndex), this);
      $question.find('.add-question').click(createQuestionProxy);

      // Listen for a request to add a photo question
      var createPhotoQuestionProxy = $.proxy(this.createPhotoQuestion(parent, questionIndex), this);
      $question.find('.add-photo-question').click(createPhotoQuestionProxy);

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

      // Deal with answers ....................................................
      var questionID = id;

      // Add each answer to the question
      _.each(question.answers, function (answer, index) {
        // The triggerID is used to hide/show other question groups
        var triggerID = _.uniqueId(question.name);

        if(question.type === "checkbox") {
          suffixed_name = answer.name + this.suffix(answer.name);
          triggerID = suffixed_name; //_.uniqueId(answer.name);
          id = suffixed_name; //_.uniqueId(answer.name);
        }

        // Set the data used to render the answer
        var data = {
          questionName: suffixed_name,
          id: triggerID,
          theme: (answer.theme || "c"),
          value: answer.value,
          text: answer.text
        };

        // Render the answer template...
        var $answer;
        var referencesToAnswersForQuestion;

        $answer = $(this.templates.answer(data));
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

        // Add a sub-question
        var $addSubQuestion = $answer.find('.add-sub-question');
        var addSubQuestionProxy = $.proxy(this.addSubQuestion(question, index), this);
        $addSubQuestion.click(addSubQuestionProxy);

        // Add sub photo question
        var $addSubPhotoQuestion = $answer.find('.add-sub-photo-question');
        var addSubPhotoQuestionProxy = $.proxy(this.addSubPhotoQuestion(question, index), this);
        $addSubPhotoQuestion.click(addSubPhotoQuestionProxy);

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
    },

    updatePreview: function() {
      this.trigger("formUpdated");
    }

  }); // end BuilderView{}

  return Builder;

});
