/*jslint nomen: true */
/*globals define: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',
  'moment',
  'settings',
  'api',

  // Models
  'models/responses',

  // Views
  'views/map'
],

function($, _, Backbone, moment, settings, api, Responses, MapView) {
  'use strict'; 

  var ResponseViews = {};

  ResponseViews.ListView = Backbone.View.extend({
    responses: null,
    firstRun: true,
    surveyId: null,
    paginationView: null,
    filters: {},

    events: { 
      "change #filter":  "filter",
      "click #subfilter a": "subFilter",
      "click #reset": "reset"
    },

    initialize: function(options) {
      _.bindAll(this, 'render', 'goToPage', 'humanizeDates', 'filter', 'subFilter', 'setupPagination', 'doesQuestionHaveTheRightAnswer');
      this.template = _.template($('#response-view').html());
      
      this.responses = options.responses;
      this.responses.on('reset', this.render, this);

      this.forms = options.forms;
    },
    
    render: function() { 
      console.log("Rendering response view");

      // The first time we render, we want to save a copy of the original responses
      if (this.firstRun) {
        this.allResponses = new Responses.Collection(this.responses.models);
        this.firstRun = false;
      }

      // TODO: Pagination
      this.setupPagination();
      var thisPage = this.responses.toJSON().slice(this.pageStart, this.pageEnd);

      // Humanize the dates so people who aren't robots can read them
      this.humanizeDates(thisPage);  

      // Set up for filtering
      var flattenedForm = this.forms.getFlattenedForm();

      // Actually render the page
      var context = { 
        responses: thisPage,
        flattenedForm: flattenedForm
      };    
      this.$el.html(this.template(context));

      // Set up the map view _after_ the results have arrived. 
      this.mapView = new MapView({
        el: $("#map-view-container"),
        responses: this.responses 
      });

      // If the data has been filtered, show that on the page. 
      // TODO: This should be done in a view. 
      if (_.has(this.filters, "answerValue")) {
        $("#current-filter").html("<h4>Current filter:</h4> <h3>" + this.filters.questionValue + ": " + this.filters.answerValue + "</h3>   <a id=\"reset\" class=\"button\">Clear filter</a>");
      }

    },

    setupPagination: function() {
      this.page = 0;
      this.pageListCount = 20000;
      this.pageStart = 0;
      this.pageEnd = this.pageStart + this.pageListCount;
      this.pageCount = Math.floor(this.responses.length / this.pageListCount);  
    },

    goToPage: function(pageStr) {
      var page = parseInt(pageStr, 10); 
      this.page = page;
      this.pageStart = (this.page - 1) * this.pageListCount;
      this.pageEnd = this.page * this.pageListCount;
      
      this.render();
    },

    reset: function(e) {
      this.filters = {};
      this.responses.reset(this.allResponses.models);
      // render should be triggered by an event...
      // this.render();

      $("#current-filter").html("");
    },

    filter: function(e) {
      // _kmq.push(['record', "Question filter selected"]);
      var $question = $(e.target);
      var question = $question.val();

      // Get the list of distinct options
      var answers = this.responses.getUniqueAnswersForQuestion(question);
      $("#subfilter").html(_.template($('#filter-results').html(), { choices: answers }));

      // Distinguish the responses visually on the map
      this.mapView.mapResponses(question, answers);
    },

    subFilter: function(e) {
      // _kmq.push(['record', "Answer filter selected"]);
      var $answer = $(e.target);

      // TODO
      // Notify the user we're working on it.
      // NSB.setLoading(true);

      // Reset the collection 
      // this.responses.reset(this.allResponses.models);

      // Filter the responses
      this.filters.answerValue = $answer.text();
      this.filters.questionValue = $("#filter").val();

      var filteredResponses = this.responses.filter(this.doesQuestionHaveTheRightAnswer);

      this.responses.reset(filteredResponses);

      // TODO
      // Let the user know we're done
      // NSB.setLoading(false);
    },

    doesQuestionHaveTheRightAnswer: function(resp) {
      //if (_.has(resp.attributes, 'responses')) {
      return resp.attributes.responses !== undefined && resp.attributes.responses[this.filters.questionValue] === this.filters.answerValue;
      //}
      // return false;
    },

    humanizeDates: function(responses, field) {
      _.each(responses, function(response){
        // 2012-06-26T20:00:52.283Z
        if(_.has(response, "created")) {
          response.createdHumanized = moment(response.created, "YYYY-MM-DDThh:mm:ss.SSSZ").format("MMM Do h:mma");
        }
      });
    }
  
  });

  return ResponseViews;

});

