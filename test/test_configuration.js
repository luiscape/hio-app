   /*
  /
 /   Testing the configuration of the app.
/                                           */


/* Dependencies */

var r         = require('rethinkdb');
var sys       = require('sys');
var path      = require('path');
var should    = require('should');
var expect    = require('chai').expect;
var supertest = require('supertest');


/* Application */

var C         = require('../config');
var _         = require('underscore');
var config    = C.LoadConfig('dev');


/* Tests */

describe('Load configuration.', function () {

  it('configuration file type', function (done) {
    configuration = C.LoadConfig('dev');
    expect(typeof(configuration)).to.equal('object');
    done();
  });

  it('configuration properties', function (done) {
    var configuration = C.LoadConfig('dev');
    expect(configuration).to.have.a.property('version');
    expect(configuration).to.have.a.property('version_name');
    expect(configuration).to.have.a.property('database');
    expect(_.size(configuration.database)).to.equal(4);
    done();
  });

});


describe('RethinkDB tests.', function () {

  it('Test if RethinkDB is running.', function (done) {
    expect(C.ConnectRethinkDB(verbose=true)).to.not.equal(false);
    done();
  }); 
 
  it('Test if the right table exist.', function (done) {
    r.connect( {host: 'localhost', port: 28015}, function(err, conn) {
      if (err) throw err;
      r.db(config.database.name).tableList().run(conne, function(err, result) {
        if (err) throw err;
        tables = result;
      });
    })

    done();
  });

});
