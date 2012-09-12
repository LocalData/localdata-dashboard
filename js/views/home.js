NSB.views.Home = Backbone.View.extend({
  
  el: $("#container"),
  
  initialize: function(options) {
    _.bindAll(this, 'render', 'appendSurvey');

    this.surveys = new NSB.collections.Surveys();
    this.surveys.bind('reset', this.render);
    this.surveys.fetch();
  },
  
  render: function() {  
    var self = this;
    var context = {};
    this.$el.html(_.template($('#home').html(), context));  

    this.surveys.each(function(survey) {
      self.appendSurvey(survey);
    });
  },

  appendSurvey: function(survey) {
    var surveyListItemView = new NSB.views.SurveyListItemView({
      model: survey
    });
    $('.survey-list', this.el).append(surveyListItemView.render().el);
  }
  
});
