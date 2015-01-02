'use strict';

var redismock = require('../')
  , should = require('should');

if (process.env['VALID_TESTS']) {
  redismock = require('redis');
}

describe('zcard', function () {
  it('should give zero [zset does not exist]', function (done) {
    var r = redismock.createClient();

    r.zcard('myzset', function (err, result) {
      (err === null).should.be.true;
      result.should.be.eql(0);

      r.end();
      done();
    });
  });

  it('should give "WRONGTYPE" error', function (done) {
    var r = redismock.createClient();

    r.set('foo', 'bar', function (err, result) {
      if (err)
        return done(err);

      r.zcard('foo', function (err, result) {
        (err === null).should.be.false;
        err.should.be.instanceOf(Error).and.have.property('toString');
        err.toString().should.eql('Error: WRONGTYPE Operation against a key holding the wrong kind of value');

        r.end();
        done();
      });
    });
  });

  it('should give 5 as zset cardinality', function (done) {
    var r = redismock.createClient();

    r.zadd(['myzset', 0, 'a', 1, 'b', 2, 'c', 3, 'd', 4, 'e' ], function (err, result) {
      if (err)
        return done(err);

      r.zcard('myzset', function (err, result) {
        (err === null).should.be.true;
        result.should.be.eql(5);

        r.end();
        done();
      });
    });
  });
});

describe('zadd', function () {
  it('should give syntax error', function (done) {
    var r = redismock.createClient();

    r.zadd(['myzset', '0.0'], function (err, result) {
      (err === null).should.be.false;
      err.should.be.instanceOf(Error).and.have.property('toString');
      err.toString().should.eql('Error: ERR syntax error');

      r.end();
      done();
    });
  });

  it('should give invalid float', function (done) {
    var r = redismock.createClient();

    r.zadd(['myzset', 'a', 'bar'], function (err, result) {
      (err === null).should.be.false;
      err.should.be.instanceOf(Error).and.have.property('toString');
      err.toString().should.eql('Error: ERR value is not a valid float');

      r.end();
      done();
    });
  });

  it('should create zset with a single member with score "-Inf"', function (done) {
    var r = redismock.createClient();

    r.zadd(['myzset', '-Inf', 'a'], function (err, result) {
      (err === null).should.be.true;

      result.should.be.eql(1);

      r.end();
      done();
    });
  });

  it('should create a zset with a single member with score "+Inf"', function (done) {
    var r = redismock.createClient();

    r.zadd(['myzset', '+Inf', 'a'], function (err, result) {
      (err === null).should.be.true;

      result.should.be.eql(1);

      r.end();
      done();
    });
  });

  it('should create a zset with a single member with score 0', function (done) {
    var r = redismock.createClient();

    r.zadd(['myzset', 0, 'a'], function (err, result) {
      (err === null).should.be.true;

      result.should.be.eql(1);

      r.end();
      done();
    });
  });

  it('should create a zset with a single member with score 0', function (done) {
    var r = redismock.createClient();

    r.zadd(['myzset', '0', 'a'], function (err, result) {
      (err === null).should.be.true;

      result.should.be.eql(1);

      r.end();
      done();
    });
  });

  it('should create a zset like [a, b]', function (done) {
    var r = redismock.createClient();

    r.zadd(['myzset', '0', 'a', '1', 'b'], function (err, result) {
      (err === null).should.be.true;

      result.should.be.eql(2);

      r.end();
      done();
    });
  });
});

describe('zrem', function () {
  it('should fail with "WRONGTYPE" error', function (done) {
    var r = redismock.createClient();

    r.set('foo', 'bar', function (err, result) {
      if (err)
        return done(err);

      result.should.be.eql('OK');

      r.zrem('foo', 'bar', function (err, result) {
        (err === null).should.be.false;

        err.should.be.instanceOf(Error).and.have.property('toString');
        err.toString().should.eql('Error: WRONGTYPE Operation against a key holding the wrong kind of value');

        r.end();
        done();
      });
    });
  });

  it('should return 0 [sorted set does not exist]', function (done) {
    var r = redismock.createClient();

    r.zrem('myzet', 'foo', function (err, result) {
      (err === null).should.be.true;

      result.should.be.eql(0);

      r.end();
      done();
    });
  });

  it('should remove one element from the zset', function (done) {
    var r = redismock.createClient();

    r.zadd(['myzset', 0, 'p', 1, 'a', 2, 'u'], function (err, result) {
      if (err)
        return done(err);

      r.zrem('myzset', 'p', function (err, result) {
        (err === null).should.be.true;

        result.should.be.eql(1);

        r.end();
        done();
      });
    });
  });
});

/*
describe('zrange', function () {
});

describe('zremrangebyrank', function () {
});
*/
