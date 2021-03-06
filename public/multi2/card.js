// 在el的父元素上面增加触摸事件
var MultiImagesCard = function(el, config) {
  //
  this.config = config;

  // 目标元素改动
  this.$el = $(el);
  this.$el.addClass("card");
  this.$el.css({width: config.width, height: config.height});

  // 生成html
  this.buildHtml(config.images);
  // this.$image = this.$el.find('.image-container > .image');

  this.attrs = [];
  for (var i = 0; i < config.images.length; i++) {
    this.attrs.push({
      posX: 0, posY: 0, lastPosX: 0, lastPosY: 0,
      scale: 1, last_scale: 1, initScale: 1,
      rotation: 0, last_rotation: 0
    });
  };

  // 做图片自适应
  this.fitAll();
  
  this.addTouchEventAll();
};

MultiImagesCard.prototype.toObject = function() {
  var bounds = getBounds(this.$image);
  return {x: bounds[0], y: bounds[1], scale: this.attrs.scale, rotation: this.attrs.rotation}
}

MultiImagesCard.prototype.buildHtml = function(images) {
  for (var i = 0; i < images.length; i++) {
    var image = images[i];
    var htmlText = 
      '<div id="imgc_'+i+'" class="image-container">'+
        '<img class="image" crossorigin="anonymous" src="'+image.imageUrl+'"/>'+
        '<div class="bbox"></div>'+
      '</div>';
    this.$el.append(htmlText);

    var imageContainer = this.$el.find("#imgc_"+i);
    imageContainer.css({
      left: image.imageContainerLeft,
      top: image.imageContainerTop,
      width: image.imageContainerWidth,
      height: image.imageContainerHeight
    });
  };

  //
  this.$el.append('<div class="frame"></div>');

  //
  for (var i = 0; i < images.length; i++) {
    var image = images[i];
    this.$el.append('<div id="imgh_'+i+'" class="image-handler"></div>');
    var imageHandler = this.$el.find("#imgh_"+i);
    imageHandler.css({
      left: image.imageContainerLeft,
      top: image.imageContainerTop,
      width: image.imageContainerWidth,
      height: image.imageContainerHeight
    });
  }

  //
  // this.$el.append('<div class="movebox"></div>');
};

MultiImagesCard.prototype.addTouchEvent = function(i) {
  var _this = this;

  var imageHandler = this.$el.find('#imgh_'+i);

  var hammer = Hammer(imageHandler.get(0), {
    transform_always_block: true,
    transform_min_scale: 1,
    drag_block_horizontal: true,
    drag_block_vertical: true,
    drag_min_distance: 0
  });

  var touch = function(ev) {
    //log('touch');
    _this.attrs[i].lastPosX = _this.attrs[i].posX;
    _this.attrs[i].lastPosY = _this.attrs[i].posY;
    _this.attrs[i].last_scale = _this.attrs[i].scale;
    _this.attrs[i].last_rotation = _this.attrs[i].rotation;
  };

  var drag = function(ev) {
    //log('drag');
    _this.attrs[i].posX = ev.gesture.deltaX + _this.attrs[i].lastPosX;
    _this.attrs[i].posY = ev.gesture.deltaY + _this.attrs[i].lastPosY;
    _this.applyTransform(i);
    // _this.showBounds(i);
  };

  var dragend = function(ev) {
    //log('dragend');
    _this.attrs[i].lastPosX = _this.attrs[i].posX;
    _this.attrs[i].lastPosY = _this.attrs[i].posY;
    //
    _this.kickback(i);
    // _this.showBounds(i);
  };

  var transform = function(ev) {
    //log('transform');
    _this.attrs[i].scale = Math.max(_this.attrs[i].initScale, Math.min(_this.attrs[i].last_scale * ev.gesture.scale, 10));
    _this.applyTransform(i);
    // _this.showBounds(i);
  };

  var transformend = function(ev) {
    //log('transformend');
    _this.kickback(i);
    // _this.showBounds(i);
  };

  hammer.on('touch', touch);
  hammer.on('drag', drag);
  hammer.on('dragend', dragend);
  hammer.on('transform', transform);
  hammer.on('transformend', transformend);
  
  hammer.on('hold', function(ev) {
    //_this.$el.find('.image-handler').css({outline: 'none'});
    imageHandler.css({
      "transition": "none",
      "-webkit-transition": "none",
      "outline": '2px solid orange'
    });

    //
    hammer.off("touch", touch);
    hammer.off("drag", drag);
    hammer.off("dragend", dragend);
    hammer.off("transform", transform);
    hammer.off("transformend", transformend);

    //
    var lastX = imageHandler.position().left;
    var lastY = imageHandler.position().top;

    var dragImageHandler = function(ev) {
      
      var posX = ev.gesture.deltaX + lastX;
      var posY = ev.gesture.deltaY + lastY;

      imageHandler.css({
        left: posX,
        top: posY
      });

      var pointerX = ev.gesture.center.pageX - _this.$el.offset().left;
      var pointerY = ev.gesture.center.pageY - _this.$el.offset().top;

      _this.catched = _this.onWhichOne(i, pointerX, pointerY);
      if(_this.catched!=-1) {
        _this.catch(i, _this.catched);
        _this.catchedLast = _this.catched;
      } else {
        // 被吸引到其他的框上后，可能大小变了，要还原
        if(_this.catchedLast!=undefined) {
          imageHandler.css({
            width: _this.config.images[i].imageContainerWidth,
            height: _this.config.images[i].imageContainerHeight
          });
        }
        
      }
      
    };
    var dragImageHandlerEnd = function(ev) {
      
      hammer.off("drag", dragImageHandler);

      //
      hammer.on('touch', touch);
      hammer.on('drag', drag);
      hammer.on('dragend', dragend);
      hammer.on('transform', transform);
      hammer.on('transformend', transformend);

      // 根据捕获的，进行交换
      if(_this.catched!=-1 && _this.catched!=undefined) {
        _this.exchange(i, _this.catched, _this.config.images);

        imageHandler.css({
          "outline-color": "transparent"
        });
      } else { // 没有捕获到的话，退回原位
        imageHandler.css({
          "transition": "all 1s ease-in-out",
          "-webkit-transition": "all 1s ease-in-out",
          "left": lastX,
          "top": lastY,
          "outline-color": "transparent"
        });
      }
      
      //
      hammer.off("release", dragImageHandlerEnd);
    };

    hammer.on('drag', dragImageHandler);
    hammer.on('release', dragImageHandlerEnd);

  });
};

MultiImagesCard.prototype.onWhichOne = function(self_i, pointerX, pointerY) {
  for (var i = 0; i < this.config.images.length; i++) {
    if(self_i != i) {
      if(this.onIt(i, pointerX, pointerY)) {
        return i;
      }
    }
  };
  return -1;
};

MultiImagesCard.prototype.onIt = function(i, pointerX, pointerY) {
  var imageHandler = this.$el.find('#imgh_'+i);
  var position = imageHandler.position();
  var ihLeft = position.left;
  var ihTop = position.top;
  var ihWidth = imageHandler.width();
  var ihHeight = imageHandler.height();
  if(pointerX>ihLeft && pointerX<ihLeft+ihWidth && pointerY>ihTop && pointerY<ihTop+ihHeight) {
    return true;
  } else {
    return false;
  }
};


MultiImagesCard.prototype.catch = function(self_i, i) {
  var _this = this;
  var theImageHandler = this.$el.find('#imgh_'+self_i);

  var imageHandler = this.$el.find('#imgh_'+i);
  var position = imageHandler.position();
  var ihLeft = position.left;
  var ihTop = position.top;
  var ihWidth = imageHandler.width();
  var ihHeight = imageHandler.height();

  theImageHandler.css({
    left: ihLeft,
    top: ihTop,
    width: ihWidth,
    height: ihHeight
  });
};

MultiImagesCard.prototype.addTouchEventAll = function() {
  var _this = this;
  for (var i = 0; i < this.config.images.length; i++) {
    _this.addTouchEvent(i);
  };
};

MultiImagesCard.prototype.applyTransform = function(i) {
  var transform =
      "translate3d("+this.attrs[i].posX+"px,"+this.attrs[i].posY+"px, 0) " +
      "scale("+this.attrs[i].scale+","+this.attrs[i].scale+") ";

  var $image = this.$el.find('#imgc_'+i+' > .image');

  var el = $image.get(0);
  el.style.transform = transform;
  el.style.oTransform = transform;
  el.style.msTransform = transform;
  el.style.mozTransform = transform;
  el.style.webkitTransform = transform;
};

MultiImagesCard.prototype.kickback = function(i) {
  var $image = this.$el.find('#imgc_'+i+' > .image');

  var bounds = getBounds($image);

  var left = bounds[0];
  var top = bounds[1];
  var width = bounds[2];
  var height = bounds[3];

  var $imageContainer = $image.parent();
  var img_window_width = $imageContainer.width();
  var img_window_height = $imageContainer.height();

  //log(left+','+top+','+width+','+ height+','+img_window_width+','+img_window_height);
  var dx, dy;

  // 大的情况
  if (width >= img_window_width) {
    if (left > 0) {
      this.attrs[i].posX = this.attrs[i].lastPosX = this.attrs[i].posX-left;
    }
    dx = width - img_window_width;
    if (left < -dx) {
      this.attrs[i].posX = this.attrs[i].lastPosX = this.attrs[i].posX+((-left)-dx);
    }
  }
  if (height >= img_window_height) {
    if (top > 0) {
      this.attrs[i].posY = this.attrs[i].lastPosY = this.attrs[i].posY-top;
    }
    dy = height - img_window_height;
    if (top < -dy) {
      this.attrs[i].posY = this.attrs[i].lastPosY = this.attrs[i].posY+((-top)-dy);
    }
  }

  // 小的情况
  if (width < img_window_width) {
    if (left < 0) {
      this.attrs[i].posX = this.attrs[i].lastPosX = this.attrs[i].posX-left;
    }
    dx = img_window_width - width;
    if (left > dx) {
      this.attrs[i].posX = this.attrs[i].lastPosX = this.attrs[i].posX-(left-dx);
    }
  }
  if (height < img_window_height) {
    if (top < 0) {
      this.attrs[i].posY = this.attrs[i].lastPosY = this.attrs[i].posY-top;
    }
    dy = img_window_height - height;
    if (top > dy) {
      this.attrs[i].posY = this.attrs[i].lastPosY = this.attrs[i].posY-(top-dy);
    }
  }

  this.applyTransform(i);
};

// MultiImagesCard.prototype.fitFaceAll = function() {
//   var _this = this;
//   for (var i = 0; i < this.config.images.length; i++) {
//     var image = this.config.images[i];
//     if(image.imageUrl.indexOf("http") != -1){
//       _this.fitFace(i);
//     } else {
//       _this.fit(i);
//     }
//   };
// };

// MultiImagesCard.prototype.fitFace = function(i) {
//   var _this = this;
//   var image = this.config.images[i];
//   fitFace(image.imageUrl, image.imageContainerWidth, image.imageContainerHeight, function(err, scale, offsetX, offsetY) {
//     if(err){
//       _this.fit(i);
//     }else{
//       var attrs = _this.attrs[i];
//       attrs.scale = attrs.initScale = scale;
//       //
//       attrs.posX = -offsetX;
//       attrs.posY = -offsetY;
//       console.log("scale: "+scale);
//       _this.applyTransform(i);
//     }
//   });
// };

MultiImagesCard.prototype.fitFaceAll = function() {
  var _this = this;
  for (var i = 0; i < this.config.images.length; i++) {
    _this.fitFace(i);
  };
};

MultiImagesCard.prototype.fitFace = function(i) {
  var _this = this;
  var image = this.config.images[i];
  fitFace(image.imageUrl, image.imageContainerWidth, image.imageContainerHeight, function(err, scale, offsetX, offsetY) {
    if(err){
      // do nothing
    }else{
      var attrs = _this.attrs[i];
      attrs.scale = scale;
      //
      attrs.posX = -offsetX;
      attrs.posY = -offsetY;
      //console.log("scale: "+scale);
      _this.applyTransform(i);
    }
  });
};

MultiImagesCard.prototype.fitAll = function() {
  var _this = this;
  for (var i = 0; i < this.config.images.length; i++) {
    _this.fit(i);
  };
};

MultiImagesCard.prototype.fit = function(i) {
  var image = this.config.images[i];
  
  var _this = this;
  getImgSize(image.imageUrl, function(imageWidth, imageHeight){
    _this.oriImageSize = {width: imageWidth, height: imageHeight};

    var sv = getSuiteValues(
      {width: imageWidth, height: imageHeight}, 
      {width: image.imageContainerWidth, height: image.imageContainerHeight}
    );
    //
    var attrs = _this.attrs[i];
    attrs.scale = attrs.initScale = sv.scale;
    // 因为缩放是根据中心点进行的，所以要考虑挪回去点：(imageWidth-sv.width)/2
    attrs.posX = sv.left-(imageWidth-sv.width)/2;
    attrs.posY = sv.top-(imageHeight-sv.height)/2;

    _this.applyTransform(i);
    _this.fitFaceAll();
  });
};

MultiImagesCard.prototype.showBounds = function(i) {
  var $image = this.$el.find('#imgc_'+i+' > .image');

  var bounds = getBounds($image);
  this.$el.find('#imgc_'+i+' > .bbox').css({
    'left': bounds[0], 
    'top': bounds[1],
    'width': bounds[2],
    'height': bounds[3]
  });
};

MultiImagesCard.prototype.exchange = function(i, j, images) {
  var image_i = images[i];
  var imageHandler_i = this.$el.find('#imgh_'+i);
  var imageContainer_i = this.$el.find('#imgc_'+i);

  var image_j = images[j];
  var imageHandler_j = this.$el.find('#imgh_'+j);
  var imageContainer_j = this.$el.find('#imgc_'+j);

  // 首先，把配置改掉
  var iLeft = image_i.imageContainerLeft;
  var iTop = image_i.imageContainerTop;
  var iWidth = image_i.imageContainerWidth;
  var iHeight = image_i.imageContainerHeight;
  image_i.imageContainerLeft = image_j.imageContainerLeft;
  image_i.imageContainerTop = image_j.imageContainerTop;
  image_i.imageContainerWidth = image_j.imageContainerWidth;
  image_i.imageContainerHeight = image_j.imageContainerHeight;
  image_j.imageContainerLeft = iLeft;
  image_j.imageContainerTop = iTop;
  image_j.imageContainerWidth = iWidth;
  image_j.imageContainerHeight = iHeight;

  // 先把i移到j的地盘
  imageHandler_i.css({
    left: image_i.imageContainerLeft,
    top: image_i.imageContainerTop,
    width: image_i.imageContainerWidth,
    height: image_i.imageContainerHeight
  });
  imageContainer_i.css({
    left: image_i.imageContainerLeft,
    top: image_i.imageContainerTop,
    width: image_i.imageContainerWidth,
    height: image_i.imageContainerHeight
  });

  // 把j移动i的地盘
  imageHandler_j.css({
    left: image_j.imageContainerLeft,
    top: image_j.imageContainerTop,
    width: image_j.imageContainerWidth,
    height: image_j.imageContainerHeight
  });
  imageContainer_j.css({
    left: image_j.imageContainerLeft,
    top: image_j.imageContainerTop,
    width: image_j.imageContainerWidth,
    height: image_j.imageContainerHeight
  });

  this.fit(i);
  this.fit(j);
};

function log(content) {
  console.log(content);
}

function clip(src, /* */cx, cy, cw, ch, /* */width, height, /* */cb) {
  var img = new Image();
  img.onload = function() {
    //
    var canvas = fabric.util.createCanvasElement();
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(this, cx, cy, cw, ch, 0, 0, width, height);
    cb(canvas.toDataURL('image/png'));
  };
  img.src = src;
}



function snapToAngle(rotation, angle, distance_angle) {
  // 先将度数归于 0 ~ 360
  rotation = rotation%360;
  if(rotation<0) {
    rotation = 360 + rotation;
  }

  //
  var yu = rotation % angle;
  if( yu > 0 && yu < distance_angle ) {
    rotation = rotation - yu;
  }
  var tmp = angle-yu;
  if( tmp > 0 && tmp < distance_angle ) {
    rotation = rotation + tmp;
  }

  return rotation;
}

function getBounds($el) {
  var rect = $el.get(0).getBoundingClientRect();
  // 因为getBoundingClientRect方法获取的是相对于document左上角的坐标，所以要减去其父元素
  // 的位置
  var parentOffset = $el.parent().offset();
  // console.log(rect);
  // console.log(parentOffset);
  return [rect.left-parentOffset.left, rect.top-parentOffset.top, rect.width, rect.height];
}

//result
// left, top: 图片相对于imageContainer的位置
function getSuiteValues(imageSize, imageContainerSize) {
  var w1 = imageSize.width;
  var h1 = imageSize.height;
  var w0 = imageContainerSize.width;
  var h0 = imageContainerSize.height;

  // 0 是相框
  if( w1/h1 <= w0/h0 ) { // 图片的宽长比小于像框的，就是竖着的
    var scale = w0/w1;
    return { width: w0, height: scale*h1, scale: scale, orientation: 1, top: -(scale*h1-h0)/2, left: 0 };
  } else if( w1/h1 > w0/h0 ) { // 横着的
    var scale = h0/h1;
    return { width: scale*w1, height: h0, scale: scale, orientation: 0, left: -(w1*scale-w0)/2, top: 0 };
  }
}

function getImgSize(imgSrc, cb) {
  var newImg = new Image();
  newImg.onload = function() {
    var height = newImg.height;
    var width = newImg.width;
    cb(width, height);
  }
  newImg.src = imgSrc;
}


function fitFace(imageUrl, imageContainerWidth, imageContainerHeight, cb) {
  if(imageUrl.indexOf("http") != -1){
    var api = new FacePP('0ef14fa726ce34d820c5a44e57fef470', '4Y9YXOMSDvqu1Ompn9NSpNwWQFHs1hYD');
    api.request('detection/detect', {
      url: imageUrl
    }, function(err, result) {
      if (err) {
        cb(err);
      } else {
        if(result.face && result.face.length==1) {
          // percent %
          var center = result.face[0].position.center;
          var x = center.x/100;
          var y = center.y/100;
          var width = result.face[0].position.width/100;
          var height = result.face[0].position.height/100;

          // real
          var centerLeft = x*result.img_width;
          var centerTop = y*result.img_height
          var imgWidth = result.img_width;
          var imgHeight = result.img_height;
          // face real position and size in origin image
          var w = width*imgWidth*1.6;
          var h = height*imgHeight*1.6;
          var left = x*imgWidth - w/2;
          var top = y*imgHeight - h/2;

          var scale = imageContainerWidth / w; // 以宽度为准

          // 缩放会影响图片的位移，所以要考虑缩放所产生的位移
          cb(null, scale, left*scale-(imgWidth*scale-imgWidth)/2, top*scale-(imgHeight*scale-imgHeight)/2-(imageContainerHeight - h*scale)/2);
        } else {
          cb('fail');
        }
      }
    });
  }
}