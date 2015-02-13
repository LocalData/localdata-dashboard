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
  var tooltipTemplate = require('text!templates/cartodb-tooltip.html');
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
    tooltipTemplate: _.template(tooltipTemplate),

    state: 'active',
    className: 'layer',

    events: {
      'click .toggle-layer': 'toggleLayer'
    },

    initialize: function(options) {
      _.bindAll(this, 'render', 'getCartoData', 'handleGridHover');

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
        var attribution = this.layerOptions.attribution || '';
        this.tileLayer = L.tileLayer(url, { attribution: attribution });

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
          self.mapView.addGridLayer(this.gridLayer, true);
        }

        if (this.layerOptions.handleClick) {
          this.gridLayer.on('click', self.handleGridClick, self);
        }

        if (this.layerOptions.handleMouseover) {
          this.gridLayer.on('mouseover', self.handleGridHover, self);
          this.gridLayer.on('mouseout', self.handleGridMouseout, self);
        }

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

      if (this.layerOptions.staticLegend) {
        context.meta.staticLegend = this.layerOptions.staticLegend;
      }

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

        this.hideTooltip();

        this.$el.addClass('legend-inactive');
      } else if (this.state === 'inactive') {
        this.state = 'active';
        this.mapView.addTileLayer(this.tileLayer);

        if(this.gridLayer) {
          this.mapView.addGridLayer(this.gridLayer, true);
        }

        this.$el.removeClass('legend-inactive');
      }
    },

    getCartoData: function(cartodb_id, done) {
      Promise.resolve($.ajax({
        url: 'https://localdata.cartodb.com/api/v2/sql',
        type: 'GET',
        dataType: 'jsonp',
        data: {
          q: _.template(this.dataQuery)({ cartodb_id: cartodb_id })
        }
      })).then(done).catch(function (error) {
        console.log('Error getting data from cartodb', error);
      });
    },

    hideTooltip: function() {
      if (!this.$tooltip) { return; }
      this.$tooltip.remove();
      delete this.$tooltip;
    },

    showTooltip: function(name) {
      if (this.$tooltip) {
        this.$tooltip.html(name);
      } else {
        this.$tooltip = $(this.tooltipTemplate({ name: name}));
        this.$tooltip.appendTo($('#map-tools .tooltips'));
      }
    },

    handleGridMouseout: function() {
      this.hideTooltip();
    },

    handleGridHover: function(event) {
      this.getCartoData(event.data.cartodb_id, function(data) {
        if (data.rows && data.rows.length > 0) {
          var name = data.rows[0][this.layerOptions.humanReadableField];
          this.showTooltip(name);
        }
      }.bind(this));
    },

    handleGridClick: function (event) {
      if (!event.data) {
        console.log("No data --returning");
        return;
      }

      var self = this;

      this.getCartoData(event.data.cartodb_id, function (data) {
        if (data.rows && data.rows.length > 0) {
          self.trigger('itemSelected', {
            view: new ItemView({
              data: data.rows[0],
              layerOptions: self.layerOptions
            }),
            latlng: event.latlng
          });
        }
      });
    }
  });
});
