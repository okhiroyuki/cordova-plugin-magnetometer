var argscheck = require('cordova/argscheck');
var utils = require('cordova/utils');
var exec = require('cordova/exec');
var MagneticField = require('./MagneticField');

var running = false;

var timers = {};

var listeners = [];

var magneticField = null;

var eventTimerId = null;

// Tells native to start.
function start() {
    exec(function (a) {
        var tempListeners = listeners.slice(0);
        magneticField = new MagneticField(a.distance, a.timestamp);
        for (var i = 0, l = tempListeners.length; i < l; i++) {
            tempListeners[i].win(magneticField);
        }
    }, function (e) {
        var tempListeners = listeners.slice(0);
        for (var i = 0, l = tempListeners.length; i < l; i++) {
            tempListeners[i].fail(e);
        }
    }, "Magnetometer", "start", []);
    running = true;
}

// Tells native to stop.
function stop() {
    exec(null, null, "Magnetometer", "stop", []);
    magneticField = null;
    running = false;
}

// Adds a callback pair to the listeners array
function createCallbackPair(win, fail) {
    return { win: win, fail: fail };
}

// Removes a win/fail listener pair from the listeners array
function removeListeners(l) {
    var idx = listeners.indexOf(l);
    if (idx > -1) {
        listeners.splice(idx, 1);
        if (listeners.length === 0) {
            stop();
        }
    }
}

var magnetometer = {
	/**
     * Asynchronously acquires the current magnetometer.
     *
     * @param {Function} successCallback    The function to call when the magnetometer data is available
     * @param {Function} errorCallback      The function to call when there is an error getting the magnetometer data. (OPTIONAL)
     * @param {Options} options The options for getting the accelerometer data such as timeout. (OPTIONAL)
     */
    getCurrentmagneticField: function (successCallback, errorCallback, options) {
        argscheck.checkArgs('fFO', 'magnetometer.getCurrentMagnetometor', arguments);

        if (cordova.platformId !== "android") {
            return;
        }

        var p;
        var win = function (a) {
            removeListeners(p);
            successCallback(a);
        };
        var fail = function (e) {
            removeListeners(p);
            if (errorCallback) {
                errorCallback(e);
            }
        };

        p = createCallbackPair(win, fail);
        listeners.push(p);

        if (!running) {
            start();
        }
    },

    /**
     * Asynchronously acquires the magneticField repeatedly at a given interval.
     *
     * @param {Function} successCallback    The function to call each time the magneticField data is available
     * @param {Function} errorCallback      The function to call when there is an error getting the magnetometer data. (OPTIONAL)
     * @param {Options} options The options for getting the magneticField data such as timeout. (OPTIONAL)
     * @return String                       The watch id that must be passed to #clearWatch to stop watching.
     */
    watchMagnetometer: function (successCallback, errorCallback, options) {
		argscheck.checkArgs('fFO', 'magnetometer.watchMagnetometer', arguments);
		
        // Default interval (10 sec)
        var frequency = (options && options.frequency && typeof options.frequency == 'number') ? options.frequency : 10000;

        // Keep reference to watch id, and report accel readings as often as defined in frequency
        var id = utils.createUUID();

        var p = createCallbackPair(function () { }, function (e) {
            removeListeners(p);
            if (errorCallback) {
                errorCallback(e);
            }
        });
        listeners.push(p);

        timers[id] = {
            timer: window.setInterval(function () {
                if (magneticField) {
                    successCallback(magneticField);
                }
            }, frequency),
            listeners: p
        };

        if (running) {
            // If we're already running then immediately invoke the success callback
            // but only if we have retrieved a value, sample code does not check for null ...
            if (magneticField) {
                successCallback(magneticField);
            }
        } else {
            start();
		}
		
        return id;
    },

    /**
     * Clears the specified magneticField watch.
     *
     * @param {String} id       The id of the watch returned from #watchMagneticField.
     */
    clearWatch: function (id) {
        // Stop javascript timer & remove from timer list
        if (id && timers[id]) {
            window.clearInterval(timers[id].timer);
            removeListeners(timers[id].listeners);
            delete timers[id];

            if (eventTimerId && Object.keys(timers).length === 0) {
                // No more watchers, so stop firing 'devicemotion' events
                window.clearInterval(eventTimerId);
                eventTimerId = null;
            }
        }
    }
};

module.exports  = magnetometer;
