/*jslint nomen: true */
/*globals define */

define(function (require, exports, module) {
  'use strict';

  var $ = require('jquery');
  var _ = require('lib/lodash');
  var Backbone = require('backbone');
  var L = require('lib/leaflet/leaflet.tilejson');
  var Promise = require('lib/bluebird');

  var api = require('api');
  var util = require('util');

  // We reuse the cartodb layer templates
  var infoTemplate = require('text!templates/foreign-layer-info.html');
  var tooltipTemplate = require('text!templates/foreign-layer-tooltip.html');
  var template = require('text!templates/projects/layerControl.html');

  // Render an infowindow for a selected map item
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
        raw: this.data
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

    initialize: function (options) {
      this.mapView = options.mapView;
      this.dataQuery = options.layer.dataQuery;
      this.layerOptions = options.layer;

      this.state = this.layerOptions.state || 'active';

      var self = this;

      // Now we need to start loading the tiles
      Promise.resolve($.ajax({
        url: '/tiles/features/tile.json',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(this.layerOptions.layer)
      })).bind(this).then(function (data) {
        // Add image tiles
        var tileConfig = util.templatizeURLs(data.tiles);
        var attribution = this.layerOptions.attribution || '';
        this.tileLayer = L.tileLayer(tileConfig.template, {
          attribution: attribution,
          subdomains: tileConfig.subs
        });

        if (this.layerOptions.zIndex) {
          this.tileLayer.setZIndex(this.layerOptions.zIndex);
        }

        if (this.state === 'active') {
          self.mapView.addTileLayer(this.tileLayer);
        }

        // We can skip adding the UTF grids on purely informational layers.
        if (this.layerOptions.disableGrid) {
          return;
        }

        // Add grid
        var gridConfig = util.templatizeURLs(data.grids);
        this.gridLayer = new L.UtfGrid(gridConfig.template, {
          resolution: 4,
          subdomains: gridConfig.subs
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
        console.log('Failed to fetch features layer map config', error);
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
      console.log('Toggling layer, start state', this.state);
      if (this.state === 'active') {
        this.state = 'inactive';
        this.mapView.removeTileLayer(this.tileLayer);

        if (this.gridLayer) {
          this.mapView.removeGridLayer(this.gridLayer);
        }

        this.hideTooltip();

        this.$el.addClass('legend-inactive');
      } else if (this.state === 'inactive') {
        this.state = 'active';
        this.mapView.addTileLayer(this.tileLayer);

        if (this.gridLayer) {
          this.mapView.addGridLayer(this.gridLayer, true);
        }

        this.$el.removeClass('legend-inactive');
      }
    },

    hideTooltip: function () {
      if (!this.$tooltip) {
        return;
      }
      this.$tooltip.remove();
      delete this.$tooltip;
    },

    showTooltip: function (name) {
      if (this.$tooltip) {
        this.$tooltip.html(name);
      } else {
        this.$tooltip = $(this.tooltipTemplate({ name: name}));
        this.$tooltip.appendTo($('#map-tools .tooltips'));
      }
    },

    handleGridMouseout: function () {
      this.hideTooltip();
    },

    handleGridHover: function (event) {
      var name = event.data.info[this.layerOptions.humanReadableField];
      this.showTooltip(name);
    },

    handleGridClick: function (event) {
      if (!event.data) {
        return;
      }

      var self = this;

      // We need to get the geometry, so we can draw the selected object on the
      // map.
      api.getFeature(this.layerOptions.layer.query.source, event.data.object_id)
      .then(function (data) {
        if (data.features && data.features.length > 0) {
          var feature = data.features[0];
          self.mapView.selectObject(feature.geometry);

          self.trigger('itemSelected', {
            view: new ItemView({
              data: feature.properties.info,
              layerOptions: self.layerOptions
            }),
            latlng: event.latlng
          });
        }
      }).catch(function (error) {
        console.log('Error getting feature data from the API', error);
      });
    }

  });
});