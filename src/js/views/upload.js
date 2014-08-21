/*jslint nomen: true */
/*globals define, FileReader: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',
  'lib/tinypubsub',
  'lib/papaparse',

  'settings',

  // Models
  'models/responses',

  // Templates
  'text!templates/upload.html'
],

/**
 * Create responses from an uploaded file
 * The uploaded CSV file requires these columns:
 * - "objectid" -- parcel id
 * db.responses.remove({'properties.survey':'5b5d4510-294c-11e4-a3f5-614d41163435'});
 */

function($, _, Backbone, events, Papa, settings, Responses, template) {
  'use strict';

  var UploadView = Backbone.View.extend({
    el: '#container',
    template: _.template(template),

    LIMIT: 10000, // limit on the number of rows to process

    initialize: function() {
      _.bindAll(this, 'render', 'setupDragDrop', 'readFile', 'handleFile', 'getParcelShape', 'gotParcel');
    },

    render: function() {
      var $el = $(this.el);
      $el.html(this.template({}));

      this.setupDragDrop();
      return this;
    },

    setupDragDrop: function() {
      var holder = document.getElementById('upload-area');
      var state = document.getElementById('upload-area');

      holder.ondragover = function () { this.className = 'hover'; return false; };
      holder.ondragend = function () { this.className = ''; return false; };
      holder.ondrop = this.readFile;
    },


    /**
     * Save a response to the survey
     * @param  {Object} feature GeoJSON feature
     * @param  {Object} data    Full row details from the CSV
     */
    createResponse: function(feature, data) {
      // Set up the response
      var responseData = {
        survey: '5b5d4510-294c-11e4-a3f5-614d41163435',
        source: {
          type: 'upload',
          collector: settings.user.get('name'),
          started: new Date(),             // Time started
          finished: new Date()              // Time finished
        },
        geo_info: {
          centroid: feature.properties.centroid.coordinates,
          geometry: feature.geometry,
          humanReadableName: feature.properties.address
        },
        // info: app.selectedObject.info,
        object_id: data.objectid, // Replaces parcel_id
        responses: data
      };

      // And save it to the server.
      console.log("Created response", responseData );
      var response = new Responses.Model(responseData);
      response.on('error', function saveError(error) {
        console.log("Error saving", error);
      });
      response.save();
    },


    /**
     * Extract feature detail (if any)
     * @param  {Object} featureCollection From the parcel API
     * @param  {Object} data              Row data from CSV
     */
    gotParcel: function(featureCollection, data) {
      if(featureCollection.features.length === 0) {
        console.log("none found");
        return;
      }
      var feature = featureCollection.features[0];
      this.createResponse(feature, data);
    },

    /**
     * Given the ID of a parcel, attempt to get the shape from the API.
     * @param  {Ojbect} data With objectid property
     */
    getParcelShape: function(data) {
      var parcelid = data.objectid; // TODO make this user-selectable.

      if(!parcelid) {
        console.log("Skipping -- no id");
        return;
      }
      var url = settings.api.baseurl + '/parcels/' + parcelid;
      var req = $.get(url);
      req.done(function(features) {
        this.gotParcel(features, data);
      }.bind(this));
      req.fail(this.failedToGetParcel);
    },

    handleFile: function(file) {
      var slice = file.data.slice(0, this.LIMIT);
      _.each(slice, this.getParcelShape);
    },

    readFile: function(event) {
      event.preventDefault();
      var file = event.dataTransfer.files[0];
      var reader = new FileReader();

      Papa.parse(file, {
        header: true,
        complete: this.handleFile
      });
    },

    update: function() {
      this.render();
    }

  });

  return UploadView;
});
