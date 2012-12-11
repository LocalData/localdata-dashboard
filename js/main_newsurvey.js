/*jslint nomen: true */
/*globals require: true */

require(['jquery', 'lib/lodash', 'backbone', 'newsurvey'],
        function ($, _, Backbone, app) {
  'use strict';
  $(document).ready(function () {
    app.initialize();
  });
});

