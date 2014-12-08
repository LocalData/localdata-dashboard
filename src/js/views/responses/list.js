/*jslint nomen: true */
/*globals define: true */

define(function (require) {
  'use strict';
  var _ = require('lib/lodash');
  var Backbone = require('backbone');

  // LocalData
  var settings = require('settings');

  // Views
  var ResponseView = require('views/responses/item');

  // Templates
  var template = require('text!templates/responses/list.html');
  var commentTemplate = require('text!templates/responses/comments.html');

  /**
   * Intended for shorter lists of responses (arbitrarily <25)
   * Doesn't include pagination, which isn't relevant in this case.
   * See responses/responses/ListView for a heavyweight implementation.
   */
  var ResponseListView = Backbone.View.extend({
    template: _.template(template),
    commentTemplate: _.template(commentTemplate),

    events: {
      'click .close': 'remove'
    },

    initialize: function(options) {
      this.listenTo(this.collection, 'add', this.render);
      this.labels = options.labels;
      this.forms = options.forms;
      this.surveyOptions = options.surveyOptions;
      this.surveyId = options.surveyId;
      this.objectId = options.objectId;
    },

    remove: function() {
      this.$el.hide();
      this.$el.empty();
      this.trigger('remove');
      this.stopListening();
      return this;
    },

    render: function() {
      var first = this.collection.at(0);
      var name;

      if(!first) {
        return;
      }

      if(first.get('geo_info') !== undefined) {
        name = first.get('geo_info').humanReadableName;
      }else {
        name = first.get('parcel_id');
      }

      this.$el.html(this.template({
        name: name,
        responses: this.collection.toJSON(),
        googleKey: settings.GoogleKey
      }));

      this.collection.each(function(response) {
        var item = new ResponseView({
          model: response,
          labels: this.labels,
          forms: this.forms,
          surveyOptions: this.surveyOptions
        });
        this.$el.append(item.render().el);
      }.bind(this));

      if (this.surveyOptions.comments) {
        this.$el.append(this.commentTemplate({
          id: 'ptxdev', // FIXME: read from the survey options
          surveyId: this.surveyId,
          objectId: this.objectId
        }));
      }

      this.$el.show();
      return this;
    }
  });

  return ResponseListView;

});
