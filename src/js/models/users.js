/*jslint nomen: true */
/*globals define: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',
  'settings'
],

function($, _, Backbone, settings) {
  'use strict';

  var Users = {};

  Users.Model = Backbone.Model.extend({
    urlRoot: settings.api.baseurl + "/user",

    initialize: function(options) {
      _.bindAll(this, 'isLoggedIn');
    },

    isLoggedIn: function() {
      return (this.attributes.username !== undefined);
    }
  });


  Users.Collection = Backbone.Collection.extend({
    model: Users.Model,

    initialize: function(options) {
      // If we initialize with a survey ID,
      // only get users for that survey
      this.surveyId = options.surveyId;
      if(this.surveyId) {
        this.url = settings.api.baseurl + '/surveys/' + this.surveyId + '/users';
      }
      this.fetch({reset: true});
    },

    parse: function(data) {
      return data.users;
    }
  });

  return Users;

}); // End Surveys module


