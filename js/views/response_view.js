NSB.views.ResponseListView = Backbone.View.extend({
  responses: null,
  firstRun: true,
  surveyId: null,
  paginationView: null,

  events: { 
    "change #filter":  "filter",
    "click #subfilter a": "subFilter",
    "click #reset": "reset"
  },

  initialize: function(options) {
    _.bindAll(this, 'render', 'goToPage', 'humanizeDates', 'filter', 'subFilter', 'setupPagination');
    this.template = _.template($('#response-view').html());

    this.responses = options.responses;
    this.responses.on('reset', this.render, this);
  },
  
  render: function() { 
    console.log("Rendering response view");

    // The first time we render, we want to save a copy of the original responses
    if (this.firstRun) {
      this.allResponses = new NSB.collections.Responses(this.responses.models);
      this.firstRun = false;
    };

    this.setupPagination();

    var thisPage = this.responses.toJSON().slice(this.pageStart, this.pageEnd);
    this.humanizeDates(thisPage);  

    var context = { 
      responses: thisPage,
      filters: this.responses.getResponseKeys()
    };    
    this.$el.html(this.template(context));

    this.mapView = new NSB.views.MapView({
      el: $("#map-view-container"),
      responses: this.responses 
    });
  },

  setupPagination: function() {
    this.page = 0;
    this.pageListCount = 20000;
    this.pageStart = 0;
    this.pageEnd = this.pageStart + this.pageListCount;
    this.pageCount = Math.floor(this.responses.length / this.pageListCount);  
  },

  goToPage: function(pageStr) {
    var page = parseInt(pageStr, 10); 
    this.page = page;
    this.pageStart = (this.page - 1) * this.pageListCount;
    this.pageEnd = this.page * this.pageListCount;
    
    this.render();
  },

  reset: function(e) {
    console.log(this.allResponses.models);
    this.responses.reset(this.allResponses.models);
    // render should be triggered by an event...
    // this.render();

    $("#current-filter").html("");
  },

  filter: function(e) {
    var $question = $(e.target);
    var results = this.responses.getUniqueAnswersForQuestion($question.val());
    $("#subfilter").html(_.template($('#filter-results').html(), { choices: results }));
  },

  subFilter: function(e) {
    var $answer = $(e.target);

    // Reset the collection 
    // this.responses.reset(this.allResponses.models);

    // Filter the responses
    var answerValue = $answer.text();
    var questionValue = $("#filter").val();

    console.log(answerValue);
    console.log(questionValue);

    var filteredResponses = this.responses.filter(function(resp) {
      if (_.has(resp.attributes, 'responses')) {
        return resp.attributes.responses[questionValue] === answerValue;
      }
      return false;
    });

    this.responses.reset(filteredResponses);

    $("#current-filter").html("<h4>Current filter:</h4> <h3>" + questionValue + ": " + answerValue + "</h3>");
  },

  humanizeDates: function(responses, field) {
    _.each(responses, function(response){
      // 2012-06-26T20:00:52.283Z
      if(_.has(response, "created")) {
        response.createdHumanized = moment(response.created, "YYYY-MM-DDThh:mm:ss.SSSZ").format("MMM Do h:mma");
      }
    });
  }
  
});