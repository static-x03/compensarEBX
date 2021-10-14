var ebx_DynamicDisplay = (function() {
	
	var hiddenCssClass = "ebx_dynamicHidden";
	
	function ebx_DynamicDisplay() {
		var self = this;
		this.properties = {};
		this.listeners = {};
		
		this.registerProperty = function(name, path) {
			this.properties[name] = path;
		};
		
		this.registerListener = function(elementId, predicate) {
			this.listeners[elementId] = predicate;
		};
		
		this.refresh = function() {
			var props = {};
			
			// gather props values
			for (var name in self.properties) {
				if (!self.properties.hasOwnProperty(name)) continue;
				
				var path = self.properties[name];
				props[name] = ebx_form_getValue(path);
			}
			
			// apply predicates
			for (var id in self.listeners) {
				if (!self.listeners.hasOwnProperty(id)) continue;
				
				var element = document.getElementById(id);
				if (!element) continue;
				
				var predicate = self.listeners[id];
				var result = predicate(props);
				
				if (result) {
					EBX_Utils.removeCSSClass(element, hiddenCssClass);
				} else {
					EBX_Utils.addCSSClass(element, hiddenCssClass);
				}
			}
		};
	}
	
	return ebx_DynamicDisplay;
})();