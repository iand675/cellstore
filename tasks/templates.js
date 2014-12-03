'use strict';

require('./crypt');

var fs = require('fs');
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var _ = require('lodash');

var Config = require('./config');

gulp.task('config-template', [ 'decrypt' ], function(){
    var Mustache = require('mustache');
    var expand = require('glob-expand');

    //Fetch credentials
    $.util.log('loading credentials from: ' + Config.paths.credentials);
    var rawCredentials = JSON.parse(fs.readFileSync(Config.paths.credentials, 'utf-8'));
    var credentials = rawCredentials.all;
    if(Config.isOnProduction){
        _.extend(credentials, rawCredentials.prod)
    } else {
        _.extend(credentials, rawCredentials.dev)
    }
    var data = { credentials: credentials };

    var src = fs.readFileSync('tasks/templates/config.json.mustache', 'utf-8');
    var result = Mustache.render(src, data);
    fs.writeFileSync(Config.paths.config, result, 'utf-8');
    $.util.log('created ' + Config.paths.config);
});

gulp.task('templates', ['load-config'], function(){

    var Mustache = require('mustache');
    var expand = require('glob-expand');

    //Fetch reports
    var reports  = expand(Config.paths.reports);
    var reportSources = [];
    reports.forEach(function(report){
        reportSources.push(fs.readFileSync(report, 'utf-8'));
    });

    var templates = [
        {
            src: 'tasks/templates/config.js.mustache',
            data: {
                cellstore: Config.credentials.cellstore,
                staging: {
                    environment: Config.isOnProduction ? 'prod' : 'dev',
                    e2eReportsDir: '/tmp/e2e-reports'
                }
            },
            dest: 'tests/e2e/config/config.js'
        },
        {
            src: 'tasks/templates/config.jq.mustache',
            data: {
                cellstore: Config.credentials.cellstore,
                sendmail: Config.credentials.sendmail,
                frontend: {
                    project: 'app',
                    domain: '.secxbrl.info'
                }
            },
            dest: Config.paths.queries + '/modules/io/28/apps/config.jq'
        },
        {
            src: 'tasks/templates/UpdateReportSchema.jq.mustache',
            data: {
                reports: reportSources.join(',')
            },
            dest: Config.paths.queries + '/private/UpdateReportSchema.jq'
        },
        {
            src: 'tasks/templates/constants.js.mustache',
            data: {
                APPNAME: 'secxbrl',
                API_URL: 'http://' + Config.projectName + '.28.io/v1',
                DEBUG: false,
                ACCOUNT_URL: '/account/info',
                REGISTRATION_URL: '/auth',
                PROFILE: Config.credentials.cellstore.profile
            },
            dest: Config.paths.app + '/constants.js'
        }
    ];

    templates.forEach(function(tpl){
        var src = fs.readFileSync(tpl.src, 'utf-8');
        var result = Mustache.render(src, tpl.data);
        fs.writeFileSync(tpl.dest, result, 'utf-8');
        $.util.log('created template: ' + tpl.dest);
    });
});
