var CanvasX = (function () {

    'use strict';

    var animateArray = function (_this, func, parametersArray, valueIndex, startValue, endValue, durationMs) {

    };

    var animateSingle = function (_this, func, parametersArray, valueIndex, startValue, endValue, durationMs) {

        return new Promise(function (resolve, reject) {
            var start = Date.now();
            var before = start;
            var diff = Math.abs(endValue - startValue);
            var valPerMs = diff / durationMs;
            var currentValue = startValue;
            var execute = function () {

                var now = Date.now();
                var startDiff = now - start;
                var msDiff = now - before;
                var delta = msDiff * valPerMs;
                var newValue = currentValue + delta;

                if (Array.isArray(startValue) || Array.isArray(endValue) || Array.isArray(valueIndex)) {

                    if (Array.isArray(startValue) && Array.isArray(endValue) && Array.isArray(valueIndex)) {
                        console.error('if any of startValue or endValue specified as array then both parameters have to be an Array');
                        return;
                    }

                    for (var i = 0; i < startValue.length; i++) {
                        parametersArray[valueIndex[i]] = newValue;
                    }


                } else {
                    newValue = currentValue + delta;
                    parametersArray[valueIndex] = newValue;
                    currentValue = newValue;
                }

                this[func].apply(this, parametersArray);

                before = now;

                if (startDiff < durationMs) {
                    window.requestAnimationFrame(execute);
                } else {
                    // if for example alert is used, then after closing the alert canvas does one more paint
                    setTimeout(resolve, 1);
                }

            }.bind(_this);

            execute();
        }.bind(_this));
    };

    /**
     * Create an array of all the right files in the source dir
     * @param      {String}   source path
     * @param      {Object}   options
     * @param      {Function} callback
     * @jsFiddle   A jsFiddle embed URL
     * @return     {Array} an array of string path
     */
    var animate = function (func, parametersArray, valueIndex, startValue, endValue, durationMs) {

        if (Array.isArray(startValue) || Array.isArray(endValue) || Array.isArray(valueIndex)) {

            if (Array.isArray(startValue) && Array.isArray(endValue) && Array.isArray(valueIndex)) {
                console.error('if any of startValue or endValue specified as array then both parameters have to be an Array');
                return;
            }

            animateArray(this, parametersArray, valueIndex, startValue, endValue, durationMs);
        } else {
            animateSingle(this, func, parametersArray, valueIndex, startValue, endValue, durationMs);
        }
    };

    var xpand = function () {

        CanvasRenderingContext2D.prototype.animate = animate;
    };

    var xtend = function (context) {
        context.animate = animate;
    };

    var CanvasX = function (context) {
        CanvasX.xtend(context);
    };

    CanvasX.xpand = xpand;
    CanvasX.xtend = xtend;

    return CanvasX;

}());

var LoadTest = (function () {

    var now = function () {
        return (performance && performance.now()) || Date.now();

    };

    var run = function (toExecute, count) {

        var start = now();
        for (var i = 0; i < count; i++) {
            toExecute();
        }

        return now() - start;
    };

    var runPromise = function (toExecute, count) {

        var start = now();
        var promises = [];
        var resolved = 0;

        for (var i = 0; i < count; i++) {
            var defer = toExecute();
            promises.push(defer);

            defer.then(function () {
                resolved++;

                if (resolved == count) {
                    console.log(now() - start);
                }
            });
        }
    };

    return {
        run: run,
        runPromise: runPromise
    };

}());


var canvas = document.querySelector('canvas');
var context = canvas.getContext('2d');

context.fillRect(0, 0, 1, 100);

//CanvasX.animate(context, 'fillRect', [0, 0, 1, 100], 2, 1, 1000, 1000);
CanvasX.xpand();