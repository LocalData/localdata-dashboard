/*jslint nomen: true */
/*globals define: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',

  // LocalData
  'settings',
  'api',

  'views/forms'
],

function($, _, Backbone, settings, api, FormViews) {
  'use strict'; 

  var Builder = {};

  Builder.BuilderView = Backbone.View.extend({

    elId: "#builder-view-container",

    boxAnswersByQuestionId: {},
    formQuestions: $('#editor'),
    questionsByParentId: {},
    repeatCounter: {},
    templates: {
      question: _.template($('#question-edit-template').html()),
      answer: _.template($('#answer-edit-template').html())
    },

    initialize: function(options) {
      _.bindAll(this, 'render', 'renderForm', 'updatePreview', 'suffix', 
        'renderQuestion', 'editQuestionType', 'deleteQuestion', 
        'createQuestion', 'editQuestion', 'addSubQuestion',
        'createAnswer', 'editAnswer', 'deleteAnswer',
        'slugify');
      
      this.forms = options.forms;
    },

    render: function() {
      this.renderForm();
      this.updatePreview();
    },

    // The blank question template.
    BlankQuestion: function(){
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
      // Clear out the editor window
      $(this.elId).html(_.template($('#survey-editor').html(), {}));

      this.formQuestions = $('#editor');
      this.formQuestions.html('');

      // Default to a blank question if the form is empty 
      if (settings.formData === undefined) {
        settings.formData = {};
        settings.formData.questions = [];
        settings.formData.questions.push(new this.BlankQuestion());
      }

      // Render form
      _.each(settings.formData.questions, function (question, questionIndex) {
        this.renderQuestion(question, undefined, undefined, undefined, undefined, questionIndex, undefined); 
        // last param was settings.formData.questions
      }, this);
      this.updatePreview();
    },

    suffix: function(name) {
      if(_.has(this.repeatCounter, name)) {
        this.repeatCounter[name] += 1;
        return "-" + this.repeatCounter[name].toString();
      }

      this.repeatCounter[name] = 1; 
      return "";
    },

    editQuestion: function(question) {
      return function(event) {
        console.log("Updating question");
        var text = $(event.target).val(); //$(this).val();
        var name = this.slugify(text);

        question.text = text;
        question.name = name;

        this.updatePreview();
        this.trigger("alert", "an event");
      };
    },

    editQuestionType: function(question) {
      return function(event) {
        var dataRole = $(event.target).attr('data-role');
        console.log(dataRole);
        if (dataRole === 'radio-question') {
          delete question.type;
        }
        if (dataRole === 'checkbox-question') {
          question.type = "checkbox";
        }

        this.updatePreview();
      };
    },

    deleteQuestion: function($question, parent, questionIndex) {
      return function(event) {
        console.log("removing question");

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
        var newQuestion = this.BlankQuestion();
        parent.splice(questionIndex + 1, 0, newQuestion);

        this.updatePreview();
        this.renderForm();
      };
    },

    createAnswer: function(question) {
      return function(event) {
        question.answers.push({
          'text': '',
          'value': ''
        });
        this.updatePreview();
        this.renderForm();
      };
    },

    addSubQuestion: function(question, index) {
      return function(event) {
        console.log("Adding sub-question");

        if (_.has(question.answers[index], 'questions')) {
          question.answers[index].questions.unshift(this.BlankQuestion());
        }else {
          question.answers[index].questions = [this.BlankQuestion()];
        }

        this.updatePreview();
        this.renderForm();
      };
    },

    editAnswer: function(question, index) {
      return function(event){
        var text = $(event.target).val();
        question.answers[index].text = text;
        question.answers[index].value = this.slugify(text);
        this.updatePreview();
      };
    },

    deleteAnswer: function(question, index, $answer) {
      return function(event) {
        console.log("removing answer");

        // Remove it from the json
        question.answers.splice(index, 1);
        this.updatePreview();

        // Remove it from the DON.
        $answer.remove();
      };
    },

    renderQuestion: function(question, visible, parentID, triggerID, appendTo, questionIndex, parent) {

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

      // Load the templates
      // if (this.templates === undefined) {
      //   this.templates = {
      //     question: _.template($('#question-template').html()),
      //     answer: _.template($('#answer-template').html())
      //   };
      // }

      // Give the question an ID based on its name
      var id = _.uniqueId(question.name);

      // Render the questions .................................................
      var $question = $(this.templates.question({question: question}));

      // Listen for changes to the question ...................................
      // TODO: make it less verbose

      // Listen for changes to the question text
      var editQuestionProxy = $.proxy(this.editQuestion(question), this);
      $question.find('> input').keyup(editQuestionProxy);

      // Listen for changes of the question type
      var editQuestionTypeProxy = $.proxy(this.editQuestionType(question), this);
      $question.find('.question-type').click(editQuestionTypeProxy);

      // Listen for a request to remove a question
      var deleteQuestionProxy = $.proxy(this.deleteQuestion($question, parent, questionIndex), this);
      $question.find('> .remove').click(deleteQuestionProxy);

      // Listen for a request to add a question
      var createQuestionProxy = $.proxy(this.createQuestion(parent, questionIndex), this);
      $question.find('> .add-question').click(createQuestionProxy);

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

      if (appendTo !== undefined) {
        $(appendTo).append($question);
      }else {
        this.formQuestions.append($question);
      }

      var suffixed_name = question.name + this.suffix(question.name);

      // TODO Infoboxes (aka help text for questions)
      // if(question.info !== undefined) {
      // }

      // Deal with answers -------------------------------------------------------
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
      text = text.replace(/-/gi, "_");
      text = text.replace(/\s/gi, "-");
      return text;
    },


    updatePreview: function() {
      console.log("TODO: Implement preview");
      // this.preview = new FormView("#preview");
    }

  }); // end BuilderView{}
  
  return Builder;

}); 




