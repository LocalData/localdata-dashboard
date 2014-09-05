/*jslint node: true */
var exec = require('child_process').exec;

module.exports = function(grunt) {
  'use strict';

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    // Read local settings for things like the deployment locations
    // The format should be:
    // {
    //   "deploy" : {
    //     "default" : "s3://awesomebucket/folder/subfolder/",
    //     "bob" : "s3://awesomebucket/folder/subfolder/",
    //     "staging" : "s3://seriousbucket/staging/app/",
    //     "production : "s3://seriousbucket/production/app/"
    //   }
    // }
    dev: (function () {
      var settings = 'dev-settings.json';
      if (grunt.file.isFile(settings)) {
        return grunt.file.readJSON('dev-settings.json');
      }
      return {};
    }()),

    // We set this later using a grunt task.
    version: {
      number: null,
      commit: null,
      custom: false,
      toString: function () {
        if (this.custom) { return this.number + '.' + this.commit + '_custom'; }
        return this.number + '.' + this.commit;
      }
    },

    dirs: {
      staging: 'staging',
      temp: 'temp',
      build: 'build'
    },

    clean: ['<%= dirs.staging %>', '<%= dirs.temp %>', '<%= dirs.build %>'],

    requirejs: {
      compile: {
        options: {
          name: 'main',
          baseUrl: '<%= dirs.staging %>/js',
          mainConfigFile: 'src/js/main.js',
          out: '<%= dirs.temp %>/js/main.js',
          optimize: 'uglify2',
          uglify2: {
            // Preserve license/copyright comments
            preserveComments: ( function () {
              var re = /\(c\)|copyright|license/gi;
              return function checkComments(node, token) {
                return re.test(token.value);
              };
            }())
          }
        }
      }
    },

    sass: {
      dist: {
        files: [ {
          src: ['src/css/sass/styles.scss'],
          dest: '<%= dirs.staging %>/css/app.css'
        } ]
      }
    },

    cssmin: {
      compress: {
        files: [ {
          expand: true,     // Enable dynamic expansion.
          cwd: 'src/',      // Src matches are relative to this path.
          src: ['**/*.css'], // Actual pattern(s) to match.
          dest: '<%= dirs.temp %>'   // Destination path prefix.
        } ]
      }
    },

    concat: {
      options: {
        separator: ';',
        banner: '/* v <%= version.toString() %> <%= grunt.template.today("isoDateTime") %> */\n'
      },
      build: {
        src: ['<%= dirs.temp %>/js/main.js'],
        dest: '<%= dirs.build %>/js/main.js'
      }
    },

    copy: {
      staging: {
        files: [
          {
            expand: true,
            cwd: 'src/',
            src: [
              '**/*',
              '!**/*.scss',
              '!**/sass/**'
            ],
            dest: '<%= dirs.staging %>'
          }
        ]
      },
      temp: {
        files: [
          // TODO: combine main.js and require.js
          {
            expand: true,
            cwd: '<%= dirs.staging %>',
            src: [
              'js/require.js',
              'js/lib/aight.js',
              'img/**',
              '**/*.png', // Leaflet looks for PNGs in a funny spot
              '**/*.gif',
              'font/**',
              'css/font/**',
              'fonts/**',
              'css/fonts/**',
              // CSS files for other components are likely raw CSS and not SCSS
              '**/*.css'
            ],
            dest: '<%= dirs.temp %>'
          }
        ]
      },
      build: {
        files: [
          {
            expand: true,
            cwd: '<%= dirs.temp %>',
            src: [
              'js/require.js',
              'js/lib/aight.js',
              '**/*.css',
              'css/**',
              '*.html',
              'img/**',
              '**/*.png',
              '**/*.gif',
              'css/font/**',
              'font/**',
              'css/fonts/**',
              'fonts/**'
            ],
            dest: '<%= dirs.build %>'
          }
        ]
      }
    },

    watch: {
      options: {
        atBegin: true
      },
      files: ['src/**/*'],
      tasks: ['stage', 'notify:watch']
    },

    notify: {
      watch: {
        options: {
          message: 'SASS compiled'
        }
      }
    }
  });

  // Load plugins
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-notify');

  // Define the deploy task
  grunt.registerTask('deploy', 'Deploy the build directory to S3 using s3cmd', function (locname) {
    var deploy = grunt.config('dev').deploy;
    var location;

    // Use the 'default' config value if we didn't specify a specific destination.
    if (locname === undefined) {
      location = deploy['default'];
    } else {
      location = deploy[locname];
    }

    if (location === undefined) {
      grunt.log.error('No destination configured by that name: ' + locname);
      return false;
    }

    var done = this.async();
    var src = grunt.config('dirs').build;

    // Make sure the source path ends with a slash.
    if (src[src.length - 1] !== '/') {
      src = src + '/';
    }

    // Make sure the destination path ends with a slash.
    if (location[location.length - 1] !== '/') {
      location = location + '/';
    }

    var cmd = 's3cmd sync ' + src + ' ' + location;
    exec(cmd, function (error, stdout, stderr) {
      if (stdout.length > 0) {
        grunt.log.writeln(stdout);
      }

      if (stderr.length > 0) {
        grunt.log.error(stderr);
      }

      if (error) {
        done(false);
      }

      done();
    });
  });

  // Define version task
  grunt.registerTask('setVersion', 'Sets the version using package.json and git', function () {
    grunt.config.requires(['pkg', 'version']);
    var done = this.async();

    var showCmd = 'git show -s head --format=format:%H';
    var statusCmd = 'git status --short src';

    // Get the commit hash.
    exec(showCmd, function (error, stdout, stderr) {
      if (error || stderr.length > 0) {
        grunt.log.error(stderr);
        done(false);
        return;
      }

      var commit = stdout.toString().trim();

      // See if we have local, uncommitted changes.
      exec(statusCmd, function (error, stdout, stderr) {
        if (error || stderr.length > 0) {
          grunt.log.error(stderr);
          done(false);
          return;
        }

        var custom = stdout.length > 1;

        // Use getRaw, so we don't get a copy.
        var version = grunt.config.getRaw('version');
        version.number = grunt.config('pkg').version;
        version.commit = commit;
        version.custom = custom;
        grunt.log.writeln('Version: ' + version.toString());
        done();
      });
    });
  });

  // Run the version task, which only updates the configuration with the appropriate version number.
  grunt.task.run('setVersion');

  grunt.registerTask('build', ['copy:staging', 'sass', 'cssmin', 'requirejs', 'copy:temp', 'concat:build', 'copy:build']);
  grunt.registerTask('stage', ['copy:staging', 'sass']);

  // Default task
  grunt.registerTask('default', ['watch']);

};
