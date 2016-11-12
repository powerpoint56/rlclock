module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        uglify: {
            build: {
                src: "app.js",
                dest: "app.min.js"
            },
            options: {
                mangleProperties: true,
                reserveDOMProperties: true,
                reserveDOMCache: true,
                exceptionsFiles: ["mangleExceptions.json"]
            }
        },
        cssmin: {
            build: {
                src: "app.css",
                dest: "app.min.css"
            }
        }
    });
    
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-cssmin");
    
    grunt.registerTask("default", ["uglify", "cssmin"]);
};
