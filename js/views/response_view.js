NSB.views.ResponseListView = Backbone.View.extend({
  responses: null,
  surveyId: null,
  paginationView: null,

  events: { 
    "change #filter":  "filter",
  },

  initialize: function(options) {
    _.bindAll(this, 'render', 'goTo', 'humanizeDates', 'filter');

    this.responses = options.responses;
    console.log(this.responses);
        
    this.responses.on('all', this.render, this);
  },
  
  setup: function() {
    this.page = 0;
    this.pageListCount = 2000;
    this.pageStart = 0;
    this.pageEnd = this.pageStart + this.pageListCount;
    this.pageCount = Math.floor(this.responses.length / this.pageListCount);  
  },
  
  goTo: function(pageStr) {
    var page = parseInt(pageStr, 10); 
    this.page = page;
    this.pageStart = (this.page - 1) * this.pageListCount;
    this.pageEnd = this.page * this.pageListCount;
    
    this.render();
  },

  filter: function(e) {
    console.log(e);
    var $target = $(e.target);
    console.log($target.val());

    var results = this.responses.getUniqueAnswersForQuestion($target.val());
    console.log(results);
    var stuff = _.template($('#response-view').html(), { choices: results });
    console.log(stuff);
  },

  humanizeDates: function(responses, field) {
    _.each(responses, function(response){
      // 2012-06-26T20:00:52.283Z
      if(_.has(response, "created")) {
        response.createdHumanized = moment(response.created, "YYYY-MM-DDThh:mm:ss.SSSZ").format("MMM Do h:mma");
      }
    });
  },
  
  render: function() { 
    this.setup();

    var thisPage = this.responses.toJSON().slice(this.pageStart, this.pageEnd);
    this.humanizeDates(thisPage);  
      
    var context = { 
      responses: thisPage,
      filters: this.responses.getResponseKeys()
    };    

    console.log(this.$el);

    this.$el.html(_.template($('#response-view').html(), context));
    
    // this.paginationView = new NSB.views.PaginationView({ 
    //   pageCount: this.pageCount
    // });
    // this.paginationView.bind('changePage', this.goTo);

    // TOTALLY NOT THE RIGHT WAY
    // This is not the right way to set up an event -- but with our render 
    // process the element isn't available earlier. 
    // $("#filter").change(function(e){
    //   console.log(e);
    // });



    return this;
  }
  
});