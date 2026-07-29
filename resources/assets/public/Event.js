export default (function($) {
	var events = {};

	return {
		on: function(eventName, handler) {
			$.event.add(events, eventName, handler);
		},
		off: function(eventName, handler) {
			$.event.remove(eventName, handler, events);
		},
		fire: function(eventName, data) {
			$.event.trigger(eventName, data, events);
		}
	};
})(jQuery);