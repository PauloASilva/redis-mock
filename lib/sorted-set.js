'use strict';

var Item = require('./item.js');

/**
 * Create a literal object from given \c score and \c member, ready to be stored
 * in a RedisSortedSet
 *
 * @param   {number}|{string} score
 * @param   mixed             the value to be stored
 * @return  {Object} Literal object {score, member}
 */
function createMember(score, member) {
  return {
    'score': parseRedisFloat(score),
    'member': typeof(member) === 'object' ? JSON.stringify(member) : member + ''
  };
}

/**
 * Checks whether given \c score is a valid string representation of a double
 * precision floating point number
 *
 * @param {string}|number score representation of a double precision floating
 *                              point number
 * @return  {boolean} Whether given \c score is valid or not
 */
function isRedisFloat(score) {

  if (score === null || score === undefined)
    return false;

  score = (''+score).toLowerCase();

  return score === '+inf' || score === '-inf' || isFinite(score);
}

/**
 * Parses given \c score, returning a Number
 *
 * @param {string}|number score representation of a double precision floating
 *                              point number
 * @return  number
 */
function parseRedisFloat(score) {
  var val = (''+score).toLowerCase();

  if (val === '+inf')
    return Number.MAX_VALUE;
  else if (val === '-inf')
    return Number.MIN_VALUE;

  return parseFloat(score);
}

exports.zcard = function (mockInstance, key, callback) {
  var count = 0;

  if (mockInstance.storage[key]) {
    if (mockInstance.storage[key].type !== 'zset') {
      var err = new Error('WRONGTYPE Operation against a key holding the wrong kind of value');
      return mockInstance._callCallback(callback, err);
    } else {
      var zset = mockInstance.storage[key].value;
      count = zset.length;
    }
  }

  mockInstance._callCallback(callback, null, count);
};

exports.zadd = function (mockInstance, args, callback) {
  var key     = args[0],
      pairs   = args.slice(1),
      idx     = 0,
      valid   = true,
      err     = null,
      tuples  = [],
      iniLen  = 0,
      zset    = null
  ;

  if (mockInstance.storage[key] && mockInstance.storage[key].type !== 'zset') {
    err = new Error('WRONGTYPE Operation against a key holding the wrong kind of value');

    return mockInstance._callCallback(callback, err);
  }

  // check args parity
  if (pairs.length % 2) {
    err = new Error('ERR syntax error');

    return mockInstance._callCallback(callback, err);
  }

  // check datatype
  for (idx = 0, valid = true; valid === true && idx < pairs.length; idx += 2) {
    valid = isRedisFloat(pairs[ idx ]);

    tuples.push(createMember(pairs[ idx ], pairs[ idx + 1 ]));
  }

  if ( ! valid) {
    err = new Error('ERR value is not a valid float');

    return mockInstance._callCallback(callback, err);
  }

  mockInstance.storage[key] = mockInstance.storage[key] || new Item.createSortedSet();
  zset = mockInstance.storage[key].value;

  iniLen = zset.length;
  zset.push.apply(zset, tuples);

  return mockInstance._callCallback(callback, null, zset.length - iniLen);
};

/**
 * @todo  >= 2.4: Accepts multiple elements. In Redis versions older than 2.4 it
 *        was possible to remove a single member per call.
 */
exports.zrem = function (mockInstance, key, member, callback) {
  var err   = null,
      zset  = null,
      iniLen = 0
  ;

  if (mockInstance.storage[key] && mockInstance.storage[key].type !== 'zset') {
    err = new Error('WRONGTYPE Operation against a key holding the wrong kind of value');

    return mockInstance._callCallback(callback, err);
  }

  if ( ! mockInstance.storage[key]) {
    return mockInstance._callCallback(callback, null, 0);
  }

  zset = mockInstance.storage[key].value;

  iniLen = zset.length;
  zset.delete(createMember(-0,member));

  return mockInstance._callCallback(callback, null, iniLen - zset.length);
};
