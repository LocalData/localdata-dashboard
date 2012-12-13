/*jslint nomen: true */
/*globals define: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',

  // LocalData
  'settings',
  'api'

],

function($, _, Backbone, settings, api) {
  'use strict'; 

  var FormPreviewView = Backbone.View.extend({

    initialize: function(options) {
      _.bindAll(this, 'render', 'renderPreview');
      console.log("Init form view");
      console.log(this.options);

      this.forms = options.forms;
      this.form = this.forms[0];
      this.$el = $(options.el);
      this.render();
    },

    renderPreview: function() {
      console.log("Rendering preview");
      // Get the templates ready to go 
      var boxTemplate = _.template($('#t-preview-questions-container').html());
      var questionTemplate = _.template($('#t-preview-question').html());
      var titleTemplate = _.template($('#t-preview-title').html());
      var nameTemplate = _.template($('#t-preview-name').html());

      var letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

      function walkActive(questions, depth, condition) {
        console.log(questions);
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

      // Actually render the preview
      var $preview = $("#preview");
      $preview.empty();
      $preview.append(titleTemplate());
      $preview.append(nameTemplate({name: this.form.name}));
      console.log(this.form);
      $preview.append(walkActive(this.form.questions, 0));
      $preview.show();


      // Dim the screen behind the preview
      var $dimmer = $("#preview-dimmer");
      $dimmer.show();
      $dimmer.click(function (event) {
        event.preventDefault();

        $preview.hide();
        $dimmer.hide();
      });

      $("#preview-close").click(function (event) {
        event.preventDefault();

        $preview.hide();
        $dimmer.hide();
      });

    },

    render: function() {        
      var context = { };    
      this.$el.html(_.template($('#preview-view').html(), context));

      this.renderPreview();
    }


    
  });

  return FormPreviewView;
});