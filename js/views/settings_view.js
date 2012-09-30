NSB.views.SettingsView = Backbone.View.extend({

  // events: {
  //   "form input[type='submit'] click": this.save
  // },

  initialize: function(options) {
    _.bindAll(this, 'render', 'save');
    this.survey = options.survey;
  },
  
  save: function(event) {
    event.preventDefault();
    console.log("SUBMITTED!");
    console.log(event);
  },
  
  render: function() {  
    console.log("Rendering settings view");
    console.log(this.forms);
    
    var context = { 
      survey: this.survey.toJSON(),
      forms: this.forms.toJSON() 
    };    

    this.$el.html(_.template($('#settings-view').html(), context));
        
  }
  
});