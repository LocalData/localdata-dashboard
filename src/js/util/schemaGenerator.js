/*jslint nomen: true */
/*globals define, FileReader: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',
  'lib/tinypubsub',
  'lib/papaparse',

  'settings'
],

/**
 * Create a schema from a set of rows
 */

function($, _, Backbone, events, Papa, settings) {
  'use strict';

  var SchemaGenerator = Backbone.View.extend({
    initialize: function(options) {
      _.bindAll(this);
    },

    // Decide what kind of question this is
    deciderator: function(values) {
      if (values.length > 10) {
        return 'text';
        // TODO it might also be a number or a date
      }
    },

    //
    schematizer: function () {
      this.schemas = 123;
    },

    // Bin a row for later schema classification
    addRow: function(row) {
      _.each(row, function(key, value) {
        if(this.schema[key].length > 10) {
          return;
          // we don't need to record the value
        }
      });
    }

  });

  return SchemaGenerator;
});
