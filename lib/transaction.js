'use strict';
/*!
 * redis-mock - transaction.js
 * (c) 2014 Paulo A. Silva <pauloasilva@gmail.com>
 */
var EventEmitter = require('events').EventEmitter
  , event = new EventEmitter();


/**
 * Original implementation from node_redis
 * @see https://github.com/mranney/node_redis/blob/master/index.js#L949
 */
function Multi(client, args) {
  this._client = client;
  this.queue = [];
  this._replies = [];
  if (Array.isArray(args)) {
    this.queue = this.queue.concat(args);
  }
}
exports.Multi = Multi;

Multi.prototype.set = Multi.prototype.SET = function () {
  this.queue.push(['set'].concat(Array.prototype.slice.call(arguments)));
  return this;
};

Multi.prototype.sadd = Multi.prototype.SADD = function () {
  this.queue.push(['sadd'].concat(Array.prototype.slice.call(arguments)));
  return this;
};

/**
 * Slightly modified version of node_redis original implementation
 * @see https://github.com/mranney/node_redis/blob/master/index.js#L1105
 */
Multi.prototype.exec = function (callback) {
  var self = this;
  var errors = [];
  var queueSize = this.queue.length;

  event.on('newReply', function () {
    if (self._replies.length === queueSize && callback) {
      callback(self._replies);
    }
  });

  this.queue.forEach(function (args, index) {
    var command = args[0], obj;
    if (typeof args[args.length - 1] === "function") {
      args = args.slice(1, -1);
    } else {
      args = args.slice(1);
    }
    if (args.length === 1 && Array.isArray(args[0])) {
      args = args[0];
    }
    if (command.toLowerCase() === 'hmset' && typeof args[1] === 'object') {
      obj = args.pop();
      Object.keys(obj).forEach(function (key) {
        args.push(key);
        args.push(obj[key]);
      });
    }

    this.send_command(command, args, function (err, reply) {
      if (err) {
        var cur = self.queue[index];
        if (typeof cur[cur.length - 1] === "function") {
          cur[cur.length - 1](err);
        } else {
          errors.push(new Error(err));
        }
      }
    });
  }, this);
};

/**
 * Executes the redis client function corresponding to the given \c command with
 * given \c args, enabling in memory storage manipulation.
 * The \c callback function is always called with reply "QUEUED".
 *
 * @param   {String}    command   the redis command to be executed
 * @param   {Array}     args      array of arguments to be passed to the redis
 *                                client function
 * @param   {Function}  callback
 * @return  void
 */
Multi.prototype.send_command = function (command, args, callback) {
  var self = this;

  args.push(function (err, result) {
    if (err) {
      self._replies.push(err);
    } else {
      self._replies.push(result);
    }

    event.emit('newReply');
  });

  this._client[command].apply(this, args);
  callback(null, "QUEUED");
};

exports.multi = function (mockInstance, args) {
  return new Multi(this, args);
};
