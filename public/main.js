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

$(document).ready(function(){
  var c = fabric.util.createCanvasElement();
  
  //var canvas = new fabric.Canvas("c");
  var canvas = new fabric.Canvas(c);
  canvas.setDimensions({width: 344.89, height: 383.548});
//  canvas.setDimensions({width: 900, height: 900});
  //var sv = getSuiteValues({width: 600, height: 900}, {width: 344.89, height: 383.548});
  
  // 以下是图片参数
  var scale = 1.7184270453057473;
  var angle = 58.650419134757044;
  var width = 600*scale;
  var height = 900*scale;
  var left = -98.55500762939454+(600-width)/2;
  var top = -257.226+(900-height)/2;
  
  //因为csstransform是根据中心点旋转的，而fabricjs是左上角旋转，所以要fix一下
  var newPoint = fabric.util.rotatePoint(new fabric.Point(left, top), new fabric.Point(left+width/2, top+height/2), fabric.util.degreesToRadians(angle));
  
  fabric.Image.fromURL('./girl.jpg', function(fabricImg) {
    fabricImg.scale(scale).set({
      left: newPoint.x,
      top: newPoint.y,
      angle: angle
    });

    canvas.add(fabricImg);
    console.log(canvas.getElement().toDataURL('image/png'));
  });
  
//  fabric.Image.fromURL('./girl.jpg', function(fabricImg) {
//    fabricImg.scale(sv.scale);
//    canvas.add(fabricImg);
//    console.log(canvas.getElement().toDataURL('image/png'));
//  });
  
});