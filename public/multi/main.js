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
      url: 'http://mmbiz.qpic.cn/mmbiz/ClWynicKUaoJ4Vt3g3xQlquCKvenqG40l5icadoeyVKHXgP8WZgZnOdoljXLFXoQI3Wwy3z4tecjNWicxLfXyZvsA/0',
      left: 42,
      top: 140,
      width: 416,
      height: 422
    },
    {
      url: 'images/girl.jpg',
      left: 560,
      top: 82,
      width: 378,
      height: 570
    },
    {
      url: 'http://pic.52mxp.com/site/girl3.jpg',
      left: 4,
      top: 754,
      width: 496,
      height: 556
    },
    {
      url: 'http://pic.52mxp.com/site/1.jpg',
      left: 504,
      top: 754,
      width: 496,
      height: 602
    }
  ];

  var config = fitByWidth(width, images);

  window.card = new MultiImagesCard("#card", config);

  var left = ($('body').width() - width)/2;
  $('#card').css({left: left, top: 35});
});
