!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?module.exports=e():"function"==typeof define&&define.amd?define(e):t.ES6Promise=e()}(this,function(){function a(t){return"function"==typeof t}function e(){var t=setTimeout;return function(){return t(r,1)}}function r(){for(var t=0;t<j;t+=2)(0,C[t])(C[t+1]),C[t]=void 0,C[t+1]=void 0;j=0}function i(t,e){var r=this,n=new this.constructor(u);void 0===n[F]&&y(n);var o,i=r._state;return i?(o=arguments[i-1],T(function(){return _(i,n,o,r._result)})):d(r,n,t,e),n}function s(t){if(t&&"object"==typeof t&&t.constructor===this)return t;var e=new this(u);return l(e,t),e}function u(){}function o(t){try{return t.then}catch(t){return D.error=t,D}}function c(t,n,o){T(function(e){var r=!1,t=function(t,e,r,n){try{t.call(e,r,n)}catch(t){return t}}(o,n,function(t){r||(r=!0,(n!==t?l:h)(e,t))},function(t){r||(r=!0,p(e,t))},e._label);!r&&t&&(r=!0,p(e,t))},t)}function f(t,e,r){var n,o;e.constructor===t.constructor&&r===i&&e.constructor.resolve===s?(n=t,(o=e)._state===k?h(n,o._result):o._state===q?p(n,o._result):d(o,void 0,function(t){return l(n,t)},function(t){return p(n,t)})):r===D?(p(t,D.error),D.error=null):void 0!==r&&a(r)?c(t,e,r):h(t,e)}function l(t,e){var r;t===e?p(t,new TypeError("You cannot resolve a promise with itself")):(r=typeof e,null===e||"object"!=r&&"function"!=r?h(t,e):f(t,e,o(e)))}function n(t){t._onerror&&t._onerror(t._result),v(t)}function h(t,e){t._state===Y&&(t._result=e,t._state=k,0!==t._subscribers.length&&T(v,t))}function p(t,e){t._state===Y&&(t._state=q,t._result=e,T(n,t))}function d(t,e,r,n){var o=t._subscribers,i=o.length;t._onerror=null,o[i]=e,o[i+k]=r,o[i+q]=n,0===i&&t._state&&T(v,t)}function v(t){var e=t._subscribers,r=t._state;if(0!==e.length){for(var n,o=void 0,i=t._result,s=0;s<e.length;s+=3)n=e[s],o=e[s+r],n?_(r,n,o,i):o(i);t._subscribers.length=0}}function _(t,e,r,n){var o=a(r),i=void 0,s=void 0,u=void 0,c=void 0;if(o){try{i=r(n)}catch(t){D.error=t,i=D}if(i===D?(c=!0,s=i.error,i.error=null):u=!0,e===i)return void p(e,new TypeError("A promises callback cannot return that same promise."))}else i=n,u=!0;e._state===Y&&(o&&u?l(e,i):c?p(e,s):t===k?h(e,i):t===q&&p(e,i))}function y(t){t[F]=K++,t._state=void 0,t._result=void 0,t._subscribers=[]}var t,m,b,g,w,A=Array.isArray||function(t){return"[object Array]"===Object.prototype.toString.call(t)},j=0,S=void 0,E=void 0,T=function(t,e){C[j]=t,C[j+1]=e,2===(j+=2)&&(E?E(r):O())},M=(P=(t="undefined"!=typeof window?window:void 0)||{}).MutationObserver||P.WebKitMutationObserver,P="undefined"==typeof self&&"undefined"!=typeof process&&"[object process]"==={}.toString.call(process),x="undefined"!=typeof Uint8ClampedArray&&"undefined"!=typeof importScripts&&"undefined"!=typeof MessageChannel,C=Array(1e3),O=void 0,O=P?function(){return process.nextTick(r)}:M?(b=0,g=new M(r),w=document.createTextNode(""),g.observe(w,{characterData:!0}),function(){w.data=b=++b%2}):x?((m=new MessageChannel).port1.onmessage=r,function(){return m.port2.postMessage(0)}):(void 0===t&&"function"==typeof require?function(){try{var t=Function("return this")().require("vertx");return void 0!==(S=t.runOnLoop||t.runOnContext)?function(){S(r)}:e()}catch(t){return e()}}:e)(),F=Math.random().toString(36).substring(2),Y=void 0,k=1,q=2,D={error:null},K=0,L=(W.prototype._enumerate=function(t){for(var e=0;this._state===Y&&e<t.length;e++)this._eachEntry(t[e],e)},W.prototype._eachEntry=function(e,t){var r=this._instanceConstructor,n=r.resolve;n===s?(n=o(e))===i&&e._state!==Y?this._settledAt(e._state,t,e._result):"function"!=typeof n?(this._remaining--,this._result[t]=e):r===N?(f(r=new r(u),e,n),this._willSettleAt(r,t)):this._willSettleAt(new r(function(t){return t(e)}),t):this._willSettleAt(n(e),t)},W.prototype._settledAt=function(t,e,r){var n=this.promise;n._state===Y&&(this._remaining--,t===q?p(n,r):this._result[e]=r),0===this._remaining&&h(n,this._result)},W.prototype._willSettleAt=function(t,e){var r=this;d(t,void 0,function(t){return r._settledAt(k,e,t)},function(t){return r._settledAt(q,e,t)})},W),N=(U.prototype.catch=function(t){return this.then(null,t)},U.prototype.finally=function(e){var r=this.constructor;return a(e)?this.then(function(t){return r.resolve(e()).then(function(){return t})},function(t){return r.resolve(e()).then(function(){throw t})}):this.then(e,e)},U);function U(t){if(this[F]=K++,this._result=this._state=void 0,this._subscribers=[],u!==t){if("function"!=typeof t)throw new TypeError("You must pass a resolver function as the first argument to the promise constructor");if(!(this instanceof U))throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");!function(e,t){try{t(function(t){l(e,t)},function(t){p(e,t)})}catch(t){p(e,t)}}(this,t)}}function W(t,e){this._instanceConstructor=t,this.promise=new t(u),this.promise[F]||y(this.promise),A(e)?(this._remaining=this.length=e.length,this._result=Array(this.length),0===this.length?h(this.promise,this._result):(this.length=this.length||0,this._enumerate(e),0===this._remaining&&h(this.promise,this._result))):p(this.promise,Error("Array Methods must be provided an Array"))}return N.prototype.then=i,N.all=function(t){return new L(this,t).promise},N.race=function(o){var i=this;return A(o)?new i(function(t,e){for(var r=o.length,n=0;n<r;n++)i.resolve(o[n]).then(t,e)}):new i(function(t,e){return e(new TypeError("You must pass an array to race."))})},N.resolve=s,N.reject=function(t){var e=new this(u);return p(e,t),e},N._setScheduler=function(t){E=t},N._setAsap=function(t){T=t},N._asap=T,N.polyfill=function(){var t=void 0;if("undefined"!=typeof global)t=global;else if("undefined"!=typeof self)t=self;else try{t=Function("return this")()}catch(t){throw Error("polyfill failed because global object is unavailable in this environment")}var e=t.Promise;if(e){var r=null;try{r=Object.prototype.toString.call(e.resolve())}catch(t){}if("[object Promise]"===r&&!e.cast)return}t.Promise=N},N.Promise=N});