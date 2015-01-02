'use strict';
/*!
 * redis-mock - transaction.js
 * (c) 2014 Paulo A. Silva <pauloasilva@gmail.com>
 */

function Multi(client, args) {
  this._client = client;
  this.queue = [["MULTI"]];
  if (Array.isArray(args)) {
    this.queue = this.queue.concat(args);
  }
}
exports.Multi = Multi;

Multi.prototype.set = Multi.prototype.SET = function() {
  this.queue.push(['set'].concat(Array.prototype.slice.call(arguments)));
  return this;
};

/**
 * Multi
 */
exports.multi = function (mockInstance, args) {
  return new Multi(this, args);
};
