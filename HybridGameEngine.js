var canvas = document.getElementById("canvas");
var processing = new Processing(canvas, function(processing) {
    processing.size(400, 400);   
    processing.background(0xFFF);

    var mouseIsPressed = false;
    processing.mousePressed = function () { mouseIsPressed = true; };
    processing.mouseReleased = function () { mouseIsPressed = false; };

    var keyIsPressed = false;
    processing.keyPressed = function () { keyIsPressed = true; };
    processing.keyReleased = function () { keyIsPressed = false; };

    function getImage(s) {s
        var url = "https://www.kasandbox.org/programming-images/" + s + ".png";
        processing.externals.sketch.imageCache.add(url);
        return processing.loadImage(url);
    }
    
    function getLocalImage(url) {
        processing.externals.sketch.imageCache.add(url);
        return processing.loadImage(url);
    }

    // use degrees rather than radians in rotate functions
    var rotateFn = processing.rotate;
    processing.rotate = function (angle) {
        rotateFn(processing.radians(angle));
    };
    with (processing) 
    {
  
          //////////Hybrid Game Engine/////////////
          /**
            *@Auther Prolight
            *@Version 0.2.7
            
            @How :
                Use the arrow keys to move. Down to go through 
                doors / set Checkpoints / collect keys / items.
                There are crates you can move. 'r' to restart level.
                Have fun, through it's a demo.
                
            @Info : 
                It's Called Hybrid Game Engine because it's a hybrid between 
                The Cartesian System and physics.
               
            @About Cartesian System :
                 The cartesian system is a coordinate grid Designed to split up
                 the objects into cells. Speeds up your game 3x by using cells for
                 collision detection between adjacent cells. It only renders cells 
                 with in the screen controlled by the camera. Will work with any 
                 platformer with an array for the arrays for all of it's gameObjects. I hope
                 you understand.
          **/
          
          /**
            Updates : 
              * v0.0.5 Full Cartesian System in place
              * v0.1.0 Circle and rectangle Physics reached
              * v0.1.5 Objects added 
              * v0.2.0 doors checkpoints keys
              * v0.2.1 Getting ready for graphics
              * v0.2.2 Cloud, dirt, ground and door graphics
              * v0.2.3 Image and screenUtils delegates / Json fully in place
              * v0.2.4 LoadImage function is pretty much done, added extra cloud graphics and a Sun, 
                       plus checkPoints now are flags, 
              * v0.2.5 Added Dynamic rectangle physics and the key graphic, crates (with nicer collision) are now in the game
                        just needs the player sprite and then it will be to the next version
              * 0.2.6 Signs, oneways and moving platforms are added 
              
           Future Updates :
                0.2.8 physics for the current gameObjects are clear and complete
                0.2.9 Graphics update
                0.3.0 Slopes
           Needs :
                slopes
          **/
          
          //Feel free to look through the code
          /////////////////Code///////////////////
          
          var game = {
              gameState : "play",
              fps : 30,
              version : "v0.2.7",
          };
          var levelInfo = {
              level : "start",
              xPos : 0,
              yPos : 0,
              width : width, 
              height : height,
              cellWidth : 100,
              cellHeight : 100,
              unitWidth : 30,
              unitHeight : 30,
          };
          var loader = {
              firstLoad : true,
          };
          
          //Constants
          var PI_MULT = PI / 180;
          var MODE = "pjs";
          var STICKY_THRESHOLD = 0.004;
          
          var cam, cameraGrid, GameObject;
          
          var keys = [];
          var keyPressed = function()
          {
              keys[keyCode] = true;
          };
          var keyReleased = function()
          {
              keys[keyCode] = false; 
          };
          
          var exstrain = function(val, min, max)
          {
              var ret = val;
              if(ret > min && ret < max)
              {  
                  var pivot = (min + max) / 2;
                  if(ret < pivot)
                  {
                      ret = min;  
                  }
                  else if(ret >= pivot)
                  {
                      ret = max; 
                  }
              }
              return ret;
          };
          
          var graphics = {};
          graphics.Fade = function(colorValue)
          {
              this.colorValue = colorValue;
              
              this.timer = 0;
              this.timerVel = 1;
              this.max = 100;
              this.fading = false;
              
              this.start = function(max, start)
              {
                  this.max = max || this.max;
                  this.timer = start || this.timer;
                  this.fading = true;
              };
              this.full = function()
              {
                  return (this.timer > this.max);
              };  
              this.draw = function()
              {
                  if(this.fading)
                  {
                      if(this.timer < 0 || this.timer > this.max)
                      {
                          this.timerVel = -this.timerVel;   
                      }
                      if(this.timer < 0)
                      {
                          this.fading = false;   
                      }
                      this.timer += this.timerVel;
                      
                      noStroke();
                      fill(red(this.colorValue), green(this.colorValue), blue(this.colorValue), this.timer * 255 / this.max);
                      rect(0, 0, width, height);
                  }
              };
          };
          var clouds = [];
          clouds.create = function()
          {
              this.length = 0;
              for(var i = 0; i < levelInfo.width * levelInfo.height / 20000; i++)
              {                                                                                                                                                                                
                  this.push([levelInfo.xPos + random(0, levelInfo.width / 5) * 5, levelInfo.yPos + random(0, (height / 2) / 5) * 5, random(40, 100), random(10, 30), random(75, 200), (random(0, 100) > 50) ? 1 * random(0.1, 0.75) : -1 * random(0.1, 0.75), (random(0, 100) < 60) ? "rect" : "ellipse"]);
              }
          };
          clouds.draw = function()
          {
              for(var i = 0; i < this.length; i++)
              {
                  fill(255, 255, 255, this[i][4]);
                  this[i][0] += this[i][5];
           
                  var edge = width * 0.3;
                  var levelLeft = levelInfo.xPos - edge;
                  var levelRight = levelInfo.xPos + levelInfo.width + edge;
                  if(this[i][6] === "rect")
                  {
                      rect(this[i][0], this[i][1], this[i][2], this[i][3], 5); 
                      
                      if(this[i][0] + this[i][2] < levelLeft)
                      {
                          this[i][0] = levelRight;
                      }
                      else if(this[i][0] > levelRight)
                      {
                          this[i][0] = levelLeft;
                      }
                  }
                  else if(this[i][6] === "ellipse")
                  {
                      ellipse(this[i][0], this[i][1], this[i][2], this[i][3]); 
                      
                      var radius = this[i][2] / 2;
                      if(this[i][0] + radius < levelLeft)
                      {
                          this[i][0] = levelRight + radius;  
                      }
                      else if(this[i][0] - radius > levelRight)
                      {
                          this[i][0] = levelLeft - radius;
                      }
                  }
              }
          };
          
          var shapes = {
              sun : function(x, y)
              {
                  fill(210, 210, 35);
                  rect(x, y, 50, 50, 10);
                  fill(210, 200, 40);
                  rect(x + 5, y + 5, 40, 40, 10);
              },
              key : function(x, y, w, h)
              {
                  var unitW = w / 3;
                  var unitH = h / 6;
                  var unitW2 = unitW * 2;
                  var unitH2 = unitH * 2;
                  
                  noStroke();
                  fill(235, 210 - 60, 70);
                  rect(x + unitW * 2, y + 4 * unitH, 0.6 * unitW, unitH * 0.7);
                  rect(x + unitW * 2, y + 5.3 * unitH, unitW, unitH * 0.7);
                  fill(235, 210, 70);
                  rect(x + unitW, y + unitH * 3, unitW, unitH * 3);
                  fill(235, 210 - 80, 70);
                  rect(x, y, unitW2, unitH);
                  fill(235, 210 - 60, 70);
                  rect(x + unitW2, y, unitW, unitH2);
                  fill(235, 210 - 40, 70);
                  rect(x + unitW, y + unitH2, unitW2, unitH);
                  fill(235, 210 - 20, 70);
                  rect(x, y + unitH, unitW, unitH2);
              },
          };
          
          
          var backgrounds = {
              background : "overworld",
              backgrounds : {
                  "overworld" : {
                      load : function()
                      {
                          clouds.create();
                      },
                      drawBackground : function()
                      {
                          background(147, 221, 250);
                      },
                      drawForeground : function()
                      {
                          noStroke();
                          pushMatrix();
                          translate((cam.focusXPos) * 0.7, (cam.focusYPos) * 0.7);
                          shapes.sun(40, -70);
                          popMatrix();
                          pushMatrix();
                          translate((levelInfo.width - cam.focusXPos) * 0.1, (levelInfo.height - cam.focusYPos) * 0.01);
                          clouds.draw();
                          popMatrix();
                      },
                  },
              },
              load : function()
              {
                   if(this.backgrounds[this.background].load !== undefined)
                   {
                       this.backgrounds[this.background].load();
                   }
              },
              setBackground : function(background)
              {
                  if(this.backgrounds[background] !== undefined)
                  {
                      this.background = background;
                  }
              },
              drawBackground : function()
              {
                  if(this.backgrounds[this.background].drawBackground !== undefined)
                  {
                      this.backgrounds[this.background].drawBackground();
                  }
              },
              drawForeground : function()
              {
                  if(this.backgrounds[this.background].drawForeground !== undefined)
                  {
                      this.backgrounds[this.background].drawForeground();
                  }
              },
          };
          
          var pixelFuncs = {
              replacePixels : function(img, findColor, replaceColor)
              {
                  var _pixels = img.pixels.toArray();
                  for(var i = 0; i < _pixels.length; i++)
                  {
                       if(_pixels[i] === findColor || (red(_pixels[i]) >= 240 && green(_pixels[i]) >= 240 && blue(_pixels[i]) >= 240))
                       {
                           img.pixels.setPixel(i, replaceColor);
                       }
                  }
              },
              safeRead : function(item, col, row)
              {
                   return (((col >= 0 && col < item.length) &&
                           (row >= 0 && row < item[col].length)) ? item[col][row] : undefined);
              },
              createPixelImage : function(input)
              {
                  if(MODE === "ka")
                  {
                      return get(0, 0, 20, 20);    
                  }
                
                  if(input.pixelSize === undefined)
                  {
                     input.pixelSize = 1;
                  }
                  
                  var clearColor = input.clearColor || color(255, 255, 255);
              
                  noStroke();
                  fill(clearColor); 
                  rect(0, 0, input.width, input.height);  
                  
                  for(var row = 0; row < input.pixels.length; row++)
                  {
                      for(var col = 0; col < input.pixels[row].length; col++)
                      {
                          var char = pixelFuncs.safeRead(input.pixels, row, col);
                          var toFill = (input.pallete[char] !== undefined) ? input.pallete[char] : clearColor;
                          fill(toFill);
                          rect(col * input.pixelSize, row * input.pixelSize,
                                     input.pixelSize, input.pixelSize);
                      }
                  }
                  var img = get(0, 0, input.width * input.pixelSize, input.height * input.pixelSize);
                  if(input.replace)
                  {
                      pixelFuncs.replacePixels(img, clearColor, color(255, 255, 255, 0));
                  }
                  img.pixelSize = input.pixelSize;
                  return img;
              },
          };
          
          var storedImages = {
              "spaceman" : pixelFuncs.createPixelImage({
                  width : 10, 
                  height : 20, 
                  replace : true,
                  pixelSize : 3, 
                  pixels : [
                      "aabbbbbbaa",
                      "abbccccbba",
                      "abcdccdcba",
                      "abcdccdcba",
                      "abccccccba",
                      "abbccccbba",
                      "aabbbbbbaa",
                      "aaaccccaaa",
                      "aaaceecaaa",
                      "aaecffceaa",
                      "aeaceecaea",
                      "aeaceecaea",
                      "afaccccafa",
                      "aaaccccaaa",
                      "aaaeeeeaaa",
                      "aaaccccaaa",
                      "aaacaacaaa",
                      "aaacaacaaa",
                      "aaacaacaaa",
                      "aaafaafaaa",
                  ],
                  pallete : {
                    'a':-1,
                    'b':-16773349,
                    'c':-15751769,
                    'd':-2960869,
                    'e':-16734949,
                    'f':-3970789,
                  },
              }),
              "spacemanRight" : pixelFuncs.createPixelImage({
                  width : 10, 
                  height : 20, 
                  replace : true,
                  pixelSize : 3, 
                  pixels : [
                      "aabbbbbbaa",
                      "abbccccbba",
                      "abccdccdba",
                      "abccdccdba",
                      "abccccccba",
                      "abbccccbba",
                      "aabbbbbbaa",
                      "aaaccccaaa",
                      "aaaceecaaa",
                      "aaecffceaa",
                      "aeaceecaea",
                      "aeaceecaea",
                      "aeaccccafa",
                      "afaccccaaa",
                      "aaaeeeeaaa",
                      "aaaccccaaa",
                      "aaacaacaaa",
                      "aaafaacaaa",
                      "aaaaaacaaa",
                      "aaaaaafaaa",
                  ],
                  pallete : {
                      'a':-1,
                      'b':-16773349,
                      'c':-15751769,
                      'd':-2960869,
                      'e':-16734949,
                      'f':-3970789,
                  },
              }),
              "spacemanRight2" : pixelFuncs.createPixelImage({
                  width : 10, 
                  height : 20, 
                  replace : true,
                  pixelSize : 3, 
                  pixels : [
                      "aabbbbbbaa",
                      "abbccccbba",
                      "abccdccdba",
                      "abccdccdba",
                      "abccccccba",
                      "abbccccbba",
                      "aabbbbbbaa",
                      "aaaccccaaa",
                      "aaaceecaaa",
                      "aaecffceaa",
                      "aeaceecaea",
                      "aeaceecaea",
                      "afaccccaea",
                      "aaaccccafa",
                      "aaaeeeeaaa",
                      "aaaccccaaa",
                      "aaacaacaaa",
                      "aaacaafaaa",
                      "aaacaaaaaa",
                      "aaafaaaaaa",
                  ],
                  pallete : {
                      'a':-1,
                      'b':-16773349,
                      'c':-15751769,
                      'd':-2960869,
                      'e':-16734949,
                      'f':-3970789,
                  },
              }),
              "spacemanLeft" : pixelFuncs.createPixelImage({
                  width : 10, 
                  height : 20, 
                  replace : true,
                  pixelSize : 3, 
                  pixels : [
                      "aabbbbbbaa",
                      "abbccccbba",
                      "abdccdccba",
                      "abdccdccba",
                      "abccccccba",
                      "abbccccbba",
                      "aabbbbbbaa",
                      "aaaccccaaa",
                      "aaaceecaaa",
                      "aaecffceaa",
                      "aeaceecaea",
                      "aeaceecaea",
                      "afaccccaea",
                      "aaaccccafa",
                      "aaaeeeeaaa",
                      "aaaccccaaa",
                      "aaacaacaaa",
                      "aaacaafaaa",
                      "aaacaaaaaa",
                      "aaafaaaaaa",
                  ],
                  pallete : {
                      'a':-1,
                      'b':-16773349,
                      'c':-15751769,
                      'd':-2960869,
                      'e':-16734949,
                      'f':-3970789,
                  },
              }),
              "spacemanLeft2" : pixelFuncs.createPixelImage({
                  width : 10, 
                  height : 20, 
                  replace : true,
                  pixelSize : 3, 
                  pixels : [
                      "aabbbbbbaa",
                      "abbccccbba",
                      "abdccdccba",
                      "abdccdccba",
                      "abccccccba",
                      "abbccccbba",
                      "aabbbbbbaa",
                      "aaaccccaaa",
                      "aaaceecaaa",
                      "aaecffceaa",
                      "aeaceecaea",
                      "aeaceecaea",
                      "aeaccccafa",
                      "afaccccaaa",
                      "aaaeeeeaaa",
                      "aaaccccaaa",
                      "aaacaacaaa",
                      "aaafaacaaa",
                      "aaaaaacaaa",
                      "aaaaaafaaa",
                  ],
                  pallete : {
                      'a':-1,
                      'b':-16773349,
                      'c':-15751769,
                      'd':-2960869,
                      'e':-16734949,
                      'f':-3970789,
                  },
              }),
          };
          var screenUtils = {
              fade : new graphics.Fade(color(0, 0, 0)),
              //Use this after defining the draw method in a gameObject
              needsScreenShot : false,
              takeScreenShot : function()
              {
                  if(this.needsScreenShot)
                  {
                      this.screenShot = get(0, 0,  width, height);
                      this.needsScreenShot = false; 
                  }
              },
              letImage : function(object, name, pro)
              {
                  object.imageName = name;
                  object.getImg = function()
                  {
                      return storedImages[this.imageName];
                  };
                  object.draw = (pro) ? function()
                  {
                      image(this.getImg(), this.xPos, this.yPos, this.width, this.height);
                  } 
                  : function()
                  {
                      image(this.getImg(), this.xPos, this.yPos);
                  };
              },
              //Will not work with transparent objects
              loadImage : function(object, constImage, name, notRect, customBackColor)
              {
                  //Constant Image is for images that do not change, we store them
                  if(constImage && storedImages[name || object.arrayName] !== undefined)
                  {
                      screenUtils.letImage(object, name || object.arrayName);
                      return;  
                  }
                  
                  /*We cannot replace pixels in ka mode due to the 
                  way the framework works differently*/
                  if(notRect && MODE === "ka")
                  {
                      return;  
                  }
                  
                  /*It doesn't matter what the color is as long as we 
                    don't use it in images we load*/
                  var backColor = customBackColor || color(255, 255, 255);
                  
                  //Get image process
                  noStroke();
                  fill(backColor);
                  rect(0, 0, object.width, object.height);
                  var lastXPos = object.xPos;
                  var lastYPos = object.yPos;
                  object.xPos = 0;
                  object.yPos = 0;
                  if(object.setDraw !== undefined)
                  {
                      object.setDraw(); 
                  }
                  object.draw();
                  var img = get(0, 0, object.width, object.height);
                  object.xPos = lastXPos;
                  object.yPos = lastYPos;
                  
                  if(notRect)
                  {
                      pixelFuncs.replacePixels(img, backColor, color(255, 255, 255, 0));
                  }
                  
                  //Store image
                  if(constImage)
                  {
                      storedImages[name || object.arrayName] = img;
                  }
                  screenUtils.letImage(object, name || object.arrayName);
              },
              update : function()
              {
                  this.takeScreenShot();
                  this.fade.draw();
              },
          };
          
          var physics = {
              formulas : {
                  crossProduct : function(point1, point2, point3)
                  {
                      return  (point1.xPos - point3.xPos) * (point2.yPos - point3.yPos) - 
                              (point2.xPos - point3.xPos) * (point1.yPos - point3.yPos);
                  },
              },
              //Gives a place for grouped physics hueristic specific-like code
              getMiddleXPos : function(object)
              {
                  object.middleXPos = (object.xPos + object.width / 2);
                  return object.middleXPos;
              },
              getMiddleYPos : function(object)
              {
                  object.middleYPos = (object.yPos + object.height / 2);
                  return object.middleYPos;
              },
              teleport : function(object, xPos, yPos)
              {
                  object.yVel = 0;
                  object.xVel = 0;
                  object.xPos = xPos;
                  object.yPos = yPos;
                  
                  //Don't forget to update the boundingBox
                  if(object.updateBoundingBox !== undefined)
                  {
                       object.updateBoundingBox();
                  }
              },
              push : {
                  rectcircle : function(host, object)
                  {
                      if(host.xVel > 0)
                      {
                          object.xVel += abs(host.xVel) || 0;
                      }
                      else if(host.xVel < 0)
                      {
                          object.xVel -= abs(host.xVel) || 0;
                      }
                      
                      if(host.yVel < 0 && host.yPos > object.yPos)
                      {
                          object.yVel -= (host.jumpHeight || 0);
                      }
                      if(host.yPos + host.width < object.yPos)
                      {
                          if(object.inAir)
                          {
                              object.yPos = object.lastYPos;
                          }
                      }
                  },
              },
          };
          
          //Observer (off limits)
          var observer = {
              collisionTypes : {
                  "blank" : {
                      colliding : function() {},
                      solveCollision : function() {},
                  },
                  "pointpolygon" : {
                      colliding : function(point1, polygon1)
                      {
                          // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
                          var inside = false;
                          for(var i = 0, j = polygon1.points.length - 1; i < polygon1.points.length; j = i++)
                          {
                              if((polygon1.points[i].yPos > point1.yPos) !== (polygon1.points[j].yPos > point1.yPos) &&
                              point1.xPos < (polygon1.points[j].xPos - polygon1.points[i].xPos) * (point1.yPos - polygon1.points[i].yPos) / (polygon1.points[j].yPos - polygon1.points[i].yPos) + polygon1.points[i].xPos)
                              {
                                  inside = !inside;
                              }
                          }
                          return inside;
                      },
                      solveCollision : function(point1, polygon1) {},
                  },
                  "rectslope" : {
                      colliding : function(rect1, slope1) 
                      { 
                          //var rect1Point = {
                          //    xPos : 0,
                          //    yPos : 0,
                          //};
                          
                          var v1 = {
                              xPos : 0,
                              yPos : 0,
                          };
                          var v2 = {
                              xPos : 0,
                              yPos : 0,
                          };
                          var v3 = {
                              xPos : 0,
                              yPos : 0,
                          };
                          
                         // var binding = 1;
                          
                          switch(slope1.direction)
                          {
                              case "leftup" : 
                                      //rect1Point.xPos = rect1.xPos;
                                      //rect1Point.yPos = rect1.yPos + rect1.height;
                                      v1.xPos = slope1.xPos;
                                      v1.yPos = slope1.yPos;
                                      v2.xPos = slope1.xPos;
                                      v2.yPos = slope1.yPos + slope1.height;
                                      v3.xPos = slope1.xPos + slope1.width;
                                      v3.yPos = slope1.yPos + slope1.height;
                                  break;
                              
                              case "rightup" : 
                                      //rect1Point.xPos = rect1.xPos + rect1.width;
                                      //rect1Point.yPos = rect1.yPos + rect1.height; 
                                      v1.xPos = slope1.xPos + slope1.width;
                                      v1.yPos = slope1.yPos;
                                      v2.xPos = slope1.xPos;
                                      v2.yPos = slope1.yPos + slope1.height;
                                      v3.xPos = slope1.xPos + slope1.width;
                                      v3.yPos = slope1.yPos + slope1.height;
                                  break;
                                    
                              case "leftdown" : 
                                      //rect1Point.xPos = rect1.xPos;
                                      //rect1Point.yPos = rect1.yPos;
                                      v1.xPos = slope1.xPos;
                                      v1.yPos = slope1.yPos;
                                      v2.xPos = slope1.xPos;
                                      v2.yPos = slope1.yPos + slope1.height;
                                      v3.xPos = slope1.xPos + slope1.width;
                                      v3.yPos = slope1.yPos;
                                  break;
                                   
                              case "rightdown" : 
                                      //rect1Point.xPos = rect1.xPos + rect1.width;
                                      //rect1Point.yPos = rect1.yPos;  
                                      v1.xPos = slope1.xPos;
                                      v1.yPos = slope1.yPos;
                                      v2.xPos = slope1.xPos + slope1.width;
                                      v2.yPos = slope1.yPos;
                                      v3.xPos = slope1.xPos + slope1.width;
                                      v3.yPos = slope1.yPos + slope1.height;
                                      //binding = 0;
                                  break;
                          }
                          
                          var rect1Points = [{
                              xPos : rect1.xPos,
                              yPos : rect1.yPos
                          }, {
                              xPos : rect1.xPos + rect1.width,
                              yPos : rect1.yPos
                          }, {
                              xPos : rect1.xPos,
                              yPos : rect1.yPos + rect1.height,
                          }, {
                              xPos : rect1.xPos + rect1.width,
                              yPos : rect1.yPos + rect1.height,
                          }];
                          var points = [v1, v2, v3];
                          
                          //Use the built-in algorithim instead of olli's three bools
                          for(var i = 0; i < rect1Points.length; i++)
                          {
                               if(observer.collisionTypes.pointpolygon.colliding(rect1Points[i], {points:points}))
                               {
                                   return true; 
                               }
                          }
                          for(var i = 0; i < points.length; i++)
                          {
                               if(observer.collisionTypes.pointpolygon.colliding(points[i], {points:rect1Points}))
                               {
                                   return true; 
                               }
                          }
                      },
                      solveCollision : function(rect1, slope1) 
                      {
                          return;
                          if(rect1.physics.movement === "dynamic" && slope1.physics.movement === "static")
                          {
                              switch(slope1.direction)
                              {
                                  case "leftup" :
                                      var r1 = {
                                          width : rect1.xPos - slope1.xPos,
                                          height : (slope1.yPos + slope1.height) - (rect1.yPos + rect1.height),
                                      };
                                      if(r1.width > r1.height)
                                      {
                                          var delta = r1.width - r1.height;
                                          r1.width -= delta;
                                          r1.height += delta;
                                      }
                                      else if(r1.height > r1.width)
                                      {
                                          var delta = r1.height - r1.width;
                                          r1.width += delta;
                                          r1.height -= delta;
                                      }
                                      var velBinding = 1;
                                      rect1.inAir = false;
                                      rect1.yVel = min(-rect1.xVel, 1);
                                      //rect1.yVel = min(rect1.yVel, 0);
                                      rect1.xPos = ((slope1.xPos + rect1.width) - r1.width) - 3;
                                      rect1.yPos = (slope1.yPos + r1.height) - rect1.height;
                                      if(rect1.xVel <= 0 && rect1.xPos <= (slope1.xPos) + abs(rect1.xVel))
                                      {
                                          rect1.xPos = slope1.xPos;
                                          rect1.yPos = slope1.yPos - rect1.height;
                                          rect1.xVel = -velBinding;
                                      }
                                  break;
                                  
                                  case "rightup" :
                                      var r1 = {
                                          width : (slope1.xPos + slope1.width) - (rect1.xPos + rect1.width),
                                          height : (slope1.yPos + slope1.height) - (rect1.yPos + rect1.height),
                                      };
                                      if(r1.width > r1.height)
                                      {
                                          var delta = r1.width - r1.height;
                                          r1.width -= delta;
                                          r1.height += delta;
                                      }
                                      else if(r1.height > r1.width)
                                      {
                                          var delta = r1.height - r1.width;
                                          r1.width += delta;
                                          r1.height -= delta;
                                      }
                                      var velBinding = 1;
                                      rect1.inAir = false;
                                      rect1.yVel = min(rect1.xVel, velBinding);
                                      //rect1.yVel = min(rect1.yVel, 0);
                                      rect1.xPos = (slope1.xPos + r1.width) - rect1.width;
                                      rect1.yPos = (slope1.yPos + r1.height) - rect1.height;
                                      if(rect1.xVel > 0 && rect1.xPos + rect1.width >= (slope1.xPos + slope1.width) - abs(rect1.xVel))
                                      {
                                          rect1.xPos = (slope1.xPos + slope1.width) - rect1.width;
                                          rect1.yPos = slope1.yPos - rect1.height;
                                          rect1.xVel = velBinding;
                                      }
                                  break;
                                  
                                  case "leftdown" :
                                      var r1 = {
                                          width : rect1.xPos - slope1.xPos,
                                          height : rect1.yPos - slope1.yPos,
                                      };
                                      if(r1.width > r1.height)
                                      {
                                          var delta = r1.width - r1.height;
                                          r1.height += delta;
                                      }
                                      else if(r1.height > r1.width)
                                      {
                                          var delta = r1.height - r1.width;
                                          r1.height -= delta;
                                      }
                                      rect1.yVel = 0;
                                      rect1.inAir = true;
                                      rect1.yPos = (slope1.yPos + rect1.height) - r1.height;
                                  break;
                                  
                                  case "rightdown" :
                                      var r1 = {
                                          width : (slope1.xPos + slope1.width) - (rect1.xPos + rect1.width),
                                          height : rect1.yPos - slope1.yPos,
                                      };
                                      if(r1.width > r1.height)
                                      {
                                          var delta = r1.width - r1.height;
                                          r1.height += delta;
                                      }
                                      else if(r1.height > r1.width)
                                      {
                                          var delta = r1.height - r1.width;
                                          r1.height -= delta;
                                      }
                                      rect1.inAir = true;
                                      rect1.yPos = (slope1.yPos + rect1.height) - r1.height;
                                      if(rect1.yVel < 0 && rect1.yPos <= slope1.yPos + 
                                      abs(rect1.yVel))
                                      {
                                          rect1.yVel = 2;
                                          rect1.yPos = slope1.yPos - rect1.height;
                                          rect1.yPos = (slope1.yPos + slope1.height) - 
                                          rect1.height;
                                      }else{
                                          rect1.yVel = 0;
                                      }
                                  break;
                              }
                          }
                      },
                  },
                  "circlecircle" : {
                      colliding : function(circle1, circle2) 
                      {
                          circle1.measuredDist = dist(circle1.xPos, circle1.yPos, circle2.xPos, circle2.yPos);
                          return (circle1.measuredDist <= circle1.radius + circle2.radius);
                      },
                      solveCollision : function(circle1, circle2)
                      {
                          var angle = atan2(circle1.yPos - circle2.yPos, circle1.xPos - circle2.xPos) + (circle1.winding || 0);
                          var input = circle1.radius + circle2.radius - circle1.measuredDist;
                          circle1.xPos += input * cos(angle);
                          circle1.yPos += input * sin(angle);
                          circle1.inAir = (circle1.yPos - circle1.radius > circle2.yPos);
                          circle1.touchedCircle = true;
                          circle2.touchedCircle = true;
                      },
                  },
                  "rectcircle" : {
                      colliding : function(rect1, circle1)
                      {
                          var point1 = {};
                          rect1.middleXPos = rect1.xPos + rect1.width / 2;
                          rect1.middleYPos = rect1.yPos + rect1.height / 2;
                          rect1.halfLineThrough = dist(rect1.xPos, rect1.yPos, rect1.xPos + rect1.width, rect1.yPos + rect1.height) / 2;
                              
                          //Step 1 : Get the closest point on the circle on the rectangle to the circle
                          var angle = atan2(circle1.yPos - rect1.middleYPos, circle1.xPos - rect1.middleXPos);
                          point1.xPos = rect1.middleXPos + (rect1.halfLineThrough * cos(angle));
                          point1.yPos = rect1.middleYPos + (rect1.halfLineThrough * sin(angle));
                          
                          //Step 2 : Constrain the point into the rectangle
                          point1.xPos = constrain(point1.xPos, rect1.xPos, rect1.xPos + rect1.width);
                          point1.yPos = constrain(point1.yPos, rect1.yPos, rect1.yPos + rect1.height);
                          
                          //Step 3 : check if the point is colliding with the circle
                          circle1.pointDist = dist(circle1.xPos, circle1.yPos, point1.xPos, point1.yPos);
                          return (circle1.pointDist <= circle1.radius);
                      },
                      solveCollision : function(rect1, circle1)
                      {
                          var angle = atan2(rect1.middleYPos - circle1.yPos, rect1.middleXPos - circle1.xPos);
                          var input = (circle1.radius - circle1.pointDist);
                          var inputX = input * cos(angle);
                          var inputY = input * sin(angle);
                          if(rect1.physics.movement === "dynamic")
                          {
                              rect1.xPos += inputX;
                              rect1.yPos += inputY;
                              rect1.inAir = (rect1.yPos >= circle1.yPos);
                              
                              if(rect1.touchedRect)
                              {
                                  rect1.collidedWithCircle = true;
                                  //Reboot the collision
                                  if(rect1.lastRectCollider !== undefined)
                                  {
                                      if(observer.collisionTypes.rectrect.colliding(rect1, rect1.lastRectCollider))
                                      {
                                          observer.collisionTypes.rectrect.solveCollision(rect1, rect1.lastRectCollider);
                                      }
                                  }
                                  if(inputX > 0)
                                  {
                                      rect1.xVel = max(0, rect1.xVel);
                                  }
                                  else if(inputX < 0)
                                  {
                                      rect1.xVel = min(0, rect1.xVel);
                                  }
                                  rect1.collidedWithCircle = false;
                                  rect1.touchedRect = false; 
                              }
                              if(!rect1.inAir)
                              {
                                  rect1.yVel = min(rect1.yVel, rect1.maxYVel * (circle1.friction || 0.25));
                              }
                          }
                          if(circle1.physics.movement === "dynamic")
                          {
                              circle1.xPos -= inputX;
                              circle1.yPos -= inputY;
                              
                              if(circle1.touchedCircle)
                              {
                                  if((inputX < 0 && circle1.xVel > 0) || 
                                     (inputX > 0 && circle1.xVel < 0))
                                  {
                                      circle1.xVel = 0;
                                  }
                                  if((inputY < 0 && circle1.yVel > 0) || 
                                     (inputY > 0 && circle1.yVel < 0))
                                  {
                                      circle1.yVel = 0;
                                  }
                              }
                              circle1.touchedCircle = false;
                              
                              if((circle1.xPos > rect1.xPos && circle1.xPos < rect1.xPos + rect1.width))
                              {
                                  circle1.inAir = (circle1.yPos > rect1.yPos);
                                  if(circle1.yPos - circle1.radius >= rect1.yPos + rect1.height)
                                  {
                                      circle1.yVel = max(circle1.yVel, 0);
                                      circle1.inAir = true;
                                  }
                                  if(!circle1.inAir)
                                  {
                                      circle1.yVel = 0;
                                  }
                              }
                          }
                      },
                  },
                  "rectrect" : {
                      colliding : function(rect1, rect2)
                      {
                          return ((rect1.xPos + rect1.width > rect2.xPos && 
                                   rect1.xPos < rect2.xPos + rect2.width) &&
                                  (rect1.yPos + rect1.height > rect2.yPos && 
                                   rect1.yPos < rect2.yPos + rect2.height));
                      },
                      solveCollision : function(rect1, rect2, extra)
                      {  
                          //Middle position method (best)
                          physics.getMiddleXPos(rect1);
                          physics.getMiddleYPos(rect1);
                          physics.getMiddleXPos(rect2);
                          physics.getMiddleYPos(rect2);
                          
                          var yAdjust = rect1.xAcl / 10; (0.15);
                          var xAdjust = yAdjust;
                          
                          var inY = (rect1.yPos + rect1.height);
                          var inY2 = (rect2.yPos + rect2.height);
                          var yAdjustRect1Height = rect1.height * yAdjust;
                          
                          //Long because it fixes inaccurate top / bottom collisions
                          var addY = ((inY < inY2 * (1 - yAdjust * 2)) ? 
                                     ((inY > rect2.yPos) ? abs(yAdjustRect1Height) : 0) : 
                                     ((rect1.yPos < rect2.yPos + rect2.height) ? -yAdjustRect1Height : 0));
                                     
                          var pushX = ((rect1.middleXPos) - rect2.middleXPos);
                          var pushY = ((rect1.middleYPos + addY) - rect2.middleYPos);
                          
                          var rect2Moveable = (!rect2.physics.independent && rect2.physics.movement === "dynamic");
                          
                          var fail = true;
                          if(abs(pushY) > abs(pushX))
                          {
                              var xAdjustRect2Width = rect2.width * xAdjust;
                              if((rect1.xPos + rect1.width > rect2.xPos + xAdjustRect2Width &&
                              rect1.xPos < rect2.xPos + (rect2.width - xAdjustRect2Width)))
                              {   
                                  var up = true;
                                  var down = true;
                                  var sUp = true;
                                  var sDown = true;
                                  if(rect2.physics.sides !== undefined)
                                  {
                                      up = rect2.physics.sides.up;  
                                      down = rect2.physics.sides.down;  
                                      
                                      if(!down)
                                      {
                                          sUp = (rect1.yPos + rect1.height <= rect2.yPos + abs(rect1.yVel));
                                      }
                                      if(!up)
                                      {
                                          sDown = (rect2.yPos + rect1.height + abs(rect1.yVel) >= rect1.yPos); 
                                      }
                                  }
                                  if(pushY > 0 && down && sDown && (rect1.collidedWithCircle || rect1.yPos >= inY2 - abs(rect1.yVel)))
                                  {
                                      if(rect2Moveable)
                                      {
                                          rect2.yVel = min(rect2.yVel, 0);
                                          if(rect1.yVel > 0)
                                          {
                                              rect1.yVel = max(rect1.yVel + (rect1.gravity * 1.1 || 1), 0);
                                          }
                                         // println(rect1.inAir);
                                          if(rect2.bottom || (rect2.inAir && !rect1.inAir))
                                          {
                                              rect2.yVel = abs(rect1.yVel);
                                              rect1.yVel = max(rect1.yVel, 0);
                                              rect2.yVel = max(rect2.yVel, 0);
                                              
                                              rect2.inAir = true;
                                              rect2.bottom = false;
                                          }
                                          rect2.top = true;
                                      }else{
                                          rect1.yVel = 0;
                                          rect1.bottom = true;
                                          rect1.inAir = true;
                                      }
                                      fail = false;
                                      
                                      rect1.yPos = rect2.yPos + rect2.height;
                                  }
                                  if(pushY < 0 && up && sUp)
                                  {
                                      if(rect2Moveable)
                                      {
                                          rect2.yVel = min(rect2.yVel, (rect2.gravity || 1));
                                          if(rect2.yVel < 0)
                                          {
                                              rect1.yVel += rect2.yVel;
                                          }
                                          rect2.bottom = true;
                                      }else{
                                          rect1.yVel = 0;
                                          rect1.top = true;
                                          rect1.inAir = false;
                                      }
                                      fail = false;
                                      rect1.yPos = rect2.yPos - rect1.height;
                                  }
                              }
                          }
                          if((abs(pushX) > abs(pushY) || (fail || rect1.collidedWithCircle)))
                          {
                              var yAdjustRect2Height = rect2.height * yAdjust;
                              if(rect1.yPos + rect1.height > rect2.yPos + yAdjustRect2Height &&
                              rect1.yPos < rect2.yPos + (rect2.height - yAdjustRect2Height))
                              {
                                  var right = true;
                                  var left = true;
                                  var sRight = true;
                                  var sLeft = true;
                                  
                                  if(rect2.physics.sides !== undefined)
                                  {
                                      right = rect2.physics.sides.right;  
                                      left = rect2.physics.sides.left;  
                                      
                                      if(!left)
                                      {
                                          sRight = (rect2.xPos + rect1.width <= rect1.xPos + abs(rect1.xVel));
                                      }
                                      if(!right)
                                      {
                                          sLeft = (rect1.xPos + rect1.width <= rect2.xPos + abs(rect1.xVel));
                                      }
                                  }
                                  if(pushX > 0 && right && sRight && rect1.xVel < 0)
                                  {  
                                      if(rect2Moveable && rect1.xVel < 0)
                                      {
                                          rect2.xVel -= abs(rect1.xVel);
                                          rect1.xVel += abs(rect2.xVel);
                                          //rect1.xVel = max(1, rect1.xVel);
                                      }else{
                                          rect1.xVel = 0;
                                      }
                                      //rect1.xVel = 0;
                                      rect1.xPos = rect2.xPos + rect2.width;// - (abs(rect2.xVel) || 0);
                                  }
                                  if(pushX < 0 && left && sLeft && rect1.xVel > 0)
                                  {
                                      if(rect2Moveable && rect1.xVel > 0)
                                      {
                                          rect2.xVel += abs(rect1.xVel);
                                          rect1.xVel -= abs(rect2.xVel);
                                          //rect1.xVel = min(-1, rect1.xVel);
                                      }else{
                                          rect1.xVel = 0;
                                      }
                                      //rect1.xVel = 0;
                                      rect1.xPos = (rect2.xPos - rect1.width); //+ (abs(rect2.xVel) || 0);
                                  }
                              }
                          }
                          rect1.touchedRect = true;
                          rect1.lastRectCollider = rect2;
                      },
                  },
              },
              access : function(object1, object2, access)
              {
                  var info = observer.getType(
                      object1.physics.shape, 
                      object2.physics.shape,
                      observer.collisionTypes
                  );
                  var colliding = false;
                  
                  if(!info.flipped)
                  {
                      colliding = observer.collisionTypes[info.type][access](object1, object2);
                  }else{
                      colliding = observer.collisionTypes[info.type][access](object2, object1);
                  }
                  return colliding;
              },
              colliding : function(object1, object2)
              {
                  return this.access(object1, object2, "colliding");
              },
              solveCollision : function(object1, object2)
              {
                  return this.access(object1, object2, "solveCollision");
              },
              boundingBoxesColliding : function(box1, box2)
              {
                  return observer.collisionTypes.rectrect.colliding(box1, box2);
              },
              getType : function(name1, name2, delegate)
              {
                  var typeToReturn = "blank";
                  var flipped = false;
                  var type = name1 + name2;
                  if(delegate[type] !== undefined)
                  {
                      typeToReturn = type;
                  }else{
                      //Flip shapes
                      flipped = true;
                      type = name2 + name1;
                      if(delegate[type])
                      {
                          typeToReturn = type;
                      }
                  }
                  return {
                      type : typeToReturn,
                      flipped : flipped,
                  };
              },
          };
  
          var Camera = function(xPos, yPos, width, height)
          {
              this.xPos = xPos;
              this.yPos = yPos;
              this.width = width;
              this.height = height;
              
              this.halfWidth = this.width / 2;
              this.halfHeight = this.height / 2;
              this.focusXPos = this.halfWidth;
              this.focusYPos = this.halfHeight;
              
              this.upperLeft = {
                  col : 0,
                  row : 0,
              };
              this.lowerRight = {
                  col : 0,
                  row : 0,
              };
              
              this.speed = 0.2;
              
              this.getObject = function() 
              { 
                  return this;
              };
  
              this.attach = function(func, directAttach)
              {
                  this.getObject = func;
                  var object = func();
                  if(directAttach)
                  {
                      this.focusXPos = object.boundingBox.xPos + (object.boundingBox.width / 2);
                      this.focusYPos = object.boundingBox.yPos + (object.boundingBox.height / 2);
                  }
              };
              
              this.view = function(object)
              {
                  if(object === undefined)
                  {
                      object = this.getObject();
                  }
                  
                  //Get the camera position
                  var xPos = object.boundingBox.xPos + (object.boundingBox.width / 2);
                  var yPos = object.boundingBox.yPos + (object.boundingBox.height / 2);
                  
                  this.angle = atan2(yPos - this.focusYPos, xPos - this.focusXPos);
                  this.distance = dist(this.focusXPos, this.focusYPos, xPos, yPos) * this.speed;
                  
                  this.focusXPos += this.distance * cos(this.angle);
                  this.focusYPos += this.distance * sin(this.angle);
                  
                  //Keep it in the grid
                  this.focusXPos = constrain(this.focusXPos, levelInfo.xPos + this.halfWidth, levelInfo.xPos + levelInfo.width - this.halfWidth);
                  this.focusYPos = constrain(this.focusYPos, levelInfo.yPos + this.halfHeight, levelInfo.yPos + levelInfo.height - this.halfHeight);
                  
                  //Get the corners position on the grid
                  this.upperLeft = cameraGrid.getPlace(this.focusXPos + EPSILON - this.halfWidth, this.focusYPos + EPSILON - this.halfHeight);
                  this.lowerRight = cameraGrid.getPlace(this.focusXPos + this.halfWidth - EPSILON, this.focusYPos + this.halfHeight - EPSILON);
                  
                  translate(this.xPos, this.yPos);
                  
                  if(levelInfo.width >= this.width)
                  {
                      translate(this.halfWidth - this.focusXPos, 0);  
                  }else{
                      translate(-levelInfo.xPos, 0);  
                  }
                  if(levelInfo.height >= this.height)
                  {
                      translate(0, this.halfHeight - this.focusYPos);
                  }else{
                      translate(0, -levelInfo.yPos);  
                  }
              };
              
              this.draw = function()
              {
                  fill(0, 0, 0, 50);
                  rect(cameraGrid.xPos + this.upperLeft.col * cameraGrid.cellWidth, cameraGrid.yPos + this.upperLeft.row * cameraGrid.cellHeight, ((this.lowerRight.col + 1) - this.upperLeft.col) * cameraGrid.cellWidth, ((this.lowerRight.row + 1) - this.upperLeft.row) * cameraGrid.cellHeight);
              }; 
              
              this.drawOutline = function()
              {
                  noFill();
                  stroke(0, 0, 0);
                  rect(this.xPos, this.yPos, this.width, this.height);  
              };
          };
          //var cam = new Camera(100, 100, width - 200, height - 200); //Use this for testing
          var cam = new Camera(0, 0, width, height); //Use this as the default
          
          var createArray = function(object, inArray)
          {  
              var array = inArray || [];
              array.references = {};
              array.add = function(xPos, yPos, width, height, colorValue, a, b, c, d, e, f, h, i, j, k, l, m, o, p, q, r, s, t, u, v, w, x, y, z)
              {
                  this.push((object.apply === undefined) ? xPos : new object(xPos, yPos, width, height, colorValue, a, b, c, d, e, f, h, i, j, k, l, m, o, p, q, r, s, t, u, v, w, x, y, z)); 
                  this.getLast().name = this.name;
                  this.getLast().arrayName = this.name;
                  this.getLast().index = this.length - 1; 
              };
              array.addObject = function(name, xPos, yPos, width, height, colorValue)
              {
                  if(this.references[name] === undefined)
                  {
                      this.references[name] = this.length;
                  }else{
                      println("Warning: You cannot have multiple objects \n" + 
                              "with the same name \'" + name + "\', Object removed.");
                      //Exit the function immediately.
                      return;
                  }
                  this.add(xPos, yPos, width, height, colorValue);
                  this.getLast().name = name;
              };
              array.addObjectBack = function(object)
              {
                  if(!this.isSuitableObject(object))
                  {
                      return;  
                  }
                  this.references[object.name] = this.length;
                  this.push(object);
                  this.getLast().arrayName = this.name || this.getLast().arrayName;
                  this.getLast().index = this.length - 1;
              };
              array.getObject = function(name)
              {
                  if(this[this.references[name]] !== undefined)
                  {
                      return this[this.references[name]];
                  }else{
                      println("Error referencing object '" + name + "'"); 
                      return {};
                  }
              };
              array.input = function(index)
              {
                  if(this[index] !== undefined)
                  {
                      return this[index];  
                  }else{
                      return new GameObject(0, 0);//{};      
                  }
              };
              array.getLast = function()
              {
                  return this.input(this.length - 1);
              };
              array.isSuitableObject = function(object)
              {
                  return !(typeof object.draw !== "function" || typeof object.update !== "function");
              };
              array.removeObject = function(name)
              {
                  if(this.references[name] !== undefined)
                  {
                      this.splice(this.references[name], 1);
                      this.references[name] = undefined;
                  }
              };
              array.clear = function()
              {
                  this.length = 0;
                  this.references = {};
              };
              array.draw = function()
              {
                  for(var i = 0; i < this.length; i++)
                  {
                       this[i].draw();
                  }
              };
              array.update = function()
              {
                  for(var i = 0; i < this.length; i++)
                  {
                      this[i].update();
                  }
              };
              array.applyObjects = function()
              {
                  for(var i = 0; i < this.length; i++)
                  {
                      this.applyObject(i);
                  }
              };
              array.applyObject = function(i)
              {
                  if(this[i] === undefined)
                  {
                      return;
                  }
                  this[i].index = i;  
                  this[i].arrayName = this.name || this[i].arrayName;
                  if(this[i].delete)
                  {
                      this.splice(i, 1);
                  }
              };
              return array;
          };
          
          var cameraGrid = [];
          cameraGrid.setup = function(xPos, yPos, cols, rows, cellWidth, cellHeight)
          {
              this.xPos = xPos;
              this.yPos = yPos;
              this.cellWidth = cellWidth;
              this.cellHeight = cellHeight;
              this.halfCellWidth = this.cellWidth / 2;
              this.halfCellHeight = this.cellHeight / 2;
              
              this.create(cols, rows);
          };
          cameraGrid.create = function(cols, rows)
          {
              this.length = 0;
              for(var col = 0; col < cols; col++)
              {
                  this.push([]);
                  for(var row = 0; row < rows; row++)
                  {
                      this[col].push({});
                  }
              }
              this.cols = cols;
              this.rows = rows;
          };
          cameraGrid.reset = function()
          {
              this.create(this.rows, this.cols);
          };
          cameraGrid.getPlace = function(xPos, yPos)
          {
              return {
                  col : constrain(round(((xPos - this.xPos) - this.halfCellWidth) / this.cellWidth), 0, this.length - 1),
                  row : constrain(round(((yPos - this.yPos) - this.halfCellHeight) / this.cellHeight), 0, this[0].length - 1),
              };
          };
          cameraGrid.addReference = function(object)
          {
              var toSet = {
                  arrayName : object.arrayName,
                  index : object.index,
              };
              var upperLeft = this.getPlace(object.boundingBox.xPos, object.boundingBox.yPos);
              var lowerRight = this.getPlace(object.boundingBox.xPos + object.boundingBox.width, object.boundingBox.yPos + object.boundingBox.height);
              for(var col = upperLeft.col; col <= lowerRight.col; col++)
              {
                  for(var row = upperLeft.row; row <= lowerRight.row; row++)
                  {
                      this[col][row][object.arrayName + object.index] = toSet;
                  }
              }
          };
          cameraGrid.draw = function()
          {  
              noFill();
              stroke(0, 0, 0);
              for(var col = 0; col < this.length; col++)
              {
                  for(var row = 0; row < this[col].length; row++)
                  {
                      rect(this.xPos + col * this.cellWidth, this.yPos + row * this.cellHeight, this.cellWidth, this.cellHeight);
                  }
              }
          };
          
          var gameObjects = createArray([]);
          gameObjects.drawBoundingBoxes = function()
          {
              noFill();
              stroke(0, 0, 0);
              strokeWeight(1);
              for(var i = 0; i < this.length; i++)
              {
                  for(var j = 0; j < this[i].length; j++)
                  {
                      var boundingBox = this[i][j].boundingBox;
                      rect(boundingBox.xPos, boundingBox.yPos, boundingBox.width, boundingBox.height);
                  }
              }  
          };
          gameObjects.removeObjects = function()
          {
              var savedObjects = [];
              for(var i = 0; i < this.length; i++)
              {
                  savedObjects.push([]);
                  
                  //Keep objects where save equals true, 
                  for(var j = 0; j < this[i].length; j++)
                  {
                      if(this[i][j].save)
                      {
                          savedObjects[i].push(this[i][j]);
                      }
                  }
                  
                  this[i].clear();
              }
              
              //Add the objects back
              for(var i = 0; i < savedObjects.length; i++)
              {
                  for(var j = 0; j < savedObjects[i].length; j++)
                  {
                      this[i].push(savedObjects[i][j]);
                      this[i].applyObject(j); // Don't forget to apply our object!
                  }
              }
          };
          gameObjects.addObjectsToCameraGrid = function()
          {
              for(var i = 0; i < this.length; i++)
              {
                  for(var j = 0; j < this[i].length; j++)
                  {
                      cameraGrid.addReference(this[i][j]);
                  }
              }
          };
          gameObjects.applyCollision = function(objectA)
          {
              if(objectA.physics.movement === "static")
              {
                  return;
              }
              
              var upperLeft = cameraGrid.getPlace(objectA.boundingBox.xPos, objectA.boundingBox.yPos);
              var lowerRight = cameraGrid.getPlace(objectA.boundingBox.xPos + objectA.boundingBox.width, objectA.boundingBox.yPos + objectA.boundingBox.height);
              
              for(var col = upperLeft.col; col <= lowerRight.col; col++)
              {
                  for(var row = upperLeft.row; row <= lowerRight.row; row++)
                  {
                      var cell = cameraGrid[col][row]; 
                      
                      for(var i in cell)
                      {
                          //If object is going to be tested with itself skip this loop
                          if(objectA.arrayName === cell[i].arrayName && objectA.index === cell[i].index)
                          {
                              continue;
                          }
                          
                          var objectB = this.getObject(cell[i].arrayName).input(cell[i].index);
                          
                          if(!observer.boundingBoxesColliding(objectA.boundingBox, objectB.boundingBox))
                          {
                              continue;
                          }
                          
                          var colliding = true;
                          /*(objectA.physics.shape !== "rect" || objectB.physics.shape !== "rect" ||
                            ((objectA.physics.shape === "rect" && objectA.customBoundingBox) || 
                              objectB.physics.shape === "rect" && objectB.customBoundingBox)))*/
                          if(!(objectA.physics.shape === "rect" && objectB.physics.shape === "rect")) //Assuming rects fill their boundingBox
                          {
                              colliding = observer.colliding(objectA, objectB);
                          }
                          
                          if(colliding)
                          {
                              if(objectA.onHit !== undefined)
                              {
                                  if(objectA.onHit(objectB))
                                  {
                                      continue;
                                  }
                              }
                              if(objectB.onHit !== undefined)
                              {
                                  if(objectB.onHit(objectA))
                                  {
                                      continue;  
                                  }
                              }
                              if(objectA.physics.solidObject && objectB.physics.solidObject)
                              {
                                  observer.solveCollision(objectA, objectB);
                              }
                              if(objectA.onCollide !== undefined)
                              {
                                  objectA.onCollide(objectB);
                              }
                              if(objectB.onCollide !== undefined)
                              {
                                  objectB.onCollide(objectA);
                              }
                          }
                      }
                  }
              }
          };
          gameObjects.apply = function()
          {
              var usedObjects = {};
              for(var col = cam.upperLeft.col; col <= cam.lowerRight.col; col++)
              {
                  for(var row = cam.upperLeft.row; row <= cam.lowerRight.row; row++)
                  {
                      var cell = cameraGrid[col][row];
                      for(var i in cell)
                      {
                          var array = this.getObject(cell[i].arrayName);
                          var object = array.input(cell[i].index);
                          array.applyObject(cell[i].index);
                          
                          /*Keep the cell up to date
                          Note: use this before referencing a cell*/
                          if(object.physics.movement === "dynamic")
                          {
                              delete cameraGrid[col][row][i];
                              cameraGrid.addReference(object);
                          }
                          
                          //Use the object only once
                          if(!usedObjects[object.arrayName + object.index])
                          {
                              object.lastXPos = object.xPos;
                              object.lastYPos = object.yPos;
                              object.update();
                              gameObjects.applyCollision(object);
                              object.draw();
                          }
                          
                          usedObjects[object.arrayName + object.index] = true;
                      }
                  }
              }
          };
          
          var travelObjects = [];
          travelObjects.add = function(object)
          {
              this.push({
                  index : object.index,
                  arrayName : object.arrayName,
              });
          };
          
          var GameObject = function(xPos, yPos)
          {
              this.xPos = xPos;
              this.yPos = yPos;
              
              this.boundingBox = {
                  xPos : this.xPos,
                  yPos : this.yPos,
              };
              
              this.physics = {
                  shape : "?",
                  movement : "static",
                  solidObject : true,
              };
              
              this.draw = function() {};
              this.update = function() {};
              
              this.remove = function()
              {
                  this.delete = true;  
              };
          };
          
          var Rect = function(xPos, yPos, width, height)
          {
              GameObject.call(this, xPos, yPos);
              
              this.width = width;
              this.height = height;
              this.boundingBox.width = width;
              this.boundingBox.height = height;
              this.physics.shape = "rect";
              this.type = "block";
              
              this.draw = function()
              {
                  noStroke();
                  fill(this.color);
                  rect(this.xPos, this.yPos, this.width, this.height);
              };
          };
          gameObjects.addObject("rect", createArray(Rect));
          
          var Circle = function(xPos, yPos, diameter)
          {
              GameObject.call(this, xPos, yPos);
              
              this.diameter = diameter;
              this.radius = this.diameter / 2;
              this.boundingBox.xPos = this.xPos - this.radius;
              this.boundingBox.yPos = this.yPos - this.radius;
              this.boundingBox.width = this.diameter;
              this.boundingBox.height = this.diameter;
              this.physics.shape = "circle";
              
              this.draw = function()
              {
                  noStroke();
                  fill(this.color);
                  ellipse(this.xPos, this.yPos, this.diameter, this.diameter);
              };
          };
          gameObjects.addObject("circle", createArray(Circle));
          
          var DynamicObject = function()
          {
              this.physics.movement = "dynamic";
              this.xVel = 0;
              this.maxXVel = 0;
              
              this.yVel = 0;
              this.maxYVel = 0;
              this.gravity = 0;
              this.inAir = false;
              
              this.update = function()
              {
                  this.updateVel();
                  this.updateBoundingBox();
              };
              
              this.updateVel = function()
              {
                  if(this.xDeacl !== undefined)
                  {
                      if(this.xVel > 0)
                      {
                           this.xVel -= this.xDeacl; 
                      }
                      if(this.xVel < 0)
                      {
                           this.xVel += this.xDeacl; 
                      }
                      if(this.xVel >= -this.xDeacl && this.xVel <= this.xDeacl)
                      {
                          this.xVel = 0;
                      }
                  }
                  if(this.boundingBox.xPos <= levelInfo.xPos)
                  {
                      this.xVel = max(0, this.xVel);
                      this.xPos = abs(this.xPos - this.boundingBox.xPos) + levelInfo.xPos - (this.diameter || 0);
                  }
                  if(this.boundingBox.xPos + this.boundingBox.width >= levelInfo.xPos + levelInfo.width)
                  {
                      this.xVel = min(0, this.xVel);
                      this.xPos = (levelInfo.xPos + levelInfo.width - this.boundingBox.width) - abs(this.boundingBox.xPos - this.xPos) + (this.diameter || 0);
                  }
                  this.xVel = constrain(this.xVel, -this.maxXVel, this.maxXVel);
                  this.xPos += this.xVel;
                  
                  if(this.boundingBox.yPos <= levelInfo.yPos)
                  {
                      this.yPos = abs(this.yPos - this.boundingBox.yPos) + levelInfo.yPos;
                      this.yVel = 0;
                  }
                  this.inAir = true;
                  this.yVel += this.gravity;
                  this.yVel = constrain(this.yVel, -this.maxYVel, this.maxYVel);
                  this.yPos += this.yVel;
              };
          };
          
          var DynamicCircle = function(xPos, yPos, diameter, colorValue)
          { 
              Circle.call(this, xPos, yPos, diameter);
              DynamicObject.call(this);
              
              this.color = colorValue;
              this.xAcl = 1.5;
              this.xDeacl = 0.3;
              this.maxXVel = 4;
              
              this.maxYVel = 12;
              this.gravity = 0.4;
              this.jumpHeight = 10.5;
              
              this.updateBoundingBox = function()
              {
                  this.boundingBox.xPos = this.xPos - this.radius;
                  this.boundingBox.yPos = this.yPos - this.radius;
              };
          };
          gameObjects.addObject("dynamicCircle", createArray(DynamicCircle));
          
          var DynamicRect = function(xPos, yPos, width, height, colorValue)
          {
              Rect.call(this, xPos, yPos, width, height);
              DynamicObject.call(this);
              
              this.color = colorValue;
              this.xAcl = 1.5;
              this.xDeacl = 0.4;
              this.maxXVel = 4;
              this.xForce = 2;
              
              this.maxYVel = 12;
              this.gravity = 0.4;
              this.jumpHeight = 10.5;
              this.yForce = 2;
              this.inAir = true;
              
              this.updateBoundingBox = function()
              {
                  this.boundingBox.xPos = this.xPos;
                  this.boundingBox.yPos = this.yPos;
              };
              
              this.onCollide = function(object)
              {
                  if(object.physics.movement === "dynamic" && object.physics.shape === "circle")
                  {
                      physics.push.rectcircle(this, object);
                  }
              };
          };
          gameObjects.addObject("dynamicRect", createArray(DynamicRect));
  
          var Slope = function(xPos, yPos, width, height, colorValue)
          {
              Rect.call(this, xPos, yPos, width, height);
              this.color = colorValue || color(175, 175, 175);
              this.physics.shape = "slope";
              this.direction = "leftup";
              
              var thicknessX = 0.05;
              var bindingX = 3;
              var thicknessY = 0.05;
              var bindingY = 3;
              this.setup = function()
              {
                  switch(this.direction)
                  {
                      case "leftup" : 
                              gameObjects.getObject("rect").add(this.xPos, this.yPos + this.height * thicknessX * bindingX, this.width * thicknessX, this.height - this.height * thicknessX * bindingX);
                              gameObjects.getObject("rect").add(this.xPos, this.yPos + this.height - this.height * thicknessY, this.width - this.width * thicknessY * bindingY, this.height * thicknessY);
                              //gameObjects.getObject("rect").getLast().ignoreRight = true;
                              //gameObjects.getObject("rect").getLast().ignoreLeft = true;
                          break;
                      
                      case "rightup" : 
                              gameObjects.getObject("rect").add(this.xPos + this.width - this.width * thicknessX, this.yPos + this.height * thicknessX * bindingX, this.width * thicknessX, this.height - this.height * thicknessX * bindingX);
                              gameObjects.getObject("rect").add(this.xPos + this.width * thicknessY * bindingY, this.yPos + this.height - this.height * thicknessY, this.width - this.width * thicknessY * bindingY, this.height * thicknessY);
                          break;
                                
                      case "leftdown" : 
                              gameObjects.getObject("rect").add(this.xPos, this.yPos, this.width * thicknessX, this.height - this.height * thicknessX * bindingX);
                              gameObjects.getObject("rect").add(this.xPos, this.yPos, this.width - this.width * thicknessY * bindingY, this.height * thicknessY);
                          break;
                      
                      case "rightdown" : 
                              gameObjects.getObject("rect").add(this.xPos + this.width - this.width * thicknessX, this.yPos, this.width * thicknessX, this.height - this.height * thicknessX * bindingX);
                              gameObjects.getObject("rect").add(this.xPos + this.width * thicknessY * bindingY, this.yPos, this.width - this.width * thicknessY * bindingY, this.height * thicknessY);
                          break;
                  }
              };
              this.draw = function()
              {
                  fill(this.color);
                  switch(this.direction)
                  {
                      case "leftup" :
                          triangle(this.xPos, this.yPos, this.xPos, this.yPos + this.height, this.xPos + this.width, this.yPos + this.height);
                          break;
                          
                      case "rightup" :
                          triangle(this.xPos, this.yPos + this.height, this.xPos + this.width, this.yPos, this.xPos + this.width, this.yPos + this.height);
                          break;
                          
                      case "leftdown" :
                          triangle(this.xPos, this.yPos, this.xPos + this.width, this.yPos, this.xPos, this.yPos + this.height);
                          break;
                          
                      case "rightdown" :
                          triangle(this.xPos, this.yPos, this.xPos + this.width, this.yPos, this.xPos + this.width, this.yPos + this.height);
                          break;
                  }
                  this.color = color(175, 175, 175);
              };
              
              this.onCollide = function(object)
              {
                  if(object.arrayName === "player")
                  {
                      this.color = 0;//color(215, 75, 75);  
                  }
              };
          };
          gameObjects.addObject("slope", createArray(Slope));
  
          var Lava = function(xPos, yPos, width, height, colorValue)
          {
              Rect.call(this, xPos, yPos, width, height);
              this.color = colorValue || color(175, 30, 40);//color(170, 70, 80);
              this.color2 = color(130, 70, 80);
              this.physics.solidObject = false;
              /*Add padding to the boundingBox so it doesn't kill 
                you while your standing on an edge of a block */
              var padding = 0.1; 
              var xPadding = this.width * padding; 
              var yPadding = this.height * padding; 
              var widthPadding = this.width * (1 - padding * 2);
              var heightPadding = this.height * (1 - padding * 2);
              this.boundingBox.xPos = this.xPos + xPadding;
              this.boundingBox.yPos = this.yPos + yPadding;
              this.boundingBox.width = widthPadding;
              this.boundingBox.height = heightPadding;
              
              this.grid = [];
              this.setupGrid = function(cols, rows)
              {
                  this.grid.length = 0;
                  for(var col = 0; col < cols; col++)
                  {
                      this.grid.push([]);
                      for(var row = 0; row < rows; row++)
                      {
                          this.grid[col].push(color(random(0, 200), random(0, 25), random(0, 25), random(100, 250)));
                      }
                  }
              };
              this.drawGrid = function()
              {
                  var cellWidth = this.width / this.grid.length;
                  var cellHeight = this.height / this.grid[0].length;
                  for(var col = 0; col < this.grid.length; col++)
                  {
                      for(var row = 0; row < this.grid[col].length; row++)
                      {
                          fill(this.grid[col][row]);
                          rect(this.xPos + col * cellWidth, this.yPos + row * cellHeight, cellWidth, cellHeight);
                      }
                  }
              };
              
              this.setupGrid(3, 3);
              
              this.draw = function()
              {
                  fill(this.color);
                  rect(this.xPos, this.yPos, this.width, this.height);
                  this.drawGrid();
              };
              
              screenUtils.loadImage(this, true, "lava" + round(random(0, 1000)));
              
              this.damage = 0.1;
              this.onCollide = function(object)
              {
                  if(object.type === "lifeform")
                  {
                      object.hp -= this.damage;  
                  }
              };
          };
          gameObjects.addObject("lava", createArray(Lava));
  
          var Crate = function(xPos, yPos, width, height, colorValue)
          { 
              DynamicRect.call(this, xPos, yPos, width, height, colorValue || color(190, 160, 84));
              
              this.breakPercent = 0;
              this.breakRate = 0.05;
              this.xDeacl = 0.2; //Turn this up for less glitches
              
              
              this.draw = function()
              {
                  fill(this.color);
                  rect(this.xPos, this.yPos, this.width, this.height);
                  
                  fill(this.color, this.color, this.color, 20);
                  rect(this.xPos + this.width * 0.15, this.yPos + this.height * 0.15, this.width * 0.65, this.height * 0.65);
                  
                  fill(0, 0, 0, 50);
                  triangle(this.xPos, this.yPos, this.xPos + this.width, this.yPos, this.xPos, this.yPos + this.height);
              };
              
              screenUtils.loadImage(this, true, "crate");
          };
          gameObjects.addObject("crate", createArray(Crate));
          
          var Sign = function(xPos, yPos, width, height, colorValue, message, textColor, fontName)
          { 
              Rect.call(this, xPos, yPos, width, height);
              this.color = colorValue || color(200, 150, 70);
              this.message = message || "This is a sign";
              this.textColor = textColor;
              this.physics.solidObject = false;
              
              this.halfWidth = this.width / 2;
              this.halfHeight = this.height / 2;
              this.fontName = fontName;
              
              this.draw = function()
              {
                  fill(this.color);
                  rect(this.xPos + this.width * 0.4, this.yPos, this.width * 0.2, this.height);
                  rect(this.xPos, this.yPos, this.width, this.height * 0.6);
                  fill(0, 0, 0, 50);
                  rect(this.xPos + this.width * 0.1, this.yPos + this.height * 0.1, this.width * 0.8, this.height * 0.4);
                  
                  stroke(0, 0, 0, 50);
                  strokeWeight(2);
                  line(this.xPos + this.width * 0.25, this.yPos + this.width * 0.25, this.xPos + this.width * 0.7, this.yPos + this.width * 0.25);
                  line(this.xPos + this.width * 0.25, this.yPos + this.width * 0.35, this.xPos + this.width * 0.7, this.yPos + this.width * 0.35);
                  noStroke();
              };
              screenUtils.loadImage(this, true, "sign", true);
              
              this.load = function()
              {
                  this.textSize1 = (this.textSize || 10);
                  this.startX = this.xPos + this.halfWidth + (this.adjustX || 0);
                  this.startY = (this.yPos - this.halfHeight) + (this.adjustY || 0);
                  this.split = ("").split(this.message).length;
                  this.messageHeight = this.adjustH || split * (this.textSize1 * 2.6);
                  this.messageWidth = this.adjustW || (this.message.length) * (this.textSize1 / 1.6);
                  this.messageWidth2 = this.messageWidth * 0.9;
                  this.messageHeight2 = this.messageHeight * 0.8;
                  this.textRectX = this.startX - this.messageWidth / 2;
                  this.textRectY = this.startY - this.messageHeight / 2;
                  this.textRectX2 = this.startX - this.messageWidth2 / 2;
                  this.textRectY2 = this.startY - this.messageHeight2 / 2;
                  
                  if(this.fontName !== undefined)
                  {
                      try{
                          this.font = createFont(this.fontName);
                      }
                      catch (e)
                      {
                          println("Error : " + e);
                      }
                      this.fontName = undefined;  
                  }
              };
              
              this.drawMessage = function()
              {
                  textAlign(CENTER, CENTER);
                  if(this.font !== undefined)
                  {
                      textFont(this.font);
                  }
                  textSize(this.textSize1);
                  noStroke();
                  fill(this.color);
                  rect(this.textRectX, this.textRectY, this.messageWidth, this.messageHeight);
                  fill(0, 0, 0, 50);
                  rect(this.textRectX2, this.textRectY2, this.messageWidth2, this.messageHeight2);
                  fill(this.textColor || 0);
                  text(this.message, this.startX, this.startY);
                  textAlign(NORMAL, NORMAL);
              };
              
              this.onCollide = function(object)
              {
                  if(object.type === "lifeform")
                  {
                      this.active = true;
                      if(keys[80])
                      {
                          println(this.message);
                      }
                  }
              };
          };
          gameObjects.addObject("sign", createArray(Sign));
          var signs = gameObjects.getObject("sign");
          signs.drawMessage = function()
          {
              for(var i = 0; i < signs.length; i++)
              {
                  if(signs[i].active)
                  {
                      signs[i].drawMessage();
                      signs[i].active = false;
                      break;
                  }
              }
          };
          
          var Ring = function(xPos, yPos, diameter, colorValue)
          {
              Circle.call(this, xPos, yPos, diameter);
              this.color = colorValue;
              
              this.angle = 0;
              this.bladeSpeed = round(random(3, 8)) * ((random(0, 100) > 50) ? 1 : -1);
              this.bladeColor = color(0, 100, 230);
              
              this.arcSize = this.diameter * 2/3;
              this.bladeRanges = [[0, 90], [90, 180], [180, 270], [270, 360]];
              
              if(MODE === "pjs")
              {
                  for(var i = 0; i < this.bladeRanges.length; i++)
                  {
                      this.bladeRanges[i][0] *= PI_MULT;
                      this.bladeRanges[i][1] *= PI_MULT;
                  }
              }
  
              this.draw = function()
              {
                  noStroke();
                  fill(this.color);
                  ellipse(this.xPos, this.yPos, this.diameter, this.diameter);
                  
                  this.angle += this.bladeSpeed;
                  pushMatrix();
                      translate(this.xPos, this.yPos);
                      rotate(this.angle);
                      //fill(0, 0, 0);
                      //arc(0, 0, this.arcSize, this.arcSize, this.bladeRanges[0][0], this.bladeRanges[0][1]);
                      //arc(0, 0, this.arcSize, this.arcSize, this.bladeRanges[2][0], this.bladeRanges[2][1]);
                      fill(this.bladeColor);
                      arc(0, 0, this.arcSize, this.arcSize, this.bladeRanges[1][0], this.bladeRanges[1][1]);
                      arc(0, 0, this.arcSize, this.arcSize, this.bladeRanges[3][0], this.bladeRanges[3][1]);
                  popMatrix();
              };
          };
          gameObjects.addObject("ring", createArray(Ring));
          
          var Ground = function(xPos, yPos, width, height, colorValue)
          {
              Rect.call(this, xPos, yPos, width, height);
              this.color = colorValue;
              this.grassColor = color(28, 156, 30);
              
              this.draw = function()
              {
                  noStroke();
                  fill(this.color);
                  rect(this.xPos, this.yPos, this.width, this.height);
                  
                  if(!this.noGrass)
                  {
                      noStroke();
                      fill(this.grassColor);
                      rect(this.xPos, this.yPos, this.width, this.height * 0.15);
                  }
                  
                  fill(0, 0, 0, 50);
                  triangle(this.xPos + this.width, this.yPos + this.height, this.xPos + this.width, this.yPos, this.xPos, this.yPos + this.height);
              };
              
              screenUtils.loadImage(this, true);
          };
          gameObjects.addObject("ground", createArray(Ground));
          
          var Dirt = function(xPos, yPos, width, height, colorValue)
          {  
              this.noGrass = true;
              this.arrayName = "dirt";
              Ground.call(this, xPos, yPos, width, height, colorValue);
          };
          gameObjects.addObject("dirt", createArray(Dirt));
          
          var Spring = function(xPos, yPos, width, height, colorValue)
          {
              Rect.call(this, xPos, yPos, width, height);
              this.color = colorValue || color(0, 150, 80);
              this.boost = 15;
              this.xBoost = this.boost;
              this.yBoost = this.boost;
              
              this.draw = function()
              {
                  fill(this.color);
                  rect(this.xPos, this.yPos, this.width, this.height);
                  fill(0, 0, 0, 50);
                  rect(this.xPos + this.width * 0.15, this.yPos + this.height * 0.15, this.width * 0.65, this.height * 0.65);
                  fill(0, 0, 0, 60);
                  triangle(this.xPos, this.yPos + this.height, this.xPos + this.width, this.yPos, this.xPos + this.width, this.yPos + this.height);
              };
              
              screenUtils.loadImage(this, true, "spring");
              
              this.onCollide = function(object)
              {
                  var padding = (object.xAcl || 1); //Padding, usually based on acceleration
                  if(object.xPos + (object.radius || object.width) < this.xPos + (padding))
                  {
                      object.xVel = -this.xBoost;
                  }
                  else if(object.xPos > this.xPos + this.width - (padding))
                  {
                      object.xVel = this.xBoost;
                  }
                  if(object.yPos + (object.radius || object.height) < this.yPos + (padding))
                  {
                      object.yVel = -this.yBoost;
                  }
                  if(object.yPos > this.yPos + this.height - (padding))
                  {
                      object.yVel = this.yBoost;
                  }
              };
          };
          gameObjects.addObject("spring", createArray(Spring));
          
          var Door = function(xPos, yPos, width, height, colorValue)
          {
              Rect.call(this, xPos, yPos, width, height);
              this.physics.solidObject = false;
              this.color = colorValue || color(76, 140, 76);
              this.goto = {};
              
              this.draw = function()
              {
                  fill(this.color);
                  rect(this.xPos, this.yPos, this.width, this.height);
                  
                  fill(0, 0, 0, 30);
                  rect(this.xPos + this.width * 0.1, this.yPos + this.height * 0.05, this.width * 0.8, this.height * 0.9);
                  
                  fill(this.color, this.color, this.color, 20);
                  rect(this.xPos, this.yPos + this.height/2, this.width, this.height/2);
                  
                  fill(this.color, this.color, this.color, 30);
                  var knobRaduis = this.width * 0.30;
                  ellipse(this.xPos + this.width * 0.8, this.yPos + this.height * 0.5, knobRaduis, knobRaduis);
              };
              
              screenUtils.loadImage(this, true, "door");
              
              this.lastDraw = this.draw;
              this.draw = function()
              {   
                  this.lastDraw();
                  if(this.goto.locked)
                  {
                      noStroke();
                      fill(0, 0, 0, 120);
                      rect(this.xPos, this.yPos, this.width, this.height);
                  }
              };
              
              this.onCollide = function(object)
              {
                  if(object.openDoor !== undefined && object.openDoor())
                  {
                      if(object.goto.keys !== undefined)
                      {
                          for(var i = 0; i < object.goto.keys.length; i++)
                          {
                              var k = object.goto.keys[i];
                              if(k.level === levelInfo.level && k.symbol === this.symbol)
                              {
                                  this.goto.locked = false;
                                  object.goto.keys.pop();
                                  break;
                              }
                          }
                      }
                      if(!this.goto.locked)
                      {
                          object.save = true;
                          object.goto.doorSymbol = this.goto.symbol;
                          object.goto.travelType = "door";
                          loader.startLoadLevel(this.goto.level);
                      }
                  }
              };
          };
          gameObjects.addObject("door", createArray(Door));
          
          var Key = function(xPos, yPos, width, height, colorValue)
          {
              Rect.call(this, xPos, yPos, width, height);
              this.physics.solidObject = false;
              this.color = colorValue || color(180, 170, 30);
              this.goto = {};
              this.type = "item";
              
              this.draw = function()
              {
                  shapes.key(this.xPos, this.yPos, this.width, this.height);
              };
              
              this.onCollide = function(object)
              {
                  if(object.collectItem !== undefined && object.collectItem())
                  {
                      if(object.goto.keys === undefined)
                      {
                          object.goto.keys = [];
                      }
                      object.goto.keys.push(this.goto);
                      this.goto.collected = true;
                      this.remove();
                  }
              };
          };
          gameObjects.addObject("key", createArray(Key));
          
          var CheckPoint = function(xPos, yPos, width, height, colorValue)
          {
              Rect.call(this, xPos, yPos, width, height);
              this.physics.solidObject = false;
              this.green = color(28, 156, 30);
              this.color = colorValue || color(200, 0, 0);
              
              this.xDiv = this.width * 0.2;
              this.xOff = this.width * 0.13;
              this.flagX = this.xPos + this.xOff + this.xDiv;
              this.flagRightX = this.xPos + this.width * 0.7 + this.xDiv;
              this.midY = this.yPos + this.height / 4;
              this.bottomY = this.yPos + this.height / 2;
              this.draw = function()
              {
                  fill(this.color);
                  triangle(this.flagX, this.yPos, this.flagX, this.bottomY, this.flagRightX, this.midY);
                  fill(0, 0, 0, 50);
                  rect(this.xPos + this.xDiv, this.yPos, this.xOff, this.height);
              };
  
              this.setObjectProps = function(object)
              {
                  object.save = true;
                  object.goto.checkPointLevel = levelInfo.level;
                  object.goto.checkPointIndex = this.index;
                  this.checked = true;
                  this.color = this.green;
              };
              this.onCollide = function(object)
              {
                  if(object.useCheckPoint !== undefined && object.useCheckPoint())
                  {
                      this.setObjectProps(object);
                  }
              };
          };
          gameObjects.addObject("checkPoint", createArray(CheckPoint));
          
          var OneWay = function(xPos, yPos, width, height, colorValue, direction, inHeritance, dynamic)
          { 
              if(!dynamic)
              {
                  Rect.call(this, xPos, yPos, width, height); 
              }else{
                  DynamicRect.call(this, xPos, yPos, width, height); 
              }
              
              this.color = colorValue;
              this.direction = direction;
              this.physics.sides = { };
              
              switch(this.direction)
              {   
                  case "left" :
                      this.physics.sides.left = true;
                      break;
                      
                  case "right" : 
                      this.physics.sides.right = true;
                      break;
                      
                  case "up" : 
                      this.physics.sides.up = true;
                      break;
                      
                  case "down" :
                      this.physics.sides.down = true;
                      break;
              }
              
              this.lastDraw = this.draw;
              this.draw = function()
              {
                  noStroke();
                  fill(this.color);
                  rect(this.xPos, this.yPos, this.width, this.height);
                  
                  var symbol = "L";
                  var textXPos = this.width * 0.2;
                  
                  pushMatrix();
                  translate(this.xPos, this.yPos);
                  switch(this.direction)
                  {   
                      case "right" : 
                          translate(this.width, this.height);
                          rotate(180);
                          break;
                          
                      case "up" : 
                          translate(this.width, 0);
                          rotate(90);
                          break;
                          
                      case "down" :
                          translate(0, this.height);
                          rotate(270);
                          break;
                  }
                  fill(0, 0, 0, 100);
                  textAlign(CENTER, CENTER);
                  textSize(20 * this.width / 40);
                  fill(0, 0, 0, 100);
                  rect(this.width * 0.0, 0, this.width * 0.1, this.height);
                  rect(this.width * 0.3, 0, this.width * 0.1, this.height);
                  for(var i = 0; i < floor(this.height / 10); i++)
                  {
                      text(symbol, 0 + textXPos, 0 + this.height * 0.10 + 10 * i);
                  }
                  textAlign(NORMAL, NORMAL);
                  popMatrix();
              };
              
              if(!inHeritance)
              {
                  screenUtils.loadImage(this, true, "oneWay" + this.direction);
              }
          };
          gameObjects.addObject("oneWay", createArray(OneWay));
          
          var MovingPlatform = function(xPos, yPos, width, height, colorValue, direction)
          {
              OneWay.call(this, xPos, yPos, width, height, colorValue, direction, true, true);
              this.physics.independent = true;
              this.updateVel = function() {};
              this.physics.sides = {
                  up : true, 
              };
              
              this.lastUpdate = this.update;
              this.gravity = 0;
              
              this.xSpeed = 0;
              this.xVel = this.xSpeed;
              this.lastXVel = this.xSpeed;
              
              this.ySpeed = 0;
              this.yVel = this.ySpeed;
              this.lastYVel = this.ySpeed;
              
              this.lastYPos = this.yPos;
              this.lastXPos = this.xPos;
              
              this.draw = function()
              {
                  fill(this.color);
                  rect(this.xPos, this.yPos, this.width, this.height);
                  fill(0, 0, 0, 50);
                  triangle(this.xPos, this.yPos, this.xPos + this.width, this.yPos, this.xPos, this.yPos + this.height);
              }
              
              this.update = function()
              {
                  if(this.xVel === 0 && this.xSpeed !== 0)
                  {
                      this.xVel = ((random(0, 100) > 50) ? -this.xSpeed : this.xSpeed);  
                  }
                 
                  if(this.xVel < 0)
                  {
                      this.xVel = -this.xSpeed;
                  }
                  else if(this.xVel > 0)
                  {
                      this.xVel = this.xSpeed;
                  }
                  if(this.xPos <= levelInfo.xPos)
                  {
                      this.xVel = this.xSpeed;
                  }
                  else if(this.xPos >= levelInfo.xPos + levelInfo.width - this.width)
                  {
                      this.xVel = -this.xSpeed;
                  }
                  this.xPos += this.xVel;
                  
                  if(this.yVel === 0 && this.ySpeed !== 0)
                  {
                      this.yVel = ((random(0, 100) > 50) ? -this.ySpeed : this.ySpeed);  
                  }
                  if(this.yVel < 0)
                  {
                      this.yVel = -this.ySpeed;
                  }
                  else if(this.yVel > 0)
                  {
                      this.yVel = this.ySpeed;
                  }
                  if(this.yPos <= levelInfo.yPos)
                  {
                      this.yVel = this.ySpeed;
                  }
                  else if(this.yPos >= levelInfo.yPos + levelInfo.height - this.height)
                  {
                      this.yVel = -this.ySpeed;
                  }
                  this.yPos += this.yVel;
                  
                  this.lastUpdate();
                  this.lastYPos = this.yPos;
                  this.lastXPos = this.xPos;
              };  
              
              this.onCollide = function(object)
              {  
                  if(object.type === "block" && object.physics.solidObject && object.arrayName !== "crate")
                  {
                      this.xVel = ((this.xPos > object.xPos) ? this.xSpeed : -this.xSpeed);
                      this.yVel = ((this.yPos > object.yPos) ? this.ySpeed : -this.ySpeed);
                  }
                  else if(object.physics.movement === "dynamic" || object.arrayName === "crate")
                  {
                      var condition = false;
                      switch(this.direction)
                      {   
                           case "up" : 
                               condition = (object.yPos + object.height <= this.yPos + abs(object.yVel || 0) && object.yVel >= 0);
                               break;
                               
                           case "down" :
                               conditon = (object.yPos - abs(object.yVel || 0) <= this.yPos + this.height && object.yVel <= 0);
                               break;
                       }
                       if(condition)
                       {
                           if(this.xVel !== 0 && abs(object.xVel) < abs(this.xVel) && this.direction !== "down")
                           {
                               object.xVel = this.xVel;
                           }
                           if(this.yVel !== 0 && abs(object.yVel) < abs(this.yVel) && this.direction !== "down")
                           {
                               object.yVel = this.yVel;
                           }
                       } 
                       if(this.direction === "down")
                       {
                           object.yVel = max(0, object.yVel); 
                           object.inAir = true;
                       }
                       this.xPos = this.lastXPos;
                       this.yPos = this.lastYPos;
                  }
              };
          };
          gameObjects.addObject("movingPlatform", createArray(MovingPlatform));
          
          var Player = function(xPos, yPos, width, height, colorValue)
          { 
              Rect.call(this, xPos, yPos, width, height);  
              DynamicObject.call(this);
              
              this.type = "lifeform";
              
              this.color = colorValue;
              
              this.xAcl = 1.5;
              this.xDeacl1 = 0.2;
              this.maxXVel = 4;
              this.xForce = 2;
              
              this.maxYVel = 12 + 2;
              this.gravity = 0.55;
              this.jumpHeight = 10.5 + 2;
              this.yForce = 0;
              
              this.controls = {
                  left : function()
                  {
                      return keys[LEFT];
                  },
                  right : function()
                  {
                      return keys[RIGHT];
                  },
                  up : function()
                  {
                      return keys[UP];  
                  },
                  down : function()
                  {
                      return keys[DOWN];
                  },
              };
              
              this.maxHp = 10;
              this.hp = this.maxHp;
              this.imageName = "spaceman";
              this.marchTimer = 0;
              this.marchTime = 10;
              
              this.draw = function()
              {
                  if(this.xVel > this.xAcl)
                  {
                      if(!this.inAir)
                      {
                          this.marchTimer++;
                      }
                      this.imageName = (this.marchTimer < this.marchTime / 2) ? "spacemanRight" : "spacemanRight2";
                  }
                  else if(this.xVel < -this.xAcl)
                  {
                      if(!this.inAir)
                      {
                          this.marchTimer++;
                      }
                      this.imageName = (this.marchTimer < this.marchTime / 2) ? "spacemanLeft" : "spacemanLeft2";
                  }else{
                      this.imageName = "spaceman";
                  }
                  if(this.marchTimer > this.marchTime)
                  {
                      this.marchTimer = 0; 
                  }
                  
                  image(storedImages[this.imageName], this.xPos, this.yPos, this.width, this.height); 
              };
              
              this.update = function()
              {
                  if(this.controls.left())
                  {
                      this.xVel -= this.xAcl;  
                  }
                  if(this.controls.right())
                  {
                      this.xVel += this.xAcl;
                  }
                  
                  if(!this.controls.left() && !this.controls.right())
                  {
                      var xDeacl = ((this.inAir) ? this.xDeacl1 * 0.75 : this.xDeacl1);
                      if(this.inAir)
                      {
                          if(this.xVel > 0)
                          {
                               this.xVel += this.xAcl * 0.05; 
                          }
                          if(this.xVel < 0)
                          {
                               this.xVel -= this.xAcl * 0.05; 
                          }
                      }
                      if(this.xVel > 0)
                      {
                           this.xVel -= xDeacl; 
                      }
                      if(this.xVel < 0)
                      {
                           this.xVel += xDeacl; 
                      }
                      
                      if(this.xVel > -xDeacl && this.xVel < xDeacl)
                      {
                          this.xVel = 0;
                      }
                  }
                  
                  if(this.controls.up() && !this.inAir)
                  {
                      this.yVel = -this.jumpHeight;
                  }
                  
                  //If it fell out of the level restart the level
                  if(this.yPos >= levelInfo.yPos + levelInfo.height || this.hp <= 0)
                  {
                      this.dead = true;  
                  }
                  
                  if(this.dead || keys[82])
                  {
                      /*Specific code*/
                      if(this.goto.checkPointLevel !== undefined)
                      {
                          this.goto.travelType = "checkPoint";  
                      }
                      this.dead = false;
                      this.hp = this.maxHp;
                      loader.startLoadLevel(this.goto.checkPointLevel || levelInfo.level);
                  }
                  
                  this.updateVel();
                  this.updateBoundingBox();
                  
                  /*Specific code*/
                  if(!this.added)
                  {
                      travelObjects.add(this);
                      this.added = true;
                  }
              };
              
              /*Specific code*/
              this.goto = {};
              this.activate = function()
              {
                  return (!this.inAir && this.controls.down());
              };
              this.openDoor = this.activate;
              this.useCheckPoint = this.openDoor;
              this.collectItem = this.useCheckPoint;
              this.collectItem = function() 
              {
                  return true;
              };
              
              var object = new DynamicRect(this.xPos, this.yPos, this.width, this.height);
              this.onCollide = object.onCollide;
              this.updateBoundingBox = object.updateBoundingBox;
          };
          gameObjects.addObject("player", createArray(Player));
          
          var levels = {
              "start" : {
                  background : "overworld",
                  doors : {
                      'a' : {
                          level : "level2",
                          symbol : 'b',
                          locked : true,
                      },
                  },
                  keys : {
                      'a' : {
                          level : "start",
                          symbol : 'a',
                      },
                  },
                  signs : {
                      'a' : {
                          message : "Welcome \n user",
                          adjustY : -40,
                          adjustW : 70,
                          adjustH : 30,
                      },
                  },
                  plan : [
                      "                         ",
                      "                         ",
                      "                         ",
                      "                         ",
                      "      x          o       ",
                      "    ggggg   O            ",
                      "                       gg",
                      "                         ",
                      "                O        ",
                      "gggg        ddd          ",
                      "d x       x  ad     gg   ",
                      "d     ss  x  Kd          ",
                      "d         ggggd          ",
                      "d^^                      ",
                      "d a    a                 ",
                      "d D p  S        cc       ",
                      "dggggggggggg##ggggggggsss",
                  ],
              },
              "level2" : {
                  background : "overworld",
                  doors : {
                      'b' : {
                          level : "start",
                          symbol : 'a',
                      },
                  },
                  plan : [
                       "                                ",
                       "                                ",
                       "                               b",
                       "              ##           f   D",
                       "            gggggggg     ggggggg",
                       "                                ",
                       "                                ",
                       "ggg                  sss        ",
                       "                                ",
                       "      sss                       ",
                       "                                ",
                       "                                ",
                       "ssss                            ",
                       "         ggg                    ",
                       "                                ",
                       "      x x                       ",
                       "ggggggggggggggggg               ",
                  ],
              },
          };
          levels.getSymbol = function(col, row, levelPlan)
          {
              if(col >= 0 && col < levelPlan[0].length &&
              row >= 0 && row < levelPlan.length)
              {
                  return levelPlan[row][col];  
              }else{
                  return " ";    
              }
          };
          //Eventually these methods will be with the gameObject arrays (maybe)
          levels.setObjectAtCheckPoint = function(object, xPos, yPos)
          {
              var checkPoint = gameObjects.getObject("checkPoint").getLast();
              if(object.goto !== undefined && object.goto.travelType === "checkPoint" && object.goto.checkPointIndex === checkPoint.index)
              {
                  physics.teleport(object, xPos, yPos);
                  checkPoint.setObjectProps(object);
              }
          };
          levels.setObjectAtDoor = function(object, xPos, yPos, symbol)
          {
              if(object.goto !== undefined && object.goto.travelType === "door" && object.goto.doorSymbol === symbol)
              {
                  physics.teleport(object, xPos, yPos + (levelInfo.unitHeight * 2 - object.height));
              }
          };
          levels.setPlayer = function(xPos, yPos, colorValue)
          {
              //Init with a checkPoint
              gameObjects.getObject("checkPoint").add(xPos, yPos, levelInfo.unitWidth, levelInfo.unitHeight);
              if(gameObjects.getObject("player").length <= 0)
              {
                  gameObjects.getObject("player").add(xPos, yPos - (levelInfo.unitHeight * 1.0), levelInfo.unitWidth, levelInfo.unitHeight * 2.0, colorValue);
                  //Set checkPoint
                  gameObjects.getObject("checkPoint").getLast().setObjectProps(gameObjects.getObject("player").getLast(0));
              }
              this.setObjectAtCheckPoint(gameObjects.getObject("player").getLast(), xPos, yPos);
          };
          levels.build = function(plan)
          {
              var level = this[plan.level];
              levelInfo.width = level.plan[0].length * levelInfo.unitWidth;
              levelInfo.height = level.plan.length * levelInfo.unitHeight;
              backgrounds.setBackground(level.background);
              
              for(var row = 0; row < level.plan.length; row++)
              {
                  for(var col = 0; col < level.plan[row].length; col++)
                  {
                      var xPos = levelInfo.xPos + col * levelInfo.unitWidth;
                      var yPos = levelInfo.yPos + row * levelInfo.unitHeight;
                      
                      /*Prevent objects from generating in the door 
                        besides objects that went though the door*/
                      var belowSymbol = this.getSymbol(col, row + 1, level.plan);
                      if(belowSymbol === 'D')
                      {
                          for(var i = 0; i < travelObjects.length; i++)
                          {
                              this.setObjectAtDoor(gameObjects.getObject(travelObjects[i].arrayName).input(travelObjects[i].index), xPos, yPos, level.plan[row][col]);
                          }
                          continue;
                      }
                      else if(belowSymbol === 'K')
                      {
                          continue;  
                      }
                      
                      switch(level.plan[row][col])
                      {
                          case 'g' : 
                              gameObjects.getObject("ground").add(xPos, yPos, levelInfo.unitWidth, levelInfo.unitHeight, color(120, 96, 81));
                              break;
                              
                          case 'm' :
                              gameObjects.getObject("movingPlatform").add(xPos, yPos, levelInfo.unitWidth, levelInfo.unitHeight, color(200, 200, 20), "up");
                              gameObjects.getObject("movingPlatform").getLast().xSpeed = 3;
                              break;  
                              
                          case 'M' :
                              gameObjects.getObject("movingPlatform").add(xPos, yPos, levelInfo.unitWidth, levelInfo.unitHeight, color(200, 200, 20), "up");
                              gameObjects.getObject("movingPlatform").getLast().ySpeed = 3;
                              break;      
                          case '<' : case '>' : case '^' : case 'v' : 
                              gameObjects.getObject("oneWay").add(xPos, yPos, levelInfo.unitWidth, levelInfo.unitHeight, color(120, 96, 81), ({'<':"left",'>':"right",'^':"up",'v' :"down"}[level.plan[row][col]]));
                              break; 
                              
                          case 'd' : 
                              gameObjects.getObject("dirt").add(xPos, yPos, levelInfo.unitWidth, levelInfo.unitHeight, color(120, 96, 81));
                              break;
                          
                          case '#' :
                              gameObjects.getObject("lava").add(xPos, yPos, levelInfo.unitWidth, levelInfo.unitHeight);
                              break;
                              
                          case 's' : 
                              gameObjects.getObject("spring").add(xPos, yPos, levelInfo.unitWidth, levelInfo.unitHeight);
                              break;
                         
                          case 'S' : 
                              var message = "";
                              var textColor = 0;
                              var colorValue = 0;
                              var fontName = undefined;
                              var symbol = this.getSymbol(col, row - 1, level.plan);
                              var condition = (level.signs !== undefined && level.signs[symbol] !== undefined);
                              
                              if(condition)
                              {
                                  message = level.signs[symbol].message;
                                  textColor = level.signs[symbol].textColor;
                                  colorValue = level.signs[symbol].color;
                                  fontName = level.signs[symbol].font;
                              }
                              
                              gameObjects.getObject("sign").add(xPos, yPos, levelInfo.unitWidth, levelInfo.unitHeight, colorValue, message, textColor, fontName);
                             
                              if(condition)
                              {
                                  var sign = gameObjects.getObject("sign").getLast();
                                  sign.adjustX = level.signs[symbol].adjustX;
                                  sign.adjustY = level.signs[symbol].adjustY;
                                  sign.adjustW = level.signs[symbol].adjustW;
                                  sign.adjustH = level.signs[symbol].adjustH;
                                  sign.textSize = level.signs[symbol].textSize;

                              }
                              sign.load();
                              break;
                          
                          case 'l' : case 'r' : case 'L' : case 'R' :
                              gameObjects.getObject("slope").add(xPos, yPos, levelInfo.unitWidth, levelInfo.unitHeight);
                              gameObjects.getObject("slope").getLast().direction = ({'l':"leftup",'r':"rightup",'L':"leftdown",'R':"rightdown"}[level.plan[row][col]]);
                              //gameObjects.getObject("slope").getLast().setup();
                              break;
                              
                          case 'x' : 
                              gameObjects.getObject("crate").add(xPos, yPos, levelInfo.unitWidth, levelInfo.unitHeight);
                              break;
                              
                          case 'o' :
                              gameObjects.getObject("circle").add(xPos, yPos + levelInfo.unitHeight / 2, levelInfo.unitWidth);
                              gameObjects.getObject("circle").getLast().color = color(175, 175, 175);
                              break;
                              
                          case 'O' :
                              gameObjects.getObject("ring").add(xPos + levelInfo.unitWidth, yPos + levelInfo.unitHeight, levelInfo.unitWidth * 2, color(175, 175, 175));
                              break;     
                          
                          case 'c' :    
                              gameObjects.getObject("dynamicCircle").add(xPos, yPos, levelInfo.unitWidth);
                              gameObjects.getObject("dynamicCircle").getLast().color = color(175, 175, 175, 250);
                              break;
                          
                          case 'p' : 
                              levels.setPlayer(xPos, yPos, color(200, 10, 30));
                              break;
                              
                          case 'f' :
                              gameObjects.getObject("checkPoint").add(xPos, yPos, levelInfo.unitWidth, levelInfo.unitHeight);
                              for(var i = 0; i < travelObjects.length; i++)
                              {
                                  this.setObjectAtCheckPoint(gameObjects.getObject(travelObjects[i].arrayName).input(travelObjects[i].index), xPos, yPos);
                              }
                              break;
  
                          case 'D' :
                              gameObjects.getObject("door").add(xPos, yPos - levelInfo.unitHeight, levelInfo.unitWidth, levelInfo.unitHeight * 2);
                              var door = gameObjects.getObject("door").getLast();
                              var aboveSymbol = this.getSymbol(col, row - 1, level.plan);
                              door.goto = level.doors[aboveSymbol];
                              door.symbol = aboveSymbol;
                              break;  
                              
                          case 'K' : 
                               var scope = level.keys[this.getSymbol(col, row - 1, level.plan)];
                               if(!scope.collected)
                               {
                                   gameObjects.getObject("key").add(xPos, yPos, levelInfo.unitWidth / 2, levelInfo.unitHeight);
                                   gameObjects.getObject("key").getLast().goto = scope;
                               }
                               break;
                      }
                  }
              }
          };
          
          loader.startLoadLevel = function(level)
          {
              this.level = level;
              screenUtils.fade.start(20, (this.firstLoad) ? 20 : 0);
              screenUtils.needsScreenShot = true;
              game.gameState = "load";
          };
          loader.loadLevel = function(level)
          {
              levelInfo.level = level;
              gameObjects.removeObjects();
              levels.build({
                  level : level,
              });
              cameraGrid.setup(levelInfo.xPos, levelInfo.yPos, levelInfo.width / levelInfo.cellWidth, levelInfo.height / levelInfo.cellHeight, levelInfo.cellWidth, levelInfo.cellHeight);
              gameObjects.addObjectsToCameraGrid();
              backgrounds.load();
              cam.attach(function()
              {
                  return gameObjects.getObject("player")[0];
              }, true);
          };
          loader.update = function()
          {
              if(screenUtils.fade.full())
              {
                  this.loadLevel(this.level);
                  game.play();
                  screenUtils.screenShot = get(0, 0, width, height);
                  this.firstLoad = false;
              }
              if(!screenUtils.fade.fading)
              {
                  game.gameState = "play";
              }
              if(screenUtils.screenShot !== undefined)
              {
                  image(screenUtils.screenShot, 0, 0);
              }
          };
          loader.startLoadLevel(levelInfo.level);
          
          game.load = function() 
          {
              loader.update();
          };
          game.play = function()
          {
              pushMatrix();
                  cam.view();
                  backgrounds.drawForeground();
                  gameObjects.apply();
                  //gameObjects.drawBoundingBoxes();
                  //cameraGrid.draw();
                  //cam.draw();
                  signs.drawMessage();
              popMatrix();
              //cam.drawOutline();
  
              //Debug menu
              var player = gameObjects.getObject("player").input(0);
              fill(0, 0, 0, 200);
              text("xPos " + player.xPos.toFixed(2), 10, 20);
              text("yPos " + player.yPos.toFixed(2), 10, 34);
              text("xVel " + player.xVel.toFixed(2), 10, 48);
              text("yVel " + player.yVel.toFixed(2), 10, 62);
              text("inAir " + player.inAir, 10, 76);
              text("hp " + player.hp.toFixed(2), 10, 90);
              //text("crate inAir " + gameObjects.getObject("crate")[0].inAir, 10, 104);
              text(game.version, 360, 20);
          };
          
          var draw = function()
          {   
              frameRate(game.fps);    
              background(255, 255, 255);
              backgrounds.drawBackground();
              game[game.gameState]();
              screenUtils.update();
          };
    }
    if (typeof draw !== 'undefined') processing.draw = draw;
});
