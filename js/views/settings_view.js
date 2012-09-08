NSB.views.SettingsView = Backbone.View.extend({
  
  elId: "#settings-view-container",
  forms: null,

  initialize: function(options) {
    _.bindAll(this, 'render', 'save');
    this.surveyId = options.surveyId;
    this.forms = options.forms;
    console.log(this.responses);
    
    if (_.has(options, 'elId')) {
      this.elId = options.elId;
    };
    
    this.forms.on('all', this.render, this);
    this.forms.on('reset', this.setup, this);
  },
  
  save: function(event) {
    event.preventDefault();
    console.log("SUBMITTED!");
    console.log(event);
    
    var id = $(event.target).attr('data-id');
    var questions = $(event.target).find('textarea').val(); 
    console.log(id);
    console.log(questions);
    
    var form = this.forms.get(id);
    if(form === undefined) {
      form = new NSB.models.Form({
        surveyId: this.surveyId,
        type: 'mobile'
      });      
    };
    
    form.set({ questions: JSON.parse(questions) });      
    form.save();
    console.log(form);
    
    // If we need to create it.
    
    var formData = {};
    formData['questions'] = questions;
    // See if this is a new form or one already in the database.
  },
  
  render: function() {  
    console.log(this.forms);
    
    var context = { 
      forms: this.forms.toJSON() 
    };    

    $(this.elId).html(_.template($('#settings-view').html(), context));
    
    // This really isn't the right way to save a thing.  
    $(this.elId + " form").on('submit', this.save);
    
  }
  
});