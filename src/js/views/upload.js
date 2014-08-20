/*jslint nomen: true */
/*globals define, FileReader: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',
  'lib/tinypubsub',
  'lib/papaparse',

  // Models
  'models/surveys',

  // Templates
  'text!templates/upload.html'
],

function($, _, Backbone, events, Papa, Responses, template) {
  'use strict';

  var UploadView = Backbone.View.extend({
    el: '#container',
    template: _.template(template),

    initialize: function() {
      _.bindAll(this, 'render', 'setupDragDrop');
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

    readFile: function(event) {
      console.log("Reading in file");
      event.preventDefault();
      var file = event.dataTransfer.files[0];
      var reader = new FileReader();

      console.log(Papa);
      Papa.parse(file, {
        header: true,
        complete: function(results) {
          console.log(results);
          var slice = results.data.slice(0, 10);
          console.log(slice);
          _.each(slice, function(slice) {

          })
        }
      });
    },

    update: function() {
      this.render();
    }

  });

  return UploadView;
});
