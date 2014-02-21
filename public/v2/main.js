 if(!Hammer.HAS_TOUCHEVENTS && !Hammer.HAS_POINTEREVENTS) {
   Hammer.plugins.showTouches();
 }

 if(!Hammer.HAS_TOUCHEVENTS && !Hammer.HAS_POINTEREVENTS) {
   Hammer.plugins.fakeMultitouch();
 }

$(document).ready(function(){
  var width = $('body').width()-70;
  var s = width/1000;
  var height = 1500*s;
  var imageContainerLeft = 47*s;
  var imageContainerTop = 63*s;
  var imageContainerWidth = 910*s;
  var imageContainerHeight = 1012*s;
  console.log(imageContainerWidth+", "+imageContainerHeight);

  window.card = new Card("#card", {
    width: width, 
    height: height,
    // imageUrl: 'http://pic1.sc.chinaz.com/files/pic/pic9/201401/apic134.jpg',
    imageUrl: 'images/girl.jpg',
    imageContainerLeft: imageContainerLeft,
    imageContainerTop: imageContainerTop,
    imageContainerWidth: imageContainerWidth, 
    imageContainerHeight: imageContainerHeight
  });

  var left = ($('body').width() - width)/2;
  $('#card').css({left: left, top: 35});

  var height = 130;
  console.log(height);
  $("#template_select > #up").css({ left: ($('body').width()-$("#template_select > #up").width())/2 });
  $("#template_select > #up").click(function(){
    if( $("#template_select").height() == 0 ) {
      $("#template_select").height(height);
    } else {
      $("#template_select").height(0);
    }
    
  });
});
