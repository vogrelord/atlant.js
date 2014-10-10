
/**
 * Create fake push state
 * Use like that:
 * require('fakePushState')(window);
 * It will patch window.history to rise "pushstate" event when pushstate is happend.
 **/
var wrapPushState = function(window){
    var pushState = window.history.pushState;

    var tryState = function(params) {
        try { 
           return pushState.apply(window.history, params); 
        } catch (e) {
           console.log('Can\'t push state:', e);
           return void 0;
        }
    };

    window.history.pushState = function(state, title, url) {
        var newState;
        var onpushstate = new CustomEvent('pushstate', { detail: { state: {referrer: window.location.pathname}, title: title, url: url } } );
        window.dispatchEvent(onpushstate);

        return tryState(arguments);
    };

};


module.exports = wrapPushState;
