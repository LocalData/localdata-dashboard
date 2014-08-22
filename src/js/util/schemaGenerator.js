/*jslint nomen: true */
/*globals define, FileReader: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',
  'lib/tinypubsub',

  // LocalData
  'settings',
  'util/util'
],

/**
 * Create a schema from a set of rows
 */

function($, _, Backbone, events, settings, Util) {
  'use strict';

  var SchemaGenerator = Backbone.View.extend({
    protoSchema: {},
    orderedKeys: [], // all the questions, in order.
    schema: [],

    initialize: function(options) {
      _.bindAll(this);
    },

    createSchemaForKey: function(key) {
      var protoAnswers = this.protoSchema[key];
      var question = {
        text: key,
        name: key
      };
      // console.log("Deciderating", key, protoAnswers);

      // If the question has many answers, it's probably a text field.
      if (protoAnswers.length === 10 || protoAnswers.length === 0) {
        question.type = 'text';
        this.schema.push(question);
        return;
      }

      // Otherwise, let's treat it as if it's a radio button
      var answers = [];
      _.each(protoAnswers, function(protoAnswer) {
        var answer = {
          name: protoAnswer,
          value: protoAnswer
        };
        answers.push(answer);
      });
      question.answers = answers;

      // Add the question to the schema.
      this.schema.push(question);
    },

    /**
     * We want a full schema out of the proto-schema!
     */
    getSchema: function(orderedKeys) {
      this.schema = []; // reset the schema
      _.each(this.orderedKeys, this.createSchemaForKey);
      // console.log("Got schema", this.schema);
      return this.schema;
    },

    setFields: function(fields) {
      this.orderedKeys = fields;
    },

    /**
     * Process a key-value pair and add it to a proto-schema
     */
    processPair: function(value, key) {
      // Add the key to the schema if it doesn't yet exist.
      if(!_.has(this.protoSchema, key)) {
        this.protoSchema[key] = [];
      }

      // Skip values with blanks
      // TODO: we might want to include these in some way
      if(value === '') {
        return;
      }

      // We don't need to record the value if there are lots
      // Later, we'll asssume it's a text question
      // This boosts performace (we don't keep every answer in memory)
      if(this.protoSchema[key].length === 10) {
        return;
      }
      // console.log("Checking", key, value, this.protoSchema);
      if(!_.contains(this.protoSchema[key], value)) {
        this.protoSchema[key].push(value);
      }
    },

    addRow: function(row) {
      _.each(row, this.processPair);
    }

  });

  return SchemaGenerator;
});
