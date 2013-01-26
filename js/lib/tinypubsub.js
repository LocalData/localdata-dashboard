/*globals define: true */

define(function () {

  "use strict";

  /**
   *    Events. Pub/Sub system for Loosely Coupled logic.
   *    Based on Peter Higgins' port from Dojo to jQuery
   *    https://github.com/phiggins42/bloody-jquery-plugins/blob/master/pubsub.js
   *
   *    Re-adapted to vanilla Javascript
   *
   *    ----------------------------------------------------------
   *    And then wrapped to AMD Module by Dragan Bajcic @kodisha
   *
   *    @class Events
   */
  return {
    cache : {},
    /**
     *    Events.publish
     *    e.g.: Events.publish("/Article/added", [article], this);
     *
     *    @class Events
     *    @method publish
     *    @param topic {String}
     *    @param args    {Array}
     *    @param scope {Object=} Optional
     */
    publish : function (topic, args, /** {Object=} */ scope) {

        // console.log('publish',topic, args);
        if (this.cache[topic]) {
            var thisTopic = this.cache[topic],
                i = thisTopic.length - 1;

            for (i ; i >= 0 ; i -= 1) {
                thisTopic[i].apply(scope || this, args || []);
            }
        }
    },
    /**
     *    Events.subscribe
     *    e.g.: Events.subscribe("/Article/added", Articles.validate)
     *
     *    @class Events
     *    @method subscribe
     *    @param topic {String}
     *    @param callback {Function}
     *    @return Event handler {Array}
     */
    subscribe : function (topic, callback) {

        // console.log('subscribe', topic, callback);
        if (!this.cache[topic]) {
            this.cache[topic] = [];
        }
        this.cache[topic].push(callback);
        return [topic, callback];
    },

    /**
     *    Events.unsubscribe
     *    e.g.: var handle = Events.subscribe("/Article/added", Articles.validate);
     *        Events.unsubscribe(handle);
     *
     *    @class Events
     *    @method unsubscribe
     *    @param handle {Array}
     *    @param completly {Boolean}
     *    @return {type description }
     */
    unsubscribe : function (handle, completly) {
        var t = handle[0],
            i = this.cache[t].length - 1;

        if (this.cache[t]) {
            for (i ; i >= 0 ; i -= 1) {
                if (this.cache[t][i] === handle[1]) {
                    this.cache[t].splice(this.cache[t][i], 1);
                    if (completly) {
                        delete this.cache[t];
                    }
                }
            }
        }
    }
  };

});


// /* jQuery Tiny Pub/Sub - v0.7 - 10/27/2011
//  * http://benalman.com/
//  * Copyright (c) 2011 "Cowboy" Ben Alman; Licensed MIT, GPL */
// 
// (function($) {
// 
//   var o = $({});
// 
//   $.subscribe = function() {
//     o.on.apply(o, arguments);
//   };
// 
//   $.unsubscribe = function() {
//     o.off.apply(o, arguments);
//   };
// 
//   $.publish = function() {
//     o.trigger.apply(o, arguments);
//   };
// 
// }(jQuery));
