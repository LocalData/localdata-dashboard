/*jslint nomen: true */
/*globals define: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',
  'moment',
  'lib/tinypubsub',
  'lib/kissmetrics',

  // LocalData
  'settings',
  'api',

  // Models
  'models/responses',

  // Views
  'views/map'
],

function($, _, Backbone, moment, events, _kmq, settings, api, Responses, MapView) {
  'use strict';

  var ResponseViews = {};


  ResponseViews.MapAndListView = Backbone.View.extend({
    responses: null,
    firstRun: true,
    survey: null,
    filters: {},
    mapView: null,
    listView: null,

    el: '#response-view-container',

    events: {
      "change #filter":  "filter",
      "click #subfilter a": "subFilter",
      "click #reset": "reset"
    },

    initialize: function(options) {
      _.bindAll(this, 'render', 'filter', 'subFilter', 'updateFilterView', 'updateFilterChoices');

      this.template = _.template($('#response-view').html());

      this.responses = options.responses;
      this.responses.on('reset', this.update, this);
      this.responses.on('add', this.update, this);
      this.responses.on('addSet', this.update, this);

      this.forms = options.forms;
      this.forms.on('reset', this.updateFilterChoices, this);

      this.survey = options.survey;

      // Make sure we have forms available
      this.render();
    },

    // TODO: merge update and render
    render: function() {
      console.log("Rendering response view");
      if (this.firstRun) {
        this.firstRun = false;
      } else {
        // If this is not the first time, then we need to remove the current
        // map and list views, since we'll create new ones.
        this.mapView.remove();
        this.mapView = null;
        this.listView.remove();
        this.listView = null;
      }

      // Actually render the page
      var context = {
        responses: this.responses
      };
      this.$el.html(this.template(context));

      // If the data has been filtered, show that on the page.
      // TODO: This should be done in a view.
      // Set up the map view, now that the root exists.
      if (this.mapView === null) {
        this.mapView = new MapView({
          el: $('#map-view-container'),
          responses: this.responses,
          survey: this.survey
        });
      }

      // Set up the list view, now that the root exists.
      if (this.listView === null) {
        this.listView = new ResponseViews.ListView({
          el: $('#responses-list-container'),
          responses: this.responses,
          parentView: this
        });
      }

      // Render the map
      this.mapView.render();

      // Render the responses list
      this.listView.render();

      this.updateFilterView();
    },

    update: function () {
      if (this.firstRun) {
        this.render();
      }

      // Update the count
      // TODO: Use a template
      this.$('#count').html(_.template('<%= _.size(responses) %> Response<% if(_.size(responses) != 1) { %>s<% } %>', {responses: this.responses}));

      // TODO:
      // Update the filters
    },


    /**
     * Update the first-level choices for filtering responses
     */
    updateFilterChoices: function() {
      var flattenedForm = this.forms.getFlattenedForm();
      $("#filter-view-container").html(_.template($('#filter-results').html(), { flattenedForm: flattenedForm }));
    },


    /**
     * If the data has already been filtered, show that on the page
     */
    updateFilterView: function () {
      if (_.has(this.filter, "answer")) {

        // Indicate the filter selection.
        $("#current-filter").html("<h4>Current filter:</h4> <h3>" + this.filter.question + ": " + this.filter.answer + "</h3>   <a id=\"reset\" class=\"button\">Clear filter</a>");
        $('#subfilter').html('');

      } else {
        // Clear the filter selections.
        $("#current-filter").html("");
        $('#filter').val('');
      }
    },

    /**
     * Reset any filters
     */
    reset: function(event) {
      this.filter = {};

      this.responses.clearFilter();
      this.updateFilterView();
    },


    /**
     * Show possible answers to a given question
     */
    filter: function(e) {
      _kmq.push(['record', "Question filter selected"]);
      var $question = $(e.target);
      var question = $question.val();

      // Get the list of distinct options
      var answers = this.responses.getUniqueAnswersForQuestion(question);
      $("#subfilter").html(_.template($('#filter-results-answer').html(), { choices: answers }));

      // Distinguish the responses visually on the map
      this.mapView.setFilter(question, answers);
    },


    /**
     * Show only responses with a specific answer
     */
    subFilter: function(event) {
      _kmq.push(['record', "Answer filter selected"]);
      var $answer = $(event.target);

      // Notify the user we're working on it
      // (it can take a while to filter a lot of items)
      events.publish('loading', [true]);

      // Filter the responses
      this.filter.answer = $answer.text();
      this.filter.question = $("#filter").val();

      this.responses.setFilter(this.filter.question, this.filter.answer);

      events.publish('loading', [false]);

      this.updateFilterView();
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
    parentView: null,
    visibleItemCount: 10,
    page: -1,
    pageCount: null,
    nextButton: null,
    prevButton: null,
    responsesPagination: null,

    events: {
      'click #next': 'pageNext',
      'click #prev': 'pagePrev',
      'click .pageNum': 'goToPage'
    },

    initialize: function(options) {
      _.bindAll(this, 'updateResponses', 'render', 'goToPage', 'humanizeDates', 'setupPagination', 'pagePrev', 'pageNext');
      this.template = _.template($('#response-list').html());
      this.paginationTemplate = _.template($('#t-responses-pagination').html());

      this.responses = options.responses;
      this.listenTo(this.responses, 'reset', this.updateResponses);
      this.listenTo(this.responses, 'addSet', this.updateResponses);

      this.parentView = options.parentView;

      if (options.visibleItemCount) {
        this.visibleItemCount = options.visibleItemCount;
      }

      this.nextButton = this.$('#next');
      this.prevButton = this.$('#prev');
    },

    render: function() {
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

      // Actually render the page
      var context = {
        responses: thisPage,
        startIndex: start
      };

      // Render the responses table
      this.$el.html(this.template(context));
      // Render the pagination elements
      this.responsesPagination = this.$('#responses-pagination');
      this.responsesPagination.html(this.paginationTemplate({
        page: this.page,
        pageCount: this.pageCount
      }));
    },

    updateResponses: function () {
      var rerender = false;
      if (this.page === this.pageCount - 1 || this.pageCount === 0) {
        rerender = true;
      }

      // We got more responses, so let's recalculate the pagination parameters.
      this.setupPagination();

      // We only need to rerender if we're on the last page. Otherwise, those
      // new items don't affect the view yet.
      if (rerender) {
        this.render();
      } else {
        var context = {
          page: this.page,
          pageCount: this.pageCount
        };
        this.responsesPagination.html(this.paginationTemplate(context));
      }
    },

    setupPagination: function() {
      if (this.page === -1) {
        this.page = 0;
      }
      this.pageCount = Math.ceil(this.responses.length / this.visibleItemCount);
    },

    goToPage: function(e) {
      e.preventDefault();

      _kmq.push(['record', "Specfic result page selected"]);
      var page = parseInt($(e.target).attr('data-page'), 10);
      this.page = page;
      this.render();
    },

    pageNext: function (e) {
      e.preventDefault();

      _kmq.push(['record', "Next page of results selected"]);
      if (this.page === this.pageCount - 1) {
        return;
      }

      this.page += 1;
      this.render();
    },

    pagePrev: function (e) {
      e.preventDefault();

      _kmq.push(['record', "Previous page of results selected"]);
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

