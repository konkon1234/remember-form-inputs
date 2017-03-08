chrome.runtime.onMessage.addListener(function(request, sender, response) {

	// types for val set $("...").val();
	var input_store_types = [
		'text', 'search', 'tel', 'url', 'email', 'datetime',
		'date', 'month', 'week', 'time', 'datetime-local', 'number',
		'range', 'color'
	];

	if (request.action == 'getInputs') {
		var input_elements = {};

		$("input, textarea, select").each(function(index, elem) {
            var $elem = $(elem);

            if ($elem.attr('type') == 'radio') {
                if (!($elem.attr('name') in input_elements)) {
                    input_elements[$elem.attr('name')] = {
                        name: $elem.attr('name'),
                        value: $("input[name='" + $elem.attr('name') + "']:checked").val(),
                        tag: $elem.prop("tagName")
                    };
                }
            } else if ($elem.attr('type') == 'checkbox') {
                input_elements[$elem.attr('name')] = {
                    name: $elem.attr('name'),
                    value: $elem.prop('checked'),
                    tag: $elem.prop("tagName")
                };
        	} else if (input_store_types.indexOf($elem.attr('type')) >= 0 ||
					$elem.prop("tagName").toLowerCase() == 'select' ||
					$elem.prop("tagName").toLowerCase() == 'textarea') {
                input_elements[$elem.attr('name')] = {
                    name: $elem.attr('name'),
                    value: $elem.val(),
                    tag: $elem.prop("tagName")
                };
			}
		});

		response({
			inputs: input_elements
		});

	} else if (request.action == 'setInputs') {

		$.each(request.inputs, function(name, value) {
			var input_selectors = [];
			$.each(input_store_types, function(index, value) {
                input_selectors.push("input[type='" + value + "'][name='" + name + "']");
			});

			$("select[name='" + name + "'], textarea[name='" + name + "']," + input_selectors.join(",")).val(value);
			$("input[type='radio'][name='" + name + "'][value='" + value + "']").prop('checked', true);

			if (typeof value === "boolean" && value) {
                $("input[type='checkbox'][name='" + name + "']").prop('checked', true);
			}
		});

		response({
			message: 'restore complete'
		});

	} else {
		response({
			message: 'unknown action'
		});
	}
});
