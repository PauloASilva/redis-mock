'use strict';

var redismock = require('../')
  , should = require('should')
  , Multi = require('../lib/transaction.js').Multi;

if (process.env['VALID_TESTS']) {
  redismock = require('redis');
}

describe.only('multi', function () {
  it('should return an instance of Multi', function (done) {
    var r = redismock.createClient()
      , m = r.multi();

    m.should.be.instanceOf(Multi).and.have.property('queue');

    done();
  });
});
