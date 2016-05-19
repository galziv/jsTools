
var CanvasX = (function () {

    'use strict';

    var strokeCircle = function (x, y, radius) {
        context.beginPath();
        context.arc(x, y, radius, 0, 2 * Math.PI);
        context.stroke();
        context.closePath();
    };

    var fillCircle = function (x, y, radius) {
        context.beginPath();
        context.arc(x, y, radius, 0, 2 * Math.PI);
        context.fill();
        context.closePath();
    }

    var applyXtension = function (target) {
        target.animate = animate;
        target.animateSeries = animateSeries;
        target.fillCircle = fillCircle;
        target.strokeCircle = strokeCircle;
        target.animateAsymmetricSeries = animateAsymmetricSeries;
    }

    var xpand = function () {
        applyXtension(CanvasRenderingContext2D.prototype);
    };

    var xtend = function (context) {
        applyXtension(context);
    };

    var CanvasX = function (context) {
        CanvasX.xtend(context);
    };

    /**
     * internal function to get max duration for given functions array and main duration
     * @param {array} funcArray 
     * @param {number} duration 
     * @returns {} 
     */
    var getMaxDuration = function (funcArray, duration) {

        var max = duration || 0;

        funcArray.forEach(function (d) {
            if (d.endsAt && d.endsAt > max) {
                max = d.endsAt;
            }
        })

        return max;
    };

    /**
     * Internal function to animate functions object dictionary
     * @param {object} _this 
     * @param {obejct} functions 
     * @param {number} durationMs 
     * @returns {} 
     */
    var animateObjArray = function (_this, functions, durationMs) {

        return new Promise(function (resolve, reject) {

            var start = Date.now();
            var before = start;
            var segments = {};
            var originalStyle = { fill: _this.fillStyle, stroke: _this.strokeStyle };
            var totalDuration = durationMs || getMaxDuration(functions);
            var completedSegments = 0;

            functions.forEach(function (func, i) {

                var objName = func.functionName + i; // in case several segments for the same function are sent, this prevents overwriting.
                var segment;

                segments[objName] = segments[objName] || { functionName: func.functionName, diffs: [], valPerMs: [], currentValues: func.data.startValues, data: func.data };
                segment = segments[objName];

                // get total value to animate
                segment.diffs = func.data.startValues.map(function (d, i) {
                    return func.data.endValues[i] - func.data.startValues[i];
                })

                // calc delta per ms
                segment.valPerMs = segment.diffs.map(function (d) {
                    return d / (func.data.endsAt - func.data.startsAt);
                });
            });

            var execute = function () {

                var now = Date.now();
                var startDiff = now - start;
                var msDiff = now - before;
                var segment;
                var style;

                this.clearRect(0, 0, this.canvas.width, this.canvas.height);

                for (var name in segments) {

                    segment = segments[name];
                    style = segment.data.style;

                    if (segment.data.startsAt <= startDiff && segment.data.endsAt >= startDiff) {

                        segment.diffs.forEach(function (d, i) {


                            var delta = msDiff * segment.valPerMs[i];
                            var newValue = segment.currentValues[i] + delta;
                            segment.data.parametersArray[segment.data.valuesIndex[i]] = newValue;
                            segment.currentValues[i] = newValue;

                            console.log(segment.currentValues);

                        }.bind(this));
                    }

                    if (style) {
                        if (style.fill) {
                            this.fillStyle = style.fill;
                        }

                        if (style.stroke) {
                            this.strokeStyle = style.stroke;
                        }
                    }

                    this.beginPath();
                    this[segment.functionName].apply(this, segment.data.parametersArray);
                    this.stroke();

                    if (style) {
                        this.fillStyle = originalStyle.fill;
                        this.strokeStyle = originalStyle.stroke
                    }
                }

                before = now;

                if (totalDuration >= startDiff) {
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
     * Internal function to animate single function with parameters as an array
     * @param {object} _this 
     * @param {object} func 
     * @param {array} parametersArray 
     * @param {array} array with the index of the values which are to be animated. 
     * @param {array} startValues 
     * @param {array} endValues 
     * @param {number} durationMs 
     * @returns {} 
     */
    var animateArray = function (_this, func, parametersArray, valuesIndex, startValues, endValues, durationMs) {

        return new Promise(function (resolve, reject) {
            var start = Date.now();
            var before = start;
            var diffs = startValues.map(function (d, i) {
                return endValues[i] - startValues[i];
            })

            var valPerMs = diffs.map(function (d) {
                return d / durationMs;
            })

            var currentValues = startValues;
            var execute = function () {

                var now = Date.now();
                var startDiff = now - start;
                var msDiff = now - before;

                diffs.forEach(function (d, i) {
                    var delta = msDiff * valPerMs[i];
                    var newValue = currentValues[i] + delta;
                    parametersArray[valuesIndex[i]] = newValue;
                    currentValues[i] = newValue;
                }.bind(this));

                this.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.beginPath();
                this[func].apply(this, parametersArray);
                this.stroke();

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
     * Internal function to generate animation segments
     * @param {array} startParameters 
     * @param {array} endParameters 
     * @param {object} style 
     * @param {number} startsAt 
     * @param {number} endsAt 
     * @returns {} 
     */
    var getSegmentData = function (startParameters, endParameters, style, startsAt, endsAt) {

        var result = {
            parametersArray: null,
            valuesIndex: [],
            startValues: [],
            endValues: [],
            style: style,
            startsAt: startsAt,
            endsAt: endsAt
        };

        if (!isNaN(Number(startParameters))) {
            startParameters = [startParameters];
            endParameters = [endParameters];
        }

        result.parametersArray = startParameters;

        startParameters.forEach(function (d, i) {
            if (d != endParameters[i]) {
                result.valuesIndex.push(i);
                result.startValues.push(d);
                result.endValues.push(endParameters[i]);
            }
        });

        return result;
    };

    /**
     * creates a animated transition between start and end values in the specifiec duration
     * @param {string} func - function name to execute
     * @param {(number|Array)} startParameters - start value. specify a number if only on parameter should be changed. specify an array if several parameters should be changed. type of valueIndex, startValue and endValue and  must match.
     * @param {(number|Array)} endParameters - end value. specify a number if only on parameter should be changed. specify an array if several parameters should be changed. type of valueIndex, startValue and endValue and  must match.
     * @param {number} durationMs - the duration for the animation to last
     * @returns {} 
     */
    var animate = function (func, startParameters, endParameters, style, durationMs) {

        var data;

        if (Array.isArray(startParameters) || Array.isArray(endParameters)) {

            if (!Array.isArray(startParameters) || !Array.isArray(endParameters)) {
                console.error('if any of startParameters or endParameters specified as array then both parameters have to be an Array');
                return;
            }
        }

        data = getSegmentData(startParameters, endParameters)

        animateArray(this, func, data.parametersArray, data.valuesIndex, data.startValues, data.endValues, durationMs);
    };

    /**
     * Public API - animate a synchronized series
     * @param {array} funcArray 
     * @param {number} durationMs 
     * @returns {} 
     */
    var animateSeries = function (funcArray, durationMs) {

        funcArray.forEach(function (d) {
            d.data = getSegmentData(d.startParameters, d.endParameters, d.style, durationMs);
        })

        animateObjArray(this, funcArray, durationMs);
    };

    /**
     * Public API - animate a asynchronized series
     * @param {array} segmentsArray 
     * @param {number} [durationMs] - total duration for the series. if a function has an endsAt which is greater than this value will override duraionMs 
     * @returns {} 
     */
    var animateAsymmetricSeries = function (segmentsArray, duration) {

        duration = getMaxDuration(segmentsArray, duration);

        if (duration == 0) {
            console.warn('animation duration was 0. verify duration was specified or endsAt on segmentObject');
        }

        segmentsArray.forEach(function (d) {

            if (!d.endsAt) {
                d.endsAt = duration; // if not specified animate till total animation length
            }

            if (!d.startsAt) {
                d.startsAt = 0
            }

            d.data = getSegmentData(d.startParameters, d.endParameters, d.style, d.startsAt, d.endsAt);
        })

        animateObjArray(this, segmentsArray, duration);
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

CanvasX.xpand();

//context.animate('arc', [250, 50, 50, 0, 2 * Math.PI], [50, 100, 50, 0, 2 * Math.PI], 1000, true);
//context.animate('fillRect', [0, 0, 1, 1], [0, 0, 100, 100], 1000);
//context.animateSeries([{ functionName: 'arc', startParameters: [200, 50, 50, 0, 0], endParameters: [400, 50, 50, 0, 2 * Math.PI] }, { functionName: 'fillRect', startParameters: [0, 0, 1, 1, ], endParameters: [0, 0, 100, 100] }], 1000);

//context.animateSeries([
//    { functionName: 'arc', startParameters: [250, 50, 50, 0, 2 * Math.PI], endParameters: [50, 100, 50, 0, 2 * Math.PI], style: { fill: 'red', stroke: 'gray' } },
//    { functionName: 'arc', startParameters: [50, 100, 50, 0, 2 * Math.PI], endParameters: [250, 50, 50, 0, 2 * Math.PI], style: { fill: 'red', stroke: 'blue' } },
//    { functionName: 'fillCircle', startParameters: [50, 100, 50], endParameters: [400, 150, 50], style: { fill: 'red', stroke: 'orange' } },
//    { functionName: 'strokeCircle', startParameters: [50, 100, 50], endParameters: [400, 150, 50], style: { fill: 'red', stroke: 'orange' } },
//    { functionName: 'fillRect', startParameters: [0, 0, 1, 1, ], endParameters: [0, 0, 100, 100] },
//    { functionName: 'fillCircle', startParameters: [50, 100, 50], endParameters: [1000, 100, 50], style: { fill: 'red', stroke: 'orange' } },
//], 1000);


//context.animateSeries([
//    { functionName: 'fillCircle', startParameters: [50, 100, 50], endParameters: [1000 - 50, 100, 50], style: { fill: 'red', stroke: 'orange' } },
//    { functionName: 'fillCircle', startParameters: [50, 200, 50], endParameters: [1000 - 50, 200, 50], style: { fill: 'purple', stroke: 'orange' } },
//], 2000);


context.animateAsymmetricSeries([
    { functionName: 'fillCircle', startParameters: [50, 100, 50], endParameters: [1000 - 50, 100, 50], style: { fill: 'red', stroke: 'orange' } },
    { functionName: 'fillCircle', startParameters: [50, 200, 50], endParameters: [700, 200, 50], style: { fill: 'purple', stroke: 'orange' }, startsAt: 0, endsAt: 1000 },
    { functionName: 'fillCircle', startParameters: [50, 0, 50], endParameters: [450, 200, 50], style: { fill: 'cyan', stroke: 'pink' }, startsAt: 1000, endsAt: 2000 },
    { functionName: 'fillRect', startParameters: [0, 0, 1, 1, ], endParameters: [0, 0, 100, 100], style: { fill: 'cyan', stroke: 'pink' }, startsAt: 1000, endsAt: 2000 }
], 2000);

//context.animateAsymmetricSeries([
//    {
//        functionName: 'fillCircle',
//        startParameters: [50, 100, 50],
//        endParameters: [1000 - 50, 100, 50],
//        style: { fill: 'red', stroke: 'orange' },
//        startsAt: 0,
//        endsAt: 1000
//    },
//    { functionName: 'fillCircle', startParameters: [1000 - 50, 100, 50], endParameters: [50, 100, 50], style: { fill: 'red', stroke: 'orange' }, startsAt: 1000, endsAt: 2000 },

//]);









