/*jslint nomen: true */
/*globals define: true */

define(function (require) {
  'use strict';
  var _ = require('lib/lodash');
  var $ = require('jquery');
  var Backbone = require('backbone');

  // Views
  var ResponseView = require('views/responses/item');

  // Templates
  var template = require('text!templates/projects/surveys/object-view.html');
  var commentTemplate = require('text!templates/responses/comments.html');

  /**
   * Displays info for a Response collection pertaining to a single object.
   */
  var ObjectView = Backbone.View.extend({
    template: _.template(template),
    commentTemplate: _.template(commentTemplate),

    events: {
      'click .close': 'remove'
    },

    initialize: function(options) {
      this.listenTo(this.collection, 'add', this.render);
      this.labels = options.labels;
      this.forms = options.forms;
      this.survey = options.survey;
      this.surveyOptions = options.surveyOptions;
      this.surveyId = options.surveyId;
      this.objectId = options.objectId;
      this.exploration = options.exploration;
    },

    remove: function() {
      this.$el.hide();
      this.$('#disqus_thread').detach().appendTo($('#disqus_hide'));
      this.$el.empty();
      this.trigger('remove');
      this.stopListening();
      return this;
    },

    render: function() {
      var first = this.collection.at(0);
      var name;
      var subName;

      if (!first) {
        return this;
      }

      if (first.get('geo_info') !== undefined) {
        name = first.get('geo_info').humanReadableName;
      } else {
        name = first.get('parcel_id');
      }

      if (this.surveyOptions.titleField) {
        subName = name;
        name = first.get('responses')[this.surveyOptions.titleField];
        if (subName.toLowerCase() === 'unknown location') {
          subName = undefined;
        }
      }

      this.$el.html(this.template({
        name: name,
        subName: subName
      }));

      this.collection.each(function(response) {
        var item = new ResponseView({
          model: response,
          labels: this.labels,
          forms: this.forms,
          surveyOptions: this.surveyOptions,
          exploration: this.exploration
        });
        this.$el.append(item.render().el);
      }, this);

      // TODO: clean up the disqus commenting stuff
      if (this.surveyOptions.comments) {
        var d = $('#disqus_thread');
        if (d.length === 0) {
          this.$el.append(this.commentTemplate({
            thread: true
          }));
        } else {
          this.$el.append(this.commentTemplate({
            thread: false
          }));
          d.detach();
          d.appendTo($('#disqus_target'));
        }

        try {
          window.DISQUS_reset(
            this.survey.id + '/' + this.collection.objectId,
            'https://app.localdata.com/#!surveys/' + this.survey.get('slug') + '/dive/' + this.collection.objectId,
            name,
            'en'
          );
        } catch (e) {
          console.log(e);
        }
      }

      return this;
    }
  });

  return ObjectView;

});
