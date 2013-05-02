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

  // Patch Backbone to support saving namespaced models
  // via https://github.com/documentcloud/backbone/issues/1777#issuecomment-9836406
  // TODO:
  // Should this go in a different location?
  var sync = Backbone.sync;
  Backbone.sync = function(method, model, options) {
    if (!options.data && model.namespace && (method === 'create' || method === 'update')) {
      var data = {};
      data[model.namespace] = model;
      options.data = JSON.stringify(data);
      options.contentType = 'application/json';
    }
    return sync.apply(this, arguments);
  };


  // Here's the dashboard app:
  // So fancy!
  var LD = {};

  // Kick off the LocalData app
  LD.initialize = function() {
    console.log("Initalizing app");
    LD.router = new RootView();
    LD.router.startRouting();

    // Some high-level events we want to handle:
    events.subscribe('loading', LD.setLoading);
    events.subscribe('navigate', LD.navigateTo);

    // Handle authentication ...................................................
    // If any request is returned with a 401, we want to redirect users to the
    // login page
    var redirectToLogin = function () {
      // Don't keep redirecting to login
      if (Backbone.history.fragment.indexOf("login") !== -1 ) {
        return;
      }
      LD.router._router.navigate("/login/?redirectTo=" + Backbone.history.fragment, {trigger: true});
    };

    $(document).ajaxError(function (event, xhr) {
      console.log("Ajax error: " + xhr.status);
      if (xhr.status === 401) {
        redirectToLogin();
      }
    });
  };


  /**
   * Navigate to a given fragement using Backbone's routing
   * @param  {String} path the fragment we want to navigate to, eg '/surveys'
   */
  LD.navigateTo = function(path, trigger) {
    if(!trigger) {
      trigger = { trigger: true };
    }
    LD.router._router.navigate(path, trigger);
  };


  /**
   * Set the loading state of the application
   * @param {boolean} state true if loading, false if not
   */
  LD.setLoading = function(state) {
    LD.loading = state;

    if (LD.loading) {
      LD.loadingView = new LoadingView();
    }else {
      LD.loadingView.remove();
    }
  };

  /**
   * Get the loading state of the application
   * @return {boolean}
   */
  LD.getLoading = function() {
    if(LD.loading === undefined){
      return false;
    }
    return LD.loading;
  };


  return LD;
});

