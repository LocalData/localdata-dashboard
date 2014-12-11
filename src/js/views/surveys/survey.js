/*jslint nomen: true */
/*globals define */

define(function (require) {
  'use strict';

  var $ = require('jquery');
  var _ = require('lib/lodash');
  var async = require('lib/async');
  var Backbone = require('backbone');
  var L = require('lib/leaflet/leaflet.tilejson');

  // LocalData
  var util = require('util');

  // Models
  var Surveys = require('models/surveys');
  var Forms = require('models/forms');
  var Stats = require('models/stats');
  var Responses = require('models/responses');

  // Views
  //var FilterView = require('views/responses/filter');
  var LayerFilterView = require('views/surveys/layer-filter');
  var ResponseListView = require('views/responses/list');

  // Templates
  var template = require('text!templates/surveys/survey-control.html');
  var selectedFiltersTemplate = require('text!templates/filters/selected-filters.html');

  function flip(a) {
    return [a[1], a[0]];
  }

  function downgrade(f) {
    return function g(data) {
      return f(null, data);
    };
  }

  // The View
  var LayerControl = Backbone.View.extend({
    template: _.template(template),
    selectedFiltersTemplate: _.template(selectedFiltersTemplate),

    events: {
      'click .close': 'close',
      'click .show-settings': 'showSettings'
    },

    className: 'layer',
    initialize: function(options) {
      _.bindAll(this,
        'render',
        'doneLoading',
        'getForms',
        'getTileJSON',
        'addLayers',
        'fitBounds',
        'handleGridClick'
      );

      this.mapView = options.mapView;
      this.surveyId = options.layerId;
      this.infoEl = options.infoEl;
      this.filterEl = options.filterEl;
      this.legendEl = options.legendEl;

      this.filter = options.filter;

      this.survey = new Surveys.Model({ id: this.surveyId });
      this.survey.on('change', this.fitBounds);
      this.survey.fetch();
      this.getTileJSON();

      this.forms = new Forms.Collection({ surveyId: this.surveyId });
      this.stats = new Stats.Model({ id: this.surveyId });
      this.stats.fetch({reset: true});

      // Don't render the page until we have the necessary models.
      var self = this;
      async.parallel([
        function (next) {
          self.survey.once('change', downgrade(next));
        },
        function (next) {
          self.stats.once('change', downgrade(next));
        },
        function (next) {
          self.forms.once('reset', downgrade(next));
        }
      ], function (error) {
        console.log("Got everything", error);
        self.render();
      });

    },

    /**
     * Set up and fetch the tilejson neede to add the survey to the map.
     */
    getTileJSON: function (filter) {
      if (!filter) {
        filter = this.filter;
      }

      // Build the appropriate TileJSON URL.
      var url = '/tiles/' + this.survey.get('id');
      if (filter) {
        if(filter.question) {
          url = url + '/filter/' + filter.question;
        }
        if(filter.answer) {
          url = url + '/' + filter.answer;
        }
      }
      url = url + '/tile.json';

      // Get TileJSON
      $.ajax({
        url: url,
        type: 'GET',
        dataType: 'json',
        cache: false
      }).done(this.addLayers)
      .fail(function(jqXHR, textStatus, errorThrown) {
        console.log("Error fetching tilejson", jqXHR, textStatus, errorThrown);
      });
    },

    fitBounds: function() {
      var bounds = this.survey.get('responseBounds');
      if (bounds) {
        this.mapView.fitBounds([flip(bounds[0]), flip(bounds[1])]);
      }
    },

    addLayers: function (tilejson) {
      if (this.tileLayer) {
        this.mapView.removeTileLayer(this.tileLayer);
      }
      this.tileLayer = new L.TileJSON.createTileLayer(tilejson);
      this.mapView.addTileLayer(this.tileLayer);

      if (this.gridLayer) {
        this.mapView.removeGridLayer(this.gridLayer);
      }
      this.gridLayer = new L.UtfGrid(tilejson.grids[0], {
        resolution: 4
      });
      this.mapView.addGridLayer(this.gridLayer);

      this.gridLayer.on('click', this.handleGridClick);
    },

    handleGridClick: function (event) {
      if (!event.data) {
        return;
      }

      var rc = new Responses.Collection({
        surveyId: this.survey.get('id'),
        objectId: event.data.object_id
      });

      var surveyOptions = this.survey.get('surveyOptions') || {};
      var selectedItemListView = new ResponseListView({
        el: this.infoEl,
        collection: rc,
        labels: this.forms.getQuestions(),
        forms: this.forms,
        surveyOptions: surveyOptions
      });

      selectedItemListView.on('remove', function () {
        this.mapView.deselectObject();
      }.bind(this));

      rc.on('destroy', function () {
        this.mapView.update();
      }.bind(this));
    },

    doneLoading: function() {
      this.$el.find('.loading').hide();
    },

    setupSettings: function() {
      this.stats = new Stats.Model({
        id: this.survey.get('id')
      });
      this.stats.fetch({reset: true});

      this.settings = new LayerFilterView({
        survey: this.survey,
        forms: this.forms,
        stats: this.stats
      });

      this.listenTo(this.settings, 'filterSet', this.changeFilter);
      this.listenTo(this.settings, 'filterReset', this.clearFilter);

      var $el = this.settings.render();
      // FIXME: This is a hack to get only the first layer's filters to render
      //this.$el.find('.settings-container').html($el);
      if (this.filterEl) {
        this.filterEl.html($el);
      }
    },

    showSettings: function() {
      this.$el.find('.settings').show();
    },

    changeFilter: function(filter) {
      this.getTileJSON(filter);
      // TODO: Update legend
      if (this.legendEl) {
        var questions = this.forms.getFlattenedForm();
        var question =  questions[filter.question].text;
        var answer = '';
        if (this.filters.answer) {
          answer = _.findWhere(questions[filter.question].answers, { value: filter.answer }).text || '';
        }

        this.legendEl.html(this.selectedFiltersTemplate({
          filters: {
            question: question,
            answer: answer
          }
        }));
      }
    },

    clearFilter: function() {
      this.getTileJSON();
    },

    getForms: function() {
      this.forms = new Forms.Collection({
        surveyId: this.survey.get('id')
      });
      // this.forms.on('reset', this.setupSettings);
      this.forms.fetch({ reset: true });
    },

    render: function() {

      // The response count to display
      var count = this.survey.get('responseCount') || 0;

      // Change the response count if we have a specific filter
      if (this.filter) {
        count = this.stats.get(this.filter.question)[this.filter.answer];
      }

      count = util.numberWithCommas(count);

      var context = {
        name: this.survey.get('name') || 'LocalData Survey',
        kind: 'responses',
        meta: {
          count: count,
          filter: this.filter
        }
      };

      this.$el.html(this.template(context));
      if(this.survey.get('name')) {
        this.doneLoading();
      }

      if (this.filterEl) {
        this.setupSettings();
        //this.filterView = new LayerFilterView({
        //  el: this.filterEl,
        //  survey: this.survey,
        //  forms: this.forms,
        //  // The SurveyView layer handles the filter change actions from the
        //  // FilterView
        //  map: this
        //}).render();
      }

      return this.$el;
    }
  });

  return LayerControl;

});
