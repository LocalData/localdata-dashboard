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
  'models/surveys',

  // Templates
  'text!templates/upload.html'
],

function($, _, Backbone, events, Papa, settings, Responses, template) {
  'use strict';

  var UploadView = Backbone.View.extend({
    el: '#container',
    template: _.template(template),

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

    gotParcel: function(data) {
      console.log("Got data", data);
      if(data.features.length === 0) {
        console.log("none found");
      }
      var feature = data.features[0];


    },

    getParcelShape: function(line) {
      var parcelid = line['Parcel #'];

      if(!parcelid) {
        console.log("Skipping -- no id");
        return;
      }
      var url = settings.api.baseurl + '/parcels/' + parcelid;
      var req = $.get(url);
      req.done(this.gotParcel);
      req.fail(this.failedToGetParcel);
    },

    handleFile: function(file) {
      var slice = file.data.slice(0, 10000);
      _.each(slice, this.getParcelShape);
    },

    readFile: function(event) {
      console.log("Reading in file");
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
