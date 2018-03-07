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

    function getImage(s) {
        var url = "https://www.kasandbox.org/programming-images/" + s + ".png";
        processing.externals.sketch.imageCache.add(url);
        return processing.loadImage(url);
    }

    function getLocalImage(url) {
        processing.externals.sketch.imageCache.add(url);
        return processing.loadImage(url);
    }

    // use degrees rather than radians in rotate function
    var rotateFn = processing.rotate;
    processing.rotate = function (angle) {
        rotateFn(processing.radians(angle));
    };
    with (processing) 
    {
        var STICKY_THRESHOLD = 0.0004;
        var game = {
            gameState : "play",
            fps : 30,
        };
        var levelInfo = {
            level : "start",
            xPos : 100,
            yPos : 100,
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
        
        var keys = [];
        var keyPressed = function()
        {
            keys[keyCode] = true;
        };
        var keyReleased = function()
        {
            keys[keyCode] = false; 
        };
        
        var Fade = function(colorValue)
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
        var screenUtils = {
            fade : new Fade(color(0, 0, 0)),
        };
        
        var physics = {
            //Gives a place for grouped physics hueristic specific-like code
            exports : {},
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
            push : {
                circle : function(host, object)
                {
                    if(host.xVel > 0)
                    {
                        object.xVel += host.xForce || 0;
                    }
                    else if(host.xVel < 0)
                    {
                        object.xVel -= host.xForce || 0;
                    }
                    if(host.yVel > 0)
                    {
                        object.yVel += host.yForce || 0;
                    }
                    else if(host.yVel < 0 && host.yPos > object.yPos)
                    {
                        object.yVel -= host.jumpHeight || 0;
                    }
                },
                rectrect : function(host, object)
                {
                    physics.getMiddleXPos(host);
                    physics.getMiddleYPos(host);
                    physics.getMiddleXPos(object)
                    physics.getMiddleYPos(object);
                    
                    if(host.yPos + host.height > object.yPos && host.yPos < object.yPos + object.height)
                    {
                        if(host.middleXPos < object.middleXPos)
                        {
                            object.xVel += host.xForce || 0;
                        }else{
                            object.xVel -= host.xForce || 0;
                        }
                    }else{
                        if(host.middleYPos > object.middleYPos)
                        {
                            if(host.yVel < 0)
                            {
                                object.yVel = -abs(host.yVel);
                            }
                            if(object.yVel > 0)
                            {
                                object.yVel = -0.01; 
                            }
                        }
                    }
                },
            },
        };
        
        var observer = {
            collisionTypes : {
                "blank" : {
                    colliding : function() {},
                    solveCollision : function() {},
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
                        var point1 = {};
                        var angle = atan2(rect1.middleYPos - circle1.yPos, rect1.middleXPos - circle1.xPos);
                        var input = (circle1.radius - circle1.pointDist);
                        var inputX = input * cos(angle);
                        var inputY = input * sin(angle);
                        if(rect1.physics.movement === "dynamic")
                        {
                            rect1.xPos += inputX;
                            rect1.yPos += inputY;
                            rect1.inAir = (rect1.yPos + rect1.height > circle1.yPos);

                            //Stop rect1 from sinking into an object
                            if(rect1.touchedRect)
                            {
                                if((inputX < 0 && rect1.xVel > 0) ||
                                   (inputX > 0 && rect1.xVel < 0))
                                {
                                    rect1.xVel = 0;
                                }
                                if((inputY < 0 && rect1.yVel > 0) ||
                                   (inputY > 0 && rect1.yVel < 0))
                                {
                                    rect1.yVel = 0;
                                }
                            }
                            else if(!rect1.inAir)
                            {
                                rect1.yVel = min(rect1.yVel, rect1.maxYVel * (circle1.friction || 0.25));
                            }
                            rect1.touchedRect = false;
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
                                    circle1.yVel = 1;
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
                        return ((rect1.xPos + rect1.width >= rect2.xPos && 
                                 rect1.xPos <= rect2.xPos + rect2.width) &&
                                (rect1.yPos + rect1.height >= rect2.yPos && 
                                 rect1.yPos <= rect2.yPos + rect2.height));
                    },
                    solveCollision : function(rect1, rect2)
                    {
                        rect2.halfWidth = rect2.width / 2;
                        rect2.halfHeight = rect2.height / 2;
                        rect1.touchedRect = true;
                        rect2.touchedRect = true;
                        
                        // Find the mid points of the rect2 and rect1
                        var pMidX = physics.getMiddleXPos(rect1);
                        var pMidY = physics.getMiddleYPos(rect1);
                        var aMidX = physics.getMiddleXPos(rect2);
                        var aMidY = physics.getMiddleYPos(rect2);
                         
                        // To find the side of entry calculate based on
                        // the normalized sides
                        var dx = (aMidX - pMidX) / rect2.halfWidth;
                        var dy = (aMidY - pMidY) / rect2.halfHeight;
                         
                        // Calculate the absolute change in x and y
                        var absDX = abs(dx);
                        var absDY = abs(dy);
                         
                        // If the distance between the normalized x and y
                        // position is less than a small threshold (.1 in this case)
                        // then this object is approaching from a corner
                        if(abs(absDX - absDY) < 0.01) 
                        {
                            // If the rect1 is approaching from positive X
                            if(dx < 0) 
                            {
                                // Set the rect1 x to the right side
                                rect1.xPos = rect2.xPos + rect2.width;
                                rect1.xSide = "right";
                                // If the rect1 is approaching from negative X
                            }else{
                                // Set the rect1 x to the left side
                                rect1.xPos = rect2.xPos - rect1.width;
                                rect1.xSide = "left";
                            }
                 
                            // If the rect1 is approaching from positive Y
                            if(dy < 0) 
                            {
                                // Set the rect1 y to the bottom
                                rect1.yPos = rect2.yPos + rect2.height;
                                rect1.ySide = "bottom";
                                rect1.inAir = true;
                                // If the rect1 is approaching from negative Y
                            }else{
                                // Set the rect1 y to the top
                                rect1.yPos = rect2.yPos - rect1.height;
                                rect1.ySide = "top";
                                rect1.inAir = false;
                            }
                            if(Math.random() < 0.5) 
                            {
                                  // Reflect the velocity at a reduced rate
                                  rect1.xVel = -rect1.xVel * (rect2.restitution || 0);
                       
                                  // If the object's velocity is nearing 0, set it to 0
                                  // STICKY_THRESHOLD is set to .0004
                                  if(abs(rect1.xVel) < STICKY_THRESHOLD) 
                                  {
                                      rect1.xVel = 0;
                                  }
                            }else{
                                  rect1.yVel = -rect1.yVel * (rect2.restitution || 0);
                                  if(abs(rect1.yVel) < STICKY_THRESHOLD) 
                                  {
                                      rect1.yVel = 0;
                                  }
                            }
                            rect1.yVel = -rect1.yVel * (rect2.restitution || 0);
                            // If the object is approaching from the sides
                        } 
                        else if(absDX > absDY) 
                        {
                            // If the rect1 is approaching from positive X
                            if(dx < 0) 
                            {
                                rect1.xPos = rect2.xPos + rect2.width;
                                rect1.xSide = "right";
                            }else{
                                // If the rect1 is approaching from negative X
                                rect1.xPos = rect2.xPos - rect1.width;
                                rect1.xSide = "left";
                            }
                            rect1.xVel = -rect1.xVel * (rect2.restitution || 0);
                            if(abs(rect1.xVel) < STICKY_THRESHOLD) 
                            {
                                rect1.xVel = 0;
                            }
                            // If this collision is coming from the top or bottom more
                        }else{
                            // If the rect1 is approaching from positive Y
                            if(dy < 0) 
                            {
                                rect1.yPos = rect2.yPos + rect2.height;
                                rect1.ySide = "bottom";
                                rect1.inAir = true;
                            }else{
                                // If the rect1 is approaching from negative Y
                                rect1.yPos = rect2.yPos - rect1.height;
                                rect1.ySide = "top";
                                rect1.inAir = false;
                            }
                            if(rect2.physics.movement === "static")
                            {
                                rect1.yVel = -rect1.yVel * (rect2.restitution || 0);
                                if(abs(rect1.yVel) < STICKY_THRESHOLD) 
                                {
                                    rect1.yVel = 0;
                                }
                            }
                        }
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
            array.add = function(xPos, yPos, width, height, colorValue)
            {
                this.push((object.apply === undefined) ? xPos : new object(xPos, yPos, width, height, colorValue)); 
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
                    return {};      
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
                     this.applyObject(i);
                }
            };
            array.applyObject = function(i)
            {
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
                col : constrain(round(((xPos - this.xPos) - this.cellWidth / 2) / this.cellWidth), 0, this.length - 1),
                row : constrain(round(((yPos - this.yPos) - this.cellHeight / 2) / this.cellHeight), 0, this[0].length - 1),
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
            for(var i = 0; i < this.length; i++)
            {
                this[i].clear();
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
                        if(!(objectA.physics.shape === "rect" && objectB.physics.shape === "rect"))
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
                        var object = this.getObject(cell[i].arrayName).input(cell[i].index);
                        this.getObject(cell[i].arrayName).applyObject(cell[i].index);
                        
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
                            object.update();
                            gameObjects.applyCollision(object);
                            object.draw();
                        }
                        
                        usedObjects[object.arrayName + object.index] = true;
                    }
                }
            }
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
                    if(this.xVel > -this.xDeacl && this.xVel < this.xDeacl)
                    {
                        this.xVel = 0;
                    }
                }
                if(this.boundingBox.xPos <= levelInfo.xPos)
                {
                    this.xVel = EPSILON;
                    this.xPos = abs(this.xPos - this.boundingBox.xPos) + levelInfo.xPos;
                }
                if(this.boundingBox.xPos + this.boundingBox.width >= levelInfo.xPos + levelInfo.width)
                {
                    this.xVel = -EPSILON;
                    this.xPos = (levelInfo.xPos + levelInfo.width - this.boundingBox.width) - abs(this.boundingBox.xPos - this.xPos);
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
            this.xDeacl = 0.1;
            this.maxXVel = 4;
            
            this.maxYVel = 12;
            this.gravity = 0.4;
            this.jumpHeight = 10.5;
            
            this.update = function()
            {
                this.updateVel();
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
            this.xDeacl = 0.6;
            this.maxXVel = 4;
            this.xForce = 2;
            
            this.maxYVel = 12;
            this.gravity = 0.3;
            this.jumpHeight = 10.5;
            this.yForce = 0;
            
            this.update = function()
            {
                this.updateVel();
                this.boundingBox.xPos = this.xPos;
                this.boundingBox.yPos = this.yPos;
            };
            
            this.onCollide = function(object, host)
            {
                if(object.physics.movement === "dynamic")
                {
                    if(object.physics.shape === "circle")
                    {
                        physics.push.circle(host || this, object);
                    }
                    if(object.physics.shape === "rect")
                    {
                        physics.push.rectrect(host || this, object);
                    }
                }
            };
        };
        gameObjects.addObject("dynamicRect", createArray(DynamicRect));
        
        var Player = function(xPos, yPos, width, height, colorValue)
        { 
            Rect.call(this, xPos, yPos, width, height);  
            DynamicObject.call(this);
            
            this.color = colorValue;
            
            this.xAcl = 1.5;
            this.xDeacl1 = 0.2;
            this.maxXVel = 4;
            this.xForce = 3.5;
            
            this.maxYVel = 12;
            this.gravity = 0.4;
            this.jumpHeight = 10.5;
            this.yForce = 0;
            
            this.update = function()
            {
                if(keys[LEFT])
                {
                    this.xVel -= this.xAcl;  
                }
                if(keys[RIGHT])
                {
                    this.xVel += this.xAcl;
                }
                
                if(!keys[LEFT] && !keys[RIGHT])
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
                
                if(keys[UP] && !this.inAir)
                {
                    this.yVel = -this.jumpHeight;
                }

                //If it fell out of the level restart the level
                if(this.yPos >= levelInfo.yPos + levelInfo.height)
                {
                    loader.startLoadLevel(levelInfo.level);
                }
                
                this.updateVel();
                this.boundingBox.xPos = this.xPos;
                this.boundingBox.yPos = this.yPos;
            };
            
            this.onCollide = new DynamicRect(this.xPos, this.yPos, this.width, this.height).onCollide;
        };
        gameObjects.addObject("player", createArray(Player));
        
        var levels = {
            'start' : {
                plan : [
                    "              ",
                    "              ",
                    "              ",
                    "              ",
                    "              ",
                    "     bbb      ",
                    "           O  ",
                    "bbb           ",
                    "b             ",
                    "b        bbbbb",
                    "b            b",
                    "b            b",
                    "b      cx    b",
                    "b  p   xc    b",
                    "bsssbbbbbbbbbb",
                ], 
            },
        };
        levels.build = function(plan)
        {
            var level = this[plan.level];
            levelInfo.width = level.plan[0].length * levelInfo.unitWidth;
            levelInfo.height = level.plan.length * levelInfo.unitHeight;

            for(var row = 0; row < level.plan.length; row++)
            {
                for(var col = 0; col < level.plan[row].length; col++)
                {
                    var xPos = levelInfo.xPos + col * levelInfo.unitWidth;
                    var yPos = levelInfo.yPos + row * levelInfo.unitHeight;
                    switch(level.plan[row][col])
                    {
                        case 'b' : 
                            gameObjects.getObject("rect").add(xPos, yPos, levelInfo.unitWidth, levelInfo.unitHeight);
                            gameObjects.getObject("rect").getLast().color = color(20, 100, 50);
                            break;
                        
                        case 's' : 
                            gameObjects.getObject("rect").add(xPos, yPos, levelInfo.unitWidth, levelInfo.unitHeight);
                            var object = gameObjects.getObject("rect").getLast();
                            object.color = color(30, 40, 150);
                            object.restitution = 1.2;
                            break;
                            
                        case "x" : 
                            gameObjects.getObject("dynamicRect").add(xPos, yPos, levelInfo.unitWidth, levelInfo.unitHeight);
                            gameObjects.getObject("dynamicRect").getLast().color = color(20, 50, 100);
                            break;
                            
                        case 'o' :
                            gameObjects.getObject("circle").add(xPos, yPos + levelInfo.unitHeight / 2, levelInfo.unitWidth);
                            gameObjects.getObject("circle").getLast().color = color(20, 100, 50);
                            break;
                            
                        case 'O' :
                            gameObjects.getObject("circle").add(xPos + levelInfo.unitWidth / 2, yPos + levelInfo.unitHeight / 2, levelInfo.unitWidth * 2);
                            gameObjects.getObject("circle").getLast().color = color(20, 100, 50);
                            break;     
                        
                        case 'c' :    
                            gameObjects.getObject("dynamicCircle").add(xPos, yPos, levelInfo.unitWidth);
                            gameObjects.getObject("dynamicCircle").getLast().color = color(20, 50, 100);
                            break;
                            
                        case 'p' : 
                            gameObjects.getObject("player").add(xPos, yPos, levelInfo.unitWidth, levelInfo.unitHeight, color(200, 10, 30));
                            break;
                    }
                }
            }
        };
        
        var drawBackground = function()
        {
            fill(10, 10, 150);
            stroke(0, 0, 0);
            rect(levelInfo.xPos, levelInfo.yPos, levelInfo.width, levelInfo.height);
        };
        
        loader.startLoadLevel = function(level)
        {
            this.level = level;
            screenUtils.fade.start(20, (this.firstLoad) ? 20 : 0);
            screenUtils.screenImage = get(0, 0, width, height);
            game.gameState = "load";
        };
        loader.loadLevel = function(level)
        {
            gameObjects.removeObjects();
            levels.build({
                level : level,
            });
            cameraGrid.setup(levelInfo.xPos, levelInfo.yPos, levelInfo.width / levelInfo.cellWidth, levelInfo.height / levelInfo.cellHeight, levelInfo.cellWidth, levelInfo.cellHeight);
            gameObjects.addObjectsToCameraGrid();
            cam.attach(function()
            {
                return gameObjects.getObject("player").input(0);
            }, true);
            levelInfo.level = level;
        };
        loader.update = function()
        {
            if(screenUtils.fade.full())
            {
                this.loadLevel(this.level);
                game.play();
                screenUtils.screenImage = get(0, 0, width, height);
                this.firstLoad = false;
            }
            if(!screenUtils.fade.fading)
            {
                game.gameState = "play";
            }
            image(screenUtils.screenImage, 0, 0);
        };
        loader.startLoadLevel("start");
        
        game.load = function() 
        {
            loader.update();
        };
        game.play = function()
        {
            pushMatrix();
                cam.view();
                drawBackground();
                gameObjects.apply();
                //gameObjects.drawBoundingBoxes();
                //cameraGrid.draw();
                //cam.draw();
            popMatrix();
            cam.drawOutline();
            
            if(keys[82])
            {
                loader.startLoadLevel("start");
            }
           
            //Debug menu
            var player = gameObjects.getObject("player").input(0);
            fill(0, 0, 0, 200);
            text("xPos " + player.xPos.toFixed(2), 20, 20);
            text("yPos " + player.yPos.toFixed(2), 20, 34);
            text("xVel " + player.xVel.toFixed(2), 20, 48);
            text("yVel " + player.yVel.toFixed(2), 20, 62);
            text("inAir " + player.inAir, 20, 76);
        };
        
        var draw = function()
        {   
            frameRate(game.fps);    
            background(255, 255, 255);
            game[game.gameState]();
            screenUtils.fade.draw();
        };
    }
    if (typeof draw !== 'undefined') processing.draw = draw;
});
