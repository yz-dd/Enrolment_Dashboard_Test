$(document).ready(function() {

  
  let jsTranslations = {};
  jsTranslations.open_trigger = 'Open';
  jsTranslations.close_trigger = 'Close';


  // Secondary nav on small screens
  $('.sub-menu-trigger').click(function(){
    if ($('#secondary-nav').hasClass('contracted')) {
      $('#secondary-nav').removeClass('contracted').addClass('expanded');
      $(this).html(jsTranslations.close_trigger + ' <i class="fas fa-caret-up" aria-hidden="true"></i>');
    } else if ($('#secondary-nav').hasClass('expanded')) {
      $('#secondary-nav').removeClass('expanded').addClass('contracted');
      $(this).html(jsTranslations.open_trigger + ' <i class="fas fa-caret-down" aria-hidden="true"></i>');
    }
  });



$('.icon').on('click', function() {
  $(this).toggleClass('open');
});

$(document).on('click', function(et) {
  //if you click on anything except the dropdown itself, close the dropdown
  if (!$(et.target).closest('.dropDown').length) {
    $('body').find('.dropDown').removeClass('active');
  }
});

$(document).on('click', function(et) {
  if (!$(et.target).closest('.icon').length) {
    $('body').find('.icon').removeClass('open');
    $('body').find('.navbar-collapse').removeClass('show');
  }
});

});
