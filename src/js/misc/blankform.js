/*jslint nomen: true */
/*globals define: true */

define([
  'jquery',
  'lib/lodash'
],

function($, _) {
  'use strict';

  return {
      "name": "Blank survey",
      "type": "mobile",
      "questions": [
        {
          "name": "sample-question",
          "text": "Sample question",
          "answers": [
            {
              "value": "yes",
              "text": "Yes"
            },
            {
              "value": "no",
              "text": "No"
            }
          ]
        }
      ]
    };
}); // End blank survey module