/*jslint nomen: true */
/*globals define, FileReader: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',
  'lib/tinypubsub',
  'lib/papaparse',

  // LocalData
  'settings',
  'api',
  'util/schemaGenerator',

  // Models
  'models/responses',

  // Templates
  'text!templates/upload.html',
  'text!templates/upload/error-row.html'
],

/**
 * Create responses from an uploaded file
 * The uploaded CSV file requires these columns:
 * - "objectid" -- parcel id
 * db.responses.remove({'properties.survey':'5b5d4510-294c-11e4-a3f5-614d41163435'});
 */

function($, _, Backbone, events, Papa, settings, api, SchemaGenerator, Responses, template, errorTemplate) {
  'use strict';

  var UploadView = Backbone.View.extend({
    el: '#container',
    template: _.template(template),
    errorTemplate: _.template(errorTemplate),
    processedCount: 0,

    events: {
      'click .submit': 'createSurvey'
    },

    LIMIT: 10000, // limit on the number of rows to process

    initialize: function() {
      _.bindAll(this,
        'render',
        'setupDragDrop',
        'readFile',
        'handleFile',
        'createSurvey',
        'surveyCreated',
        'getParcelShape',
        'gotParcel',
        'addError',
        'saveFormToSurvey'
      );
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
        survey: settings.surveyId,
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
      //console.log("Created response", responseData );
      var response = new Responses.Model(responseData);
      response.on('error', function saveError(error) {
        //console.log("Error saving", error);
      });
      response.save();

      // See if we're done yet
      // (Gross way -- should use ASYNC)
      // But with this, we can also do a counter.
      this.processedCount++;
      if(this.processedCount === this.totalCount) {
        $("#upload-processing").hide();
        $("#upload-processing-done").fadeIn();
        $("#upload-processing-done a").attr('href', '/#/surveys/' + this.surveySlug);
      }
    },


    /**
     * Extract feature detail (if any)
     * @param  {Object} featureCollection From the parcel API
     * @param  {Object} data              Row data from CSV
     */
    gotParcel: function(featureCollection, data) {
      if(featureCollection.features.length === 0) {
        this.addError(data, 'Parcel not found');
        return;
      }
      var feature = featureCollection.features[0];
      this.createResponse(feature, data);
    },

    /**
     * Note an import error
     * @param {Object} data  The row that was supposed to be added
     * @param {String} error What went wrong
     */
    addError: function(data, error) {
      this.totalCount--; // decrement the total number we need to process
      $("#upload-errors").show();

      data.error = error;
      $('#upload-errors table').append(this.errorTemplate({
        error: data
      }));
    },

    /**
     * Given the ID of a parcel, attempt to get the shape from the API.
     * @param  {Ojbect} data With objectid property
     */
    getParcelShape: function(data) {
      var parcelid = data.objectid; // TODO make this field user-selectable.

      if(!parcelid) {
        this.addError(data, 'No parcel ID');
        return;
      }
      var url = settings.api.baseurl + '/parcels/' + parcelid;
      var req = $.get(url);
      req.done(function(features) {
        this.gotParcel(features, data);
      }.bind(this));
      req.fail(this.failedToGetParcel);
    },

    saveFormToSurvey: function() {
      var questions = this.schema.getSchema();
      var formToSave = {
        questions: questions,
        type: 'mobile'
      };
      api.createForm(formToSave, $.proxy(function() {
        this.trigger('formAdded');
      },this));
    },

    handleFile: function(file) {
      $("#upload-area").hide();
      $("#upload-processing").fadeIn();

      var slice = file.data.slice(0, this.LIMIT);
      this.totalCount = slice.length;
      console.log("Handling file", file.meta);
      this.schema.setFields(file.meta.fields);
      _.each(slice, this.getParcelShape);
      _.each(slice, this.schema.addRow);
      this.saveFormToSurvey();
    },

    readFile: function(event) {
      event.preventDefault();
      var file = event.dataTransfer.files[0];
      var reader = new FileReader();

      this.schema = new SchemaGenerator();
      Papa.parse(file, {
        header: true,
        complete: this.handleFile
      });
    },

    surveyCreated: function(error, survey) {
      console.log("CREATED SURVEY", error, survey);
      settings.surveyId = survey.id;
      this.surveySlug = survey.slug;
      if(error) {
        $("#new-survey-form .submit").fadeIn();
        $("#new-survey-form .error").fadeIn();
        return;
      }

      $("#new-survey-form").hide();
      $("#upload-area").fadeIn();
    },

    createSurvey: function(event) {
      event.preventDefault();

      var survey = {
        "name": $("#new-survey-form input.survey-name").val(),
        "location": $("#new-survey-form input.survey-location").val()
      };

      survey.geoObjectSource = {
        type: 'LocalData',
        source: '/api/features?type=parcels&bbox={{bbox}}'
      };

      // Submit the details as a new survey.
      api.createSurvey(survey, this.surveyCreated);
    },

    update: function() {
      this.render();
    }

  });

  return UploadView;
});
