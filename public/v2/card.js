// 在el的父元素上面增加触摸事件
var Card = function(el, config) {
  //
  this.config = config;

  // 目标元素改动
  this.$el = $(el);
  this.$el.addClass("card");
  this.$el.css({width: config.width, height: config.height});

  // 生成html
  this.buildHtml(config.imageUrl);
  this.setText();
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

Card.prototype.toObject = function() {
  var bounds = getBounds(this.$image);
  return {x: bounds[0], y: bounds[1], scale: this.attrs.scale, rotation: this.attrs.rotation}
}

//cb(imageBase64Url)
Card.prototype.toImage = function(cb) {
  var _this = this;
  console.log((this.attrs.posX)+','+(this.attrs.posY)+','+this.attrs.scale+','+this.attrs.rotation);
  // 准备好canvas，往里头放图片，然后根据参数调整，最后输出图片
  var canvas = new fabric.StaticCanvas(fabric.util.createCanvasElement());
  canvas.setDimensions({width: this.config.width, height: this.config.height});
  
  // 以下是图片参数
  var scale = this.attrs.scale;
  var angle = this.attrs.rotation;
  var width = this.oriImageSize.width*scale;
  var height = this.oriImageSize.height*scale;
  var left = this.attrs.posX+(this.oriImageSize.width-width)/2;
  var top = this.attrs.posY+(this.oriImageSize.height-height)/2;
  
  // 因为csstransform是根据中心点旋转的，而fabricjs是左上角旋转，所以要fix一下
  var newPoint = fabric.util.rotatePoint(new fabric.Point(left, top), new fabric.Point(left+width/2, top+height/2), fabric.util.degreesToRadians(angle));
  
  fabric.Image.fromURL(this.config.imageUrl, function(img) {
    img.scale(scale).set({
      // _this.config.imageContainerLeft：相对于frame的位置
      left: newPoint.x+_this.config.imageContainerLeft,
      top: newPoint.y+_this.config.imageContainerTop,
      angle: angle
    });
    background = $(".frame").css("background-image").replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
    fabric.Image.fromURL(background, function(frameImg) {
      frameImg.set({
        width: _this.config.width,
        height: _this.config.height
      });
      canvas.add(img);
      canvas.add(frameImg);
      cb(canvas.toDataURL({'format': 'jpg', 'quality': 0.7}));
    });
    
    
  }, {crossOrigin : 'anonymous'});

};

Card.prototype.buildHtml = function(imageUrl) {
  var htmlText = 
  '<div class="image-container">'+
    '<img class="image" crossorigin="anonymous" src="'+imageUrl+'"/>'+
    '<!-- <div class="bbox"></div> -->'+
  '</div>'+
  '<div class="frame"></div>'+
  '<div class="text"></div>';

  this.$el.html(htmlText);
  var imageContainer = this.$el.find(".image-container");
  imageContainer.css({
    left: this.config.imageContainerLeft,
    top: this.config.imageContainerTop,
    width: this.config.imageContainerWidth,
    height: this.config.imageContainerHeight
  });
};

Card.prototype.setText = function() {
  var _this = this;
  this.applyText();
  this.$el.find(".text").on("mousedown", function(e){
    var text = prompt("请输入您的文字", _this.config.text);
    if(text){
      _this.config.text = text;
      _this.applyText();
    }
    e.stopPropagation();
  });
};

Card.prototype.applyText = function() {
  var text = this.config.text;
  var family = this.config.fontFamily;
  var size = this.config.fontSize;
  var left = this.config.fontLeft;
  var top = this.config.fontTop;

  var imgTag = '<img src="http://115.28.178.82:3002/font?text='+text+'&family='+family+'&size='+size+'"/>';
  this.$el.find(".text").html(imgTag);
  this.$el.find(".text").css({
    left: left,
    top: top,
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
  var transform =
      "translate3d("+this.attrs.posX+"px,"+this.attrs.posY+"px, 0) " +
      "scale3d("+this.attrs.scale+","+this.attrs.scale+", 0) " +
      "rotate("+this.attrs.rotation+"deg) ";

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

  // this.$image.css({
  //   "-webkit-transition": "-webkit-transform .5s ease-in-out"
  // });

  this.applyTransform();

  // var _this = this;
  // setTimeout(function(){
  //   _this.$image.css("-webkit-transition", "");
  // }, 1000);
  
  // this.$image..removeAttr("style");
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
    console.log(sv.scale);
    _this.attrs.scale = _this.attrs.initScale = sv.scale;
    // 因为缩放是根据中心点进行的，所以要考虑挪回去点：(imageWidth-sv.width)/2
    _this.attrs.posX = sv.left-(imageWidth-sv.width)/2;
    _this.attrs.posY = sv.top-(imageHeight-sv.height)/2;
    _this.applyTransform();
    
    var o = _this.toObject();
    // alert(o.x+','+o.y+','+o.scale+','+o.rotation);
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