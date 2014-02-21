// 在el的父元素上面增加触摸事件
var Card = function(el, config) {
  if (/(iPhone|iPad|iPod|iOS)/i.test(navigator.userAgent)) {
    this.ios = true;
  } else {
    this.ios = false;
  }
  //
  this.config = config;

  // 目标元素改动
  this.$el = $(el);
  this.$el.addClass("card");
  this.$el.css({width: config.width, height: config.height});

  // 生成html
  this.buildHtml(config.imageUrl);
  this.$image = this.$el.find('.image-container > .image');

  // 做图片自适应
  this.fit();

  //
  this.attrs = {
    posX: 0, posY: 0, lastPosX: 0, lastPosY: 0,
    scale: 1, last_scale: 1, initScale: 1,
    rotation: 0, last_rotation: 0
  };
  this.addTouchEvent();

};

Card.prototype.toImage = function() {
  var _this = this;
  console.log((this.attrs.posX)+','+(this.attrs.posY)+','+this.attrs.scale+','+this.attrs.rotation);
  // 准备好canvas，往里头放图片，然后根据参数调整，最后输出图片
  var canvas = new fabric.StaticCanvas(fabric.util.createCanvasElement());
  canvas.setDimensions({width: this.config.imageContainerWidth, height: this.config.imageContainerHeight});
  
  // 以下是图片参数
  var scale = this.attrs.scale;
  var angle = this.attrs.rotation;
  var width = this.oriImageSize.width*scale;
  var height = this.oriImageSize.height*scale;
  var left = this.attrs.posX+(this.oriImageSize.width-width)/2;
  var top = this.attrs.posY+(this.oriImageSize.height-height)/2;
  
  // 因为csstransform是根据中心点旋转的，而fabricjs是左上角旋转，所以要fix一下
  var newPoint = fabric.util.rotatePoint(new fabric.Point(left, top), new fabric.Point(left+width/2, top+height/2), fabric.util.degreesToRadians(angle));
  
  fabric.Image.fromURL(this.config.imageUrl, function(fabricImg) {
    fabricImg.scale(scale).set({
      left: newPoint.x,
      top: newPoint.y,
      angle: angle
    });

    canvas.add(fabricImg);
    
    //console.log($(".frame").css('background'));
    var background = "http://192.168.0.123:3002/v2/images/frame.png";
    
    var canvas2 = new fabric.StaticCanvas(fabric.util.createCanvasElement());
    canvas2.setDimensions({width: _this.config.width, height: _this.config.height});
    fabric.Image.fromURL(canvas.toDataURL(), function(img1) {
      img1.set({
        left: _this.config.imageContainerLeft,
        top: _this.config.imageContainerTop,
      });
      canvas2.add(img1);
      
      fabric.Image.fromURL(background, function(img2) {
        img2.set({
          width: _this.config.width,
          height: _this.config.height
        });
        canvas2.add(img2);
        //console.log(canvas2.toDataURL());
        window.open(canvas2.toDataURL());
      });
      
    });
    
  });
};

Card.prototype.buildHtml = function(imageUrl) {
  var htmlText = 
  '<div class="image-container">'+
    '<img class="image" src="'+imageUrl+'"/>'+
    '<!-- <div class="bbox"></div> -->'+
  '</div>'+
  '<div class="frame"></div>';

  this.$el.html(htmlText);
  var imageContainer = this.$el.find(".image-container");
  imageContainer.css({
    left: this.config.imageContainerLeft,
    top: this.config.imageContainerTop,
    width: this.config.imageContainerWidth,
    height: this.config.imageContainerHeight
  });
};

Card.prototype.addTouchEvent = function() {
  var hammer = Hammer(this.$el.parent().get(0), {
    transform_always_block: true,
    transform_min_scale: 1,
    drag_block_horizontal: true,
    drag_block_vertical: true,
    drag_min_distance: 0
  });

  var _this = this;

  hammer.on('touch', function(ev) {
    //log('touch');
    _this.attrs.lastPosX = _this.attrs.posX;
    _this.attrs.lastPosY = _this.attrs.posY;
    _this.attrs.last_scale = _this.attrs.scale;
    _this.attrs.last_rotation = _this.attrs.rotation;
  });

  hammer.on('drag', function(ev) {
    //log('drag');
    _this.attrs.posX = ev.gesture.deltaX + _this.attrs.lastPosX;
    _this.attrs.posY = ev.gesture.deltaY + _this.attrs.lastPosY;
    _this.applyTransform();
    //showBounds($('#image'));
  });

  hammer.on('dragend', function(ev) {
    //log('dragend');
    _this.attrs.lastPosX = _this.attrs.posX;
    _this.attrs.lastPosY = _this.attrs.posY;
    //
    _this.kickback();
    //showBounds($('#image'));
  });

  hammer.on('transform', function(ev) {
    //log('transform');
    _this.attrs.rotation = _this.attrs.last_rotation + ev.gesture.rotation;
    _this.attrs.rotation = snapToAngle(_this.attrs.rotation, 90, 20);
    //
    _this.attrs.scale = Math.max(_this.attrs.initScale, Math.min(_this.attrs.last_scale * ev.gesture.scale, 10));
    //老的方式
    // _this.attrs.scale = Math.max(1, Math.min(_this.attrs.last_scale * ev.gesture.scale, 10));
    _this.applyTransform();
    //showBounds($('#image'));
  });

  hammer.on('transformend', function(ev) {
    //log('transformend');
    _this.kickback();
    //showBounds($('#image'));
  });
};

Card.prototype.applyTransform = function() {
  if (this.ios===true) {
    var transform =
      "translate("+this.attrs.posX+"px,"+this.attrs.posY+"px) " +
      "scale("+this.attrs.scale+","+this.attrs.scale+") " +
      "rotate("+this.attrs.rotation+"deg) ";
  } else {
    var transform =
      "translate3d("+this.attrs.posX+"px,"+this.attrs.posY+"px, 0) " +
      "scale3d("+this.attrs.scale+","+this.attrs.scale+", 0) " +
      "rotate("+this.attrs.rotation+"deg) ";
  };

  //log(transform);
  var el = this.$image.get(0);
  el.style.transform = transform;
  el.style.oTransform = transform;
  el.style.msTransform = transform;
  el.style.mozTransform = transform;
  el.style.webkitTransform = transform;
};

Card.prototype.kickback = function() {
  var bounds = getBounds(this.$image);

  var left = bounds[0];
  var top = bounds[1];
  var width = bounds[2];
  var height = bounds[3];

  var $imageContainer = this.$image.parent();
  var img_window_width = $imageContainer.width();
  var img_window_height = $imageContainer.height();

  //log(left+','+top+','+width+','+ height+','+img_window_width+','+img_window_height);
  var dx, dy;

  // 大的情况
  if (width >= img_window_width) {
    if (left > 0) {
      this.attrs.posX = this.attrs.lastPosX = this.attrs.posX-left;
    }
    dx = width - img_window_width;
    if (left < -dx) {
      this.attrs.posX = this.attrs.lastPosX = this.attrs.posX+((-left)-dx);
    }
  }
  if (height >= img_window_height) {
    if (top > 0) {
      this.attrs.posY = this.attrs.lastPosY = this.attrs.posY-top;
    }
    dy = height - img_window_height;
    if (top < -dy) {
      this.attrs.posY = this.attrs.lastPosY = this.attrs.posY+((-top)-dy);
    }
  }

  // 小的情况
  if (width < img_window_width) {
    if (left < 0) {
      this.attrs.posX = this.attrs.lastPosX = this.attrs.posX-left;
    }
    dx = img_window_width - width;
    if (left > dx) {
      this.attrs.posX = this.attrs.lastPosX = this.attrs.posX-(left-dx);
    }
  }
  if (height < img_window_height) {
    if (top < 0) {
      this.attrs.posY = this.attrs.lastPosY = this.attrs.posY-top;
    }
    dy = img_window_height - height;
    if (top > dy) {
      this.attrs.posY = this.attrs.lastPosY = this.attrs.posY-(top-dy);
    }
  }

  this.applyTransform();
};

Card.prototype.fit = function() {
  var _this = this;
  getImgSize(_this.config.imageUrl, function(imageWidth, imageHeight){
    _this.oriImageSize = {width: imageWidth, height: imageHeight};
    
    var sv = getSuiteValues({width: imageWidth, height: imageHeight}, {width: _this.config.imageContainerWidth, height: _this.config.imageContainerHeight});
    // 老的方式
    //    _this.$image.css({
    //      left: sv.left,
    //      top: sv.top,
    //      width: sv.width,
    //     height: sv.height
    //    });
    _this.attrs.scale = _this.attrs.initScale = sv.scale;
    // 因为缩放是根据中心点进行的，所以要考虑挪回去点：(imageWidth-sv.width)/2
    _this.attrs.posX = sv.left-(imageWidth-sv.width)/2;
    _this.attrs.posY = sv.top-(imageHeight-sv.height)/2;
    _this.applyTransform();
  });
};

function log(content) {
  console.log(content);
}

function showBounds($el) {
  var bounds = getBounds($el);
  $('.bbox').css({
    'left': bounds[0], 
    'top': bounds[1],
    'width': bounds[2],
    'height': bounds[3]
  });
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
  var parentOffset = $el.parent().offset()
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