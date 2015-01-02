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

  it('should return the array ["OK", "OK"]', function (done) {
    var r = redismock.createClient();

      r.multi()
        .set('foo', 'bar')
        .set('hello', 'world')
        .exec(function (replies) {
          replies.should.be.instanceOf(Array).and.have.lengthOf(2);
          replies.should.eql(['OK','OK']);
          done();
        })
      ;
  });
});
