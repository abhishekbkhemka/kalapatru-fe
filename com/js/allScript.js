
/* Active Menu Js */
$(document).ready(function() {
$('.menuInner a').click(function(){
	 $('.activeM').removeClass('activeM')
	 $(this).addClass("activeM");
});
});