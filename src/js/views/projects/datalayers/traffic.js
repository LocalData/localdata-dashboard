/*jslint nomen: true */
/*globals define, cartodb, Rickshaw: true */

define(function (require) {
  'use strict';

  var $ = require('jquery');
  var _ = require('lib/lodash');
  var Backbone = require('backbone');
  var L = require('lib/leaflet/leaflet.tilejson');

  // Templates
  var template = require('text!templates/projects/layerControl.html');

  function hsl2rgb(hsl) {
    var c = hsl[1] * (1 - Math.abs(2*hsl[2] - 1));
    var hp = hsl[0] / 60;
    var x = c * (1 - Math.abs((hp % 2) - 1));

    var rgbp;
    if (hp >= 0 && hp < 1) {
      rgbp = [c,x,0];
    } else if (hp >= 1 && hp < 2) {
      rgbp = [x,c,0];
    } else if (hp >= 2 && hp < 3) {
      rgbp = [0,c,x];
    } else if (hp >= 3 && hp < 4) {
      rgbp = [0,x,c];
    } else if (hp >= 4 && hp < 5) {
      rgbp = [x,0,c];
    } else if (hp >= 5 && hp < 6) {
      rgbp = [c,0,x];
    } else {
      rgbp = [0,0,0];
    }

    var m = hsl[2] - (c / 2);
    return [rgbp[0] + m, rgbp[1] + m, rgbp[2] + m];
  }

  function rgbString(rgb) {
    return '#' + rgb.map(function (x) {
      var hex = Math.floor(255 * x).toString('16');
      if (hex.length === 1) {
        return '0' + hex;
      }
      return hex;
    }).join('');
  }

  function getColor(h) {
    var s = 1;
    var l = 0.5;
    return rgbString(hsl2rgb([360 * h, s, l]));
  }


  var LayerControl = Backbone.View.extend({
    template: _.template(template),

    className: 'layer',

    initialize: function(options) {
      _.bindAll(this,
        'setup',
        'render',
        'update',
        'getCount',
        'processData',
        'doneLoading'
      );
      this.map = options.map;
      this.setup();
    },

    update: function(options) {
      //this.setup();
    },

    /**
     * Set up the map and chart data
     * @param  {Object} options
     */
    setup: function() {
      var self = this;
      $.ajax({
        url: '//comfortless.herokuapp.com/?url=' + encodeURIComponent('https://s3.amazonaws.com/localdata-public/misc/tmp/ftraffic.geojson'),
        dataType: 'json'
      }).done(function (data) {
        self.processData(data);
      }).fail(function (error) {
        console.log(error);
      });
    },

    processData: function(data) {
      this.data = data;
      var self = this;

      function style(zoom) {
        var weight = (3.03*zoom - 42.67);
        function color(val) {
          if (val > 0.9) {
            return '#e32238';
          }
          if (val > 0.5) {
            return '#ffe000';
          }
          return '#00cc5d';
        }
        console.log('zoom: ' + zoom + ' weight: ' + weight);
        return function (feature) {
          return {
            color: color(feature.properties.a),
            opacity: 0.8,
            lineCap: 'butt',
            weight: weight
          };
        };
      }

      this.layer = L.geoJson(this.data, {
        style: style(this.map.getZoom())
      });
      this.layer.addTo(this.map);
      this.map.on('zoomend', function () {
        self.layer.setStyle(style(self.map.getZoom()));
      });
      this.render();
    },

    doneLoading: function() {
      this.$el.find('.loading').hide();
    },

    /**
     * Get the number of responses
     * @return {String}
     */
    getCount: function() {
      if(this.data) {
        return this.data.features.length;
      }
      return '';
    },

    render: function() {
      console.log("Rendering layerControl", this.$el);
      var context = {
        name: 'Traffic data',
        kind: 'traffic',
        meta: {
          // count: this.getCount()
        }
      };

      this.$el.html(this.template(context));

      if(this.data) {
        this.doneLoading();
      }

      return this.$el;
    }
  });

  return LayerControl;

});
