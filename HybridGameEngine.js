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
        var game = {
            gameState : "play",
            fps : 60,
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
        
        var observer = {
            collisionTypes : {
                "blank" : {
                    colliding : function() {},
                    applyCollision : function() {},
                },
                "rectrect" : {
                    colliding : function(rect1, rect2)
                    {
                        return ((rect1.xPos + rect1.width >= rect2.xPos && 
                                 rect1.xPos <= rect2.xPos + rect2.width) &&
                                (rect1.yPos + rect1.height >= rect2.yPos && 
                                 rect1.yPos <= rect2.yPos + rect2.height));
                    },
                    applyCollision : function(objectA, objectB)
                    {
                        //Last position method
                        if(objectA.lastYPos + objectA.height > objectB.yPos && 
                              objectA.lastYPos < objectB.yPos + objectB.height)
                        {
                            objectA.xVel = 0;
                            if(objectA.lastXPos < objectB.xPos)
                            {
                                objectA.xPos = objectB.xPos - objectA.width;
                            }else{
                                objectA.xPos = objectB.xPos + objectB.width;
                            }
                        }
                        else if(objectA.lastXPos + objectA.width > objectB.xPos &&
                              objectA.lastXPos < objectB.xPos + objectB.width)
                        {
                            objectA.yVel = 0;
                            if(objectA.lastYPos < objectB.yPos)
                            {
                                objectA.inAir = false;
                                objectA.yPos = objectB.yPos - objectA.height;
                            }else{
                                objectA.inAir = true;
                                objectA.yPos = objectB.yPos + objectB.height;
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
            applyCollision : function(object1, object2)
            {
                return this.access(object1, object2, "applyCollision");
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
                    this.focusXPos = object.xPos + (object.width / 2);
                    this.focusYPos = object.yPos + (object.height / 2);
                }
            };
            
            this.view = function(object)
            {
                if(object === undefined)
                {
                    object = this.getObject();
                }
                
                //Get the camera position
                var xPos = object.xPos + (object.width / 2);
                var yPos = object.yPos + (object.height / 2);
                
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
        var GameObject = function(xPos, yPos, width, height, colorValue)
        {
              this.xPos = xPos;
              this.yPos = yPos;
              this.width = width;
              this.height = height;
              this.color = colorValue;
              
              this.boundingBox = this;
              
              this.physics = {
                  shape : "rect",
                  movement : "fixed",
                  solidObject : true,
              };
              
              this.draw = function()
              {
                  noStroke();
                  fill(this.color);
                  rect(this.xPos, this.yPos, this.width, this.height);
              };
              
              this.update = function() {};
              
              this.remove = function()
              {
                  this.delete = true;  
              };
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
            if(objectA.physics.movement === "fixed")
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
                        if(!(objectA.physics.shape === "rect" && objectB.physics.shape === "rect")) //Assuming the rects fill their bounding box completely
                        {
                            colliding = observer.colliding(objectA, objectB);
                        }
                        
                        if(colliding)
                        {
                            if(objectA.physics.solidObject && objectB.physics.solidObject)
                            {
                                observer.collisionTypes.rectrect.applyCollision(objectA, objectB);
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
                        if(object.physics.movement === "mobile")
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
        
        var Block = function(xPos, yPos, width, height, colorValue)
        {
            GameObject.call(this, xPos, yPos, width, height, colorValue);
        };
        gameObjects.addObject("block", createArray(Block));
        
        var MovingBlock = function(xPos, yPos, width, height, colorValue)
        {
            GameObject.call(this, xPos, yPos, width, height, colorValue);
             
            this.xVel = random(-3, 3);
            this.yVel = random(-3, 3);
             
            this.physics.movement = "mobile";
             
            this.update = function()
            {
                this.xPos -= ((this.xPos - (cam.focusXPos)) / width) * -this.xVel;
                this.yPos -= ((this.yPos - (cam.focusYPos)) / height) * -this.yVel;
                this.xPos = constrain(this.xPos, levelInfo.xPos, levelInfo.xPos + (levelInfo.width - this.width));
                this.yPos = constrain(this.yPos, levelInfo.yPos, levelInfo.yPos + (levelInfo.height - this.height));
                if(this.xVel === 0)
                {
                    this.xVel = random(-3, 3);
                }
                if(this.yVel === 0)
                {
                    this.yVel = random(-3, 3);
                }
            };
        };
        gameObjects.addObject("movingBlock", createArray(MovingBlock));
        
        var Player = function(xPos, yPos, width, height, colorValue)
        {
            GameObject.call(this, xPos, yPos, width, height, colorValue);
            
            this.color = colorValue || color(200, 10, 30);
            
            this.physics.movement = "mobile";
            
            this.xAcl = 1.5;
            this.xDeacl = 0.2;
            this.xVel = 0;
            this.maxXVel = 4;
            
            this.yVel = 0;
            this.maxYVel = 12.5;
            this.gravity = 0.4;
            this.jumpHeight = 10.5;
            this.inAir = false;
            
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
                    var xDeacl = ((this.inAir) ? this.xDeacl * 0.75 : this.xDeacl);
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
                
                this.xVel = constrain(this.xVel, -this.maxXVel, this.maxXVel);
                this.xPos += this.xVel;
                this.xPos = constrain(this.xPos, levelInfo.xPos, levelInfo.xPos + (levelInfo.width - this.width));
                
                if(keys[UP] && !this.inAir)
                {
                    this.yVel = -this.jumpHeight;
                }
                
                this.yVel += this.gravity;
                this.inAir = true;
                
                this.yVel = constrain(this.yVel, -this.maxYVel, this.maxYVel);
                this.yPos += this.yVel;
                this.yPos = max(this.yPos, levelInfo.yPos);
               
                //Stop it from clinging to the ceiling
                if(this.yPos <= levelInfo.yPos)
                {
                    this.yVel = 0;
                }
                if(this.yPos >= levelInfo.yPos + levelInfo.height)
                {
                    loader.startLoadLevel(levelInfo.level);
                }
            };
        };
        gameObjects.addObject("player", createArray(Player));
        
        var levels = {
            'start' : {
                plan : [
                    "                           ",
                    "                           ",
                    "                           ",
                    "                           ",
                    "         bbbb              ",
                    "         b          bbbbb  ",
                    "                           ",
                    "                           ",
                    "  bbbbb                    ",
                    "  b           bbbb         ",
                    "  b                        ",
                    "  bbbb                     ",
                    "          bb          bbbbb",
                    "         b  b              ",
                    "             b             ",
                    "              b            ",
                    "     p         b           ",
                    "bbbbbbbbb       bbbbbbbbbbbb",
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
                            gameObjects.getObject("block").add(xPos, yPos, levelInfo.unitWidth, levelInfo.unitHeight, color(20, 100, 50));
                            break;
                            
                        case 'p' : 
                            gameObjects.getObject("player").add(xPos, yPos, levelInfo.unitWidth, levelInfo.unitHeight);
                            break;
                            
                        case 'm' :  
                            gameObjects.getObject("movingBlock").add(xPos, yPos, levelInfo.unitWidth, levelInfo.unitHeight, color(20, 50, 100));
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
            game.screenImage = get(0, 0, width, height);
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
                game.screenImage = get(0, 0, width, height);
                this.firstLoad = false;
            }
            if(!screenUtils.fade.fading)
            {
                game.gameState = "play";
            }
            image(game.screenImage, 0, 0);
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