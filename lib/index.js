'use strict'

var extend = require('js-extend').extend
var guardedConsole = require('pouchdb-utils').guardedConsole

/* global cordova, sqlitePlugin, openDatabase */
function createOpenDBFunction (opts) {
  return function (name, version, description, size) {
    if (typeof sqlitePlugin !== 'undefined') {
      // The SQLite Plugin started deviating pretty heavily from the
      // standard openDatabase() function, as they started adding more features.
      // It's better to just use their "new" format and pass in a big ol'
      // options object. Also there are many options here that may come from
      // the PouchDB constructor, so we have to grab those.
      var sqlitePluginOpts = extend({}, opts, {
        name: name,
        version: version,
        description: description,
        size: size
      })
      return sqlitePlugin.openDatabase(sqlitePluginOpts)
    }

    // Traditional WebSQL API
    return openDatabase(name, version, description, size)
  }
}

module.exports = function (PouchDB) {
  var WebSqlPouchCore = PouchDB.adapters['websql']

  function CordovaSQLitePouch (opts, callback) {
    var websql = createOpenDBFunction(opts)
    var _opts = extend({
      websql: websql
    }, opts)

    if (typeof cordova === 'undefined' || typeof sqlitePlugin === 'undefined' || typeof openDatabase === 'undefined') {
      guardedConsole('error',
        'PouchDB error: you must install a SQLite plugin ' +
        'in order for PouchDB to work on this platform. Options:' +
        '\n - https://github.com/nolanlawson/cordova-plugin-sqlite-2' +
        '\n - https://github.com/litehelpers/Cordova-sqlite-storage' +
        '\n - https://github.com/Microsoft/cordova-plugin-websql')
    }

    if(!WebSqlPouchCore) {
      guardedConsole('error',
        'PouchDB error: you must install the websql plugin')
      return
    }

    WebSqlPouchCore.call(this, _opts, callback)
  }

  CordovaSQLitePouch.valid = function () {
    // if you're using Cordova, we assume you know what you're doing because you control the environment
    return true
  }

  // no need for a prefix in cordova (i.e. no need for `_pouch_` prefix
  CordovaSQLitePouch.use_prefix = false

  PouchDB.adapter('cordova-sqlite', CordovaSQLitePouch, true)
}
