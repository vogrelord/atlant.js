"use strict";

var Bacon = require('baconjs');

module.exports = function(Counter, whenCount)  {

    var Upstream = require('./upstream.js')
        ,s = require('./lib')

    var whenRenderedStream = new Bacon.Bus(); // Stream for finishing purposes
    var nullifyScan = new Bacon.Bus();

    /* Counting all renders of all whens. When zero => everything is rendered. */
    var ups = new Upstream();
    var ups2 = new Upstream();
    var renderEndStream = whenRenderedStream
        .map(s.logIt('are rendered', whenCount))
        .map( s.compose( ups.push, ups.clear ) )
        .scan([], function(oldVal, newVal) {  // Gathering the upstreams which come here.
            oldVal.push(newVal); 
            return oldVal;
        })
        .map( s.compose( ups2.push, ups2.clear ) )
        .map( ups.pop ) // Restoring stream which initially come
        .map(s.logIt('are counter before:'))
        .map( Counter.decrease )
        .map(s.logIt('are counter: after'))
        .filter( function(value) { return 0 === value; })
        .map( ups2.pop )  // Yes the counter now zero, so we can apply gathered streams together
        .changes()
        .merge(nullifyScan)
        .scan({}, function(oldVal, newVal) {  // creating hash of streams with viewName as key
            if (newVal == 'nullify') {
                oldVal = {};
                return oldVal
            }

            if ( !(newVal instanceof Array) ) 
                newVal = [newVal];
            
            newVal.map(function(val){
                oldVal[val.render.viewName] = val;
            })

            return oldVal;
        })
        .filter(s.notEmpty) // Still this hash can be nullified, so stay aware.
        .changes()
        .map( s.logIt('are checking for zero....:', whenCount))
        .filter( function(upstream) { return 0 === --whenCount.value; } ) // Here checking is there all whens are ended.
        .map( s.logIt('Yess! are finished all'))

    return { 
        renderEndStream: renderEndStream 
        ,whenRenderedStream: whenRenderedStream  
        ,nullifyScan: nullifyScan 
    }
}
