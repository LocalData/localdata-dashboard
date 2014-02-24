  MapViews.MapDrawView = Backbone.View.extend({
    map: null,
    el: "#map-draw-view-container",

    events: {
      'click .draw': 'drawZone',
      'click .remove': 'removeZone',
      'click .done': 'doneDrawingZone'
    },

    initialize: function(options) {
      _.bindAll(this, 'render', 'renderZones', 'drawZone', 'removeZone',
        'doneDrawingZone', 'save');


      this.survey = options.survey;
      this.survey.on('change', this.render);

      this.zones = new Zones.Collection();
      this.zones.on('add', this.renderZones);
      this.zones.on('reset', this.renderZones);
    },


    render: function() {
      // Don't re-render
      if(this.map) {
        return;
      }

      console.log("Rendering map draw view");
      this.$el.html(_.template($('#map-draw-view').html(), {
        zones: this.survey.get('zones')
      }));

      // Initialize the map
      this.map = new L.map('map-draw', {
        maxZoom: 19
      });


      // Set up the base map
      this.baseLayer = new L.tileLayer('http://a.tiles.mapbox.com/v3/matth.map-zmpggdzn/{z}/{x}/{y}.png');
      this.map.addLayer(this.baseLayer);

      // Center on the survey
      // TODO: use geocoded center
      this.map.setView([42.374891,-83.069504], 17);

      return;

      // Initialize the FeatureGroup to store editable layers
      this.drawnItems = new L.FeatureGroup();
      this.map.addLayer(this.drawnItems);

      // Initialize the draw control and pass it the FeatureGroup of editable layers
      var drawControl = new L.Control.Draw({
          draw: {
            polyline: false,
            rectangle: false,
            circle: false,
            marker:false,
            polygon: {
              shapeOptions: {
                  color: '#ef6d4a',
                  fillColor: '#ef6d4a'
              }
            }
          },
          edit: {
              featureGroup: this.drawnItems
          }
      });
      this.map.addControl(drawControl);

      this.map.on('draw:created', function (e) {
        var type  = e.layerType,
            layer = e.layer;

        // Style zones with a unique color
        // TODO: we only have 6 colors right now.
        var zoneNumber = this.zones.length;
        var color = settings.colorRange[zoneNumber];
        layer.setStyle({
          color: color,
          fillColor: color
        });

        // Create a new zone model
        var zone = new Zones.Model({
          layer: layer,
          name: 'Zone ' + (this.zones.length + 1),
          color: color
        });
        this.zones.push(zone);

        // Add the zone layer to the layerGroup
        this.drawnItems.addLayer(layer);
      }.bind(this));

      if(this.survey.zones) {
        this.renderZones();
      }
    },

    /**
     * Render surveyor zones on the map
     */
    renderZones: function() {
      console.log("ZONE ADDED!");
      // Add the zones to the map
      // this.zones.each(function(zone) {
      //   this.map.addLayer(zone);
      // }, this);

      if(_.has(this.survey, 'zones')) {
        this.zones.reset(this.survey.zones.features);
      }

      // Show the form for the zones
      $('#map-zones').html(_.template($('#map-zones-view').html(), {
        zones: this.zones.toJSON()
      }));
    },


    /**
     * Get the user started drawing a shape on the map
     */
    drawZone: function(event) {
      // Show the drawing tools

      // Show the save button
    },

    /**
     * Save the zones that are on the map
     */
    saveZones: function() {
      // Update the zone names
      $('#survey-zone-form input').each(function($input, index) {
        this.zones[index].properties.name = $input.value;
      });

      // Save the zone to the survey
      console.log(this.survey);
      this.survey.save();
    },

    /**
     * Remove a zone from the survey
     */
    removeZone: function(event) {
      // Delete it from the survey

      // Delete it from the map

      // Save the survey
    },

    save: function() {
      console.log("NOOP");
    }

  });
