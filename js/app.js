/*jslint nomen: true */
/*globals define: true */

define([
  'jquery',
  'lib/lodash',

  'settings',
  'api',

  // Models
  // 'models/forms',
  // 'models/responses',
  // 'models/surveys',

  // Views
  'views/root'
],

function($, _, settings, api, RootView) {
  'use strict';

  // Here's the dashboard app:
  // So fancy!
  var LD = {};

  // TODO
  LD.collections = {};
  LD.routers = {};
  LD.templates = {};


  // Kick off the LocalData app
  LD.initialize = function() {
      console.log("Initalize dashboard");
      LD.router = new RootView();
      LD.router.startRouting();
  };

  LD.setLoading = function(state) {
    LD.loading = state;
    console.log(LD.loading);

    if (LD.loading) {
      console.log("Show the loading view");
      LD.loadingView = new LD.views.LoadingView({
        el: $("#loading-view-container")
      });
    }else {
      console.log("Hide the loading view");
      LD.loadingView.remove();
    }
  };

  // Return true if the page is in the loading state,
  // false if not 
  LD.getLoading = function() {
    if(LD.loading === undefined){
      return false;
    }
    return LD.loading;
  };

  return LD;
});

