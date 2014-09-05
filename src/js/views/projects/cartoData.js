/*jslint nomen: true */
/*globals define: true */

define(function (require) {
  'use strict';

  var $ = require('jquery');
  var _ = require('lib/lodash');
  // Gross :/
  var cartodb = require('cartodb');
  cartodb = window.cartodb;
  var Promise = require('lib/bluebird');
  var L = require('lib/leaflet/leaflet.tilejson');

  var dateRangeStyleTemplate = _.template(require('text!templates/projects/carto-data-daterange.cartocss'));
  var dateRangeSQLTemplate = _.template(require('text!templates/projects/carto-data-daterange.sql'));
  var byHourStyleTemplate = _.template(require('text!templates/projects/carto-data-byhour.cartocss'));
  var byHourSQLTemplate = _.template(require('text!templates/projects/carto-data-byhour.sql'));

  var exports = {};

  var cdbLayer;

  exports.map = null;

  // options.start = 0
  // options.stop = Date.now()
  window.filter = function filter(min, max, geometry) {
    exports.updateCDBMap({
      type: 'daterange',
      data: {
        start: min,
        stop: max
      }
    });
    window.printCounts({
      start: min || 0,
      stop: max || Date.now(),
      geometry: geometry
    });
  };

  window.printCounts = function (options) {
    if (!options) {
      options = {};
    }
    exports.countsByDate(options)
    .then(function (data) {
      console.log(Object.keys(data.fields).join(', '));
      data.rows.forEach(function (row) {
        console.log(_.values(row).join(', '));
      });
    }).catch(function (error) {
      console.log(error);
    });
  };


  exports.queries = {
    daterange: dateRangeSQLTemplate,
    day: _.template('WITH hgrid AS (SELECT CDB_HexagonGrid(ST_Expand(!bbox!, greatest(!pixel_width!,!pixel_height!) * <%= size %>), greatest(!pixel_width!,!pixel_height!) * <%= size %>) as cell) SELECT hgrid.cell as the_geom_webmercator, count(i.cartodb_id) as points_count, count(i.cartodb_id)/power( <%= size %> * CDB_XYZ_Resolution(16), 2 ) as points_density, 1 as cartodb_id FROM hgrid, (SELECT * from fourweeks WHERE day >= <%= day_min %> AND day < <%= day_max %>) i where ST_Intersects(i.the_geom_webmercator, hgrid.cell) GROUP BY hgrid.cell'),
    hour: byHourSQLTemplate
  };

  exports.styles = {
    daterange: dateRangeStyleTemplate,
    hour: byHourStyleTemplate,
    day: _.template('/** density visualization */\n\n#fourweeks{\n  polygon-fill: #B10026;\n  polygon-opacity: 0.7;\n  line-color: #FFF;\n  line-width: 0;\n  line-opacity: 0;\n}\n#fourweeks{\n  [points_density <= 0.95] { polygon-fill: #B10026;  }\n  [points_density <= 0.85] { polygon-fill: #E31A1C;  }\n  [points_density <= 0.7] { polygon-fill: #FC4E2A;  }\n  [points_density <= 0.5] { polygon-fill: #FD8D3C;  }\n  [points_density <= 0.3] { polygon-fill: #FEB24C;  }\n  [points_density <= 0.2] { polygon-fill: #FED976;  }\n  [points_density <= 0.1] { polygon-fill: #FFFFB2; polygon-opacity: 0.1; }\n\n}')
  };

  exports.varDefaults = {
    daterange: {
      start: 0,
      stop: 1893456000 * 1000,
      size: 15
    },
    hour: {
      hour_min: 0,
      hour_max: 24,
      size: 15
    },
    day: {
      day_min: 0,
      day_max: 24,
      size: 15
    }
  };

  exports.updateCDBMap = function (options) {
    var type = options.type;
    if (!type) {
      type = 'daterange';
    }

    var data = _.defaults({}, options.data, exports.varDefaults[type]);

    var mapConfig = {
      version: '1.0.1',
      layers: [{
        type: 'cartodb',
        options: {
          cartocss_version: '2.1.1',
          cartocss: exports.styles[type](data),
          sql: exports.queries[type](data)
        }
      }]
    };

    return Promise.resolve($.ajax({
      url: '//prashtx.cartodb.com/api/v1/map',
      type: 'POST',
      crossOrigin: true,
      dataType: 'json',
      contentType: 'application/json',
      data: JSON.stringify(mapConfig)
    })).then(function (data) {
      var url = 'http://prashtx.cartodb.com/api/v1/map/' + data.layergroupid + '/{z}/{x}/{y}.png';
      if (cdbLayer) {
        cdbLayer.setUrl(url);
      } else {
        cdbLayer = new L.tileLayer(url);
        exports.map.addLayer(cdbLayer);
      }
    }).catch(function (error) {
      console.log(error);
      console.log(error.statusText);
    });
  };

  exports.sql = (new cartodb.SQL({ user: 'prashtx' }));

  /**
   * Get counts by date
   * @param  {Object} options With optional start and end parameters
   * @return {Promise}
   */
  exports.countsByDate = function (options) {
    if(!options) {
      options = {};
    }
    var start;
    console.log("Getting counts by date", options);
    if (options.start) {
      start = (new Date(options.start)).toISOString();
      console.log("Using custom start date", options.start, start);
    } else {
      start = (new Date(0)).toISOString();
    }
    var stop;
    console.log("IS THERE A STOP", options.stop);
    if (options.stop) {
      stop = (new Date(options.stop)).toISOString();
      console.log("Using custom stop date", options.stop, stop);
    } else {
      stop = (new Date()).toISOString();
    }

    console.log("Running counts by date", options, start, stop);

    return new Promise(function (resolve, reject) {
      var promise;
      if (options.geometry) {
        promise = exports.sql.execute('SELECT date_trunc(\'day\', ts) AS d, COUNT(*) FROM fourweeks WHERE ts > timestamp \'{{start}}\' AND ts <= timestamp \'{{stop}}\' AND ST_Intersects(the_geom, ST_SetSRID(ST_GeomFromGeoJSON(\'' + JSON.stringify(options.geometry) + '}}\'), 4326)) GROUP BY d ORDER BY d', {
          start: start,
          stop: stop,
          geometry: options.geometry
        });
      } else {
        promise = exports.sql.execute('SELECT date_trunc(\'day\', ts) AS d, COUNT(*) FROM fourweeks WHERE ts > timestamp \'{{start}}\' AND ts <= timestamp \'{{stop}}\' GROUP BY d ORDER BY d', {
          start: start,
          stop: stop
        });
      }

      promise.done(resolve)
      .error(reject);
    });
  };

  /**
   * Get counts by day-hour
   * @param  {Object} options With optional start and end parameters
   * @return {Promise}
   */
  exports.countsByHourOfWeek = function (options) {
    if(!options) {
      options = {};
    }
    var start;
    console.log("Getting counts by date", options);
    if (options.start) {
      start = (new Date(options.start)).toISOString();
      console.log("Using custom start date", options.start, start);
    } else {
      start = (new Date(0)).toISOString();
    }
    var stop;
    console.log("IS THERE A STOP", options.stop);
    if (options.stop) {
      stop = (new Date(options.stop)).toISOString();
      console.log("Using custom stop date", options.stop, stop);
    } else {
      stop = (new Date()).toISOString();
    }

    console.log("Running counts by date", options, start, stop);

    return new Promise(function (resolve, reject) {
      var promise;
      if (options.geometry) {
        promise = exports.sql.execute('SELECT extract(\'dow\' from ts) AS d, extract(\'hour\' from ts) as h, COUNT(*) FROM fourweeks WHERE ts > timestamp \'{{start}}\' AND ts <= timestamp \'{{stop}}\' AND ST_Intersects(the_geom, ST_SetSRID(ST_GeomFromGeoJSON(\'' + JSON.stringify(options.geometry) + '}}\'), 4326)) GROUP BY d, h ORDER BY d, h', {
          start: start,
          stop: stop,
          geometry: options.geometry
        });
      } else {
        promise = exports.sql.execute('SELECT extract(\'dow\' from ts) AS d, extract(\'hour\' from ts) as h, COUNT(*) FROM fourweeks WHERE ts > timestamp \'{{start}}\' AND ts <= timestamp \'{{stop}}\' GROUP BY d, h ORDER BY d, h', {
          start: start,
          stop: stop
        });
      }

      promise.done(resolve)
      .error(reject);
    });
  };

  return exports;
});
