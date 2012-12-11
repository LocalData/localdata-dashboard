/*jslint nomen: true */
/*globals define: true */

define(function (require) {
  'use strict';
  var $ = require('jquery');
  var _ = require('lib/lodash');

  var allSurveyQuestions = require('survey_questions');

  var app = {};

  // Survey builder questions
  // TODO: these should come from a separate file or potentially the API.
  var metaQuestions = [{
    text: 'Would you like to survey lots/parcels in a city?',
    summary: 'Lots/parcels',
    type: 'radio',
    options: [{
      text: 'Yes',
      questions: [{
        text: 'What types of property would you like to cover?',
        summary: 'Property type',
        type: 'checkbox',
        options: [{
          text: 'Residential'
        }, {
          text: 'Commercial'
        }, {
          text: 'Industrial'
        }, {
          text: 'Institutional'
        }]
      },
      {
        text: 'Will you collect information on vacant lots?',
        summary: 'Vacant lots',
        type: 'radio',
        options: [{
          text: 'Yes'
        }, {
          text: 'No'
        }]
      }]
    }, {
      text: 'No',
      questions: null
    }]
  }];

  var createId = (function () {
    var id = 0;
    return function () {
      id += 1;
      return id;
    };
  }());

  function linearize(questions, node) {
    if (node === undefined) {
      node = 'options';
    }

    if (questions === undefined || questions === null) {
      return [];
    }
    return _.reduce(questions, function (memo, question) {
      var sub = [];
      var i;
      for (i = 0; i < question[node].length; i += 1) {
        sub = sub.concat(linearize(question[node][i].questions, node));
      }
      question.id = createId();
      return memo.concat([question], sub);
    }, []);
  }



  function selectSurveyQuestions(builderQuestions) {
    var surveyQList = linearize(allSurveyQuestions, 'answers');

    function findQByName(name) {
      return _.find(surveyQList, function (q) {
        return q.name === name;
      });
    }
    function activateQuestions(names) {
      _.forEach(surveyQList, function (q) {
        if (_.include(names, q.name)) {
          q.active = true;
        } else {
          q.active = false;
        }
      });
    }

    var activate = [];

    // TODO: This logic should get coded into the data structure that holds the
    // builder questions.
    if (builderQuestions[0].responses[0] === 0) {
      activate.push('structure');
      activate.push('structure-properties');
      activate.push('in-use');

      var useCount = 0;
      if (_.include(builderQuestions[1].responses, 0)) {
        // Residential
        activate.push('units');
        activate.push('condition');
        activate.push('occupancy');
        useCount += 1;
      }
      if (_.include(builderQuestions[1].responses, 1)) {
        // Commercial
        activate.push('condition-commercial');
        activate.push('storefront-condition');
        activate.push('commercial-units');
        activate.push('commercial-use');
        useCount += 1;
      }
      if (_.include(builderQuestions[1].responses, 2)) {
        // Industrial
        activate.push('condition-industrial');
        activate.push('industrial-detailed-use');
        useCount += 1;
      }
      if (_.include(builderQuestions[1].responses, 3)) {
        // Institutional
        activate.push('condition-institutional');
        activate.push('detailed-use');
        useCount += 1;
      }
      if (useCount > 1) {
        activate.push('multiple-uses-check');
      }

      if (_.include(builderQuestions[2].responses, 0)) {
        // Vacant Lots
        activate.push('vacant-property-details');
        activate.push('maintenance');
        activate.push('no-structure');
      }
    //} else {
      // Non-parcel survey
    }

    activateQuestions(activate);
  }

  function selectByIndex(arr, indices) {
    return _.filter(arr, function (el, index) {
      return _.include(indices, index);
    });
  }

  // Get the index of the first active question that follows the provided
  // index.
  function nextActive(list, index) {
    var i = index + 1;
    while (i < list.length && !list[i].active) {
      i += 1;
    }

    if (i === list.length) {
      return -1;
    }
    return i;
  }

  // Get the index of the last active question that precedes the provided
  // index.
  function previousActive(list, index) {
    var i = index - 1;
    while (i >= 0 && !list[i].active) {
      i -= 1;
    }

    return i;
  }

  // Get the index of the last active question.
  function lastActive(list) {
    var index = list.length - 1;
    while (!list[index].active) {
      index -= 1;
    }
  }

  var questionList = linearize(metaQuestions);
  questionList[0].active = true;

  var $promptContainer = $('#prompt-container');
  var tPromptContent = $('#t-prompt-content').html();
  var tPromptRadio = $('#t-prompt-radio').html();
  var tPromptCheck = $('#t-prompt-check').html();
  var $nextButton = $('#next-button');
  var $prevButton = $('#prev-button');

  function disableNext() {
    $nextButton.hide();
  }
  function disablePrev() {
    $prevButton.hide();
  }
  function enableNext() {
    $nextButton.show();
  }
  function enablePrev() {
    $prevButton.show();
  }

  function renderQuestion(index) {
    var question = questionList[index];
    var html = _.template(tPromptContent, {
      index: index,
      question: question.text
    });
    var template;
    var data;
    var $el;
    if (question.type === 'radio') {
      // Radio buttons
      // Don't let the user go ahead until one of the options has been selected
      disableNext();
      template = tPromptRadio;
      $el = $(_.map(question.options, function (option, index) {
        return _.template(template, {
          text: option.text,
          radioGroup: question.id,
          index: index,
          checked: question.responses !== undefined && _.include(question.responses, index)
        });
      }).join(''));
    } else {
      // Checkboxes
      template = tPromptCheck;
      $el = $(_.map(question.options, function (option, index) {
        return _.template(template, {
          text: option.text,
          index: index,
          checked: question.responses !== undefined && _.include(question.responses, index)
        });
      }).join(''));
    }

    $el.click(function (e) {
      var checked = $promptContainer.find(':checked');
      if (question.type === 'radio' &&
          index < questionList.length - 1 &&
            checked.length > 0) {
        enableNext();
      }
      var indices = checked.map(function () {
        return parseInt($(this).attr('data-index'), 10);
      });
      question.responses = indices.toArray();

      // Activate/deactivate the appropriate subquestions.
      _.forEach(question.options, function (option, index) {
        if (option.questions !== undefined) {
          if (_.include(indices, index)) {
            _.forEach(option.questions, function (q) {
              q.active = true;
            });
          } else {
            _.forEach(option.questions, function (q) {
              q.active = false;
            });
          }
        }
      });
    });

    $promptContainer.html(html);
    $promptContainer.append($el);
  }

  var progressTabs = (function () {
    var self = {};
    var progressIndices = [];
    var current = -1;

    // Render the appropriate progress tabs
    self.render = function () {
      var $container = $('#progress-container');
      var template = $('#t-progress-tab').html();

      $container.html('');

      var html = _.map(progressIndices, function (index) {
        var data = {
          label: questionList[index].summary,
          active: false
        };
        if (index === current) {
          data.active = true;
        }
        return _.template(template, data);
      }).join('');

      $container.html(html);
    };

    // Add a progress tab for the questionList index.
    self.add = function (index) {
      current = -1;
      if (!_.include(progressIndices, index)) {
        progressIndices.push(index);
      }
      self.render();
    };

    // Mark a progress tab as active by its questionList index.
    self.mark = function (index) {
      current = index;
      self.render();
    };

    return self;
  }());

  function renderPreview() {
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

      var contents = _.map(_.filter(questions, function (question) { return question.active; }),
                              function (question) {
        var $question = $(questionTemplate({
          prompt: question.text,
          answers: _.pluck(question.answers, 'text'),
          letters: letters
        }));

        var subQuestions = _.filter(_.map(question.answers, function (answer, i) {
          if (answer.questions === undefined) {
            return null;
          }

          var sub = walkActive(answer.questions, depth + 1, letters[i]);
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

    var $preview = $('#preview');
    $preview.empty();
    $preview.append(titleTemplate());
    $preview.append(nameTemplate({name: 'Big bird wants to know, why you hatin\'?'}));
    $preview.append(walkActive(allSurveyQuestions, 0));
    $preview.show();

    var $dimmer = $('#preview-dimmer');
    $dimmer.show();
    $dimmer.click(function (e) {
      e.preventDefault();

      $preview.hide();
      $dimmer.hide();
    });
  }

  $('#preview-sidebar').click(function (e) {
    e.preventDefault();

    selectSurveyQuestions(questionList);

    renderPreview();

    function linearizeActive(questions) {
      if (questions === undefined || questions === null) {
        return [];
      }
      return _.reduce(questions, function (memo, question) {
        if (!question.active) {
          return memo;
        }

        var sub = [];
        var i;
        for (i = 0; i < question.answers.length; i += 1) {
          sub = sub.concat(linearizeActive(question.answers[i].questions));
        }
        question.id = createId();
        return memo.concat([question], sub);
      }, []);
    }

    console.log(_.pluck(linearizeActive(allSurveyQuestions), 'text').join(', '));
  });

  app.initialize = function () {
    var questionIndex = 0;

    $('#preview').hide();

    $('#next-button').click(function (e) {
      e.preventDefault();

      if (questionIndex === 0) {
        enablePrev();
      }

      progressTabs.add(questionIndex);

      questionIndex = nextActive(questionList, questionIndex);

      if (questionIndex === lastActive(questionList)) {
        disableNext();
      }

      renderQuestion(questionIndex);
    });

    $('#prev-button').click(function (e) {
      e.preventDefault();

      if (questionIndex === lastActive(questionList)) {
        enableNext();
      }

      questionIndex = previousActive(questionList, questionIndex);

      if (questionIndex === 0) {
        disablePrev();
      }

      renderQuestion(questionIndex);

      progressTabs.mark(questionIndex);
    });

    disablePrev();
    renderQuestion(questionIndex);
  };

  return app;
});