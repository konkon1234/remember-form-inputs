
window.addEventListener('load', function() {

	function createDefaultKeyPrefix(str) {
		return md5(str);
	}

	function number_format(num) {
		return String(num).replace( /(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
	}

	function validateStoreKey(key) {
		if (key.length == 0) {
			return false;
		} else if (!key.match(/^[0-9a-zA-Z]+$/g)) {
			return false;
		}

		return true;
	}

    function updateByteInUse() {
        $("#max-bytes").text(number_format(chrome.storage.local.QUOTA_BYTES));
        chrome.storage.local.getBytesInUse(null, function(bytesInUse) {
            $("#bytes-in-use").text(number_format(bytesInUse));
        });
    }

    function updateStoreKeyMessage(key_prefix) {
        chrome.storage.local.get(key_prefix, function(inputs) {
            if (key_prefix in inputs) {
            	setMessage('this key is stored. you can restore.');
            } else {
                setMessage('this key is not stored.');
            }
        });
    }

    function setMessage(message) {
		$("#action-message").text(message);
	}

	function clearMessage() {
		setMessage(' ');
	}

    function updatePageByStoreKey(key_prefix, message) {
		if (key_prefix == '') {
            setPageForEmptyStoreKey(message);
			return;
		} else {
            $("#store").removeClass("hidden");
            $(".empty-only").addClass("hidden")
		}

        chrome.storage.local.get(key_prefix, function(inputs) {
            if (key_prefix in inputs) {
                $(".stored-only").removeClass("hidden");
            } else {
                $(".stored-only").addClass("hidden");
            }
        });

        if (typeof message === "undefined") {
            updateStoreKeyMessage(key_prefix);
		} else {
        	setMessage(message);
		}
    }

    function setPageForEmptyStoreKey(message) {
		$("#store").addClass("hidden");
        $(".stored-only").addClass("hidden");
        $(".empty-only").removeClass("hidden");

        if (typeof message === "undefined") {
            setMessage('Please input store key.');
        } else {
            setMessage(message);
        }
    }

	// event handler

    $("#store").click(function() {
    	var key_prefix = $("#store-name").val();

    	clearMessage();

    	if (!validateStoreKey(key_prefix)) {
    		setMessage('Please input valid store key. can use characters 0-9,a-z,A-Z ');
    		return;
		}

		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			var tab = tabs[0],
                store_values = {},
				element_count = 0;

			chrome.tabs.sendMessage(tab.id, {
				"action": "getInputs"
			}, onStoreInputs);

			function onStoreInputs(response) {
				$.each(response.inputs, function(index, input) {
					store_values[key_prefix + input.name] = input.value;
                    element_count ++;
				});

				// store flag
				store_values[key_prefix] = tab.url;

				chrome.storage.local.set(store_values, onStoreInputsComplete);
			}

			function onStoreInputsComplete() {
				updatePageByStoreKey(key_prefix, 'store complete. (' + element_count + ' elements.)');
			}
		});

		return false;
	});

	$("#restore").click(function() {
        var key_prefix = $("#store-name").val();

        clearMessage();

        if (!validateStoreKey(key_prefix)) {
            setMessage('Please input valid store key. can use characters 0-9,a-z,A-Z ');
            return;
        }

        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			var tab = tabs[0],
				restore_count = 0;

			chrome.tabs.sendMessage(tab.id, {
				"action": "getInputs"
			}, onRestoreInputs);

			function onRestoreInputs(response) {
				var store_keys = [];

				$.each(response.inputs, function(index, input) {
					store_keys.push(key_prefix + input.name);
				});

				chrome.storage.local.get(store_keys, function(inputs) {
					var read_inputs = {};

					$.each(inputs, function(key, value) {
						var name = key.replace(key_prefix, "");

						read_inputs[name] = value;
                        restore_count ++;
					});

					console.log(inputs);

					chrome.tabs.sendMessage(tab.id, {
						"action": "setInputs",
						"inputs": read_inputs
					}, onRestoreComplete);
				});
			}

			function onRestoreComplete(response) {
                setMessage('restore complete. (' + restore_count + ' elements.)');
            }

		});

		return false;
	});

    $("#delete").click(function() {
        var key_prefix = $("#store-name").val();

        clearMessage();

        if (!validateStoreKey(key_prefix)) {
            setMessage('Please input valid store key. can use characters 0-9,a-z,A-Z ');
            return;
        }

        chrome.storage.local.get(key_prefix, function(inputs) {

        	if (key_prefix in inputs) {
        		deleteStoreValues();
			}
        });

        function deleteStoreValues() {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                var tab = tabs[0];

                chrome.tabs.sendMessage(tab.id, {
                    "action": "getInputs"
                }, onDeleteStoreValues);
            });
		}

        function onDeleteStoreValues(response) {
        	var delete_keys = [];
            $.each(response.inputs, function(key, value) {
                delete_keys.push(key_prefix + key);
            });
            delete_keys.push(key_prefix);

            chrome.storage.local.remove(delete_keys, onDeleteStoreValuesComplete);
        }

        function onDeleteStoreValuesComplete() {
            updatePageByStoreKey(key_prefix, 'delete complete.');
            updateByteInUse();
		}

        return false;
	});

    $("#all-delete").on("click", function() {
    	chrome.storage.local.clear(function() {
            setMessage('all delete complete.');
		});
	});

    $("#store-name").on("input", function() {
        updatePageByStoreKey($(this).val());
	});

    // initialize page
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		var tab = tabs[0],
			key_prefix = createDefaultKeyPrefix(tab.url);

        $("#store-name").val(key_prefix);
        updatePageByStoreKey(key_prefix);
        updateByteInUse();
	});

});