/*jslint nomen: true */
/*globals define: true */

define(function(require, exports, module) {
  'use strict';

  var $ = require('jquery');
  var _ = require('lib/lodash');
  var L = require('lib/leaflet.draw/leaflet.draw');
  var Backbone = require('backbone');

  var settings = require('settings');
  var util = require('util');

  // Models
  var Zones = require('models/zones');

  // Templates
  var MapDrawTemplate = require('text!templates/surveys/zone-editor.html');
  var MapZonesTemplate = require('text!templates/surveys/zone-editor-zone.html');

  var WEIGHT = 4;

  function flip(a) {
    return [a[1], a[0]];
  }

  var ZoneEditorView = Backbone.View.extend({
    map: null,

    el: '#zone-editor-container',

    template: _.template(MapDrawTemplate),
    zonesTemplate: _.template(MapZonesTemplate),

    events: {
      'click .draw': 'drawZone',
      'click .remove': 'removeZone',
      'click .done': 'doneDrawingZone',
      'click .save': 'save'
    },

    initialize: function(options) {
      _.bindAll(this,
        'render',
        'fitBounds',
        'addZone',
        'findZoneByName',
        'editZone',
        'removeZone',
        'renderZones',
        'getZones',
        'success',
        'error'
      );

      this.survey = options.survey;
      this.survey.on('change', this.render);

      this.zones = new Zones.Collection();

      this.zones.on('add', this.saveZones);
      this.zones.on('remove', this.unmapZone);

      this.render();
    },

    render: function() {
      // Don't re-render
      if(this.map) {
        return;
      }

      this.zones.reset(this.survey.get('zones'));

      this.$el.html(this.template({
        zones: this.zones.toJSON()
      }));

      // Initialize the map
      this.map = new L.map('map-draw', {
        maxZoom: 18
      });

      // Set up the base map
      this.baseLayer = new L.tileLayer(settings.baseLayer);
      this.map.addLayer(this.baseLayer);

      // Center on the survey
      // TODO: use geocoded center for empty surveys
      this.fitBounds();

      // Initialize the FeatureGroup to store editable layers
      this.drawnItems = new L.FeatureGroup();
      this.drawnItems.addTo(this.map);

      // Add existing zones
      this.renderZones();

      // Initialize the draw control and pass it the FeatureGroup of editable layers
      var drawControl = new L.Control.Draw({
        draw: {
          polyline: false,
          circle: false,
          marker:false,
          rectangle: {
            shapeOptions: {
              color: '#ef6d4a',
              fillColor: '#ef6d4a',
              weight: WEIGHT
            }
          },
          polygon: {
            shapeOptions: {
              color: '#ef6d4a',
              fillColor: '#ef6d4a',
              weight: WEIGHT
            }
          }
        },
        edit: {
          featureGroup: this.drawnItems
        }
      });
      this.map.addControl(drawControl);

      this.map.on('draw:created', this.addZone);
      this.map.on('draw:edited', this.editZone);
    },

    error: function(model, xhr, options) {
      this.$el.find('.error').fadeIn().css('display','inline-block').delay(2000).fadeOut();
    },

    success: function() {
      console.log("Saved", this.$el.find('.saved'));
      this.$el.find('.saved').fadeIn().css('display','inline-block').delay(2000).fadeOut();
    },

    save: function(event) {
      event.preventDefault();
      util.track('survey.settings.zones.save');

      this.survey.attributes.zones = this.getZones();
      this.survey.save({}, {
        success: this.success,
        error: this.error
      });
    },

    fitBounds: function() {
      var bounds = this.survey.get('responseBounds');
      if (bounds) {
        bounds = [flip(bounds[0]), flip(bounds[1])];
        if (bounds[0][0] === bounds[1][0] || bounds[0][1] === bounds[1][1]) {
          this.map.setView(bounds[0], 15);
        } else {
          this.map.fitBounds(bounds, {
            reset: true,
            maxZoom: 18
          });
        }
      } else {
        this.survey.getLocation(function(error, location) {
          this.map.setView(location.coords, 13);
        }.bind(this));
      }
    },

    style: function(feature) {
      return {
        color: feature.properties.color,
        fillColor: feature.properties.color,
        opacity: 1,
        weight: WEIGHT,
        lineJoin: 'miter'
      };
    },

    findZoneByName: function(name) {
      console.log("zones", this.zones);
      var result;
      this.zones.each(function(zone) {
        if (zone.get('properties').name === name) {
          result = zone;
        }
      });
      return result;
    },

    editZone: function (e) {
      var layers = e.layers;
      layers.eachLayer(function (layer) {
        var zone = this.findZoneByName(layer.feature.properties.name);
        // TODO
        // This layer still has the old polygon's geometry.
        // console.log("New geometry", layer.feature.geometry, layer);
        zone.set('geometry', layer.feature.geometry);
      }.bind(this));
    },

    addZone: function(event) {
      var type  = event.layerType,
          layer = event.layer;

      // Style zones with a unique color
      // TODO: Add more colors.
      // We only have 6 colors right now.
      var zoneNumber = this.zones.length;
      var color = settings.zoneColors[zoneNumber];
      layer.setStyle({
        color: color,
        fillColor: color,
        opacity: 1,
        weight: WEIGHT
      });

      // Create a new zone model
      var geoJSON = layer.toGeoJSON();
      geoJSON.properties = {
        name: 'Zone ' + (this.zones.length + 1),
        color: color
      };

      // Add the zone layer to the layerGroup
      this.drawnItems.addLayer(layer);

      // Save the layer to the model
      geoJSON.layer = layer;
      var zone = new Zones.Model(geoJSON);
      this.zones.push(zone);

      // Render the form
      $('#map-zones').html(this.zonesTemplate({
        zones: this.zones.toJSON()
      }));
    },

    /**
     * Render existing survey zones on the map
     */
    renderZones: function() {
      var zones;

      // If the survey already has zones, render them
      if(this.survey.get('zones')) {
        zones = this.survey.get('zones');
        var zonesWithLayers = [];

        // Create a layer for each zone
        _.each(zones.features, function(zone, i) {
          var layer = L.geoJson(zone, {
            style: this.style,
            onEachFeature: function (feature, layer) {
              // leaflet draw workaround
              // https://github.com/Leaflet/Leaflet.draw/issues/159#issuecomment-47757508
              this.drawnItems.addLayer(layer);

              // We can't just add the layer to the feature, because that causes
              // a self-referential json issue when we save the survey object.
              zonesWithLayers.push({
                layer: layer,
                geometry: zones.features[i].geometry,
                type: zones.features[i].type,
                properties: zones.features[i].properties
              });
            }.bind(this)
          });

        }.bind(this));

        this.zones.reset(zonesWithLayers);

        // Fit the map to the zone bounds
        var bounds = this.drawnItems.getBounds();
        if(bounds.isValid()) {
          this.map.fitBounds(bounds);
        }
      }

      // Renter the form for the zones
      $('#map-zones').html(this.zonesTemplate({
        zones: this.zones.toJSON()
      }));
    },

    removeZone: function(event) {
      var index = $(event.currentTarget).attr('data-index');
      var model = this.zones.at(index);

      // Remove the zone from the map, the collection, and the form
      // TODO: should be handled by events on the zones collection.
      this.drawnItems.removeLayer(model.get('layer'));
      this.zones.remove(model);
      $(event.currentTarget).parent().remove();
    },

    /**
     * Get all zones
     * @return {Object} geoJSON FeatureCollection
     */
    getZones: function() {
      // Update the names
      $('#survey-zone-form input').each(function(index, $input) {
        this.zones.at(index).attributes.properties.name = $input.value;
      }.bind(this));

      return {
        type: 'FeatureCollection',
        features: this.zones.toJSON()
      };
    }

  });

  return ZoneEditorView;

});
