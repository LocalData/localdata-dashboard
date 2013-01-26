/*jslint nomen: true */
/*globals define: true */

define([
  'jquery',
  'lib/lodash'
],

function($, _) {
  'use strict'; 

	return {
		  "name": "Standard neighborhood survey",
		  "type": "mobile",
		  "questions": [
		    {
		      "name": "structure",
		      "text": "Is there a structure on the site?",
		      "answers": [
		        {
		          "value": "yes",
		          "text": "Yes",
		          "questions": [
		            {
		              "name":"condition",
		              "text":"What is the condition of the structure?",
		              "answers":[
		                {
		                  "value":"excellent",
		                  "text":"Excellent"
		                },
		                {
		                  "value":"good",
		                  "text":"Good"
		                },
		                {
		                  "value":"fair",
		                  "text":"Fair"
		                },
		                {
		                  "value":"poor",
		                  "text":"Poor"
		                },
		                {
		                  "value":"needs-demolition",
		                  "text":"Needs demolition"
		                }
		              ]
		            },
		            {
		              "name": "structure-properties",
		              "text": "Do any of the following apply?",
		              "type": "checkbox",
		              "answers": [
		                {
		                  "name": "vacanct",
		                  "value": "yes",
		                  "text": "Vacant"
		                },
		                {
		                  "name": "vod",
		                  "value": "yes",
		                  "text": "Vacant, open, and dangerous"
		                },
		                {
		                  "name": "fire-damage",
		                  "value": "yes",
		                  "text": "Fire damage"
		                }
		              ]
		            }
		          ]
		        },
		        {
		          "value": "no",
		          "text": "No",
		          "questions": [
		            {
		              "name": "improvements",
		              "text": "Is the site improved or unimproved?",
		              "answers": [
		                {
		                  "value":"improved",
		                  "text": "Improved"
		                },
		                {
		                  "value":"unimproved",
		                  "text": "Unimproved"
		                }
		              ]
		            }
		          ]
		        }
		      ]
		    },
		    {
		      "name": "dumping",
		      "text": "Is there illegal dumping on the site?",
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
}); // End Root module