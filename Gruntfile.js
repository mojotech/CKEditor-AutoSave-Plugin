/**
 * Build process for CKEditor AutoSave Plugin
 * This file contributed by Timm Stokke <timm@stokke.me>
 *
 * Don't know where to start?
 * Try: http://24ways.org/2013/grunt-is-not-weird-and-hard/
 */
module.exports = function(grunt) {

  // CONFIGURATION
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    // Minimize JS
    min: {
      options: {
        report: false
      },
      extensions: {
        src: [
          'autosave/js/moment.js',
          'autosave/js/lz-string.js'
          ],
        dest: 'autosave/js/extensions.min.js',
      }
    }
  });

  // PLUGINS
  grunt.loadNpmTasks('grunt-yui-compressor');
  grunt.registerTask('default', 'min');
};
