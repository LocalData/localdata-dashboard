/*jslint nomen: true */
/*globals define: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',
  'lib/tinypubsub',

  // LocalData
  'settings',
  'api',

  // Models
  'models/responses',

  // Views
  'views/responses/item',
  'views/pagination',

  // Templates
  'text!templates/responses/table.html'
],

function($, _, Backbone, events, settings, api, Responses, ResponseView, PaginationView, template) {
  'use strict';

  /**
   * Intended for shorter lists of responses (arbitrarily <25)
   * Doesn't include pagination, which isn't relevant in this case.
   * See responses/responses/ListView for a heavyweight implementation.
   */
  var ResponseTableView = Backbone.View.extend({
    className: 'responses',
    el: '#table',

    template: _.template(template),

    events: {
    // 'click .close': 'remove'
    },

    initialize: function(options) {
      console.log("Init table view");
      this.survey = options.survey;
      this.labels = options.labels;
      this.collection = new Responses.Collection({
        surveyId: this.survey.get('id')
      });
      this.listenTo(this.collection, 'add', this.render);
      this.listenTo(this.collection, 'reset', this.render);
      this.labels = options.labels;
    },

    remove: function() {
      this.$el.empty();
      this.trigger('remove');
      this.stopListening();
      return this;
    },

    render: function() {
      var $el = $(this.el);
      // console.log("Rendering response TABLE view", this.collection.toJSON(), this.labels, this.survey.toJSON());

      $el.html(this.template({
        labels: this.labels,
        responses: this.collection.toJSON()
      }));

      var paginationView = new PaginationView({
        pageCount: this.survey.get('responseCount') / 10
      });

      paginationView.on('change', function(event) {
        console.log("Got page change", event);
      });

      // TODO: make a row view for each response
      // this.collection.each(function(response) {
      //   var item = new ResponseView({
      //     model: response,
      //     labels: this.labels
      //   });
      //   $el.find('.responses-list').append(item.render().el);
      // }.bind(this));

      return this;
    }
  });

  return ResponseTableView;

});
