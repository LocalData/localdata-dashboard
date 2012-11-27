/*jslint nomen: true */
/*globals define: true */

define([
  'jquery',
  'lib/lodash',
  'lib/tinypubsub',

  'settings',
  'api',

  // Views
  'views/root',
  'views/loading'
],

function($, _, events, settings, api, RootView, LoadingView) {
  'use strict';

  // Here's the dashboard app:
  // So fancy!
  var LD = {};

  // TODO
  // LD.collections = {};
  // LD.routers = {};
  // LD.templates = {};

  // Kick off the LocalData app
  LD.initialize = function() {
    console.log("Initalize dashboard");
    LD.router = new RootView();
    LD.router.startRouting();

    // Listen for loading events
    events.subscribe('loading', LD.setLoading);
  };

  // Loading ...................................................................
  // Is the app currently loading data?
  // These functions help keep track of that. 
  LD.setLoading = function(state) {
    LD.loading = state;

    if (LD.loading) {
      console.log("Show the loading view");
      LD.loadingView = new LoadingView();
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

