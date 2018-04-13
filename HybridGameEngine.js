var canvas = document.getElementById("canvas");
var processing = new Processing(canvas, function(processing)
{
    processing.size(400, 400);
    processing.background(0xFFF);

    var mouseIsPressed = false;
    processing.mousePressed = function() 
    {
        mouseIsPressed = true;
    };
    processing.mouseReleased = function()
    {
        mouseIsPressed = false;
    };

    var keyIsPressed = false;
    processing.keyPressed = function()
    {
        keyIsPressed = true;
    };
    processing.keyReleased = function() 
    {
        keyIsPressed = false;
    };

    function getImage(s) {
        var url = "https ://www.kasandbox.org/programming-images/" + s + ".png";
        processing.externals.sketch.imageCache.add(url);
        return processing.loadImage(url);
    }

    function getLocalImage(url) {
        processing.externals.sketch.imageCache.add(url);
        return processing.loadImage(url);
    }

    // use degrees rather than radians in rotate functions
    var rotateFn = processing.rotate;
    processing.rotate = function(angle) {
        rotateFn(processing.radians(angle));
    };

    with(processing)
    {  
/**   Hybrid Game Engine  **/
/**
    @Author Prolight
    @Version 0.3.6 beta

    @How  :
        Use the arrow keys to move. Down to go through 
        doors / set Checkpoints / collect keys / items.
        There are crates you can move. 'r' to restart level.
        Have fun, through it's a demo.
    
    @Info  : 
        It's Called Hybrid Game Engine because it's a hybrid between 
        The Cartesian System and physics.
    
    @About Cartesian System  :
        The cartesian system is a coordinate grid Designed to split up
        the objects into cells. Speeds up your game 3x by using cells for
        collision detection between adjacent cells. It only renders cells 
        with in the screen controlled by the camera. Will work with any 
        platformer with an array for the arrays for all of it's gameObjects. I hope
        you understand.
**/

    /**
    Updates  : 
    * v0.0.5 Full Cartesian System in place
    * v0.1.0 Circle and rectangle Physics reached
    * v0.1.5 Objects added 
    * v0.2.0 doors checkpoints keys
    * v0.2.1 Getting ready for graphics
    * v0.2.2 Cloud, dirt, ground and door graphics
    * v0.2.3 Image and screenUtils delegates / Json fully in place
    * v0.2.4 LoadImage function is pretty much done, added extra cloud graphics and a Sun, 
    plus checkPoints now are flags, 
    * v0.2.5 Added Dynamic rectangle physics and the key graphic, crates (with nicer collision) are now in the game just needs the player sprite and then it will be to the next version
    * 
    * 0.2.6 Signs, oneways and moving platforms are added 
    * 0.2.7 Crate and ball physics are completely stablized
    * 0.2.8 Slope Prototype added
    * 0.2.9 Images can now load in khan academy mode
    * 0.3.0 completed slopes though they seem a little glitchy
    * 0.3.1 fps and physics adjusted
    * 0.3.2 Changed graphics to load
    * 0.3.3 - 0.3.4 Added a better player graphic. Made clouds in background move. Removed old background and code
    Title Screen added (too much like original) Pause Menu added. How and extras menu (For extra stuff) added.
    Added an infomation bar.
    * 0.3.5 Made the restart key 'r' so you can't hold it down and have the game keep restarting. Added a tuturial level
    * 0.3.6 Added platforms using oneways, added coins, got rid of suddle glitches with slopes and oneWays.
    
    Added water
    
    Future Updates  :
    **/

//Feel free to look through the code
/////////////////Code///////////////////

var game = {
    gameState : "menu",
    fps : 60,
    version : "v0.3.6 beta",
    debugMode : true, //Turn this to true to see the fps
};
var levelInfo = {
    level : "intro",
    xPos : 0,
    yPos : 0,
    width : width,
    height : height,
    /*Changing this will effect game performance. 
    Too low means that there will be too many cells for the camera to loop through.
    Too high and it means that too many collisions will be checked*/
    cellWidth : 100,
    cellHeight : 100,
    /*Changing this will also effect game performance
    Too low means too many objects in each cell and there for lower fps.
    Too high and you won't be able to see anything but you'll get higher fps*/
    unitWidth : 30,
    unitHeight : 30,
};
var loader = {
    firstLoad : true,
};

var fpsCatcher = {
    lastSecond : second(),
    countedFrames : 0,
    actualFps : game.fps,
    update : function()
    {
        if(this.lastSecond !== second())
        {
            this.actualFps = this.countedFrames;
            this.countedFrames = 0;
        }
        this.countedFrames++;
        this.lastSecond = second();
    },
};

//Constants
var PI_MULT = PI / 180;
var MODE = "pjs";//Ka or pjs
var STICKY_THRESHOLD = 0.004;

//Make sure we have the right angle mode.
angleMode = "degrees";

//predefine
var cam, cameraGrid, GameObject, observer, gameObjects;

smooth();

var keys = [];
var keyPressed = function()
{
    keys[keyCode] = true;
};
var keyReleased = function()
{
    keys[keyCode] = false;
};

var Button = function(xPos, yPos, width, height, colorVal, message)
{
    this.xPos = xPos;
    this.yPos = yPos;
    this.width = width;
    this.height = height;
    this.color = colorVal;
    //this.font = createFont("sans serif");
    this.message = message;
    
    this.textColor = color(0, 0, 0);
    this.draw = function()
    {
        noStroke();
        fill(this.color);
        rect(this.xPos, this.yPos, this.width, this.height, this.round);
        fill(0, 0, 0);
        textAlign(CENTER, CENTER);
        textSize(this.textSize || 12);
        if(this.font !== undefined)
        {
            textFont(this.font);
        }
        fill(this.textColor || this.color);
        text(this.message, this.xPos + this.width / 2, this.yPos + this.height / 2);
    };
    
    this.clicked = function()
    {
        return (mouseIsPressed && observer.collisionTypes.pointrect.colliding({xPos : mouseX, yPos : mouseY}, this));  
    };
};

var buttons = {
    play : new Button(160, 210, 80, 25, color(11, 68, 153, 100), "Play"),
    how : new Button(160, 245, 80, 25, color(11, 68, 153, 100), "How"),
    extras : new Button(160, 280, 80, 25, color(11, 68, 153, 100), "Extras"),
    back : new Button(160, 210 - 30, 80, 25, color(11, 68, 153, 100), "Back"),
    restart : new Button(160, 245 - 30, 80, 25, color(11, 68, 153, 100), "Restart"),
    menu : new Button(160, 280 - 30, 80, 25, color(11, 68, 153, 100), "Menu"),
    back2 : new Button(0, 375, 75, 25, color(11, 68, 153, 100), "Back"),
    settings : new Button(160, 210, 80, 25, color(11, 68, 153, 100), "Settings"),
    debugMode : new Button(145, 200, 110, 25, color(11, 68, 153, 100), "DebugMode " + game.debugMode),
};
buttons.load = function()
{
    for(var i in this)
    {
        this[i].round = 7; 
        this[i].textColor = color(20, 20, 20, 150);
    }
};

var Bar = function(x, y, w, h, c, inRound)
{
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.c = c;
    
    this.input = 0;
    this.set = function(amt, max)
    {
        this.input = (this.w * amt) / max;
    };
    
    this.draw = function(amt, max) 
    {
        fill(this.c);
        rect(this.x, this.y, (amt !== undefined) ? ((this.w * amt) / max) : this.input, this.h, (inRound || 0));
        noFill();
        if(!this.noStroke) 
        { 
            strokeWeight(1);
            stroke(0, 0, 0, 50); 
        }
        rect(this.x, this.y, this.w, this.h, (inRound || 0));
        noStroke();
    };
};

var graphics = {};
graphics.Fade = function(colorValue)
{
    this.colorValue = colorValue;

    this.timer = 0;
    this.timerVel = 0.7;
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
        return(this.timer > this.max);
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

graphics.inClouds = [];
graphics.inClouds.getSpeed = function()
{
    var speed = 0;
    var dir = round(random(-1, 1));
    if(dir === -1)
    {
        speed = -random(0.25, 0.5);
    }
    else if(dir === 1)
    {
        speed = random(0.25, 0.5);
    }
    else if(dir === 0)
    {
        speed = 0;
    }
    return speed;
};
graphics.inClouds.create = function(amt)
{
    this.length = 0;
    var n = 0;
    while(n < amt)
    {
        var x = round(random(0, width));
        var y = round(random(130, 250));
        var speed = this.getSpeed();
        for(var i = 0; i < round(random(1, 3)); i++)
        {
            var w = round(random(30, 70));
            var h = round(random(10, 25));
            var offX = (w / round(random(2, 4))) * ((random(0, 100) > 50) ? 1 : -1);
            var offY = (h / round(random(2, 4))) * ((random(0, 100) > 50) ? 1 : -1);
            this.push([x + offX, y + offY, w, h, {
                speed : speed,
                type : ((random(0, 100) <= 70) ? "rect" : "ellipse"),
            }]);
            n++;
        }
    }
};
graphics.inClouds.draw = function() 
{
    for(var i = 0; i < this.length; i++)
    {
        fill(255, 255, 255, 70);
        this[i][0] += this[i][4].speed;
        if(this[i][4].type === "rect")
        {
            rect(this[i][0], this[i][1], this[i][2], this[i][3], 5);
            if(this[i][0] + this[i][2] < 0)
            {
                this[i][0] = width;
            }
            if(this[i][0] > width)
            {
                this[i][0] = -this[i][2];
            }
        }
        else if(this[i][4].type === "ellipse")
        {
            ellipse(this[i][0], this[i][1], this[i][2], this[i][3]);
            
            var radius = this[i][2] / 2;
            if(this[i][0] + radius < 0)
            {
                this[i][0] = width + radius;
            }
            if(this[i][0] - radius > width)
            {
                this[i][0] = -radius;
            }
        }
    }
};
graphics.stars = [];
graphics.stars.create = function(amt)
{
    for(var i = 0; i < amt; i++)
    {
        this.push([random(0, width), random(0, 115)]);
    }
};
graphics.stars.draw = function() 
{
    for(var i = 0; i < this.length; i++)
    {
        fill(200, 200, 255);
        ellipse(this[i][0], this[i][1], 2, 2);
    }
};

var shapes = {
    bush : function(x, y, w, h)
    {
        for(var i = 0; i < width / 3; i += 70)
        {
            pushMatrix();
            translate(x + i, y);
            rotate(150);
            fill(35, 153, 98);
            ellipse(0, 0, w, h);
            popMatrix();
        }
        for(var i = 0; i < width / 3; i += 70)
        {
            pushMatrix();
            translate(x + 10 + i, y);
            rotate(150);
            fill(16, 128, 62);
            ellipse(0, 0, w - 23, h - 23);
            popMatrix();
        }
    },
    grass : function(x, y, w, h)
    {
        fill(50, 140, 30);
        var bladeW = w * 0.1;
        rect(x, y + h, bladeW, -h);
        rect(x + bladeW, y + h, bladeW, h * -0.4);
        rect(x + bladeW * 2, y + h, bladeW, h * -0.7);
        rect(x + bladeW * 3, y + h, bladeW, h * -0.2);
        rect(x + bladeW * 4, y + h, bladeW, h * -0.5);
        rect(x + bladeW * 5, y + h, bladeW, h * -0.8);
        rect(x + bladeW * 6, y + h, bladeW, h * -0.4);
        rect(x + bladeW * 7, y + h, bladeW, h * -0.9);
        rect(x + bladeW * 8, y + h, bladeW, h * -0.6);
        rect(x + bladeW * 9, y + h, bladeW, h * -0.4);
        rect(x + bladeW * 10, y + h, bladeW, h * -0.7);
    },
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
    background : "spaceFromEarth",
    backgrounds : {
        "spaceFromEarth" : {
            primeLoad : function()
            {
                graphics.stars.create(round(random(30, 80)));
                background(255, 255, 255);
                backgrounds.backgrounds.spaceFromEarth.drawBackground();
                var spaceFromEarth = get(0, 0, 400, 400);
                backgrounds.backgrounds.spaceFromEarth.drawBackground = function()
                {
                    image(spaceFromEarth, 0, 0);
                    graphics.inClouds.draw();
                };
            },
            load : function()
            {
                graphics.inClouds.create(round(random(4, 13)));
            },
            drawBackground : function()
            {
                var backColor = color(147 - 30, 221 - 30, 250 - 30);background(red(backColor), green(backColor), blue(backColor));
                noStroke();
                
                //Atmosphere
                fill(red(backColor) - 10, green(backColor) - 10, blue(backColor) - 10);
                rect(0, 155, 400, 10);
                fill(red(backColor) - 30, green(backColor) - 30, blue(backColor) - 30);
                rect(0, 130, 400, 25);
                fill(red(backColor) - 80, green(backColor) - 80, blue(backColor) - 80);
                rect(0, 90, 400, 40);
                fill(red(backColor) - 130, green(backColor) - 130, blue(backColor) - 130);
                rect(0, 0, 400, 90, 0);
                graphics.stars.draw();
                
                //Moon
                fill(220, 222, 124);
                pushMatrix();
                scale(0.3, 0.3);
                translate(-17, -63);
                beginShape();
                vertex(274, 166);
                bezierVertex(283, 154, 213, 122, 192, 171);
                bezierVertex(179, 228, 264, 258, 286, 200);
                bezierVertex(254, 239, 228, 207, 226, 183);
                bezierVertex(242, 145, 269, 170, 279, 169);
                endShape();
                popMatrix();
                
                //Mountains
                fill(13, 93, 204);
                triangle(343, 308, 213, 421, 299, 239);
                fill(13, 133, 130);
                triangle(317, 308, 200, 421, 266, 256);
                triangle(369, 308, 204, 421, 342, 255);
                
                fill(255, 255, 255, 200);
                triangle(266, 256, 262, 267, 273, 263);
                triangle(342, 255, 348, 266, 332, 266);
                triangle(299, 239, 293, 251, 308, 252);
                
                //Hills
                fill(28, 122, 52);
                ellipse(258, 317, 158, 66);
                fill(30, 130, 50);
                ellipse(71, 298, 153, 60);
                ellipse(15, 338, 114, 58);
                ellipse(371, 332, 146, 70);
                
                //observetory
                var ox = 129;
                var oy = 291;
                fill(130, 130, 130);
                pushMatrix();
                translate(ox, oy);
                scale(1.2, 1.2);
                rotate(208);
                fill(23, 71, 161);
                rect(-2.5, 5, 5, 28);
                fill(24, 92, 161);
                rect(-4.5, 16, 10, 10);
                popMatrix();
                
                //Hills and grass
                fill(23, 71, 161);
                ellipse(ox, oy, 50, 45);
                fill(24, 92, 161);
                ellipse(ox, oy, 33, 33);
                
                shapes.bush(60, 335, 149, 70);
                shapes.bush(270, 344, 122, 70);
                fill(117, 82, 57);
                ellipse(200, 360, 155, 83);
                
                fill(41, 171, 115);
                ellipse(77, 353, 162, 67);
                ellipse(319, 357, 168, 63);
                
                shapes.grass(35, 320, 20, 31);
                shapes.grass(79, 307, 20, 45);
                shapes.grass(121, 333, 20, 17);
                
                shapes.grass(331, 315, 20, 38);
                shapes.grass(289, 333, 20, 17);
                
                //Ground
                fill(56, 158, 25);
                rect(0, 350, 400, 100, 10);
                
                fill(76, 184, 33);
                for(var x = 0; x < width; x += 40)
                {
                    rect(x, 350, 20, 100, 15);
                }
                
                fill(0, 0, 0, 60);
                for(var x = 0; x < width; x += 70)
                {
                    rect(x, 375, 70, 100, 10);
                }
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
    setBackground : function(background1)
    {
        if(this.backgrounds[background1] !== undefined)
        {
            this.background = background1;
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
    primeLoad : function()
    {
        for(var i in this.backgrounds)
        {
             if(this.backgrounds[i].primeLoad !== undefined)
             {
                  this.backgrounds[i].primeLoad(); 
             }
        }
    },
};

var pixelFuncs = {
    safeRead : function(item, col, row)
    {
        return(((col >= 0 && col < item.length) &&
            (row >= 0 && row < item[col].length)) ? item[col][row]  : undefined);
    },
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
    createPixelImage : function(input)
    {
        if(input.pixelSize === undefined)
        {
            input.pixelSize = 1;
        }

        var img = createGraphics(input.width, input.height, P2D);
        img.beginDraw();
        img.noStroke();
        img.background(0, 0, 0, 0);
        for(var row = 0; row < input.pixels.length; row++)
        {
            for(var col = 0; col < input.pixels[row].length; col++)
            {
                var char = pixelFuncs.safeRead(input.pixels, row, col);
                var toFill = (input.pallete[char] !== undefined) ?
                    input.pallete[char]  : "clear";
                if(toFill !== "clear")
                {
                    img.fill(toFill);
                    img.rect(col * input.pixelSize, row * input.pixelSize,
                        input.pixelSize, input.pixelSize);
                }
            }
        }
        img.endDraw();
        return img;
    },
};

var storedImages = {
    "suitLeft" : pixelFuncs.createPixelImage({
        width : 30,
        height : 60,
        replace : true,
        pixelSize : 3,
        pixels : [
            "  iiiiii  ",
            "  ibbbbi  ",
            "  hchcbi  ",
            "  ccccbi  ",
            "  ibbbbi  ",
            "iiibbbbidd",
            "ibbbbbbbdf",
            "ibeebbddbi",
            "ibjebbddbi",
            "ibeeddbbbi",
            "fdejdfbbbi",
            "ffddbbejfd",
            " lddbbeeff",
            " libbbjel ",
            " libbbjel ",
            " lkgbbbill",
            "  gkbbbill",
            "  kg  bi  ",
            "  dd  dd  ",
            "  ff  ff  ",
        ],
        pallete : {
            'b' : color(31, 54, 122),
            'c' : color(0, 0, 0),
            'd' : color(43, 181, 181),
            'e' : color(200, 150, 60),
            'f' : color(43, 132, 181),
            'g' : color(14, 130, 31),
            'h' : color(40, 40, 40),
            'i' : color(31 - 20, 54 - 20, 122 - 20),
            'j' : color(200 - 30, 150 - 30, 60 - 30),
            'k' : color(34, 150, 51),
            'l' : color(51, 51, 51),
        },
    }),
    "suitLeft2" : pixelFuncs.createPixelImage({
        width : 30,
        height : 60,
        replace : true,
        pixelSize : 3,
        pixels : [
            "  iiiiii  ",
            "  ibbbbi  ",
            "  hchcbi  ",
            "  ccccbi  ",
            "  ibbbbi  ",
            "iiibbbbidd",
            "ibbbbbbbdf",
            "ibeebbddbi",
            "ibjebbddbi",
            "ibeeddbbbi",
            "fdejdfbbbi",
            "ffddbbejfd",
            " lddbbeeff",
            " libbbjel ",
            " libbbjel ",
            " lkgbbbill",
            "  gkbbbill",
            "  kg  dd  ",
            "  dd  ff  ",
            "  ff      ",
        ],
        pallete : {
            'b' : color(31, 54, 122),
            'c' : color(0, 0, 0),
            'd' : color(43, 181, 181),
            'e' : color(200, 150, 60),
            'f' : color(43, 132, 181),
            'g' : color(14, 130, 31),
            'h' : color(40, 40, 40),
            'i' : color(31 - 20, 54 - 20, 122 - 20),
            'j' : color(200 - 30, 150 - 30, 60 - 30),
            'k' : color(34, 150, 51),
            'l' : color(51, 51, 51),
        },
    }),
    "suitLeft3" : pixelFuncs.createPixelImage({
        width : 30,
        height : 60,
        replace : true,
        pixelSize : 3,
        pixels : [
            "  iiiiii  ",
            "  ibbbbi  ",
            "  hchcbi  ",
            "  ccccbi  ",
            "  ibbbbi  ",
            "iiibbbbidd",
            "ibbbbbbbdf",
            "ibeebbddbi",
            "ibjebbddbi",
            "ibeeddbbbi",
            "fdejdfbbbi",
            "ffddbbejfd",
            " lddbbeeff",
            " libbbjel ",
            " libbbjel ",
            " lkgbbbill",
            "  gkbbbill",
            "  dd  bi  ",
            "  ff  dd  ",
            "      ff  ",
        ],
        pallete : {
            'b' : color(31, 54, 122),
            'c' : color(0, 0, 0),
            'd' : color(43, 181, 181),
            'e' : color(200, 150, 60),
            'f' : color(43, 132, 181),
            'g' : color(14, 130, 31),
            'h' : color(40, 40, 40),
            'i' : color(31 - 20, 54 - 20, 122 - 20),
            'j' : color(200 - 30, 150 - 30, 60 - 30),
            'k' : color(34, 150, 51),
            'l' : color(51, 51, 51),
        },
    }),
    "suitRight" : pixelFuncs.createPixelImage({
        width : 30,
        height : 60,
        replace : true,
        pixelSize : 3,
        pixels : [
            "  iiiiii  ",
            "  ibbbbi  ",
            "  ibchch  ",
            "  ibcccc  ",
            "  ibbbbi  ",
            "iiibbbbidd",
            "ibbbbbbbdf",
            "ibeebbddbi",
            "ibjebbddbi",
            "ibeeddbbbi",
            "ibejdfbbdf",
            "dfddbbejff",
            "ffddbbeel ",
            " libbbjel ",
            " libbbjel ",
            "llkgbbbil ",
            "llgkbbbi  ",
            "  kg  bi  ",
            "  dd  dd  ",
            "  ff  ff  ",
        ],
        pallete : {
            'b' : color(31, 54, 122),
            'c' : color(0, 0, 0),
            'd' : color(43, 181, 181),
            'e' : color(200, 150, 60),
            'f' : color(43, 132, 181),
            'g' : color(14, 130, 31),
            'h' : color(40, 40, 40),
            'i' : color(31 - 20, 54 - 20, 122 - 20),
            'j' : color(200 - 30, 150 - 30, 60 - 30),
            'k' : color(34, 150, 51),
            'l' : color(51, 51, 51),
        },
    }),
    "suitRight2" : pixelFuncs.createPixelImage({
        width : 30,
        height : 60,
        replace : true,
        pixelSize : 3,
        pixels : [
            "  iiiiii  ",
            "  ibbbbi  ",
            "  ibchch  ",
            "  ibcccc  ",
            "  ibbbbi  ",
            "iiibbbbidd",
            "ibbbbbbbdf",
            "ibeebbddbi",
            "ibjebbddbi",
            "ibeeddbbbi",
            "ibejdfbbdf",
            "dfddbbejff",
            "ffddbbeel ",
            " libbbjel ",
            " libbbjel ",
            "llkgbbbil ",
            "llgkbbbi  ",
            "  dd  bi  ",
            "  ff  dd  ",
            "      ff  ",
        ],
        pallete : {
            'b' : color(31, 54, 122),
            'c' : color(0, 0, 0),
            'd' : color(43, 181, 181),
            'e' : color(200, 150, 60),
            'f' : color(43, 132, 181),
            'g' : color(14, 130, 31),
            'h' : color(40, 40, 40),
            'i' : color(31 - 20, 54 - 20, 122 - 20),
            'j' : color(200 - 30, 150 - 30, 60 - 30),
            'k' : color(34, 150, 51),
            'l' : color(51, 51, 51),
        },
    }),
    "suitRight3" : pixelFuncs.createPixelImage({
        width : 30,
        height : 60,
        replace : true,
        pixelSize : 3,
        pixels : [
            "  iiiiii  ",
            "  ibbbbi  ",
            "  ibchch  ",
            "  ibcccc  ",
            "  ibbbbi  ",
            "iiibbbbidd",
            "ibbbbbbbdf",
            "ibeebbddbi",
            "ibjebbddbi",
            "ibeeddbbbi",
            "ibejdfbbdf",
            "dfddbbejff",
            "ffddbbeel ",
            " libbbjel ",
            " libbbjel ",
            "llkgbbbil ",
            "llgkbbbi  ",
            "  kg  dd  ",
            "  dd  ff  ",
            "  ff      ",
        ],
        pallete : {
            'b' : color(31, 54, 122),
            'c' : color(0, 0, 0),
            'd' : color(43, 181, 181),
            'e' : color(200, 150, 60),
            'f' : color(43, 132, 181),
            'g' : color(14, 130, 31),
            'h' : color(40, 40, 40),
            'i' : color(31 - 20, 54 - 20, 122 - 20),
            'j' : color(200 - 30, 150 - 30, 60 - 30),
            'k' : color(34, 150, 51),
            'l' : color(51, 51, 51),
        },
    }),
    "suit" : pixelFuncs.createPixelImage({
        width : 30,
        height : 60,
        replace : true,
        pixelSize : 3,
        pixels : [
            "  iiiiii  ",
            "  ibbbbi  ",
            "  ichchi  ",
            "  icccci  ",
            "  ibbbbi  ",
            "iiibbbbidd",
            "ibbbbbbbdf",
            "ibeebbddbi",
            "ibjebbddbi",
            "ibeeddbbbi",
            "ibejdfbbbi",
            "fdddbbejdf",
            "ffddbbeeff",
            " libbbjel",
            " libbbjel",
            " lkgbbbil ",
            "llgkbbbill",
            "llkgllbill",
            "  dd  dd  ",
            "  ff  ff  ",
        ],
        pallete : {
            'b' : color(31, 54, 122),
            'c' : color(0, 0, 0),
            'd' : color(43, 181, 181),
            'e' : color(200, 150, 60),
            'f' : color(43, 132, 181),
            'g' : color(14, 130, 31),
            'h' : color(40, 40, 40),
            'i' : color(31 - 20, 54 - 20, 122 - 20),
            'j' : color(200 - 30, 150 - 30, 60 - 30),
            'k' : color(34, 150, 51),
            'l' : color(51, 51, 51),
        },
    }),
};

graphics.infoBarProps = {
    font : createFont("sans serif"),
    height : 17,
};
var screenUtils = {
    fade : new graphics.Fade(color(0, 0, 0)),
    infoBar : {
        height : graphics.infoBarProps.height,
        healthMeter : new Bar(0, 0, 100, graphics.infoBarProps.height - 1, color(34, 190, 51, 70), 10),
        draw : function()
        {
            fill(0, 0, 0, 80);
            noStroke();
            rect(0, 0, width, screenUtils.infoBar.height);
            screenUtils.infoBar.healthMeter.draw();
            
            var player = gameObjects.getObject("player").input(0);
            screenUtils.infoBar.healthMeter.set(player.hp, player.maxHp);
            
            textAlign(CENTER, CENTER);
            fill(0, 0, 0, 100);
            textFont(graphics.infoBarProps.font);
            textSize(11);
            
            fill(0, 12, 12, 50);
            rect(1, 0, 70, screenUtils.infoBar.height, 10);
            fill(0, 0, 0, 160);
            text("Hp " + abs((player.hp || 0).toFixed(0)) + "/" + player.maxHp, 34, screenUtils.infoBar.height - 8);
            
            textAlign(NORMAL, CENTER);
            fill(0, 12, 12, 150);
            rect(125, 0, 140, screenUtils.infoBar.height, 10);
            fill(230, 230, 230, 100);
            text("Coins " + (player.coins || 0) + "    Score " + (player.score || 0), 130, screenUtils.infoBar.height - 8);
            
            fill(0, 12, 12, 150);
            rect(285, 0, 85, screenUtils.infoBar.height, 10);
            fill(230, 230, 230, 100);
            text("Level " + (levelInfo.level || 0), 290, screenUtils.infoBar.height - 8);
        },
    },
    needsScreenShot : false,
    takeScreenShot : function()
    {
        if(this.needsScreenShot)
        {
            this.screenShot = get(0, 0, width, height);
            this.needsScreenShot = false;
        }
    },
    //Use this after defining the draw method in a gameObject
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
        } :
        function()
        {
            image(this.getImg(), this.xPos, this.yPos);
        };
    },
    //Will not work with transparent objects
    loadImage : function(object, constImage, name, notRect, customBackColor, ref)
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
        object[ref || "draw"]();
        var img = get(0, 0, object.width, object.height);
        object.xPos = lastXPos;
        object.yPos = lastYPos;

        if(notRect)
        {
            //Only works for images without curves or angles, if you do have these use createGraphics instead
            pixelFuncs.replacePixels(img, backColor, color(255, 255, 255, 0));
        }

        //Store image
        if(constImage)
        {
            storedImages[name || object.arrayName] = img;
        }
        screenUtils.letImage(object, name || object.arrayName);
    },
    debugMode : function()
    {
        if(!game.debugMode)
        {
            return;
        }
        
        //Debug menu
        var player = gameObjects.getObject("player").input(0);
        fill(0, 0, 0, 200);
        textAlign(NORMAL, NORMAL);
        text("xPos " + player.xPos.toFixed(2), 10, 30);
        text("yPos " + player.yPos.toFixed(2), 10, 44);
        text("xVel " + player.xVel.toFixed(2), 10, 58);
        text("yVel " + player.yVel.toFixed(2), 10, 72);
        text("inAir " + player.inAir, 10, 106);
        text("hp " + player.hp.toFixed(2), 10, 90);
        text(game.version, 330, 30);
        text("sfps " + game.fps + "  afps " + fpsCatcher.actualFps + "  cf " + fpsCatcher.countedFrames + "  s " + second(), 150, 30);
    },
    update : function()
    {
        this.takeScreenShot();
        this.fade.draw();
        if(game.gameState === "play" || game.gameState === "pauseMenu")
        {
            this.infoBar.draw();
        }
        if(game.switchedState && this.fade.full())
        {
            game.gameState = game.switchState; 
            game.switchedState = false;
        }
    },
};

var physics = {
    formulas : {
        crossProduct : function(point1, point2, point3)
        {
            return(point1.xPos - point3.xPos) * (point2.yPos - point3.yPos) -
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
            if(host.yPos + host.height < object.yPos && object.inAir) //&& object.yPos > object.lastYPos)
            {
                object.yPos = object.lastYPos;
            }
            if(abs(object.yVel) < abs(host.yVel))
            {
                if(host.xVel > 0)
                {
                    object.xVel += abs(host.xVel) || 0;
                }
                else if(host.xVel < 0)
                {
                    object.xVel -= abs(host.xVel) || 0;
                }
            }
        },
    },
    getSlopePoints : function(slope1)
    {
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
    
        var slopeRight = slope1.xPos + slope1.width;
        var slopeBottom = slope1.yPos + slope1.height;
        switch(slope1.direction)
        {
            case "leftup" :
                v1.xPos = slope1.xPos;
                v1.yPos = slope1.yPos;
                v2.xPos = slope1.xPos;
                v2.yPos = slopeBottom;
                v3.xPos = slopeRight;
                v3.yPos = slopeBottom;
                break;
    
            case "rightup" :
                v1.xPos = slopeRight;
                v1.yPos = slope1.yPos;
                v2.xPos = slope1.xPos;
                v2.yPos = slopeBottom;
                v3.xPos = slopeRight;
                v3.yPos = slopeBottom;
                break;
    
            case "leftdown" :
                v1.xPos = slope1.xPos;
                v1.yPos = slope1.yPos;
                v2.xPos = slope1.xPos;
                v2.yPos = slopeBottom;
                v3.xPos = slopeRight;
                v3.yPos = slope1.yPos;
                break;
    
            case "rightdown" :
                v1.xPos = slope1.xPos;
                v1.yPos = slope1.yPos;
                v2.xPos = slopeRight;
                v2.yPos = slope1.yPos;
                v3.xPos = slopeRight;
                v3.yPos = slopeBottom;
                break;
        }
        
        //Return our points
        return [v1, v2, v3];
    },
};

//Observer (off limits)
var observer = {
    collisionTypes : {
        "blank" : {
            colliding : function() {},
            solveCollision : function() {},
        },
        "pointrect" : {
            colliding : function(point1, rect1)
            {
                return ((point1.xPos > rect1.xPos && 
                         point1.xPos < rect1.xPos + rect1.width) &&
                        (point1.yPos > rect1.yPos && 
                         point1.yPos < rect1.yPos + rect1.height));   
            },
            solveCollision : function() {},
        },
        "pointpolygon" : {
            colliding : function(point1, polygon1)
            {
                // http ://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
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
        "circleslope" : {
            colliding : function(circle1, slope1)
            {
                var colliding = false;
                var point = {
                    xPos : circle1.xPos,
                    yPos : circle1.yPos,
                };
                switch(slope1.direction)
                {  
                    case "leftup" :
                        var hyp = dist(slope1.xPos, slope1.yPos, slope1.xPos + slope1.width, slope1.yPos + slope1.height);
                        var angle = asin(slope1.width / hyp);
                        point.xPos -= cos(angle) * circle1.radius;
                        point.yPos += sin(angle) * circle1.radius + (circle1.gravity || 1);
                        break;
                        
                    case "rightup" :
                        var hyp = dist(slope1.xPos, slope1.yPos + slope1.height, slope1.xPos + slope1.width, slope1.yPos);
                        var angle = asin(slope1.width / hyp);
                        point.xPos += cos(angle) * circle1.radius;
                        point.yPos += sin(angle) * circle1.radius + (circle1.gravity || 1);
                        break;
                        
                    case "leftdown" :
                        var hyp = dist(slope1.xPos, slope1.yPos + slope1.height, slope1.xPos + slope1.width, slope1.yPos);
                        var angle = asin(slope1.width / hyp);
                        point.xPos -= cos(angle) * circle1.radius;
                        point.yPos -= sin(angle) * circle1.radius;
                        break;
                        
                    case "rightdown" :
                        var hyp = dist(slope1.xPos, slope1.yPos, slope1.xPos + slope1.width, slope1.yPos + slope1.height);
                        var angle = asin(slope1.width / hyp);
                        point.xPos += cos(angle) * circle1.radius;
                        point.yPos -= sin(angle) * circle1.radius;
                        break;
                }
                
                if(circle1.xPos <= slope1.xPos)
                {
                    point.xPos = slope1.xPos;
                }
                if(circle1.xPos >= slope1.xPos + slope1.width)
                {
                    point.xPos = slope1.xPos + slope1.width;
                }
                if(circle1.yPos <= slope1.yPos && (slope1.direction === "leftdown" || slope1.direction === "rightdown"))
                {
                    point.yPos = slope1.yPos;
                }
                if(circle1.yPos >= slope1.yPos + slope1.height &&  (slope1.direction === "leftup" || slope1.direction === "rightup"))
                {
                    point.yPos = slope1.yPos + slope1.height;
                }
                circle1.keptPoint = point;
                //Re-use anther colliding function
                colliding = observer.collisionTypes.rectslope.colliding({}, slope1, [point]);
                return colliding;
            },
            solveCollision : function(circle1, slope1)
            {
                //slope1.color = 0;
                var angle = atan2(slope1.height, slope1.width);
                if(circle1.keptPoint === undefined)
                {
                   return; 
                }
                
                switch(slope1.direction)
                {
                    case "leftup" :
                        var right = slope1.xPos + slope1.width;
                        var w1 = abs(right - circle1.keptPoint.xPos);
                        var h2 = sin(angle) * w1;
                        if(circle1.keptPoint.xPos < right)
                        {
                            circle1.inAir = false;
                            circle1.yVel = min(0, circle1.yVel);
                            circle1.xPos += (slope1.slip || 1);
                            circle1.yPos = (slope1.yPos + (slope1.height - h2)) - (circle1.radius - (circle1.gravity || 1));
                        }
                        break;
                        
                    case "rightup" :
                        var w1 = abs(circle1.keptPoint.xPos - slope1.xPos);
                        var h2 = sin(angle) * w1;
                        if(circle1.keptPoint.xPos > slope1.xPos)
                        {
                            circle1.inAir = false;
                            circle1.yVel = min(0, circle1.yVel);
                            circle1.xPos -= (slope1.slip || 1);
                            circle1.yPos = (slope1.yPos + (slope1.height - h2)) - (circle1.radius - (circle1.gravity || 1));
                        }
                        break;
                        
                    case "leftdown" :
                        var right = slope1.xPos + slope1.width;
                        var w1 = abs(right - circle1.keptPoint.xPos);
                        var h2 = sin(angle) * w1;
                        if(circle1.keptPoint.xPos < right)
                        {
                            circle1.yVel = max(0, circle1.yVel);
                            circle1.xPos += (slope1.slip || 1);
                            circle1.yPos = slope1.yPos + h2 + circle1.radius;
                        }
                        break;
                        
                    case "rightdown" :
                        var w1 = abs(circle1.keptPoint.xPos - slope1.xPos);
                        var h2 = sin(angle) * w1;
                        if(circle1.keptPoint.xPos > slope1.xPos)
                        {
                            circle1.yVel = max(0, circle1.yVel);
                            circle1.xPos -= (slope1.slip || 1);
                            circle1.yPos = slope1.yPos + h2 + circle1.radius;
                        }
                        break;
                }  
            },
        },
        "rectslope" : {
            colliding : function(rect1, slope1, customRectPoints)
            {
                var rect1Points = customRectPoints || [{
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
                var points = physics.getSlopePoints(slope1);
                
                for(var i = 0; i < rect1Points.length; i++)
                {
                    if(observer.collisionTypes.pointpolygon.colliding(rect1Points[i], {
                            points : points
                        }))
                    {
                        return true;
                    }
                }
                if(rect1Points.length > 1)
                {
                    for(var i = 0; i < points.length; i++)
                    {
                        if(observer.collisionTypes.pointpolygon.colliding(points[i], {
                                points : rect1Points
                            }))
                        {
                            return true;
                        }
                    }
                }  
            },
            solveCollision : function(rect1, slope1)
            {
                rect1.lastSlopeCollider = slope1;
                if(rect1.physics.movement === "dynamic" && slope1.physics.movement === "static")
                {
                    rect1.onSlope = true;
                    var slopeRight = slope1.xPos + slope1.width;
                    var slopeBottom = slope1.yPos + slope1.height;
                    var stopY = false;
                    var beforeUp = function()
                    {
                        if(rect1.yPos + rect1.height >= slopeBottom - 1 &&
                            rect1.yPos + rect1.height <= slopeBottom + 2)
                        {
                            if(slope1.direction === "leftup")
                            {
                                rect1.xPos += 1;
                                if(rect1.xPos <= slopeRight)
                                {
                                   rect1.sloped = 0;
                                }
                            }
                            else if(slope1.direction === "rightup")
                            {
                                rect1.xPos -= 1;
                                if(rect1.xPos >= slope1.xPos - rect1.width)
                                {
                                   rect1.sloped = 0;
                                }
                            }
                        }
                        if((slope1.direction === "rightup" && rect1.xPos + rect1.width >= slopeRight) ||
                           (slope1.direction === "leftup" && rect1.xPos + rect1.width < slope1.xPos))
                        {
                            rect1.sloped = 0;
                            rect1.yPos = (slope1.yPos - rect1.height);
                            rect1.yVel = min(rect1.yVel, 0);
                            stopY = true;
                        }
                    };
                    
                    var handleUp = function()
                    {
                        if(rect1.yPos + rect1.height >= slopeBottom - abs(rect1.yVel))
                        {
                            if(((slope1.direction === "rightup" && rect1.xPos + rect1.width <= slope1.xPos + abs(rect1.xVel)) ||
                                (slope1.direction === "leftup" && rect1.xPos + abs(rect1.xVel) >= slopeRight)))
                            {
                                rect1.sloped = 0;
                            }
                            rect1.yVel = min(rect1.yVel, 0);
                        }
                        else if(rect1.yPos + rect1.height <= slope1.yPos + abs(rect1.yVel * 2))
                        {
                            if((slope1.direction === "leftup" && (rect1.xPos <= slope1.xPos)) ||
                                (slope1.direction === "rightup" && (rect1.xPos + rect1.width >= slope1.xPos - abs(rect1.xVel * 2))))
                            {
                                rect1.yPos = slope1.yPos - rect1.height;
                                rect1.yVel = min(rect1.yVel, 0);
                                return true;
                            }
                        }
                    };

                    var handleDown = function()
                    {
                        if(rect1.yPos + rect1.height <= slope1.yPos + abs(rect1.yVel))
                        {
                            if((slope1.direction === "rightdown" && rect1.xPos + abs(rect1.xVel) > slopeRight) ||
                                (slope1.direction === "leftdown" && rect1.xPos + rect1.width < slope1.xPos + abs(rect1.xVel)))
                            {
                                rect1.sloped = 0;
                            }
                            rect1.yVel = max(rect1.yVel, 0);
                        }
                    };

                    switch(slope1.direction)
                    {
                        case "leftup" :
                            beforeUp();
                            if(rect1.xPos + rect1.width >= slope1.xPos)
                            {
                                rect1.inAir = (rect1.yPos + rect1.height >= slopeBottom);
                                if(!handleUp())
                                {
                                    if(!stopY)
                                    {
                                        var angle = atan2(slope1.height, slope1.width);
                                        var w1 = abs(slopeRight - rect1.xPos);
                                        var h2 = sin(angle) * w1;
                                        rect1.yPos = (slope1.yPos + (slope1.height - h2)) - rect1.height;
                                    }
                                    if(rect1.lastRectCollider !== undefined && rect1.lastRectCollider.movement === "dynamic" && !rect1.lastRectCollider.touchedRect)
                                    {
                                        rect1.xPos += (slope1.slip || 1);
                                    }
                                }
                            }
                            break;

                        case "rightup" :
                            beforeUp();
                            var rect1PointXPos = rect1.xPos + rect1.width;
                            if(rect1.xPos <= slopeRight)
                            {
                                rect1.inAir = (rect1.yPos + rect1.height >= slopeBottom);
                                if(!handleUp())
                                {
                                    if(!stopY)
                                    {
                                        var angle = atan2(slope1.height, slope1.width);
                                        var w1 = abs(slope1.xPos - rect1PointXPos);
                                        var h2 = sin(angle) * w1;
                                        rect1.yPos = (slope1.yPos + (slope1.height - h2)) - rect1.height;
                                    }
                                    if(rect1.lastRectCollider !== undefined && rect1.lastRectCollider.movement === "dynamic" && !rect1.lastRectCollider.touchedRect)
                                    {
                                        rect1.xPos -= (slope1.slip || 1);
                                    }
                                }
                            } 
                            break;

                        case "leftdown" :
                            if(rect1.xPos <= slopeRight && !handleDown())
                            {
                                rect1.inAir = true;
                                rect1.yVel = max(rect1.yVel, 0);
                                var angle = atan2(slope1.height, slope1.width);
                                var w1 = abs(slopeRight - rect1.xPos);
                                var h2 = sin(angle) * w1;
                                rect1.yPos = (slope1.yPos + h2);
                            }
                            break;

                        case "rightdown" :
                            var rect1PointXPos = rect1.xPos + rect1.width;
                            if(rect1.xPos <= slopeRight && !handleDown())
                            {
                                rect1.inAir = true;
                                rect1.yVel = max(rect1.yVel, 0);
                                var angle = atan2(slope1.height, slope1.width);
                                var w1 = abs(slope1.xPos - rect1PointXPos);
                                var h2 = sin(angle) * w1;
                                rect1.yPos = (slope1.yPos + h2);
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
                return(circle1.measuredDist <= circle1.radius + circle2.radius);
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

                //Step 1  : Get the closest point on the circle on the rectangle to the circle
                var angle = atan2(circle1.yPos - rect1.middleYPos, circle1.xPos - rect1.middleXPos);
                point1.xPos = rect1.middleXPos + (rect1.halfLineThrough * cos(angle));
                point1.yPos = rect1.middleYPos + (rect1.halfLineThrough * sin(angle));

                //Step 2  : Constrain the point into the rectangle
                point1.xPos = constrain(point1.xPos, rect1.xPos, rect1.xPos + rect1.width);
                point1.yPos = constrain(point1.yPos, rect1.yPos, rect1.yPos + rect1.height);

                //Step 3  : check if the point is colliding with the circle
                circle1.pointDist = dist(circle1.xPos, circle1.yPos, point1.xPos, point1.yPos);
                return(circle1.pointDist <= circle1.radius);
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
                    rect1.inAir = (rect1.yPos + rect1.height >= circle1.yPos);
                    if(circle1.physics.movement === "dynamic" && circle1.yVel === rect1.yVel && !rect1.touchedRect)
                    {
                        circle1.yVel = max(circle1.yVel, 3);
                    }
                    if(rect1.touchedRect)
                    {
                        if(inputX > 0)
                        {
                            rect1.xVel = max(0, rect1.xVel);
                        }
                        else if(inputX < 0)
                        {
                            rect1.xVel = min(0, rect1.xVel);
                        }
                        //Reboot the collision
                        if(rect1.lastRectCollider !== undefined)
                        {
                            if(observer.collisionTypes.rectrect.colliding(rect1, rect1.lastRectCollider))
                            {
                                observer.collisionTypes.rectrect.solveCollision(rect1, rect1.lastRectCollider);
                            }
                        }
                        rect1.collidedWithCircle = false;
                        rect1.touchedRect = false;
                    }
                    
                    //Reboot the collision with the slopes
                    if(rect1.lastSlopeCollider !== undefined)
                    {
                        if(observer.collisionTypes.rectrect.colliding(rect1, rect1.lastSlopeCollider))
                        {
                            observer.collisionTypes.rectrect.solveCollision(rect1, rect1.lastSlopeCollider);
                        }
                    }
                    if(!rect1.inAir)
                    {
                        rect1.yVel = min(rect1.yVel, rect1.maxYVel * (circle1.friction || 0.25));
                    }
                }
                if(circle1.physics.movement === "dynamic")
                {
                    if(rect1.arrayName !== "oneWay")
                    {
                        circle1.xPos -= inputX;
                        circle1.yPos -= inputY;
                        circle1.inAir = (inputY < 0);
                    } else {
                        if(inputX < 0 && rect1.physics.sides.right)
                        {
                            circle1.xPos -= inputX;
                        }
                        else if(inputX > 0 && rect1.physics.sides.left)
                        {
                            circle1.xPos -= inputX;
                        }
                        if(inputY < 0 && rect1.physics.sides.down)
                        {
                            circle1.yPos -= inputY;
                        }
                        else if(inputY > 0 && rect1.physics.sides.up)
                        {
                            circle1.yPos -= inputY;
                        }
                    }
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
                return((rect1.xPos + rect1.width > rect2.xPos &&
                        rect1.xPos < rect2.xPos + rect2.width) &&
                    (rect1.yPos + rect1.height > rect2.yPos &&
                        rect1.yPos < rect2.yPos + rect2.height));
            },
            solveCollision : function(rect1, rect2, extra)
            {
                if(rect1.sloped <= 2)
                {
                    rect1.sloped++;
                    if(rect1.inAir)
                    {
                        rect1.yVel = min(rect1.yVel, 0);
                    }
                    return;
                }
                //Middle position method (best)
                physics.getMiddleXPos(rect1);
                physics.getMiddleYPos(rect1);
                physics.getMiddleXPos(rect2);
                physics.getMiddleYPos(rect2);

                var yAdjust = rect1.xAcl / 10;
                var xAdjust = yAdjust;
                var inY = (rect1.yPos + rect1.height);
                var inY2 = (rect2.yPos + rect2.height);
                var yAdjustRect1Height = rect1.height * yAdjust;

                //Long because it fixes inaccurate top / bottom collisions
                var addY = ((inY < inY2 * (1 - yAdjust * 2)) ?
                    ((inY > rect2.yPos) ? abs(yAdjustRect1Height)  : 0)  :
                    ((rect1.yPos < inY2) ? -yAdjustRect1Height  : 0));

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
                                
                                if(rect2.physics.movement === "static" && rect1.yVel < 0)
                                {
                                     sUp = false;
                                }   
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
                                if(rect1.yVel >= 0)
                                {
                                    rect1.yVel = max(rect1.yVel + (rect1.gravity * 1.2 || 1), 0);
                                }
                                if((rect2.bottom) || (rect1.top && rect1.bottom && (abs(rect1.yVel) < (rect2.yVel) ||
                                        (rect2.yVel === 0 && rect2.lastRectCollider.arrayName !== "oneWay"))))
                                {
                                    rect1.yVel = max(rect1.yVel, 0);
                                    rect2.yVel = max(rect2.yVel, 0);
                                    rect2.yVel += abs(rect1.yVel);
                                    rect1.yVel += abs(rect2.yVel);
                                    rect2.bottom = false;
                                    if(rect1.top)
                                    {
                                        rect1.top = false;
                                        rect1.bottom = false;
                                    }
                                }
                                rect2.top = true;
                            } else {
                                rect1.yVel = 0;
                                rect1.bottom = true;
                            }
                            fail = false;
                            rect1.inAir = true;
                            rect1.yPos = rect2.yPos + rect2.height;
                        }
                        else if(pushY < 0 && up && sUp)
                        {
                            if(rect2Moveable)
                            {
                                rect2.yVel = min(rect2.yVel, (rect2.gravity || 1));
                                if(rect2.yVel <= 0)
                                {
                                    rect1.yVel += rect2.yVel;
                                }
                                rect2.bottom = true;
                            } else {
                                rect1.yVel = 0;
                                rect1.top = true;
                            }
                            fail = false;
                            rect1.inAir = false;
                            if(rect1.yPos + rect1.height < rect2.middleYPos)
                            {
                                rect1.yPos = rect2.yPos - rect1.height;
                            }
                        }
                    }
                }
                if(((abs(pushX) > abs(pushY) || (fail || rect1.collidedWithCircle))))
                {
                    var yAdjustRect2Height = rect2.height * yAdjust;
                    if((rect1.yPos + rect1.height > rect2.yPos + yAdjustRect2Height &&
                            rect1.yPos < rect2.yPos + (rect2.height - yAdjustRect2Height)) || rect2.width < 10)
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
                                sRight = (rect2.xPos + rect1.width <= rect1.xPos + abs(rect1.xVel) && rect1.xVel < 0);
                            }
                            if(!right)
                            {
                                sLeft = (rect1.xPos + rect1.width <= rect2.xPos + abs(rect1.xVel) && rect1.xVel > 0);
                            }
                        }
                        if(pushX > 0 && right && sRight)
                        {
                            if(rect2Moveable)
                            {
                                rect2.xVel = min(rect2.xVel, -rect1.maxXVel);
                                rect1.xVel = max(rect1.xVel, 0);
                            } else {
                                rect1.xVel = 0;
                            }
                            rect1.xPos = rect2.xPos + rect2.width;
                        }
                        if(pushX < 0 && left && sLeft)
                        {
                            if(rect2Moveable)
                            {
                                rect2.xVel = max(rect2.xVel, rect1.maxXVel);
                                rect1.xVel = min(rect1.xVel, 0);
                            } else {
                                rect1.xVel = 0;
                            }
                            rect1.xPos = (rect2.xPos - rect1.width);
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
        } else {
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
        } else {
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

    this.speed = 0.15;//0.2

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
        } else {
            translate(-levelInfo.xPos, 0);
        }
        if(levelInfo.height >= this.height)
        {
            translate(0, this.halfHeight - this.focusYPos);
        } else {
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
    array.add = function(xPos, yPos, width, height, colorValue,
        a, b, c, d, e, f, h, i, j, k, l, m, o, p, q, r, s, t, u, v, w, x, y, z)
    {
        this.push((object.apply === undefined) ? xPos  : new object(xPos, yPos, width, height, colorValue,
            a, b, c, d, e, f, h, i, j, k, l, m, o, p, q, r, s, t, u, v, w, x, y, z));
        this.getLast().name = this.name;
        this.getLast().arrayName = this.name;
        this.getLast().index = this.length - 1;
    };
    array.addObject = function(name, xPos, yPos, width, height, colorValue)
    {
        if(this.references[name] === undefined)
        {
            this.references[name] = this.length;
        } else {
            println("Warning : You cannot have multiple objects \n" +
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
        } else {
            println("Error referencing object '" + name + "'");
            return {};
        }
    };
    array.input = function(index)
    {
        if(this[index] !== undefined)
        {
            return this[index];
        } else {
            return new GameObject(0, 0); //{};      
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
        return; //We don't want to process anything that doesn't move
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
                //If an object is going to be tested with itself skip the loop
                if(objectA.arrayName === cell[i].arrayName && objectA.index === cell[i].index)
                {
                    continue;
                }


                var objectB = this.getObject(cell[i].arrayName).input(cell[i].index);

                //Test boundingBoxes
                if(!observer.boundingBoxesColliding(objectA.boundingBox, objectB.boundingBox))
                {
                    continue;
                }

                var colliding = true;
                if(!(objectA.physics.shape === "rect" && objectB.physics.shape === "rect")) //Assuming rects fill their boundingBox
                {
                    colliding = observer.colliding(objectA, objectB);
                }

                if(colliding)
                {
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
                array.applyObject(cell[i].index); //Needed for moving objects around

                /*Keep the cell up to date
                Note : use this before referencing a cell*/
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
                
                //Signify that we've used the object for this loop
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
        this.inLiquid = false;
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
    this.xAcl = 1.5 * 0.7;
    this.xDeacl = 0.4 * 0.3;
    this.maxXVel = 4 * 0.7;

    this.maxYVel = 12 * 0.75;
    this.gravity = 0.4 * 0.6;
    this.jumpHeight = 10.5 * 0.75;
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
    this.color = colorValue || color(175, 175, 175, 100);
    this.physics.shape = "slope";
    this.direction = "leftup";

    var thicknessX = 0.1;
    var bindingX = 3;
    var thicknessY = 0.1;
    var bindingY = 3;
    this.slip = 0.5;
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
    };
};
gameObjects.addObject("slope", createArray(Slope));

var OneWay = function(xPos, yPos, width, height, colorValue, direction, inHeritance, dynamic)
{
    if(!dynamic)
    {
        Rect.call(this, xPos, yPos, width, height);
    } else {
        DynamicRect.call(this, xPos, yPos, width, height);
    }

    this.color = colorValue;
    this.direction = direction;
    this.physics.sides = {};

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

var FallingBlock = function(xPos, yPos, width, height, colorValue)
{
    Rect.call(this, xPos, yPos, width, height);
    this.color = colorValue || color(0, 0, 0, 70);
    
    this.draw = function()
    {
        fill(this.color);
        rect(this.xPos, this.yPos, this.width, this.height);
        rect(this.xPos + this.width * 0.15, this.yPos + this.height * 0.15, this.width * 0.7, this.height * 0.7);
    };
};
gameObjects.addObject("fallingBlock", createArray(FallingBlock));

var MovingPlatform = function(xPos, yPos, width, height, colorValue, direction, fixed, noRender)
{
    OneWay.call(this, xPos, yPos, width, height, colorValue, direction, true, !fixed);
    this.physics.independent = true;
    this.updateVel = function() {};
    this.physics.sides = {
        up : true,
    };

    this.physics.movement = (fixed) ? "static" : "dynamic"; 

    this.lastUpdate = this.update;
    this.gravity = 0;

    this.xSpeed = 0;
    this.xVel = this.xSpeed;
    this.lastXVel = this.xVel;

    this.ySpeed = 0;
    this.yVel = this.ySpeed;
    this.lastYVel = this.yVel;

    this.lastYPos = this.yPos;
    this.lastXPos = this.xPos;

    this.draw = function()
    {
        fill(this.color);
        rect(this.xPos, this.yPos, this.width, this.height);
        fill(0, 0, 0, 50);
        triangle(this.xPos, this.yPos, this.xPos + this.width, this.yPos, this.xPos, this.yPos + this.height);
    };
    
    screenUtils.loadImage(this, true, "movingPlatform");
        
    this.update = (this.physics.movement === "dynamic") ? function()
    {
        if(this.xVel === 0 && this.xSpeed !== 0)
        {
            this.xVel = ((random(0, 100) > 50) ? -this.xSpeed  : this.xSpeed);
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
            this.yVel = ((random(0, 100) > 50) ? -this.ySpeed  : this.ySpeed);
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
    } : this.update;

    this.onCollide = (this.physics.movement === "dynamic") ? function(object)
    {
        if(object.type === "block" && object.physics.solidObject && object.arrayName !== "crate")
        {
            this.xVel = ((this.xPos > object.xPos) ? this.xSpeed  : -this.xSpeed);
            this.yVel = ((this.yPos > object.yPos) ? this.ySpeed  : -this.ySpeed);
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
                    condition = (object.yPos - abs(object.yVel || 0) <= this.yPos + this.height && object.yVel <= 0);
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
    } : this.onCollide;
};
gameObjects.addObject("movingPlatform", createArray(MovingPlatform));

var Lava = function(xPos, yPos, width, height, colorValue, damage)
{
    Rect.call(this, xPos, yPos, width, height);
    this.color = colorValue || color(175, 30, 40); //color(170, 70, 80);
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

    this.num = round(random(0, 1000));
    screenUtils.loadImage(this, true, "lava" + this.num);

    this.damage = damage || 0.075;
    this.onCollide = function(object)
    {
        if(object.type === "lifeform")
        {
            object.hp -= this.damage;
        }
    };
};
gameObjects.addObject("lava", createArray(Lava));

var MovingLava = function(xPos, yPos, width, height, colorValue, damage)
{
    Lava.call(this, xPos, yPos, width, height, colorValue);
    MovingPlatform.call(this, xPos, yPos, width, height, colorValue, "left", false);
    this.lastOnCollide = this.onCollide;
    this.imageName = "lava" + this.num;
    
    this.physics.solidObject = true;

    this.damage = damage || 0.05;
    this.onCollide = function(object)
    {
        this.lastOnCollide(object);
        if(object.type === "lifeform")
        {
            object.hp -= this.damage;
        }
    };
};
gameObjects.addObject("movingLava", createArray(MovingLava));

var Water = function(xPos, yPos, width, height, colorValue)
{
    Rect.call(this, xPos, yPos, width, height, colorValue); 
    this.color = colorValue || color(40, 103, 181, 150);
    this.physics.solidObject = false;
    
    this.thickness = 1.405;
    
    this.onCollide = function(object)
    {
        if(object.physics.movement === "dynamic")
        {
            object.inAir = false;
            object.inLiquid = true;
            object.yVel = object.yVel / this.thickness;
            object.xVel = object.xVel / this.thickness;
        }
    };
};
gameObjects.addObject("water", createArray(Water));

var Crate = function(xPos, yPos, width, height, colorValue)
{
    DynamicRect.call(this, xPos, yPos, width, height, colorValue || color(190, 160, 84));

    this.breakPercent = 0;
    this.breakRate = 0.05;
    this.xDeacl = 0.35; //Turn this up for less glitches

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

var Coin = function(xPos, yPos, diameter, colorValue, amt)
{
    Circle.call(this, xPos, yPos, diameter);
    this.color = colorValue || color(184, 194, 75, 150);
    this.amt = amt || 1;
    this.score = this.amt * 100;
    this.physics.solidObject = false;
    
    this.onCollide = function(object)
    {
        if(object.arrayName === "player")
        {
            object.coins += this.amt;
            object.score += this.score;
            this.remove(); //Don't forget to delete the coin!
        }
    };
}
gameObjects.addObject("coin", createArray(Coin));

var HpCoin = function(xPos, yPos, diameter, colorValue, amt)
{
    Circle.call(this, xPos, yPos, diameter);
    this.color = colorValue || color(75, 194, 164 - 50, 200);
    
    this.amt = amt || 1;
    this.score = this.amt * 100;
    this.physics.solidObject = false;
    
    this.onCollide = function(object)
    {
        if(object.arrayName === "player")
        {
            object.hp += this.amt;
            object.hp = min(object.hp, object.maxHp);
            object.score += this.score;
            this.remove(); //Don't forget to delete the hpCoin!
        }
    };
};
gameObjects.addObject("hpCoin", createArray(HpCoin));

var Ring = function(xPos, yPos, diameter, colorValue)
{
    Circle.call(this, xPos, yPos, diameter);
    this.color = colorValue;

    this.angle = 0;
    this.bladeSpeed = round(random(3, 8)) * ((random(0, 100) > 50) ? 1  : -1) * 0.75;
    this.bladeColor = color(0, 100, 230);

    this.arcSize = this.diameter * 2 / 3;
    this.bladeRanges = [
        [0, 90],
        [90, 180],
        [180, 270],
        [270, 360]
    ];

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

var Block = function(xPos, yPos, width, height, colorValue)
{
    this.noGrass = true;
    this.arrayName = "block";
    Ground.call(this, xPos, yPos, width, height, colorValue);
};
gameObjects.addObject("block", createArray(Block));

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
    screenUtils.loadImage(this, true, "sign" + this.color, true);
    
    this.lastDraw = this.draw;
    this.draw = function()
    {
        this.lastDraw();     
        if(this.active)
        {
            this.drawMessage();
        }
        this.active = false;
    };
    
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
            //Note  : There used to be a try catch block here but I removed it because it stalls the program
            this.font = createFont(this.fontName);
            this.fontName = undefined;
        }
    };

    this.sleep = 0;
    this.drawMessage = function()
    {
        this.sleep++;
        //Wait a sec to render the sign's message to reduce lag
        if(this.sleep < 5)
        {
            return;  
        }
        
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
            if(keys[84])
            {
                println(this.message);
            }
        }
    };
};
gameObjects.addObject("sign", createArray(Sign));

var Door = function(xPos, yPos, width, height, colorValue)
{
    Rect.call(this, xPos, yPos, width, height);
    this.physics.solidObject = false;
    this.color = colorValue || color(58 - 30, 175 - 30, 67 - 30);//color(56, 140, 56);//color(76, 140, 76);
    this.goto = {};

    this.draw = function()
    {
        fill(this.color);
        rect(this.xPos, this.yPos, this.width, this.height);

        fill(0, 0, 0, 30);
        rect(this.xPos + this.width * 0.1, this.yPos + this.height * 0.05, this.width * 0.8, this.height * 0.9);

        fill(this.color, this.color, this.color, 20);
        rect(this.xPos, this.yPos + this.height / 2, this.width, this.height / 2);

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
        fill(0, 0, 0, 30);
        textAlign(CENTER, CENTER);
        textSize(30);
        text(this.symbol, this.xPos + this.width * 0.5, this.yPos + this.height * 0.4);
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
    
    screenUtils.loadImage(this, true, "key", true);
    
    this.lastDraw = this.draw;
    this.draw = function()
    {
        this.lastDraw();
        
        fill(0, 0, 0, 100);
        rect(this.xPos - this.width * 1.6, this.yPos - this.height * 0.65, this.width * 4.3, this.height * 0.5, 5);
        fill(20, 200, 200, 150);
        textAlign(CENTER, CENTER);
        textSize(11);
        text("Key " + this.goto.level + " " + this.goto.symbol, this.xPos + this.width * 0.4, this.yPos - this.height * 0.4);
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
    //this.flagX = this.xPos + this.xOff + this.xDiv;
    //this.flagRightX = this.xPos + this.width * 0.7 + this.xDiv;
    this.flagX2 = this.xOff + this.xDiv;
    this.flagRightX2 = this.width * 0.7 + this.xDiv;
    this.midY = this.yPos + this.height / 4;
    this.bottomY = this.yPos + this.height / 2;
    
    this.loadImg = function(colorValue)
    {
        var img = createGraphics(0, 0, P2D);
        img.noStroke();
        img.beginDraw();
        img.background(0, 0, 0, 0);
        img.fill(colorValue);
        img.triangle(this.flagX2, 0, this.flagX2, this.height / 2, this.flagRightX2, this.height / 4);
        img.fill(0, 0, 0, 50);
        img.rect(this.xDiv, 0, this.xOff, this.height);
        img.endDraw();
        return img;
    };
    
    this.draw = function()
    {
        if(storedImages.redFlag === undefined)
        {
            storedImages.redFlag = this.loadImg(color(200, 0, 0));
        }
        if(storedImages.flag === undefined)
        {
            storedImages.flag = this.loadImg(this.color);
        }
        
        this.draw = function()
        {
           if(this.color !== color(200, 0, 0))
           {
               image(storedImages.flag, this.xPos, this.yPos);
           }else{
               image(storedImages.redFlag, this.xPos, this.yPos);
           }
        };
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

var Player = function(xPos, yPos, width, height, colorValue)
{
    Rect.call(this, xPos, yPos, width, height);
    DynamicObject.call(this);

    this.type = "lifeform";
    this.color = colorValue;

    this.xAcl = 1.5 * 0.75;//0.7
    this.xDeacl = 0.2 * 0.3;//0.3
    this.maxXVel = 4 * 0.75;//0.7

    this.maxYVel = 14 * 0.75;
    this.gravity = 0.325;//0.55 * 0.5; 0.3
    this.jumpHeight = 12.5 * 0.75;

    this.coins = 0;
    this.score = 0;
    this.swimSpeed = 2;
    
    this.controls = {
        left : function()
        {
            return keys[LEFT] || keys[65];
        },
        right : function()
        {
            return keys[RIGHT] || keys[68];
        },
        up : function()
        {
            return keys[UP] || keys[87];
        },
        down : function()
        {
            return keys[DOWN] || keys[83];
        },
    };

    this.maxHp = 5;
    this.hp = this.maxHp;
    this.imageName = "spaceman";
    this.marchTimer = 0;
    this.marchTime = 30;
    this.splitMarchTime = this.marchTime / 3;
    
    this.revive = function()
    {
        this.dead = false;
        this.hp = this.maxHp;
    };
    
    this.draw = function()
    {
        var img = "suit";//spaceman
        if(this.xVel > this.xAcl)
        {
            if(!this.inAir)
            {
                this.marchTimer++;
            }
            this.imageName = (this.marchTimer < this.splitMarchTime) ? img + "Right" : (this.marchTimer < this.splitMarchTime * 2) ? img + "Right2" : img + "Right3";
        }
        else if(this.xVel < -this.xAcl)
        {
            if(!this.inAir)
            {
                this.marchTimer++;
            }
            this.imageName = (this.marchTimer < this.splitMarchTime) ? img + "Left" : (this.marchTimer < this.splitMarchTime * 2) ? img + "Left2" : img + "Left3";
        }else{
            this.imageName = img;
        }
        if(this.marchTimer > this.marchTime)
        {
            this.marchTimer = 0;
        }
        image(storedImages[this.imageName], this.xPos, this.yPos, this.width, this.height);
    };

    this.handleDeath = function()
    {
        /*Specific code*/
        if(this.goto.checkPointLevel !== undefined)
        {
            this.goto.travelType = "checkPoint";
        }
       
        loader.startLoadLevel(this.goto.checkPointLevel || levelInfo.level);
    };

    this.restart = false;
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
            var xDeacl = ((this.inAir) ? this.xDeacl * 0.75  : this.xDeacl);
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

        if(this.controls.up())
        {
            if(this.inLiquid)
            {
                this.yVel = -this.swimSpeed; 
            }
            else if(!this.inAir)
            {
                this.yVel = -this.jumpHeight;
            }
        }
        
        if(this.controls.down())
        {
            if(this.inLiquid)
            {
                this.yVel += this.swimSpeed / 2; 
            }
        }

        //If it fell out of the level restart the level
        if(this.yPos >= levelInfo.yPos + levelInfo.height || this.hp <= 0)
        {
            this.dead = true;
        }

        //Restart key 'r' spam protection
        if(!this.restart && !keys[82])
        {
            this.restart = true;
        }
        
        if(this.dead || (this.restart && keys[82])) //or 'r'
        {
            this.handleDeath();
            this.restart = false;
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
        return(!this.inAir && this.controls.down());
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
    "intro" : {
        background : "spaceFromEarth",
        doors : {
            'a' : {
                level : "intro",
                symbol : 'b',
            },
            'b' : {
                level : "intro",
                symbol : 'a',
            },
            'c' : {
                level : "intro",
                symbol : 'd',
                locked : true,
            },
            'd' : {
                level : "intro",
                symbol : 'c',
            },
            'e' : {
                level : "level1",
                symbol : 'a',
            }
        },
        signs : {
            'a' : {
                message : "Arrow keys to move\nor wasd",
                color : color(100, 100, 100),
                adjustY : -40,
                adjustW : 100,
                adjustH : 35,
            },
            'b' : {
                message : "Press down to\n activate this\n checkpoint",
                color : color(100, 100, 100),
                adjustY : -40,
                adjustW : 100,
                adjustH : 45,
            },
            'c' : {
                message : "Or to go through\n a door",
                color : color(100, 100, 100),
                adjustY : -40,
                adjustW : 100,
                adjustH : 35,
            },
            'd' : {
                message : "Doors can take you\n to other levels too",
                adjustY : -40,
                adjustW : 100,
                adjustH : 35,
            },
            'e' : {
                message : "Collect items\n such as keys.",
                color : color(100, 100, 100),
                adjustY : -40,
                adjustW : 100,
                adjustH : 35,
            },
            'f' : {
                message : "You've finished\nthe tutorial level!",
                color : color(100, 100, 100),
                adjustY : -20,
                adjustW : 100,
                adjustH : 35,
            },
            'g' : {
                message : "Oh and watch out\nfor enemies and\n hazards",
                adjustY : -40,
                adjustW : 100,
                adjustH : 40,
            },
            'h' : {
                message : "You can press 'p' at\nany time to pause\nyour game",
                color : color(100, 100, 100),
                adjustY : -40,
                adjustW : 100,
                adjustH : 45,
            },
            'i' : {
                message : "'r' lets you quickly\nreset the level.",
                adjustY : -40,
                adjustW : 100,
                adjustH : 35,
            },
            'j' : {
                message : "Press 't' if you\n can't read a sign",
                adjustY : -40,
                adjustW : 100,
                adjustH : 35,
            },
        },
        keys : {
            'a' : {
                level : "intro",
                symbol : 'c',
            },
        },
        plan : [ 
            "   p                                                ",
            "                                                    ",
            "                                                    ",
            "                                                    ",
            "                                                    ",
            "                       b   d   e   a   h   i   j   c",
            "                       D   S   S   K   S   S   S   D",
            "                      gggggggggggggggggggggggggggggg", 
            "                      dddddddddddddddddddddddddddddd",
            "                      ddddddddddddddddd             ",
            "                      dddddddddddd   f   g         e",
            "   a   b       c   a  dddddddddddD   S   S         D",
            "   S   S   f   S   D  ddddddddddddddddddddd##dd#dddd",
            "ggggggggggggggggggggggddddddddddd##dddddd###dddddddd",
        ],
    },
    "level1" : {
        doors : {
            'a' : {
                level : "intro",
                symbol : 'e',
            },
        },
        plan : [
            "                          ",
            "                          ",
            "                          ",
            "                          ",
            "                          ",
            "                          ",
            "                          ",
            "                          ",
            "                          ",
            "        FFF               ",
            "a                         ",
            "D  p                      ",
            "gggggbbbgggggbbbgggggggggg",
            "dddddddddddddddddddddddddd",
        ],
    },
    "test" : {
        doors : {
            'a' : {
                level : "test",
                symbol : 'a',
            },
        },
        keys : {
            'a' : {
                level : "test",
                symbol : 'a',
            },
        },
        plan : [
            "             ",
            "             ",
            "             ",
            "             ",
            "             ",
            "             ",
            "             ",
            "             ",
            "             ",
            "             ",
            "     a   a   ",
            "p    D   K   ",
            "gggggggggggggg",
        ],
    },  
};
levels.getSymbol = function(col, row, levelPlan)
{
    if(col >= 0 && col < levelPlan[0].length &&
        row >= 0 && row < levelPlan.length)
    {
        return levelPlan[row][col];
    } else {
        return " ";
    }
};
//Eventually these methods will be with the gameObject arrays (maybe)
levels.setObjectAtCheckPoint = function(object, xPos, yPos)
{
    var checkPoint = gameObjects.getObject("checkPoint").getLast();
    if(object.goto !== undefined && object.goto.travelType === "checkPoint" && object.goto.checkPointIndex === checkPoint.index)
    {
        physics.teleport(object, xPos, yPos - abs(object.height - levelInfo.unitHeight));
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
        gameObjects.getObject("player").add(xPos, yPos - abs(levelInfo.unitHeight * 2 - levelInfo.unitHeight), levelInfo.unitWidth, levelInfo.unitHeight * 2, colorValue);
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
                    var object = gameObjects.getObject(travelObjects[i].arrayName).input(travelObjects[i].index);
                    this.setObjectAtDoor(object, xPos, yPos, level.plan[row][col]);
                }
                continue;
            }
            else if(belowSymbol === 'K' || belowSymbol === 'S')
            {
                continue;
            }

            switch(level.plan[row][col])
            {
                case 'g' :
                    gameObjects.getObject("ground").add(xPos, yPos, levelInfo.unitWidth, levelInfo.unitHeight, color(107, 83, 60));//color(120, 96, 81));
                    break;

                case 'd' :
                    gameObjects.getObject("dirt").add(xPos, yPos, levelInfo.unitWidth, levelInfo.unitHeight, color(107, 83, 60));
                    break;
                
                case 'b' : 
                    gameObjects.getObject("block").add(xPos, yPos, levelInfo.unitWidth, levelInfo.unitHeight, color(130, 130, 130));
                    break;
                
                case 'w' : 
                    gameObjects.getObject("water").add(xPos, yPos, levelInfo.unitWidth, levelInfo.unitHeight);
                    break;
                
                case '#' :
                    gameObjects.getObject("lava").add(xPos, yPos, levelInfo.unitWidth, levelInfo.unitHeight);
                    break;

                case 'n' : 
                    gameObjects.getObject("movingLava").add(xPos, yPos, levelInfo.unitWidth, levelInfo.unitHeight);
                    gameObjects.getObject("movingLava").getLast().xSpeed = 2;
                    break;
                    
                case 'N' : 
                    gameObjects.getObject("movingLava").add(xPos, yPos, levelInfo.unitWidth, levelInfo.unitHeight);
                    gameObjects.getObject("movingLava").getLast().ySpeed = 2;
                    break;  
                    
                case 's' :
                    gameObjects.getObject("spring").add(xPos, yPos, levelInfo.unitWidth, levelInfo.unitHeight);
                    break;
                    
                case 'P' : 
                    gameObjects.getObject("movingPlatform").add(xPos, yPos, levelInfo.unitWidth, levelInfo.unitHeight, color(20, 20, 200), "up", true);
                    break;

                case 'x' :
                    gameObjects.getObject("crate").add(xPos, yPos, levelInfo.unitWidth, levelInfo.unitHeight);
                    break;

                case 'm' :
                    gameObjects.getObject("movingPlatform").add(xPos, yPos, levelInfo.unitWidth, levelInfo.unitHeight, color(200, 200, 20), "up");
                    gameObjects.getObject("movingPlatform").getLast().xSpeed = 1.5;
                    break;

                case 'M' :
                    gameObjects.getObject("movingPlatform").add(xPos, yPos, levelInfo.unitWidth, levelInfo.unitHeight, color(200, 200, 20), "up");
                    gameObjects.getObject("movingPlatform").getLast().ySpeed = 1.5;
                    break;

                case 'c' : 
                    gameObjects.getObject("coin").add(xPos + levelInfo.unitWidth / 2, yPos + levelInfo.unitHeight / 2, levelInfo.unitWidth / 2);
                    break;
                    
                case 'h' :
                    gameObjects.getObject("hpCoin").add(xPos + levelInfo.unitWidth / 4, yPos + levelInfo.unitHeight / 4, levelInfo.unitWidth / 2);
                    break;

                case 'o' :
                    gameObjects.getObject("circle").add(xPos, yPos + levelInfo.unitHeight / 2, levelInfo.unitWidth);
                    gameObjects.getObject("circle").getLast().color = color(175, 175, 175);
                    break;

                case 'O' :
                    gameObjects.getObject("ring").add(xPos + levelInfo.unitWidth, yPos + levelInfo.unitHeight, levelInfo.unitWidth * 2, color(175, 175, 175));
                    break;

                case '0' :
                    gameObjects.getObject("dynamicCircle").add(xPos + levelInfo.unitWidth / 2, yPos + levelInfo.unitHeight / 2, levelInfo.unitWidth);
                    gameObjects.getObject("dynamicCircle").getLast().color = color(175, 175, 175, 250);
                    break;
                    
                case 'F' : 
                    gameObjects.getObject("fallingBlock").add(xPos, yPos, levelInfo.unitWidth, levelInfo.unitHeight);
                    break;

                case '<' : case '>' : case '^' : case 'v' :
                    gameObjects.getObject("oneWay").add(xPos, yPos, levelInfo.unitWidth, levelInfo.unitHeight, color(120, 96, 81), ({
                        '<' : "left",
                        '>' : "right",
                        '^' : "up",
                        'v' : "down"
                    }[level.plan[row][col]]));
                    break;

                case 'l' : case 'r' : case 'L' : case 'R' :
                    gameObjects.getObject("slope").add(xPos, yPos, levelInfo.unitWidth * 2, levelInfo.unitHeight, color(0, 0, 0, 150));
                    gameObjects.getObject("slope").getLast().direction = ({
                        'l' : "leftup",
                        'r' : "rightup",
                        'L' : "leftdown",
                        'R' : "rightdown"
                    }[level.plan[row][col]]);
                    break;
                    
                case 'S' :
                    var message = "";
                    var textColor = 0;
                    var colorValue;
                    var fontName;
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
                        sign.load();
                    }
                    break; 
                    
                case 'p' :
                    levels.setPlayer(xPos, yPos, color(200, 10, 30));
                    break;
                    
                case 'D' :
                    gameObjects.getObject("door").add(xPos, yPos - levelInfo.unitHeight, levelInfo.unitWidth, levelInfo.unitHeight * 2);
                    var door = gameObjects.getObject("door").getLast();
                    var aboveSymbol = this.getSymbol(col, row - 1, level.plan);
                    door.goto = level.doors[aboveSymbol];
                    door.symbol = aboveSymbol;
                    
                    //Reminder
                    if(level.doors[aboveSymbol].symbol === undefined)
                    {
                        println("Error : missing goto symbol in door '" + aboveSymbol + "'"); 
                    }
                    break;
                    
                case 'f' :
                    gameObjects.getObject("checkPoint").add(xPos, yPos, levelInfo.unitWidth, levelInfo.unitHeight);
                    for(var i = 0; i < travelObjects.length; i++)
                    {
                        this.setObjectAtCheckPoint(gameObjects.getObject(travelObjects[i].arrayName).input(travelObjects[i].index), xPos, yPos);
                    }
                    break;
                    
                case 'K' :
                    var scope = level.keys[this.getSymbol(col, row - 1, level.plan)];
                    if(!scope.collected)
                    {
                        gameObjects.getObject("key").add(xPos + levelInfo.unitWidth * 0.2, yPos, levelInfo.unitWidth / 2, levelInfo.unitHeight);
                        gameObjects.getObject("key").getLast().goto = scope;
                    }
                    break;
            }
        }
    }
};

game.startFade = function(top)
{
    screenUtils.fade.start(20, (top) ? 20 : 0);
};
loader.startLoadLevel = function(level)
{
    this.level = level;
    game.startFade(this.firstLoad);
    screenUtils.needsScreenShot = true;
    game.tempState = game.gameState;
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
    
    //Player specific code
    cam.attach(function()
    {
        return gameObjects.getObject("player").input(0);
    }, true);
    gameObjects.getObject("player").input(0).revive();
};
loader.update = function()
{
    if(this.firstLoad)
    {
        backgrounds.primeLoad();
        buttons.load();
    }
    if(screenUtils.fade.full())
    {
        this.loadLevel(this.level);
        if(!this.firstLoad)
        {
            game.play();
        }else{
            textAlign(CENTER, CENTER);
            textSize(20);
            fill(0, 0, 0, 100);
            text("Loading", 200, 200);
        }
        screenUtils.screenShot = get(0, 0, width, height);
        this.firstLoad = false;
    }
    if(!screenUtils.fade.fading)
    {
        game.gameState = (game.tempState !== "load") ? game.tempState : "play"; 
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
game.switchGameState = function(condition, state, needsScreenShot)
{
    if(condition)
    {
        this.startFade();
        this.switchedState = true;
        this.switchState = state;
        if(needsScreenShot)
        {
             screenUtils.needsScreenShot = true;
        }
    }
};
game.pauseMenu = function()
{
    image(screenUtils.screenShot, 0, 0);
    textSize(40);
    fill(31, 173, 88);
    textAlign(CENTER, CENTER);
    text("Paused", 200, 110);
    fill(0, 0, 0, 60);
    rect(75, 0, width - 75 * 2, height);
    
    buttons.back.draw();
    this.switchGameState(buttons.back.clicked(), "play");
    
    buttons.restart.draw();
    if(buttons.restart.clicked())
    {
        this.gameState = "play";
        gameObjects.getObject("player").input(0).handleDeath();
    }
    
    buttons.menu.draw();
    this.switchGameState(buttons.menu.clicked(), "menu");
};
game.how = function()
{
    fill(0, 0, 0, 60);
    rect(75, 0, width - 75 * 2, height);
    fill(11, 68, 153, 80);
    rect(100, 100, 200, 210, 10);
    fill(200, 200, 200, 150);
    textAlign(NORMAL, NORMAL);
    text("  Use the arrow keys to move or wasd. Press down to go through doors or to activate checkpoints. Press 'p' to pause, 'r' to restart, 't' to print what the sign says if you can't read it and 'm' to go directly to the menu.\n\n   This is Planet Search 2 If you haven't played the first one please play it right now.\n\n        Created by ProlightHub", 110, 115, 200, 225);
    fill(0, 0, 0, 100);
    text(game.version, 334, 394); 
    buttons.back2.draw();
    this.switchGameState(buttons.back2.clicked(), "menu");
};
game.settings = function()
{
    textSize(40);
    fill(31, 173, 88);
    textAlign(CENTER, CENTER);
    text("Settings", 200, 110);
    fill(0, 0, 0, 60);
    rect(75, 0, width - 75 * 2, height);
    buttons.back2.draw();
    this.switchGameState(buttons.back2.clicked(), "extras");
    buttons.debugMode.draw();
    buttons.debugMode.message = "debugMode " + game.debugMode;
};
game.settings.mousePressed = function()
{
    if(buttons.debugMode.clicked())
    {
        game.debugMode = !game.debugMode;
    }
};
game.extras = function()
{
    textSize(40);
    fill(31, 173, 88);
    textAlign(CENTER, CENTER);
    text("Extras", 200, 110);
    fill(0, 0, 0, 60);
    rect(75, 0, width - 75 * 2, height);
    fill(0, 0, 0, 100);
    textSize(12);
    text(game.version, 364, 390); 
    buttons.back2.draw();
    this.switchGameState(buttons.back2.clicked(), "menu");
    buttons.settings.draw();
    this.switchGameState(buttons.settings.clicked(), "settings");
};
var titleFont = createFont("sans serif");
game.menu = function()
{
    fill(0, 0, 0, 60);
    rect(75, 0, width - 75 * 2, height);
    fill(41, 98, 213, 100);
    textFont(titleFont);
    textAlign(CENTER, CENTER);
    textSize(43);
    text("Planet\nSearch 2", 200, 83);
    textSize(26);
    fill(0, 0, 0, 30);
    rect(150, 146, 100, 30, 5);
    fill(31, 173, 88);
    text("Amber", 200, 160);
    fill(0, 0, 0, 100);
    textSize(12);
    text(game.version, 364, 390); 
    
    buttons.play.draw();
    this.switchGameState(buttons.play.clicked(), "play");
    
    buttons.how.draw();
    this.switchGameState(buttons.how.clicked(), "how");
    
    buttons.extras.draw();
    this.switchGameState(buttons.extras.clicked(), "extras");
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
    popMatrix();
    //cam.drawOutline();
    
    //Menu
    this.switchGameState(keys[77], "menu"); //On key 'm' switch to menu
    this.switchGameState(keys[80], "pauseMenu", true); //On key 'p' switch to pause menu
    
    //Debug stuff 
    fpsCatcher.update();
    screenUtils.debugMode();
};

var draw = function()
{
    frameRate(game.fps);
    backgrounds.drawBackground();
    game[game.gameState]();
    screenUtils.update();
};

var lastMousePressed = mousePressed;
mousePressed = function()
{
    lastMousePressed();
    if(game[game.gameState].mousePressed !== undefined)
    {
        game[game.gameState].mousePressed();
    }
};
    }
    if(typeof draw !== 'undefined') processing.draw = draw;
});
