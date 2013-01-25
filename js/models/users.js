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


  // TODO
  // This is a stub
  Users.Model = Backbone.Model.extend({
    urlRoot: settings.api.baseurl + "/user/",
    
    initialize: function(options) {
      _.bindAll(this, 'parse', 'isLoggedIn');
      this.fetch();
    },

    isLoggedIn: function() {
      console.log(this.attributes);
      return (this.attributes.username !== undefined);
    }
  });

  return Users;

}); // End Surveys module


