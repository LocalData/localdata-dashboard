NSB.models.Response = Backbone.Model.extend({ 
  
});


// NSB.collections.Responses = Backbone.Collection.extend({
//   model: NSB.models.Response,
//   
//   initialize: function(options) {
//     this.surveyId = options.surveyId;
//     this.fetch();
//   },
//   
//   url: function() {
//     return NSB.API + '/surveys/' + this.surveyId + '/responses';
//   },
//         
//   parse: function(response) {
//     return response.responses;
//   }
//   
// });


NSB.collections.PaginatedResponses = Backbone.Paginator.clientPager.extend({
  model: NSB.models.Response,
  
  initialize: function(options) {
    this.surveyId = options.surveyId;
    this.paginator_core.url = NSB.API + '/surveys/' + this.surveyId + '/responses';
  },
  
  paginator_core: {
      type: 'GET',
      dataType: 'json',
      url: null
  },
  
  paginator_ui: {
      firstPage: 1,
      currentPage: 1,
      perPage: 3,
      totalPages: 10
  },
  
  server_api: {
  },
  
  parse: function(response) {
    this.totalPages = Math.floor(response.responses.length / this.perPage);
    return response.responses;
  }  
  
});
