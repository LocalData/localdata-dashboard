/*jslint nomen: true */
/*globals define: true */

define([
  'jquery',
  'lib/lodash',
  'backbone',
  'lib/tinypubsub',

  // LocalData
  'settings',

  // Models
  'models/surveys',
  'models/responses',
  'models/forms',

  // Views
  'views/subnav',
  'views/export',
  'views/settings',
  'views/responses'
],

function($, _, Backbone, events, settings, SurveyModels, ResponseModels, FormModels, SubnavView, ExportView, SettingsView, ResponseViews) {
  'use strict'; 

  var SurveyViews = {};

  SurveyViews.ListItemView = Backbone.View.extend({
    initialize: function() {
      _.bindAll(this, 'render');
      this.model.bind('change', this.render);
    },

    render: function() {
      this.$el.html(_.template($('#survey-list-item-view').html(), {survey: this.model }));  
      return this;
    }

  });


  SurveyViews.SurveyView = Backbone.View.extend({
    el: $("#container"),
    
    toshow: ['', 0],
    survey: null,
    bodyView: null,
    
    initialize: function(options) {
      _.bindAll(this, 'render', 'show', 'showResponses', 'showUpload', 'showSettings');

      // Set up the page and show the given survey
      this.surveyId = options.id;
      this.survey = new SurveyModels.Model({id: this.surveyId});
      this.survey.on('change', this.render, this);
      
      // Get the relevant responses    
      this.responses = new ResponseModels.Collection([], {surveyId: this.surveyId}); 

      // Get the forms
      this.forms = new FormModels.Collection({surveyId: this.surveyId});
    },

    render: function() {
      console.log("Rendering survey view");
      
      // Set the context & render the page
      var context = {
        'survey': this.survey.toJSON()
      };
      this.$el.html(_.template($('#survey-view').html(), context));
      
      // TODO -- reenable setLoading 
      events.publish('loading', [true]);
      // app.setLoading(true);

      // Render the sub components
      $('#settings-view-container').hide();
      $('#export-view-container').hide();

      // List the responses
      this.responseListView = new ResponseViews.ListView({
        el: $("#response-view-container"),
        responses: this.responses,
        forms: this.forms
      });

      // TODO 
      // Settings view
      this.settingsView = new SettingsView({
        survey: this.survey,
        forms: this.forms
      });

      // Subnav & Export views   
      this.subnavView = new SubnavView({slug: settings.slug});  
      this.exportView = new ExportView({surveyId: this.surveyId});  

      this.subnavView.render();
      this.exportView.render(); 
      this.settingsView.render();

      // TODO -- this should only run after SubnavView is read. 
      // By default, we show the first tab
      this.show(this.toshow[0], this.toshow[1]);
    },
    
    show: function(id, tab) {
      // This is a really bad way to show the right tab
      this.toshow = [id, tab];

      $("#content > div").hide();
      $("#content #loading-view-container").show();
      $(id).show();
      this.subnavView.setActiveTab(tab);
    },
    
    showResponses: function() {
      this.show('#response-view-container', 0);
    },
    
    showExport: function() {
      this.show('#export-view-container', 1);
    },
    
    showSettings: function() {
      this.show('#settings-view-container', 2);
    },
        
    // Not yet implemented
    showUpload: function() {
      console.log("[not] Using upload view");
    },
    
    showScans: function() {
      console.log("[not] Using scans view");
    }
    
  });

  return SurveyViews;

}); // End SurveyViews 
