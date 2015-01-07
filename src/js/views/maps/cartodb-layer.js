/*jslint nomen: true */
/*globals define */

define(function (require, exports, module) {
  'use strict';

  var $ = require('jquery');
  var _ = require('lib/lodash');
  var Backbone = require('backbone');
  var L = require('lib/leaflet/leaflet.tilejson');
  var Promise = require('lib/bluebird');

  var settings = require('settings');

  var infoTemplate = require('text!templates/cartodb-info.html');
  var template = require('text!templates/projects/layerControl.html');


  // Render an infowindow for a selected cartodb map item
  var ItemView = Backbone.View.extend({
    template: _.template(infoTemplate),

    events: {
      'click .close': 'remove'
    },

    initialize: function (options) {
      this.layerOptions = options.layerOptions;
      this.data = options.data;
    },

    render: function () {
      var context = {
        name: this.data[this.layerOptions.humanReadableField],
        centroid: JSON.parse(this.data.centroid),
        googleKey: settings.GoogleKey
      };

      var names = this.layerOptions.fieldNames;
      context.fields = _.map(_.keys(names), function (name) {
        return {
          name: names[name],
          value: this.data[name]
        };
      }, this);
      this.$el.html(this.template(context));
      return this;
    }
  });

  // The View
  // We don't make much use of the Backbone.View facilities, but we may need
  // later need to have this layer behave more like the survey layer, which
  // renders some summary data and reacts to models.
  module.exports = Backbone.View.extend({
    template: _.template(template),

    state: 'active',
    className: 'layer',

    events: {
      'click .toggle-layer': 'toggleLayer'
    },

    initialize: function(options) {
      _.bindAll(this, 'render');

      this.mapView = options.mapView;
      this.dataQuery = options.layer.dataQuery;
      this.layerOptions = options.layer;

      this.state = this.layerOptions.state || 'active';

      var self = this;

      // Now we need to start loading the tiles
      Promise.resolve($.ajax({
        url: 'https://localdata.cartodb.com/api/v1/map',
        type: 'GET',
        dataType: 'jsonp',
        data: {
          stat_tag: options.layer.stat_tag, // doesn't seem to be required
          config: JSON.stringify(options.layer.config)
        }
      })).then(function (data) {

        // Add image tiles
        var url = 'https://' + data.cdn_url.https +
            '/localdata/api/v1/map/' + data.layergroupid +
            '/{z}/{x}/{y}.png';
        this.tileLayer = L.tileLayer(url);

        if (this.state === 'active') {
          self.mapView.addTileLayer(this.tileLayer);
        }

        // We can skip adding the UTF grids on purely informational layers.
        if(this.layerOptions.config.disableGrid) {
          return;
        }

        // Add grid
        var gridUrl = 'https://' + data.cdn_url.https +
            '/localdata/api/v1/map/' + data.layergroupid +
            '/0/{z}/{x}/{y}.grid.json?callback={cb}';
        this.gridLayer = new L.UtfGrid(gridUrl, {
          resolution: 4
        });

        if (this.state === 'active') {
          self.mapView.addGridLayer(this.gridLayer);
        }

        this.gridLayer.on('click', self.handleGridClick, self);

      }.bind(this)).catch(function (error) {
        console.log('Failed to fetch cartodb map config', error);
      });

    },

    render: function () {
      if (this.layerOptions.noLegend) {
        return;
      }

      var context = {
        name: this.layerOptions.layerName,
        meta: {
          color: this.layerOptions.color
        }
      };

      if (this.state === 'inactive') {
        this.$el.addClass('legend-inactive');
      }

      this.trigger('rendered', this.$el);

      this.$el.html(this.template(context));
      return this.$el;
    },

    toggleLayer: function () {
      console.log("Toggling layer, start state", this.state);
      if (this.state === 'active') {
        this.state = 'inactive';
        this.mapView.removeTileLayer(this.tileLayer);

        if(this.gridLayer) {
          this.mapView.removeGridLayer(this.gridLayer);
        }

        this.$el.addClass('legend-inactive');
      } else if (this.state === 'inactive') {
        this.state = 'active';
        this.mapView.addTileLayer(this.tileLayer);

        if(this.gridLayer) {
          this.mapView.addGridLayer(this.gridLayer);
        }

        this.$el.removeClass('legend-inactive');
      }
    },

    handleGridClick: function (event) {
      if (!event.data) {
        return;
      }

      var self = this;

      Promise.resolve($.ajax({
        url: 'https://localdata.cartodb.com/api/v2/sql',
        type: 'GET',
        dataType: 'jsonp',
        data: {
          q: _.template(this.dataQuery, { cartodb_id: event.data.cartodb_id })
        }
      })).then(function (data) {
        if (data.rows && data.rows.length > 0) {
          self.trigger('itemSelected', {
            view: new ItemView({
              data: data.rows[0],
              layerOptions: self.layerOptions
            }),
            latlng: event.latlng
          });
        }
      }).catch(function (error) {
        console.log('Error getting data from cartodb', error);
      });
    }
  });
});
