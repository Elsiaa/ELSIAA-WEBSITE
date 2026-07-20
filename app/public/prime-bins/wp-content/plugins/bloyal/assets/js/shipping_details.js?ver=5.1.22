jQuery.noConflict();

jQuery( document ).ready(
	function ($) {

		$( "#gift_message_box_area" ).hide();
		$( 'input#gift_order_id' ).change(
			function () {
				if (this.checked) {
					$( "#gift_message_box_area" ).show();
				} else {
					$( "#gift_message_box_area" ).hide();
					$( "#gift_message_box_area" ).val( "" );
				}
			}
		);

		var shipping_alt = $( "#shipping_alt" );
		shipping_alt.val( "0" );
		shipping_alt.on(
			"change",
			function () {
				$.post(
					WCMA_Ajax.ajaxurl,
					{
						action               : 'shipping_address_change',
						id                   : $( this ).val(),
						wc_multiple_addresses: WCMA_Ajax.wc_multiple_addresses
					},
					function (response) {
						$( '#shipping_address_1' ).val( response.shipping_address_1 );
						$( '#shipping_address_2' ).val( response.shipping_address_2 );
						$( '#shipping_city' ).val( response.shipping_city );
						$( '#shipping_company' ).val( response.shipping_company );
						$( '#shipping_first_name' ).val( response.shipping_first_name );
						$( '#shipping_last_name' ).val( response.shipping_last_name );
						$( '#shipping_postcode' ).val( response.shipping_postcode );
						$( '#shipping_phone' ).val( response.shipping_phone );
						$( '#shipping_email' ).val( response.shipping_email );
						var dob_ship = response.shipping_birth_date;

						if (dob_ship != null) {
							var shipp_dob_format = dob_ship.replace( /(\d\d)\/(\d\d)\/(\d{4})/, "$3-$1-$2" );
							$( '#shipping_birth_date' ).val( shipp_dob_format );
						}

						if (response.shipping_country_code != null && response.shipping_country != null) {
							$( "#shipping_country" ).find( "option[value=" + response.shipping_country_code + "]" ).prop( 'selected', true );
							$( "#select2-shipping_country-container" ).text( response.shipping_country );
						}
						if (response.shipping_state_code != null && response.shipping_state != null) {
							$( "#shipping_state" ).find( "option[value=" + response.shipping_state_code + "]" ).prop( 'selected', true );
							$( "#select2-shipping_state-container" ).text( response.shipping_state );
						}
						if (response.shipping_country_code == null && response.shipping_country == null) {
							$( "#shipping_country option[value='']" ).attr( 'selected', true )
							$( "#select2-shipping_country-container" ).text( "" );
						}
						if (response.shipping_state_code == null && response.shipping_state == null) {
							$( "#shipping_state option[value='']" ).attr( 'selected', true )
							$( "#select2-shipping_state-container" ).text( "" );
						}
						// code to update checkout page on shipping saved address selection
						if (response.uid) {
							$( "body" ).trigger( "update_checkout" );
						}
					}
				);
				return false;
			}
		);

		$( 'input#save_address_checkbox' ).change(
			function () {
				if (this.checked) {

					$.post(
						WCMA_Ajax.ajaxurl,
						{
							action               : 'save_shipping_address',
							save_shipping_addrs  : true,
							wc_multiple_addresses: WCMA_Ajax.wc_multiple_addresses
						},
						function (response) {
							console.log( response );
						}
					);
				} else {
					$.post(
						WCMA_Ajax.ajaxurl,
						{
							action               : 'save_shipping_address',
							save_shipping_addrs  : false,
							wc_multiple_addresses: WCMA_Ajax.wc_multiple_addresses
						},
						function (response) {
							console.log( response );
						}
					);
				}
			}
		);

		// code to update checkout page on store pickup location selection
		// $(document).on('change','#carrier_name',function () {
		// var selectedVal = $('#carrier_name').find(":selected").val();
		// console.log(selectedVal);
		// $("body").trigger("update_checkout");
		// return false;
		// });

		$( document ).on(
			'click',
			'.remove_coupons',
			function () {

				console.log( 'The function is hooked up' );
				jQuery.ajax(
					{
						type: "POST",
						url: "/wp-admin/admin-ajax.php",
						data: {
							action: 'bloyal_remove_custom_coupon'
							// add your parameters here

						},
						success: function (output) {
							location.reload();
						}
					}
				);

			}
		);

		// code to update cart on shipping method change
		// Listen for change in shipping method
		$( document ).on(
			'change',
			'input[name^="shipping_method"]',
			function () {
				// Get selected shipping method value
				var shippingMethod = $( 'input[name^="shipping_method"]:checked' ).val();

				// Prepare data to send in AJAX request
				var data = {
					action: 'update_shipping_method_cart',
					security: wc_cart_params.update_shipping_method_nonce,
					shipping_method: shippingMethod,
				};

				// Make AJAX request to update cart
				$.ajax(
					{
						type: 'POST',
						url: wc_cart_params.ajax_url,
						data: data,
						success: function (response) {

							if (response && response.fragments) {
								// Replace cart content with updated fragments
								$.each(
									response.fragments,
									function (key, value) {
										$( key ).replaceWith( value );
									}
								);

								// Trigger update cart event
								$( document.body ).trigger( 'wc_update_cart' );
							}
						},
						error: function (error) {
							console.log( error );
						}
					}
				);
			}
		);

		if ($('.woocommerce-thankyou-order-received').length > 0) {
	        // Your code here to handle the successful order placement
	        // console.log('Order successfully placed!');
	        sessionStorage.removeItem('bL_cartUid');
	    }

	    $(document).on('updated_wc_div', function() {
		  if ( $('div.woocommerce-cart-form').find('table.cart').find('tr.cart_item').length === 0 ) {
		    sessionStorage.removeItem('bL_cartUid');
		  }
		});

		if (getCookie('clear_session_storage_key')) {
			// Clear the specific sessionStorage key
			sessionStorage.removeItem('bL_sk');
			sessionStorage.removeItem('bL_cartUid');
			// Delete the cookie
			deleteCookie('clear_session_storage_key');
		}
	}
);

//set and remove bloyal session key for logout customers 
async function blPreProcess() {
    if(WCMA_Ajax.isLoggedIn == '1'){
		var bloyal_sk = sessionStorage.getItem('bL_sk');
		// if(!bloyal_sk) {
				console.log( 'set bL_sk in sessionStorage' );
				await jQuery.post(
					WCMA_Ajax.ajaxurl,
					{
						action               : 'generate_bloyal_session_key',
						is_logged_in         :  WCMA_Ajax.isLoggedIn,
					},
					function (response) {
						var bL_sk = response.bloyal_session_key;
						if (bL_sk != null) {
							sessionStorage.setItem('bL_sk', bL_sk);
						}else { 
							sessionStorage.removeItem('bL_sk'); 
						}
					}
				);
				return false;
		// }
	}else {
		console.log( 'remove bL_sk from sessionStorage' );
		sessionStorage.removeItem('bL_sk');
		//sessionStorage.removeItem('cartUid');
	}
}

function WebSnippetCompleteFn(cartData) {
	console.log('cartData WebSnippetCompleteCartUid', cartData);
	jQuery.ajax({ 
		type: 'POST', 
		dataType : 'JSON',
		url: WCMA_Ajax.ajaxurl, 
		data: { 
			action: 'bloyal_web_snippets_complete', 
			cart_uid: cartData.CartUid 
		}, beforeSend: function(){ 
			jQuery('#loading_resubmit').show(); 
		}, success:function(responseData){ 
			console.log('responseData', responseData);
			var redirectUrl = responseData.redirect;
			var bL_cartUid = responseData.bL_cartUid;
			if (redirectUrl && bL_cartUid) {
				sessionStorage.setItem('bL_cartUid', bL_cartUid);
				window.location.href = redirectUrl;
			} 
		}, complete:function(responseData){ 
			jQuery('#loading_resubmit').hide(); 
		} 
	});
}

// Helper function to get a cookie
function getCookie(name) {
    var value = "; " + document.cookie;
    var parts = value.split("; " + name + "=");
    if (parts.length == 2) return parts.pop().split(";").shift();
}

// Helper function to delete a cookie
function deleteCookie(name) {
    document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}