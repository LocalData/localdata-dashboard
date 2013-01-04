/*jslint nomen: true */
/*globals define: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',

  // LocalData
  'settings',
  'api',

  'views/form'
],

function($, _, Backbone, settings, api, FormViews) {
  'use strict'; 

  return function(app) {
    // Add Question stuff
    var boxAnswersByQuestionId = {};
    var questionsByParentId = {};
    var repeatCounter = {};
    var formQuestions = $('#editor');
    var templates;
    
    this.init = function() {
      api.getForm(function(){
        renderForm();
        updatePreview();
      });
    };

    // The blank question template.
    var blankQuestion = function(){
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
    };

    var renderForm = this.renderForm = function() {
        $('#editor').html('');
        console.log(settings.formData);

        // Default to a blank question if the form is empty 
        if (settings.formData === undefined) {
          settings.formData = {};
          settings.formData.questions = [];
          settings.formData.questions.push(new blankQuestion());
        };

        // Render form
        _.each(settings.formData.questions, function (question, questionIndex) {
          addQuestion(question, undefined, undefined, undefined, undefined, questionIndex, settings.formData.questions);
        }, this);
        updatePreview();
    };

    var suffix = function(name) {
      if(_.has(repeatCounter, name)) {
        repeatCounter[name] += 1;
        return "-" + repeatCounter[name].toString();
      }

      repeatCounter[name] = 1; 
      return "";
    };

    function addQuestion(question, visible, parentID, triggerID, appendTo, questionIndex, parent) {
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
      if (templates === undefined) {
        templates = {
          question: _.template($('#question-template').html()),
          answer: _.template($('#answer-template').html())
        };
      }

      // Give the question an ID based on its name
      var id = _.uniqueId(question.name);

      // Render the questions --------------------------------------------------
      var $question = $(templates.question({question: question}));

      // Listen for changes to the question
      $question.find('> input').keyup(function(){
        var text = $(this).val();
        var name = slugify(text)

        question.text = text;
        question.name = name;

        updatePreview();
      });

      // Change question type
      $question.find('.question-type').click(function(){
        var dataRole = $(this).attr('data-role');
        console.log(dataRole);
        if (dataRole === 'radio-question') {
          delete question.type;
        }
        if (dataRole === 'checkbox-question') {
          question.type = "checkbox";
        }
        updatePreview();
      });

      // Remove a question
      $question.find('> .remove').click(function(){
        console.log("removing question");

        // Remove it from the DON.
        $question.remove();

        // Remove it from the json
        parent.splice(questionIndex, 1);
        updatePreview();
      });

      // Add a question
      $question.find('> .add-question').click(function(){
        console.log("adding question");
        // Sensible default answers:
        var newQuestion = {};
        newQuestion.text = '';
        newQuestion.name = '';
        newQuestion.answers = [
          {
            "value": "yes",
            "text": "Yes"
          },
          {
            "value": "no",
            "text": "No"
          }
        ];
        parent.splice(questionIndex + 1, 0, newQuestion);
        updatePreview();
        renderForm();
      });

      // Add an answer 
      $question.find('.add-answer').click(function(){
        question.answers.push({
          'text': '',
          'value': ''
        });
        updatePreview();
        renderForm();
      });

      // Some stuff with siblings -- forget what this does. 
      var siblings = questionsByParentId[parentID];
      if (siblings === undefined) {
        siblings = [];
        questionsByParentId[parentID] = siblings;
      }
      siblings.push($question); 

      if (appendTo !== undefined) {
        $(appendTo).append($question);
      }else {
        formQuestions.append($question);
      }

      var suffixed_name = question.name + suffix(question.name);

      // TODO Infoboxes (aka help text for questions)
      // if(question.info !== undefined) {
      // }

      // Deal with answers -------------------------------------------------------
      var questionID = id;
      // Add each answer to the question
      _.each(question.answers, function (answer, index) {
        // The triggerID is used to hide/show other question groups
        var triggerID = _.uniqueId(question.name);

        // TODO: checkbox questions should be consistent with other answer groups
        if(question.type === "checkbox") {
          suffixed_name = answer.name + suffix(answer.name);
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

        // Render the answer and append it to the fieldset.
        var $answer;
        var referencesToAnswersForQuestion;

        $answer = $(templates.answer(data));
        referencesToAnswersForQuestion = boxAnswersByQuestionId[questionID];
        if (referencesToAnswersForQuestion === undefined) {
          referencesToAnswersForQuestion = [];
          boxAnswersByQuestionId[questionID] = referencesToAnswersForQuestion;
        }

        $question.find('> .answers').append($answer);

        // Tools related to editing answers ------------------------------------

        // Change the answer text when updated
        var $input = $answer.find('input');
        $input.keyup(function(){
          question.answers[index].text = $(this).val();
          question.answers[index].value = slugify($(this).val());
          updatePreview();
        });

        // Add a sub-question
        var $addSubQuestion = $answer.find('.add-sub-question');
        $addSubQuestion.click(function(e){
          console.log("Adding sub-question");
          if (_.has(question.answers[index], 'questions')) {
            question.answers[index].questions.unshift(blankQuestion());
          }else {
            question.answers[index].questions = [blankQuestion()];
          }

          updatePreview();
          renderForm();
        })

        // Remove an answer
        var $remove = $answer.find('.remove');
        $remove.click(function(e) {
          console.log("removing answer");

          // Remove it from the json
          question.answers.splice(index, 1);
          updatePreview();

          // Remove it from the DON.
          $answer.remove();
        });


        // If there are conditional questions, add them. -----------------------
        if (answer.questions !== undefined) {
          appendTo = $answer;
          _.each(answer.questions, function (subq, questionIndex) {
            // Add the sub questions before the repeatButton
            if(appendTo !== undefined){
              addQuestion(subq, false, id, triggerID, appendTo, questionIndex, answer.questions);
            }else {
              addQuestion(subq, false, id, triggerID, undefined, questionIndex, answer.questions);
            }
          });
        } // end check for sub-answers

      });
    }; // end addQuestion

    // Slugify a string
    // Used to generate the name attribute of forms 
    var slugify = function(text) {
      text = text.replace(/[^-a-zA-Z0-9,&\s]+/ig, '');
      text = text.replace(/-/gi, "_");
      text = text.replace(/\s/gi, "-");
      return text;
    };

    var updatePreview = function() {
     // $("#form-json").html(JSON.stringify(settings.formData.questions));
     app.preview = new FormView(app, "#preview");
    };

  } // end app{}

}); 




