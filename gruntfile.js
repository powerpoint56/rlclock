module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        uglify: {
            build: {
                src: "app.js",
                dest: "app.min.js"
            },
            options: {
                mangle: {
                    properties: false 
                },
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
        },
        minifyHtml: {
            dist: {
                files: {
                    "index.html": "dev.html"
                }
            }
        }
    });
    
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-cssmin");
    grunt.loadNpmTasks("grunt-minify-html");
    
    grunt.registerTask("default", ["uglify", "cssmin", "minifyHtml"]);
};
