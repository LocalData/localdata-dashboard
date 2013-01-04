/*jslint nomen: true */
/*globals define: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',

  // LocalData
  'settings',
  'api',

  // Views
  'views/design'
],

function($, _, Backbone, settings, api, DesignViews) {
  'use strict'; 

  var FormViews = {};

  FormViews.FormView = Backbone.View.extend({
    
    elId: "#form-view-container",

    initialize: function(options) {
      _.bindAll(this, 'render', 'showEditor');
      console.log("Init forms view");
      this.survey = options.survey;
      this.forms = options.forms;
      // console.log(this.survey);
      // console.log(this.forms);
    },
    
    showEditor: function() {
      $("#survey-design-container").empty();

      // If there isn't a form yet, let's show the survey creation view
      if (settings.formData === undefined) {

        $("#send-survey-container").hide();

        $('.button').hide();

        var designView = new DesignViews.DesignView({
          elId: "#survey-design-container",
          survey: this.survey
        });
        designView.render();

        designView.on("formAdded", this.render, this);

      }else {

        $("#send-survey-container").show(); // hacky!

        // Preview the form if there already is one.
        this.previewView = new FormViews.PreviewView({
          elId: "#preview-view-container",
          forms: [settings.formData]
        });  

      }    
    },
    
    render: function() {        
      var context = { 
        survey: this.survey.toJSON(),
        forms: this.forms.toJSON() 
      };    

      $(this.elId).html(_.template($('#form-view').html(), context));

      api.getForm(this.showEditor);

    }
  });

  FormViews.PreviewView = Backbone.View.extend({

    initialize: function(options) {
      _.bindAll(this, 'render', 'renderPreview', 'useSurvey');
      console.log("Init form view");
      console.log(this.options);

      this.forms = options.forms;
      this.form = this.forms[0];
      this.$el = $(options.elId);

      // Set if we want the preview to appear as a popup or not.
      this.popup = "";
      if (options.popup !== undefined) {
        this.popup = "popup";
      }

      this.render();
    },

    useSurvey: function(event) {
      console.log("Using the survey");
      api.createForm(this.form, function() {
        console.log("Form added!");
      });
    },

    renderPreview: function() {
      console.log("Rendering form preview");

      // Get the templates ready to go 
      var boxTemplate = _.template($('#t-preview-questions-container').html());
      var questionTemplate = _.template($('#t-preview-question').html());
      var titleTemplate = _.template($('#t-preview-title').html());
      var nameTemplate = _.template($('#t-preview-name').html());

      var letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

      function walkActive(questions, depth, condition) {
        if (questions === undefined || questions === null || questions.length === 0) {
          return null;
        }

        var boxData = {
          depth: depth,
          condition: null
        };
        if (condition !== undefined) {
          boxData.condition = condition;
        }
        var box = $(boxTemplate(boxData));

        var contents = _.map(questions, function (question) {
          var $question = $(questionTemplate({
            prompt: question.text,
            answers: _.pluck(question.answers, 'text'),
            letters: letters
          }));

          var subQuestions = _.filter(_.map(question.answers, function (answer, i) {
            if (answer.questions === undefined) {
              return null;
            }

            var sub = walkActive(answer.questions, depth + 1, question.answers[i].text);
            return sub;
          }), function (item) { return item !== null; });

          $question = _.reduce(subQuestions, function (memo, $sub) {
            return memo.add($sub);
          }, $question);

          return $question;
        });

        // If there are no active questions, don't create an empty container.
        if (contents.length === 0) {
          return null;
        }

        box.append(_.reduce(contents, function (memo, $el) {
          return memo.add($el);
        }, $()));
        return box;
      }

      var $dimmer;
      if (this.popup === "popup") {
        // Dim the screen behind the preview
        $dimmer = $("#preview-dimmer");
        $dimmer.fadeIn(100);
      }

      // Actually render the preview
      var $preview = $("#preview");
      $preview.hide();
      $preview.empty();
      $preview.append(titleTemplate());
      $preview.append(nameTemplate({name: this.form.name}));
      $preview.append(walkActive(this.form.questions, 0));
      $preview.fadeIn(250);

      // If the user wants to use the given survey...
      $('.use-survey').click(this.useSurvey);

      // Functions to close the preview popup + dimmer
      var closePreview = function(event) {
        event.preventDefault();

        $preview.fadeOut(100);
        $dimmer.fadeOut(150);
      };

      if (this.popup === "popup") {
        $dimmer.click(closePreview);
        $("#preview-close").click(closePreview);
      }

    },

    render: function() {        
      var context = { 
        popup: this.popup
      };    

      this.$el.html(_.template($('#preview-view').html(), context));

      this.renderPreview();
    }

  });

  return FormViews;
});