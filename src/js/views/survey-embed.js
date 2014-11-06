/*jslint nomen: true */
/*globals define: true */

define(function (require) {
  'use strict';

  var _ = require('lib/lodash');
  var async = require('lib/async');
  var Backbone = require('backbone');

  var embedTemplate = require('text!templates/surveys/embed.html');
  var Form = require('models/forms');
  var ResponseViews = require('views/responses/responses');
  var Survey = require('models/surveys');

  function downgrade(f) {
    return function g(data) {
      return f(null, data);
    };
  }

  var EmbedView = Backbone.View.extend({
    el: '#container',

    template: _.template(embedTemplate),

    initialize: function (options) {
      this.surveyId = options.id;

      // Get the survey and forms.
      this.survey = new Survey.Model({ id: this.surveyId });
      this.forms = new Form.Collection({ surveyId: this.surveyId });

      // Don't render the page until we have the necessary models.
      var self = this;
      async.parallel([
        function (next) {
          self.survey.once('change', downgrade(next));
        },
        function (next) {
          self.forms.once('reset', downgrade(next));
        }
      ], function (error) {
        self.render();
      });
    },

    render: function (model) {
      this.$el.html(this.template({
        survey: this.survey.toJSON()
      }));

      this.mapAndListView = new ResponseViews.MapAndListView({
        forms: this.forms,
        survey: this.survey
      });

      this.mapAndListView.showFilters();
    },
  });

  return EmbedView;
});
