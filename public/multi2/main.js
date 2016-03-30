$(document).ready(function(){
  var width = $('body').width()-70;


  function fitByWidth(width, images) {
    var s = width/1000;
    var height = 1500*s;

    var result = {width: width, height: height, images: []};

    for (var i = 0; i < images.length; i++) {
      var image = images[i];
      result.images.push({
        imageUrl: image.url,
        imageContainerLeft: image.left*s,
        imageContainerTop: image.top*s,
        imageContainerWidth: image.width*s,
        imageContainerHeight: image.height*s
      });
    };

    return result;
  }

  var images = [
    {
      url: 'images/teapot.jpg',
      left: 40,
      top: 40,
      width: 440,
      height: 440
    },
    {
      url: 'images/girl.jpg',
      left: 520,
      top: 40,
      width: 440,
      height: 440
    },
    {
      url: 'images/girl2.png',
      left: 40,
      top: 520,
      width: 440,
      height: 940
    },
    {
      url: 'images/girl3.jpg',
      left: 520,
      top: 520,
      width: 440,
      height: 940
    }
  ];

  var config = fitByWidth(width, images);

  window.card = new MultiImagesCard("#card", config);

  var left = ($('body').width() - width)/2;
  $('#card').css({left: left, top: 35});
});
