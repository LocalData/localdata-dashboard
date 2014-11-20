/*jslint nomen: true */
/*globals define: true */

define(function(require, exports, module) {
  'use strict';

  // Libs
  var $ = require('jquery');
  var _ = require('lib/lodash');
  var Backbone = require('backbone');
  var moment = require('moment');

  // Models
  var Responses = require('models/responses');

  // Views
  var ResponseCountView = require('views/surveys/count');
  var ResponseListView = require('views/responses/list');
  var FilterView = require('views/responses/filter');
  var MapView = require('views/map');
  var CollectorStatsView = require('views/surveys/stats-collector');

  // Templates
  var mapListTemplate = require('text!templates/responses/map-list.html');
  var embeddedResponseMapTemplate = require('text!templates/responses/embed-map-list.html');


  var ResponseViews = {};

  ResponseViews.MapAndListView = Backbone.View.extend({
    filters: {},
    firstRun: true,
    mapView: null,
    listView: null,
    responses: null,
    survey: null,

    template: _.template(mapListTemplate),

    el: '#response-view-container',

    events: {
      'click .refresh': 'getNew'
    },

    initialize: function(options) {
      _.bindAll(this,
        'render',
        'update',

        // Filtering
        'showFilters',
        'hideFilters',

        // Updating
        'getNew',
        'lastUpdated',

        'mapClickHandler'
      );

      this.responses = options.responses;

      this.forms = options.forms;
      this.forms.on('reset', this.updateFilterChoices, this);

      this.survey = options.survey;

      this.render();
    },

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
        survey: this.survey.toJSON()
      };
      this.$el.html(this.template(context));

      // Show collector stats
      this.collectorStatsView = new CollectorStatsView({
        survey: this.survey
      });

      // Set up the map view, now that the root exists.
      if (this.mapView === null) {
        this.mapView = new MapView({
          el: $('#map-view-container'),
          survey: this.survey,
          clickHandler: this.mapClickHandler
        });
      }

      // Render the map
      this.mapView.render();

      this.filterView = new FilterView({
        collection: this.responses,
        survey: this.survey,
        forms: this.forms,
        map: this.mapView
      });
      $("#filter-view-container").html(this.filterView.$el);

      // Set up the response count view.
      this.countView = new ResponseCountView({
        model: this.survey
      }).render();
      $("#response-count-container").html(this.countView.$el);

      // Listen for new responses
      this.survey.on('change', this.mapView.update);

      // Listen for a change in map view size
      this.$('.b').on('transitionend', function(event) {
        this.mapView.map.invalidateSize();
      }.bind(this));
    },

    mapClickHandler: function(event) {
      if (!event.data || !event.data.object_id) {
        return;
      }

      var rc = new Responses.Collection({
        surveyId: this.survey.get('id'),
        objectId: event.data.object_id
      });

      var surveyOptions = this.survey.get('surveyOptions') || {};
      var selectedItemListView = new ResponseListView({
        el: '#responses-list-container',
        collection: rc,
        labels: this.forms.getQuestions(),
        surveyOptions: surveyOptions
      });

      selectedItemListView.on('remove', function() {
        this.mapView.deselectObject();
      }.bind(this));

      rc.on('destroy', function() {
        this.mapView.update();
      }.bind(this));
    },

    update: function() {
      if (this.firstRun) {
        this.render();
      }

      // Update the count
      // TODO: Use a template
      this.$('#count').html(_.template('<%= _.size(responses) %> Response<% if(_.size(responses) != 1) { %>s<% } %>', {responses: this.responses}));
    },

    showFilters: function() {
      $('.factoid').addClass('small-factoid');
      this.$el.addClass('bigb');

      // Render the filter
      $("#filter-view-container").show();
    },

    hideFilters: function() {
      $('.factoid').removeClass('small-factoid');
      this.$el.removeClass('bigb');

      this.update();

      $("#filter-view-container").hide();
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
    },

    /**
     * Get new responses
     */
    getNew: function(event) {
      console.log("Getting new responses");
      event.preventDefault();
      this.survey.fetch();
      this.mapView.update();

      // This is a hack because it's hard to watch .fetch
      // if there are no changes.
      $('.checking').fadeIn(500).fadeOut(750);
    },

    /**
     * Show the time of the last response collection update
     */
    lastUpdated: function () {
      if(this.responses.lastUpdate !== undefined) {
        var time = moment(this.responses.lastUpdate).format("Do h:mma");
        $('#last-updated').html('Last updated: ' + time);
      }
    }

  });


  /**
   * Heavy-duty list view
   * Includes pagination
   * Not currently in use in the app.
   * See views/responses/list.js for a shorter verson.
   */
  ResponseViews.ListView = Backbone.View.extend({
    responses: null,
    parentView: null,
    visibleItemCount: 1,
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

      // _kmq.push(['record', "Specfic result page selected"]);
      var page = parseInt($(e.target).attr('data-page'), 10);
      this.page = page;
      this.render();
    },

    pageNext: function (e) {
      e.preventDefault();

      // _kmq.push(['record', "Next page of results selected"]);
      if (this.page === this.pageCount - 1) {
        return;
      }

      this.page += 1;
      this.render();
    },

    pagePrev: function (e) {
      e.preventDefault();

      // _kmq.push(['record', "Previous page of results selected"]);
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


  /*
   * Map-oriented view for embedded pages.
   */
  ResponseViews.EmbeddedResponseMapView = Backbone.View.extend({
    filters: {},
    firstRun: true,
    mapView: null,
    listView: null,
    responses: null,
    survey: null,

    template: _.template(embeddedResponseMapTemplate),

    el: '#response-view-container',

    events: {
      'click .action-show-filters': 'toggleFilters',
    },

    initialize: function(options) {
      _.bindAll(this,
        'toggleFilters',
        'mapClickHandler'
      );

      this.responses = options.responses;

      this.forms = options.forms;
      this.forms.on('reset', this.updateFilterChoices, this);

      this.survey = options.survey;

      this.showFilter = options.showFilter;

      this.render();
    },

    render: function () {
      // Actually render the page
      var context = {
        survey: this.survey.toJSON()
      };
      this.$el.html(this.template(context));

      // XXX
      //// Show collector stats
      //this.collectorStatsView = new CollectorStatsView({
      //  survey: this.survey
      //});

      // Set up the map view, now that the root exists.
      if (this.mapView === null) {
        this.mapView = new MapView({
          el: $('#map-view-container'),
          survey: this.survey,
          clickHandler: this.mapClickHandler
        });
      }

      // Render the map
      this.mapView.render();

      this.filterView = new FilterView({
        collection: this.responses,
        survey: this.survey,
        forms: this.forms,
        map: this.mapView
      });
      $('#filter-view-container').html(this.filterView.$el);

      // Set up the response count view.
      this.countView = new ResponseCountView({
        el: '#response-count-container',
        model: this.survey
      }).render();

      // Listen for new responses
      this.mapView.listenTo(this.survey, 'change', this.mapView.update);

      $('.factoid').addClass('small-factoid');
      this.$el.addClass('bigb');
    },

    mapClickHandler: function (event) {
      if (!event.data || !event.data.object_id) {
        return;
      }

      var rc = new Responses.Collection({
        surveyId: this.survey.get('id'),
        objectId: event.data.object_id
      });

      var surveyOptions = this.survey.get('surveyOptions') || {};
      // FIXME: respect the actual configured options
      surveyOptions.comments = true;
      var selectedItemListView = new ResponseListView({
        el: '#responses-list-container',
        collection: rc,
        labels: this.forms.getQuestions(),
        surveyOptions: surveyOptions,
        surveyId: this.survey.get('id'),
        objectId: event.data.object_id
      });

      selectedItemListView.on('remove', function () {
        this.mapView.deselectObject();
      }.bind(this));

      rc.on('destroy', function () {
        this.mapView.update();
      }.bind(this));
    },

    toggleFilters: function () {
      // Render the filter
      $('.filters').toggle();
    },

    remove: function () {
      this.$el.remove();
      this.stopListening();
      // XXX
      this.responses.off('reset', this.render, this);
      this.responses.off('add', this.update, this);
      this.responses.off('addSet', this.update, this);

      if (this.mapView) {
        this.mapView.remove();
        this.mapView = null;
      }

      if (this.listView) {
        this.listView.remove();
        this.listView = null;
      }

      return this;
    }
  });


  return ResponseViews;

});

