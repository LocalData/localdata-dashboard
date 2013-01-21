/*jslint nomen: true */
/*globals define: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',
  'moment',
  'lib/tinypubsub',

  // LocalData
  'settings',
  'api',

  // Models
  'models/responses',

  // Views
  'views/map'
],

function($, _, Backbone, moment, events, settings, api, Responses, MapView) {
  'use strict'; 

  var ResponseViews = {};

  ResponseViews.MapAndListView = Backbone.View.extend({
    responses: null,
    firstRun: true,
    surveyId: null,
    paginationView: null,
    filters: {},
    mapView: null,
    listView: null,

    events: { 
      "change #filter":  "filter",
      "click #subfilter a": "subFilter",
      "click #reset": "reset"
    },

    initialize: function(options) {
      _.bindAll(this, 'render', 'goToPage', 'humanizeDates', 'filter', 'subFilter', 'setupPagination', 'doesQuestionHaveTheRightAnswer', 'remove');
      this.template = _.template($('#response-view').html());
      
      this.responses = options.responses;
      this.responses.on('reset', this.render, this);
      this.responses.on('add', this.update, this);
      this.responses.on('addSet', this.update, this);

      this.forms = options.forms;
    },
    
    render: function() { 
      console.log("Rendering response view");

      // The first time we render, we want to save a copy of the original responses
      if (this.firstRun) {
        this.allResponses = new Responses.Collection(this.responses.models);
        this.firstRun = false;
      } else {
        // If this is not the first time, then we need to remove the current
        // map and list views, since we'll create new ones.
        this.mapView.remove();
        this.mapView = null;
        this.listView.remove();
        this.listView = null;
      }

      // Set up for filtering
      var flattenedForm = this.forms.getFlattenedForm();

      // Actually render the page
      var context = { 
        responses: this.responses,
        flattenedForm: flattenedForm
      };    
      this.$el.html(this.template(context));

      // Set up the map view, now that the root exists.
      if (this.mapView === null) {
        this.mapView = new MapView({
          el: $('#map-view-container'),
          responses: this.responses
        });
      }

      // Set up the list view, now that the root exists.
      if (this.listView === null) {
        this.listView = new ResponseViews.ListView({ 
          el: $('#responses-list'),
          responses: this.responses,
          parentView: this
        });
      }

      // Render the map
      this.mapView.render();

      // Render the responses list
      this.listView.render();

      // If the data has been filtered, show that on the page. 
      // TODO: This should be done in a view. 
      if (_.has(this.filters, "answerValue")) {
        $("#current-filter").html("<h4>Current filter:</h4> <h3>" + this.filters.questionValue + ": " + this.filters.answerValue + "</h3>   <a id=\"reset\" class=\"button\">Clear filter</a>");
      }

    },

    update: function () {
      if (this.firstRun) {
        this.render();
      }
      // Update the responses area
      // TODO: Use a template
      this.$('#count').html(_.template('<%= _.size(responses) %> Response<% if(_.size(responses) != 1) { %>s<% } %>', {responses: this.responses}));
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
      this.mapView.plotAllResponses(question, answers);
    },

    subFilter: function(e) {
      // _kmq.push(['record', "Answer filter selected"]);
      var $answer = $(e.target);

      // Notify the user we're working on it.
      events.publish('loading', [true]);

      // Reset the collection 
      // this.responses.reset(this.allResponses.models);

      // Filter the responses
      this.filters.answerValue = $answer.text();
      this.filters.questionValue = $("#filter").val();

      var filteredResponses = this.responses.filter(this.doesQuestionHaveTheRightAnswer);

      this.responses.reset(filteredResponses);

      // Let the user know we're done
      events.publish('loading', [false]);
    },

    doesQuestionHaveTheRightAnswer: function(resp) {
      //if (_.has(resp.attributes, 'responses')) {
      return resp.attributes.responses !== undefined && resp.attributes.responses[this.filters.questionValue] === this.filters.answerValue;
      //}
      // return false;
    },

    remove: function () {
      this.$el.remove();
      this.stopListening();
      this.responses.off('reset', this.render, this);
      this.responses.off('add', this.update, this);
      this.responses.off('addSet', this.update, this);
      if (this.mapView) {
        this.mapView.remove();
      }
      if (this.listView) {
        this.listView.remove();
      }
      return this;
    }

  });

  ResponseViews.ListView = Backbone.View.extend({
    responses: null,
    firstRun: true,
    surveyId: null,
    paginationView: null,
    filters: {},
    parentView: null,
    visibleItemCount: 20,
    page: -1,
    pageCount: null,

    events: { 
      "click #next": "pageNext",
      "click #prev": "pagePrev"
    },

    initialize: function(options) {
      _.bindAll(this, 'updateResponses', 'render', 'goToPage', 'humanizeDates', 'filter', 'subFilter', 'setupPagination', 'doesQuestionHaveTheRightAnswer', 'pagePrev', 'pageNext');
      this.template = _.template($('#responses-table').html());
      
      this.responses = options.responses;
      this.listenTo(this.responses, 'reset', this.updateResponses);
      this.listenTo(this.responses, 'addSet', this.updateResponses);

      this.parentView = options.parentView;

      if (options.visibleItemCount) {
        this.visibleItemCount = options.visibleItemCount;
      }
    },

    render: function() { 
      console.log('Rendering response list');

      if (this.pageCount === null) {
        this.setupPagination();
      }

      var start = this.page * this.visibleItemCount;
      var end = start + this.visibleItemCount;
      var thisPage = _.map(this.responses.models.slice(start, end),
        function (item) {
          return item.toJSON();
        });

      // Humanize the dates so people who aren't robots can read them
      this.humanizeDates(thisPage);

      // Set up for filtering
      var flattenedForm = this.parentView.forms.getFlattenedForm();

      // Actually render the page
      var context = { 
        responses: thisPage,
        flattenedForm: flattenedForm,
        startIndex: start
      };    

      // Render the responses table
      this.$el.html(this.template(context));

      // If the data has been filtered, show that on the page. 
      // TODO: This should be done in a view. 
      if (_.has(this.filters, "answerValue")) {
        $("#current-filter").html("<h4>Current filter:</h4> <h3>" + this.filters.questionValue + ": " + this.filters.answerValue + "</h3>   <a id=\"reset\" class=\"button\">Clear filter</a>");
      }

    },

    updateResponses: function () {
      this.setupPagination();
      if (this.page === this.pageCount - 1) {
        this.render();
      }
    },

    setupPagination: function() {
      if (this.page === -1) {
        this.page = 0;
      }
      this.pageCount = Math.floor(this.responses.length / this.visibleItemCount);  
    },

    goToPage: function(pageStr) {
      var page = parseInt(pageStr, 10); 
      this.page = page;
      
      this.render();
    },

    pageNext: function () {
      if (this.page === this.pageCount - 1) {
        return;
      }

      this.page += 1;
      this.render();
    },

    pagePrev: function () {
      if (this.page === 0) {
        return;
      }

      this.page -= 1;
      this.render();
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

