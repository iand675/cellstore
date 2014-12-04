'use strict';

var minimist = require('minimist');
var fs = require('fs');
var $ = require('gulp-load-plugins')();
var gulp = require('gulp');
var _ = require('lodash');

var knownOptions = {
    string: [ 'build-id', 'config' ],
    default: {
        'build-id': process.env.RANDOM_ID,
        'config': ( process.env.TRAVIS_BRANCH !== undefined && fs.existsSync('config/' + process.env.TRAVIS_BRANCH + '.json.enc') ) ? process.env.TRAVIS_BRANCH : process.env.CELLSTORE_CONFIG
    }
};
var throwError = function(msg){
    $.util.log($.util.colors.red('ERROR ') + msg);
    throw 'terminating';
};
var args = minimist(process.argv.slice(2), knownOptions);
var buildId = args['build-id'];
if(buildId === undefined || buildId === ''){
    throwError('no buildId available. ' + $.util.colors.red('Command line argument --build-id missing.'));
}

var configId = args.config;
if(configId === undefined || configId === ''){
    throwError('no configId available. ' + $.util.colors.red('Command line argument --config or env variable CELLSTORE_CONFIG missing.'));
}
var unencryptedConfigFile = 'config/' + configId + '.json';
var encryptedConfigFile = unencryptedConfigFile + '.enc';
if(!fs.existsSync(encryptedConfigFile)){
    throwError('Invalid --config command line argument. ' + $.util.colors.red('Config file ' + encryptedConfigFile + ' does not exist.'));
}

var isOnTravis = process.env.TRAVIS_BUILD_ID !== undefined;
// if a config/<branch>.json.enc exists we are on a production deployment branch
var isProd = fs.existsSync('config/' + process.env.TRAVIS_BRANCH + '.json.enc');
var isOnTravisAndProd = isOnTravis && isProd && process.env.TRAVIS_PULL_REQUEST === 'false';

var skipDeployment = false;
if(isOnTravisAndProd && process.env.TRAVIS_BRANCH !== process.env.CELLSTORE_CONFIG){
    skipDeployment = true;
}

var config =
{
    isOnTravis: isOnTravis,
    isOnProduction: isOnTravisAndProd,
    skipDeployment: skipDeployment,
    buildId: buildId,
    configId: configId,
    bucketName: '',
    projectName: '',
    paths: {
        //src and build folders
        app: 'app',
        dist: 'dist',
        tmp: '.tmp',
        queries: 'queries',

        //Reports
        reports: 'data/' + configId + '/*.json',

        //Static Assets
        json: ['*.json', 'tasks/templates/*.json.mustache', 'swagger/*.json', 'data/**/*.json' ],
        js: ['app/**/*.js'],
        css: ['app/**/*.css'],
        index: 'app/*.html',
        html: ['app/**/*.html'],
        images: 'app/images/**/*.{gif,jpg,png}',
        svgs: 'app/images/**/*.svg',
        less: ['app/**/*.less'],
        fonts: ['app/**/*.ttf', 'app/**/*.woff'],

        //CI
        tasks: ['gulpfile.js', 'tasks/*.js'],

        //Crypted config
        encryptedConfigFile: encryptedConfigFile,
        unencryptedConfigFile: unencryptedConfigFile,
        config: 'config.json',

        //Queries
        jsoniq: ['queries/**/*.{xq,jq}'],
        initQueries: [
            'queries/private/InitAuditCollection.jq',
            'queries/private/init.jq',
            'queries/private/UpdateReportSchema.jq',
            'queries/private/cleanupTestUserReports.jq',
            'queries/private/migration/db6.jq'
        ],
        apiTestQueries: [
            'queries/public/test/' + configId + '/*'
        ],

        //tests
        protractorConfigLocal: 'tests/e2e/config/protractor-conf.js',
        protractorConfigTravis: 'tests/e2e/config/protractor-travis-nosaucelabs-conf.js',
        e2eSpecs: [ 'tests/e2e/' + configId + '/*-scenario.js' ]
    },
    credentials: {}
};

gulp.task('load-config', ['config-template'], function(done){
    if(!_.isEmpty(config.credentials)){
        done();
        return;
    }

    if(!fs.existsSync(config.paths.config)){
        done('no ' + config.paths.config + ' found.');
    } else {
        $.util.log('loading config: ' + config.paths.config);
        config.credentials = JSON.parse(fs.readFileSync(config.paths.config, 'utf-8'));

        config.bucketName = config.isOnProduction ? config.credentials.s3.bucketPrefix : config.credentials.s3.bucketPrefix + '-' + config.buildId;
        config.projectName = config.isOnProduction ? config.credentials['28'].projectPrefix : config.credentials['28'].projectPrefix + '-' + buildId;

        $.util.log('Bucket: ' + $.util.colors.green(config.bucketName));
        $.util.log('Project: ' + $.util.colors.green(config.projectName));
        $.util.log('Profile: ' + $.util.colors.green(config.credentials.cellstore.profile));

        done();
    }
});

module.exports = config;
