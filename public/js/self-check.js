$(document).ready(function () {
	/* CONSTANTS */
	var user;
	
	function checkInactivity() {
		var interval;
		$(document).on('mousemove keyup keypress click', function () {
			clearTimeout(interval);
			settimeout();
		});

		function settimeout() {
			// Logout and clear data after 60 seconds of inactivity
			interval = setTimeout(logout, 50000);
		}
	}

	function bindEnterKey() {
		$("#barcode").bind("keypress", function (e) {
			var code = e.keyCode || e.which;
			// Enter key activates lookup
			if (code === 13) {
				loan();
			} else if (code < 48 || code > 57) {  // only digits allowed
				e.preventDefault();
			}
		});

		$("#userid").bind("keypress", function (e) {
			var code = e.keyCode || e.which;
			// Enter key activates login
			if (code === 13) {
				login();
			} else if (code < 48 || code > 57) {  // only digits allowed
				e.preventDefault();
			}
		});
	}

	function login() {
		$("#bigload").show();
    $("#login").prop("disabled", true);		
		var loginid = $("#userid").val();
		if ((loginid != null) && (loginid != "")) {
      $("#loginform").submit();
		}
	}

	function prevloans() {
		$("#littleload").show();
		$.ajax({
			type: "GET",
			url:  "/loans"
		}).done(function (data) {
			$("#littleload").hide();
			console.log(data);
			if (data.error) {
				$("#dataerror .card-text").text(data.error);
				$("#dataerror").show();
				setTimeout(function () {
					$("#dataerror").fadeOut(1000);
				}, 3000);
			} else {
				$("#prevloanstable tbody").html(data);
			}
		});
	}

	function loan() {
		$("#bigload").show();
		$("#lookup").prop("disabled", true);
		var barcode = $("#barcode").val();
		if ((barcode != null) && (barcode != "")) {
      $.ajax({
        type: "POST",
        url:  "/item",
        data: {barcode: barcode}
      }).done(function(data) {
				$("#bigload").hide();
        console.log(data);
        if (data.error) {
          $("#dataerror .card-text").text(data.error);
          $("#dataerror").show();
          setTimeout(function () {
            $("#dataerror").fadeOut(1000);
          }, 3000);
        } else {
					$("#userloans").html(data.checkouts);
          $("#loanstable tbody").append(data.html);
        }
      });
    }
	}

	function logout() {
    $("#logoutform").submit();
  }
  
	bindEnterKey();
	checkInactivity();
	$("#userid").focus();
	$("#userid").on("blur", function() {
		if ($(this).val()) { login();	}
	});
	$("#barcode").on("blur", function() {
		if ($(this).val()) { loan();	}
	});
	$("#userid").on("keyup", function () {
		// triggers login when the length of the ID hits 8 characters
		if ($(this).val().length >= 8) { login();	}
	});
	$("#barcode").on("keyup", function () {
		// triggers item lookup when the length of the barcode hits 14 numbers
		if ($(this).val().length >= 14) {	loan();	}
	});
	$("#login").on("click", login);
	$("#logout").on("click", logout);
	$("#lookup").on("click", loan);
	$("#viewloans").on("click", prevloans);

	$("#details").on("click", function() {
		window.location.href = "/stats/" + $("#station").val() + "/" + $("#startdate").val() + "/" + $("#enddate").val();
	});

	$("#summary").on("click", function() {
		window.location.href = "/stats/summary/" + $("#station").val() + "/" + $("#startdate").val() + "/" + $("#enddate").val();
	});
});