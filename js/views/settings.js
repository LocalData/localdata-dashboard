/*jslint nomen: true */
/*globals define: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',
  'settings',
  'api'
],

function($, _, Backbone, settings, api) {
  'use strict'; 

  var SettingsView = Backbone.View.extend({
    
    elId: "#settings-view-container",

    // TODO 
    // Save survey settings
    // events: {
    //   "form input[type='submit'] click": this.save
    // },

    initialize: function(options) {
      _.bindAll(this, 'render', 'save');
      this.survey = options.survey;
      this.forms = options.forms;
      console.log(this.survey);
      console.log(this.forms);
    },
    
    // TODO
    save: function(event) {
      event.preventDefault();
      console.log("SUBMITTED!");
      console.log(event);
    },
    
    render: function() {  
      console.log("RENDERING settings view");
      console.log(this.forms);
      
      var context = { 
        survey: this.survey.toJSON(),
        forms: this.forms.toJSON() 
      };    

      $(this.elId).html(_.template($('#settings-view').html(), context));
      console.log($(this.elId));  
    }
    
  });

  return SettingsView;
});