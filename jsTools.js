
var CanvasX = (function () {

    'use strict';

    var animateArray = function (_this, func, parametersArray, valueIndex, startValue, endValue, durationMs) {

        return new Promise(function (resolve, reject) {
            var start = Date.now();
            var before = start;
            var diffs = startValue.map(function (d, i) {
                return Math.abs(endValue[i] - startValue[i]);
            })

            var valPerMs = diffs.map(function (d) {
                return d / durationMs;
            })

            var currentValues = startValue;
            var execute = function () {

                var now = Date.now();
                var startDiff = now - start;
                var msDiff = now - before;

                diffs.forEach(function (d, i) {
                    var delta = msDiff * valPerMs[i];
                    var newValue = currentValues[i] + delta;
                    parametersArray[valueIndex[i]] = newValue;
                    currentValues[i] = newValue;
                    this[func].apply(this, parametersArray);
                }.bind(this));

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
        });
    };

    /**
     * creates a animated transition between start and end values in the specifiec duration
     * @param {string} func - function name to execute
     * @param {Array} parametersArray - function parameters as an array (perhaps not all values need to be incremented/decremented)
     * @param {(number|Array)} valueIndex - the index of the value needs to be changed in the parametersArray parameter. type of valueIndex, startValue and endValue and  must match.
     * @param {(number|Array)} startValue - start value. specify a number if only on parameter should be changed. specify an array if several parameters should be changed. type of valueIndex, startValue and endValue and  must match.
     * @param {(number|Array)} endValue - end value. specify a number if only on parameter should be changed. specify an array if several parameters should be changed. type of valueIndex, startValue and endValue and  must match.
     * @param {number} durationMs - the duration for the animation to last
     * @returns {} 
     */
    var animate = function (func, parametersArray, valueIndex, startValue, endValue, durationMs) {

        if (Array.isArray(startValue) || Array.isArray(endValue) || Array.isArray(valueIndex)) {

            if (!Array.isArray(startValue) || !Array.isArray(endValue) || !Array.isArray(valueIndex)) {
                console.error('if any of startValue or endValue specified as array then both parameters have to be an Array');
                return;
            }

            animateArray(this, func, parametersArray, valueIndex, startValue, endValue, durationMs);
        } else {
            animateArray(this, func, parametersArray, [valueIndex], [startValue], [endValue], durationMs);
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