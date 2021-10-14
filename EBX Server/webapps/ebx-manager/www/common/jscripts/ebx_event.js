var EBX_Events = (function() {
	"use strict";
	
	return {
		on: addEventListener,
		off: removeEventListener,
		trigger: dispatchEvent
	};
	
	function addEventListener(target, event, callback) {
		if (!target) {
			target = this;
		}
		
		var allListeners = target.EBX_Listeners;
		if (allListeners === undefined) {
			allListeners = {};
			target.EBX_Listeners = allListeners;
		}
		
		var eventListeners = allListeners[event];
		if (eventListeners === undefined) {
			eventListeners = [];
			allListeners[event] = eventListeners;
		}
		
		if (!EBX_Utils.arrayContains(eventListeners, callback)) {
			eventListeners.push(callback);
		}
	}
	
	function removeEventListener(target, event, callback) {
		if (!target) {
			target = this;
		}
		
		var allListeners = target.EBX_Listeners;
		if (allListeners === undefined) {
			return;
		}
		
		var eventListeners = allListeners[event];
		if (eventListeners === undefined) {
			return;
		}
		
		allListeners[event] = EBX_Utils.filter(eventListeners, function(element) {
			return element !== callback;
		});
	}
	
	function dispatchEvent(target, event, data) {
		dispatchEventOnTarget(target, target, event, data);
		dispatchEventOnTarget(this, target, event, data);
	}
	
	function dispatchEventOnTarget(listenerHolder, target, event, data) {
		if (!listenerHolder) {
			return;
		}
		
		var allListeners = listenerHolder.EBX_Listeners;
		if (allListeners === undefined) {
			return;
		}
		
		var eventListeners = allListeners[event];
		if (eventListeners === undefined) {
			return;
		}
		
		EBX_Utils.forEach(eventListeners, function(callback) {
			callback({
				target: target,
				event: event,
				data: data
			});
		});
	}
	
})();