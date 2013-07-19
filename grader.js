#!/usr/bin/env node
/*
  Automatically grade files for the presence of specified HTML tags/attributes.
  Uses commander.js and cheerio. Teaches command line application development and 
  basic DOM parsing.


  References:

  + cheerio
    - https://github.com/MatthewMueller/cheerio
    - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
    - http://maxogden.com/scraping-with-node.html

  + commander.js
    - https://github.com/visionmedia/commander.js
    - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

  +  JSON
    - http://en.wikipedia.org/wiki/JSON
    - https://developer.mozilla.org/en-US/docs/JSON
    - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2

*/

var util = require("util");
var fs = require("fs");
var program = require("commander");
var cheerio = require("cheerio");
var rest = require("restler"); 

var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var URL_DEFAULT = "http://arcane-plains-6885.herokuapp.com";
var TYPE_CHECK_DEFAULT = "URL";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    
    if(!fs.existsSync(instr)) {
	console.log("%s does not exist. Exiting", instr);

	process.exit(1); //http://nodejs.org/api/process.html#process_process_exit_code  
    }
    
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    //console.log(cheerio.load(fs.readFileSync(htmlfile)));
    return cheerio.load(fs.readFileSync(htmlfile));
};

var cheerioUrl = function() {

    var cheerioHelper = function(url, checksfile) {
	
	rest.get(url).on("complete", function(result, response) {

	    if(result instanceof Error) {
		console.error(util.format(response.message));
	    }
	    
	    loadCheerioUrl(result, checksfile);
	
	});

    }

    return cheerioHelper;
};

var loadCheerioUrl = function(result, checksfile) {

    $ = cheerio.load(result);
    var checks = loadChecks(checksfile).sort()
    var out = {};
//console.log($("h1"));
//console.log
    for(var ii in checks) {
	var present = $(checks[ii]).length > 0;
	out[checks[ii]] = present;
    }

    checkJson = out;

    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);
    
}

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};

    console.log($("h1"));

    for(var ii in checks) {
	var present = $(checks[ii]).length > 0;
	out[checks[ii]] = present;
    }
    
    return out;
};

var checkUrl = function(url, checksfile) {

    var cheerioHelper = cheerioUrl();

    cheerioHelper(url, checksfile);

};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
      .option("-c, --checks <check_file>", "Path to checks.json", clone(assertFileExists), CHECKSFILE_DEFAULT) 
      .option("-f, --file <html_file>", "Path to index.html", clone(assertFileExists), HTMLFILE_DEFAULT)
      .option("-u, --url <url>","Url to check",URL_DEFAULT)
      .option("-t, --type_check <type_check>","Type of check performed (URL or FILE)",TYPE_CHECK_DEFAULT)
      .parse(process.argv);
    
    var checkJson;

    if(program.type_check === "URL") {
	checkUrl(program.url, program.checks);
    }
    else if(program.type_check === "FILE") {
	checkJson = checkHtmlFile(program.file, program.checks);

	var outJson = JSON.stringify(checkJson, null, 4);
	console.log(outJson);
    }
    else {
	console.log("type_check unknown - please set to URL or FILE. grader.js --help for options.")
    }

} else {
    exports.checkHtmlFile = checkHtmlFile;
}
