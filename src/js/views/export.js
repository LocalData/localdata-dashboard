/*jslint nomen: true */
/*globals define: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',
  'settings',
  'api',

  // Templates
  'text!templates/export.html'
],

function($, _, Backbone, settings, api, exportTemplate) {
  'use strict';

  var ExportView = Backbone.View.extend({
    el: '#export-view-container',

    template: _.template(exportTemplate),

    events: {
      'click .shapefile': 'getShapefile'
    },

    initialize: function(options) {
      _.bindAll(this, 'render', 'pingAPI', 'pingS3');

      // Show a given survey
      this.surveyId = options.surveyId;
    },

    render: function(loading) {
      // Set the context & render the page
      var context = {
        surveyId: this.surveyId,
        baseurl: settings.api.baseurl,
        loading: loading
      };

      this.$el.html(this.template(context));
    },

    // When we're done with the shapefile export process, we should reset our
    // in-progress indication.
    exportDone: function exportDone(error) {
      this.render(false);
      if (error) {
        console.log(error);
        this.$('.error').show();
      }
    },

    // Ping the API to see if our shapefile export link is ready.
    pingAPI: function pingAPI() {
      var url = settings.api.baseurl + '/surveys/' + this.surveyId + '/responses.zip';
      var expiration = Date.now() + (2 * 60 * 1000);

      var self = this;

      function clear() {
        clearInterval(self.pingTimer);
        self.pingTimer = null;
      }

      if (this.pingTimer) {
        clear();
      }

      this.pingTimer = setInterval(function () {
        $.ajax({
          url: url
        }).fail(function (jqXHR, textStatus, errorThrown) {
          if (jqXHR.status === 307) {
            clear();
            // Remove the "Location: " from the response text.
            self.pingS3(jqXHR.responseText.slice(9).trim(), expiration);
          }
        }).always(function () {
          if (Date.now() > expiration) {
            clear();
            self.exportDone(new Error('Shapefile export timed out.'));
          }
        });
      }, 200);
    },

    // Ping the shapefile export link (at S3) to see if the file has been created yet.
    pingS3: function pingS3(url, expiration) {
      if (expiration === undefined) {
        expiration = Date.now() + (2 * 60 * 1000);
      }

      var self = this;

      function clear() {
        clearInterval(self.pingTimer);
        self.pingTimer = null;
      }

      if (this.pingTimer) {
        clear();
      }

      this.pingTimer = setInterval(function () {
        $.ajax({
          url: url,
          type: 'HEAD'
        }).done(function (data, textStatus, jqXHR) {
          clear();
          self.exportDone();
          window.location = url;
        }).fail(function (jqXHR, textStatus, errorThrown) {
          // If we get a 403 or 404, then keep trying, unless we've been at it too long.
          // S3 will respond with a 403, since either the object doesn't exist or we just don't have permission for it.
          // We check for 404s also, in case we ever use a static web server-style endpoint.
          if (jqXHR.status === 403 || jqXHR.status === 404) {
            if (Date.now() < expiration) {
              return;
            }
          }
          clear();
          console.log('Got ' + jqXHR.status + ' status from S3.');
          self.exportDone(new Error('Shapefile export failed.'));
        });
      }, 500);
    },

    // Ask the API to generate a shapefile export and start checking to see if
    // the export is ready.
    getShapefile: function getShapefile() {
      this.render(true);
      var url = settings.api.baseurl + '/surveys/' + this.surveyId + '/responses.zip';
      var pingAPI = this.pingAPI;
      var pingS3 = this.pingS3;
      var self = this;
      $.ajax({
        url: url
      }).done(function (data, textStatus, jqXHR) {
        if (jqXHR.status === 202) {
          pingAPI();
        }
      }).fail(function (jqXHR, textStatus, errorThrown) {
        if (jqXHR.status === 307) {
          // Remove the "Location: " from the response text.
          pingS3(jqXHR.responseText.slice(9).trim());
        } else {
          self.exportDone(new Error('Export failed.'));
        }
      });
    }
  });

  return ExportView;

});
