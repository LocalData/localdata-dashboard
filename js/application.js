// The global NSB object acts as a registry of NSB Backbone types. 
window.NSB = {

  // Tracks if the page is currently loading data
  // Pretty naieve for now (really only used for responses) 
  setLoading: function(state) {
    NSB.loading = state;
    console.log(NSB.loading);

    if (NSB.loading) {
      console.log("Show the loading view");
      NSB.loadingView = new NSB.views.LoadingView({
        el: $("#loading-view-container"),
      });
    }else {
      console.log("Hide the loading view");
      NSB.loadingView.remove();
    }
  },

  // Return true if the page is in the loading state,
  // false if not 
  getLoading: function() {
    if(NSB.loading === undefined){
      return false;
    }
    return NSB.loading;
  }
};


NSB.settings = {};
NSB.API = {};
NSB.collections = {};
NSB.models = {};
NSB.views = {};
NSB.routers = {};
NSB.templates = {};
