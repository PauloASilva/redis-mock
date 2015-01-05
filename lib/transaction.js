'use strict';
/*!
 * redis-mock - transaction.js
 * (c) 2014 Paulo A. Silva <pauloasilva@gmail.com>
 */
var commands = require('./commands')
  , async = require('async');

/**
 * Original implementation from node_redis
 * @see https://github.com/mranney/node_redis/blob/master/index.js#L949
 */
function Multi(client, args) {
  this._client = client;
  this.queue = [];
  this._replies = [];
  this._queuedCommands = [];
  if (Array.isArray(args)) {
    this.queue = this.queue.concat(args);
  }
}
exports.Multi = Multi;

// fullfill Multi prototype
commands.forEach(function (command) {
  Multi.prototype[command] = function () {
    this.queue.push([command].concat(Array.prototype.slice.call(arguments)));
    return this;
  };

  Multi.prototype[command.toUpperCase()] = Multi.prototype[command];
});

/**
 * Slightly modified version of node_redis original implementation
 * @see https://github.com/mranney/node_redis/blob/master/index.js#L1105
 */
Multi.prototype.exec = function (callback) {
  var self = this
    , errors = [];

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

  this.send_command('exec', [], function (err, replies) {
    callback(err, replies);
  });
};

/**
 * Manages \c Multi._queuedCommands prepared redis commands queue.
 * When given the \c command 'exec', prepared commands are executed asynchronously
 */
Multi.prototype.send_command = function (command, args, callback) {
  var self = this;
  if (command.toLowerCase() === 'exec') {
    // run prepared redis commands synchronously
    async.series(this._queuedCommands, callback);
  } else {
    this._queuedCommands.push(function (callback) {
      args.push(callback);
      self._client[command].apply(this, args);
    });
  }
};

exports.multi = function (mockInstance, args) {
  return new Multi(this, args);
};
