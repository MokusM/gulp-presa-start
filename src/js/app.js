'use strict';
$(window).on('load', function () {
	setTimeout(function () {
		$('body').addClass('loaded');
	}, 400);
});
$(document).ready(function () {
	function goToSlide(slide) {
		com.veeva.clm.gotoSlide(slide);
	}

	// main menu
	$('#menu1').click(function () {
		goToSlide('S2_UA_CERAVE_Senile_Xerosis.zip');
	});

	// slide2
	$('#sl2-btn-plus').click(function () {
		goToSlide('S3_UA_CERAVE_Senile_Xerosis.zip');
	});

	// if ($('#xeroz-count').length) {
	// 	var options = {
	// 		useEasing: false,
	// 		useGrouping: true,
	// 		separator: '',
	// 		decimal: '.',
	// 		prefix: '',
	// 		suffix: '',
	// 	};

	// 	let counter = new CountUp('xeroz-count', 0, 85, 0, 5, options);
	// 	if (!counter.error) {
	// 		setTimeout(() => {
	// 			counter.start();
	// 		}, 800);
	// 	} else {
	// 		console.error(counter.error);
	// 	}
	// }

	$('#sl3-btn-plus').click(function () {
		$(this).toggleClass('active');
		$('.barrier__note').fadeToggle(500);
	});

	// range
	// var ua = window.navigator.userAgent;
	// var isIE = /MSIE|Trident/.test(ua);
	// var eventType = isIE ? 'change' : 'input';
	// Array.prototype.slice.call(document.querySelectorAll('.slider__input')).forEach(function (element) {
	// 	element.addEventListener(
	// 		eventType,
	// 		function (e) {
	// 			element.style.setProperty('--val', element.value);
	// 		},
	// 		false
	// 	);
	// });
});
