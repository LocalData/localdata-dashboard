/*jslint nomen: true */
/*globals define: true */


define([
  'jquery',
  'lib/lodash',
  'backbone',
  'lib/tinypubsub',

  'settings',
  'api',

  // Views
  'views/root',
  'views/loading'
],

function($, _, Backbone, events, settings, api, RootView, LoadingView) {
  'use strict';

  // Here's the dashboard app:
  // So fancy!
  var LD = {};

  // Kick off the LocalData app
  LD.initialize = function() {
    console.log("Initalizing app");
    LD.router = new RootView();
    LD.router.startRouting();

    // Handle authentication ...................................................
    // If any request is returned with a 401, we want to redirect users to the
    // login page
    var redirectToLogin = function () {
      LD.router._router.navigate("/login/?redirectTo=" + Backbone.history.fragment, {trigger: true});
    };

    $(document).ajaxError(function (event, xhr) {
      console.log("Ajax error: " + xhr.status);
        if (xhr.status === 401) {
          redirectToLogin();
        }
    });

    // Listen for loading events ...............................................
    events.subscribe('loading', LD.setLoading);
    events.subscribe('navigate', LD.navigateTo);

  };


  /**
   * Navigate to a given fragement using Backbone's routing
   * @param  {String} path the fragment we want to navigate to, eg '/surveys'
   */
  LD.navigateTo = function(path) {
    console.log("Navigate to...");
    LD.router._router.navigate(path, { trigger: true });
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

  // Return true if the page is in the loading state, false if not
  LD.getLoading = function() {
    if(LD.loading === undefined){
      return false;
    }
    return LD.loading;
  };
 
 
  return LD;
});

