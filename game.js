//constants
var UP = 0;
var RIGHT = 1;
var DOWN = 2;
var LEFT = 3;

var GRID = 20; //5x5px grid
var WIDTH = 300;
var HEIGHT = 300;

var SPEED = 300;

function log ( msg ) {
	//$("log").innerHTML += "<p>"+msg+"</p>";
}

//return random number i, p <= i < n
function rand (n,p) {
  return Math.floor( Math.random()*p + n );
}

//returns true if num is in between range1 and range2, inclusive
function inRange( num, range1, range2 ) {
	var min = range1;
	var max = range2;
	if( range1 > range2) {
		min = range2;
		max = range1;
	}
	return ( num >= min ) && ( num <= max );
}

var Segment = Class.create({
	//new 0-length segment (draws on the canvas as length 1, or a square)
	initialize: function (newX,newY,direction,board) {
		this.x = newX;
		this.y = newY;
		this.toX = newX;
		this.toY = newY;
		//these are for smooth animation
		this.drawX = newX;
		this.drawY = newY;
		this.drawToX = newX;
		this.drawToY = newY;

		this.length = GRID;
		this.direction = direction;
		this.board = board;
	},
	//returns true if this segment crosses over apple or portal a
	intersects: function (a) {
		if( (this.board == a.board) && ( ( this.x == a.x && inRange( a.y, this.y, this.toY ) ) || ( this.y == a.y && inRange( a.x, this.x, this.toX ) ) ) ) {
			//log(a.toString()+" collides with "+this.toString());
			return true;
		}
		return false;
	},
	//returns true if this segment collides with the other segment
	collidesWith: function (other) {
		//avoids erroneous collisions with "0" length segments
		if( this.length < (GRID*2) ) { return false; }
		if( this.board != other.board ) { return false; }
		if( ( this.direction % 2 ) == 0 ) { //up or down
			//if both this and other are vertical, then x must be the same and y's must overlap
			if( (other.direction % 2) == 0 ) {
				if( this.x == other.x && ( inRange(this.y, other.y, other.toY) || inRange(this.toY, other.y, other.toY) ) ){
					log("("+this.toString()+") collides with ("+other.toString()+")");
					log(" they are supposedly both vertical");
					return true;
				}
				return false;
			} else { //they are perpendicular
				//they collide if the other's y is in between this' start and end
				//this' x is in between the other's start and end
				if( inRange( other.y, this.y, this.toY ) && inRange( this.x, other.x, other.toX ) ) {
					log("("+this.toString()+") collides with ("+other.toString()+")");
					log(" this is supposedly vertical, while other is horizontal ");
					return true;
				}
				return false;
			}
		} else { //left or right
			//if both this and other are horizontal, then y must be the same and x's must overlap
			if( (other.direction % 2) == 1 ) {
				if( this.y == other.y && ( inRange(this.x, other.x, other.toX) || inRange(this.toX, other.x, other.toX) ) ) {
					log("("+this.toString()+") collides with ("+other.toString()+")");
					log(" they are supposedly both horizontal");
					return true;

				}
				return false;
			} else { //they are perpendicular
				//they collide if the other's x is in between this' start and end
				//this' y is in between the other's start and end
				if( inRange( other.x, this.x, this.toX ) && inRange( this.y, other.y, other.toY ) ) {
					log("("+this.toString()+") collides with ("+other.toString()+")");
					log(" this is supposedly horizontal, while other is vertical ");
					return true;
				}
				return false;
			}
		}
	},
	//syncs the draw state back to the actual state, in case the animation got behind
	sync: function () {
		this.drawX = this.x;
		this.drawY = this.y;
		this.drawToX = this.toX;
		this.drawToY = this.toY;
	},
	//ticks forward the draw values during the animation
	tick: function() {
		if( this.drawX < this.x ) { this.drawX++; }
		if( this.drawY < this.y ) { this.drawY++; }
		if( this.drawToX < this.toX ) { this.drawToX++; }
		if( this.drawToY < this.toY ) { this.drawToY++; }
		if( this.drawX > this.x ) { this.drawX--; }
		if( this.drawY > this.y ) { this.drawY--; }
		if( this.drawToX > this.toX ) { this.drawToX--; }
		if( this.drawToY > this.toY ) { this.drawToY--; }
	},
	//draws this segment to the given context
	//notice that a length of 0 means the segment will be drawn as a square
	draw: function (ctx1,ctx2) {
		if( this.board == 1 ) {
			ctx1.strokeStyle = "#3a3";
			ctx1.lineWidth = GRID-2;
			ctx1.lineCap = 'round';
			ctx1.beginPath();
			ctx1.moveTo(this.drawX, this.drawY);
			ctx1.lineTo(this.drawToX, this.drawToY);
			ctx1.stroke();
		}
		else {
			ctx2.strokeStyle = "#3a3";
			ctx2.lineWidth = GRID-2;
			ctx2.lineCap = 'round';
			ctx2.beginPath();
			ctx2.moveTo(this.drawX, this.drawY);
			ctx2.lineTo(this.drawToX, this.drawToY);
			ctx2.stroke();
		}

	},
	//shortens this segment from the start, returns false if the segment has length 0
	cut: function () {
		this.length -= GRID;
		if( this.length == 0 ) { return false; }
		switch( this.direction ) {
			case UP:
				this.y -= GRID;
				break;
			case RIGHT:
				this.x += GRID;
				break;
			case DOWN:
				this.y += GRID;
				break;
			case LEFT:
				this.x -= GRID;
				break;
		}
		return true;
	},
	//elongates the end of the line, returns false if the new end is out of bounds
	elongate: function () {
		this.length += GRID;
		switch( this.direction ) {
			case UP:
				this.toY -= GRID;
				break;
			case RIGHT:
				this.toX += GRID;
				break;
			case DOWN:
				this.toY += GRID;
				break;
			case LEFT:
				this.toX -= GRID;
				break;
		}

		return (this.toX > 0) && (this.toX < WIDTH) && (this.toY > 0) && (this.toY < HEIGHT);
	},
	toString: function () {
		return "Segment: x="+this.x+", toX="+this.toX+", y="+this.y+", toY="+this.toY+", length="+this.length+", direction="+this.direction+", board="+this.board;
	}

});


var Snake = Class.create({
	initialize: function () {
		this.direction = RIGHT;
		this.board = 1;
		this.eating = false; //flag variable to elongate the snake when moving
		//add first segment and elongate it 3 times
		this.segments = [new Segment(Math.floor(WIDTH/2-GRID*4),Math.floor(HEIGHT/2), this.direction, this.board)];
		this.segments[0].elongate();
		this.segments[0].elongate();
		this.segments[0].elongate();
		this.length = 4; //even though the segment was elongated three times, it appears visually as length 4
		this.headX = this.segments[0].toX;
		this.headY = this.segments[0].toY;
	},
	//returns true if the move doesn't make the snake collide with walls or itself
	move: function () {
		var head = this.segments.pop(); //pop last segment off the stack
		if( !head.elongate() ) {
			//collision, end game
			log("snake collided with the walls!");
			return false;
		}
		//update head x and y
		this.headX = head.toX;
		this.headY = head.toY;
		this.segments.push(head);
		if( this.eating ) {
			this.eating = false;
			if( this.collided() ) {
				log("snake collided with itself!");
				return false;
			}
			return true;
		}
		//if it's not being elongated
		//cut the tail piece
		var tail = this.segments.shift();
		while (true) { //successively cuts segments that should be
			if( tail.cut() ) { //if the tail still has length
				this.segments.unshift( tail );
				break;
			} else {
				//try to cut next segment in next loop
				tail = this.segments.shift();
			}
		}
		if( this.collided() ) {
			log("snake collided with itself!");
			return false;
		}
		return true;
	},
	//sets eating flag, so next move won't cut the tail
	elongate: function () {
		this.eating = true;
		this.length++;
	},
	//returns true if this snake intersects apple or portal a
	intersects: function (a) {
		//log("running Snake.intersects...");
		//first lazy collision
		if( this.board == a.board && this.headX == a.x && this.headY == a.y ) {
			//log("lazy collision");
			return true;
		}
		for( var i = 0; i < this.segments.length; i++ ) {
			if( this.segments[i].intersects(a) ) {
				//log("internal collision");
				return true;
			}
		}
		return false;
	},
	//returns true if the snake collided with itself sometime
	collided: function () {
		//check each segment against the others
		var len = this.segments.length;
		for( var i = 0; i < len; i++ ) {
			//skips the segment right after, because they can never collide
			for( var j = i + 2; j < len; j++ ) {
				if( this.segments[i].collidesWith( this.segments[j] ) ) {
					return true;
				}
			}
		}
		return false;
	},
	//syncs segments to their draw state
	sync: function () {
		this.segments.each( function ( i ) {
			i.sync();
		});
	},
	//ticks each segment to the boards
	tick: function () {
		this.segments.each( function ( i ) {
			i.tick();
		});
	},
	//draws each segment to the boards
	draw: function (ctx1,ctx2) {
		this.segments.each( function ( i ) {
			i.draw(ctx1,ctx2);
		});
		//get head's draw position
		//or in the edge case of going through a portal,
		//the second to last draw position
		var drawHead = this.segments.last();
		if( this.segments.length > 1 && this.segments.last().board != this.segments[this.segments.length-2].board && this.segments.last().length < GRID*2) {
			drawHead = this.segments[this.segments.length-2];
		}
		var drawX = drawHead.drawToX;
		var drawY = drawHead.drawToY;
		//beady little eyes and tongue
		var ctx = ctx1;
		if( drawHead.board != 1 ) {
			ctx = ctx2;
		}
		ctx.fillStyle = 'black';
		if( this.direction % 2 == 0 ) {//vertical
			ctx.beginPath();
			ctx.arc(drawX-GRID/4,drawY,2,0,Math.PI*2,true);
			ctx.fill();
			ctx.beginPath();
			ctx.arc(drawX+GRID/4,drawY,2,0,Math.PI*2,true);
			ctx.fill();

		} else {
			ctx.beginPath();
			ctx.arc(drawX,drawY-GRID/4,2,0,Math.PI*2,true);
			ctx.fill();
			ctx.beginPath();
			ctx.arc(drawX,drawY+GRID/4,2,0,Math.PI*2,true);
			ctx.fill();
		}
		//the tongue
		ctx.beginPath();
		ctx.lineWidth = .5;
			ctx.strokeStyle = 'red';
		switch( this.direction ) {
			case UP:
				ctx.moveTo(drawX,drawY-GRID/2+2);
				ctx.lineTo(drawX,drawY-(GRID*3/5));
				ctx.lineTo(drawX-GRID/4, drawY-GRID*4/5);
				ctx.stroke();
				ctx.beginPath();
				ctx.moveTo(drawX,drawY-(GRID*2/3));
				ctx.lineTo(drawX+GRID/4, drawY-GRID*4/5);
				ctx.stroke();
				break;
			case RIGHT:
				ctx.moveTo(drawX+GRID/2-2,drawY);
				ctx.lineTo(drawX+(GRID*3/5),drawY);
				ctx.lineTo(drawX+GRID*4/5, drawY-GRID/4);
				ctx.stroke();
				ctx.beginPath();
				ctx.moveTo(drawX+(GRID*3/5),drawY);
				ctx.lineTo(drawX+GRID*4/5, drawY+GRID/5);
				ctx.stroke();
				break;
			case DOWN:
				ctx.moveTo(drawX,drawY+GRID/2-2);
				ctx.lineTo(drawX,drawY+(GRID*3/5));
				ctx.lineTo(drawX-GRID/4, drawY+GRID*4/5);
				ctx.stroke();
				ctx.beginPath();
				ctx.moveTo(drawX,drawY+(GRID*3/5));
				ctx.lineTo(drawX+GRID/4, drawY+GRID*4/5);
				ctx.stroke();
				break;
			case LEFT:
				ctx.moveTo(drawX-GRID/2+2,drawY);
				ctx.lineTo(drawX-(GRID*3/5),drawY);
				ctx.lineTo(drawX-GRID*4/5, drawY-GRID/4);
				ctx.stroke();
				ctx.beginPath();
				ctx.moveTo(drawX-(GRID*3/5),drawY);
				ctx.lineTo(drawX-GRID*4/5, drawY+GRID/4);
				ctx.stroke();
				break;
		}

	},
	//changes direction and adds a 0-length new segment in the right direction to the snake
	changeDirection: function (newDirection) {
		this.direction = newDirection;
		this.segments.push( new Segment( this.headX, this.headY, newDirection, this.board) );
	},
	//warps snake to other board to portal p
	warp: function (p) {
		this.board = p.board;
		this.headX = p.x;
		this.headY = p.y;
		this.segments.push( new Segment( p.x, p.y, this.direction, p.board ) );
	},
	//status info
	toString: function () {
		var output = "Snake: length="+this.length+", headX="+this.headX+", headY="+this.headY+", board="+this.board+", eating="+this.eating+", direction="+this.direction+", segments=[";
		this.segments.each( function (i) {
			output += i.toString()+", ";
		});
		output += "]";
		return output;
	}
});

var Apple = Class.create({
	initialize: function(x,y,board) {
		this.x = x;
		this.y = y;
		this.board = board;
		//log("new "+this.toString());
	},
	draw: function (ctx1, ctx2) {
		var ctx = ctx1;
		if( this.board != 1 ) {
			ctx = ctx2;
		}
		ctx.fillStyle = "#F33";
		ctx.beginPath();
		ctx.arc(this.x,this.y,GRID/2,0,Math.PI*2,true);
		ctx.fill();
		ctx.fillStyle = "#7F5";
		ctx.beginPath();
		ctx.arc(this.x+GRID/4,this.y-GRID/2,GRID/4,0,Math.PI*2,true);
		ctx.fill();
	},
	toString: function () {
		return "Apple: x="+this.x+", y="+this.y+", board="+this.board;
	}
});

var Portal = Class.create({
	initialize: function(x,y,board,color) {
		this.x = x;
		this.y = y;
		this.used = false;
		this.board = board;
		this.color = color;

		this.active = false;

		//log("new "+this.toString());
	},
	draw: function (ctx1, ctx2) {
		var ctx = ctx1;
		if( this.board != 1 ) {
			ctx = ctx2;
		}
		//assume orange
		var fill1 = '#FF6';
		var fill2 = '#FA0';
		if( this.color == 'blue' ) {
			fill1 = '#77F';
			fill2 = '#33F';
		}
		//draw grey centers if the portal isn't active
		if( !this.active ) {
			fill2 = '#aaa';
		}

		ctx.fillStyle = fill1;
		ctx.beginPath();
		ctx.arc(this.x,this.y,GRID/2+6,0,Math.PI*2,true);
		ctx.fill();

		ctx.fillStyle = fill2;
		ctx.beginPath();
		ctx.arc(this.x,this.y,GRID/2+2,0,Math.PI*2,true);
		ctx.fill();

	},
	//checks intersection against apples
	intersects: function (other) {
		return (this.board == other.board) && (this.x == other.x) && ( this.y == other.y );
	},
	toString: function () {
		return "Portal: x="+this.x+", y="+this.y+", board="+this.board+", used="+this.used;
	}
});


var game = new Object; //stores game state

function loop() {
	//clear previous animation if necessary
	if( game.animation ) {
		clearInterval(game.animation);
	}
	//sync bad animation
	game.snake.sync();
	//add apple if necessary
	if( game.apples.length == 0 ) {
		var a = new Apple( GRID*rand(1,WIDTH/GRID-2)+GRID/2, GRID*rand(1,HEIGHT/GRID-2)+GRID/2, rand(0,2));
		while(game.snake.intersects(a)) {
			a = new Apple( GRID*rand(1,WIDTH/GRID-2)+GRID/2, GRID*rand(1,HEIGHT/GRID-2)+GRID/2, rand(0,2));
			//log("bad apple!");
			//try a new random apple
		}
		game.apples.push(a);
	}
	if( game.newDirection != game.snake.direction ) {
		game.snake.changeDirection( game.newDirection );
	}
	if( !game.snake.move() ) {//if move was unsuccessful
		log("game over!");
		var ctx1 = $("board1").getContext('2d');
		var ctx2 = $("board2").getContext('2d');
		ctx1.fillStyle = 'black';
		ctx1.font = "40pt 'Indie Flower'";
		ctx1.fillText("Game", WIDTH/2-ctx1.measureText("Game").width/2,HEIGHT/2);
		ctx2.fillStyle = 'black';
		ctx2.font = "40pt 'Indie Flower'";
		ctx2.fillText("Over!", WIDTH/2-ctx1.measureText("Over!").width/2,HEIGHT/2);

		$("start").innerHTML = 'Start';
		$("status").update("Score: "+(game.snake.length-4));
		clearInterval( game.interval ); //stop looping
		game.running = false;
		return;
	}
	//check for apple collision
	var collided;
	game.apples.each( function(i) {
		if( game.snake.intersects( i ) ) {
			//log(i.toString()+" got eaten!");
			game.snake.elongate();
			collided = i; //stores reference to colliding apple
		}
	});
	if( collided ) { //this changes the list after the iteration, to avoid weird inplace editing errors
		game.apples = game.apples.without( collided );
	}

	//check active portals
	if( game.bluePortal && game.orangePortal && game.bluePortal.active && game.snake.intersects( game.bluePortal ) ) {
		game.bluePortal.used = true;
		game.orangePortal.used = true;

		game.snake.warp(game.orangePortal);

		game.orangePortal.pair = game.bluePortal;
		game.bluePortal.pair = game.orangePortal;
		game.portals.push(game.bluePortal);
		game.portals.push(game.orangePortal);
		//clears portal objects
		game.bluePortal = false;
		game.orangePortal = false;
	}
	if( game.bluePortal && game.orangePortal && game.orangePortal.active && game.snake.intersects( game.orangePortal ) ) {
		game.bluePortal.used = true;
		game.orangePortal.used = true;

		game.snake.warp(game.bluePortal);

		game.orangePortal.pair = game.bluePortal;
		game.bluePortal.pair = game.orangePortal;
		game.portals.push(game.bluePortal);
		game.portals.push(game.orangePortal);
		//clears portal objects
		game.bluePortal = false;
		game.orangePortal = false;
	}
	//clear inactive portals
	var spent;
	//check portal collision
	game.portals.each( function(i) {
		if( !game.snake.intersects( i ) && !game.snake.intersects(i.pair) ) {
			//removed used portals that aren't currently used
			//log("purging spent portal: "+i.toString());
			spent = i; //reference to spent portal
		}
	});
	if( spent ) {
		game.portals = game.portals.without( spent, spent.pair );
	}
	//activate noncolliding portals
	if( game.orangePortal && game.bluePortal && !game.snake.intersects(game.orangePortal) && !game.snake.intersects(game.bluePortal) ) {
		game.bluePortal.active = true;
		game.orangePortal.active = true;
	}

	//animate to next game state
	game.frames = 0;
	game.animation = setInterval( animate, SPEED/GRID );
	//print status
	//$("status").update(game.snake.toString() );
	$("status").update("Score: "+(game.snake.length-4));
}

//draws a grid on context ctx
function drawGrid( ctx ) {
	for( var i = GRID/2; i < WIDTH; i += GRID ) {
		ctx.strokeStyle = "#ddd";
		ctx.lineWidth = .5;
		ctx.beginPath();
		ctx.moveTo( i, 0);
		ctx.lineTo( i, HEIGHT);
		ctx.stroke();
	}
	for( var i = GRID/2; i < HEIGHT; i += GRID ) {
		ctx.strokeStyle = "#ddd";
		ctx.lineWidth = .5;
		ctx.beginPath();
		ctx.moveTo( 0, i);
		ctx.lineTo( WIDTH, i);
		ctx.stroke();
	}
}

function animate() {
	//stops animation after it's complete
	if( game.frames > GRID ) {
		clearInterval(game.animation);
		return;
	}
	//tick forward snake
	game.snake.tick();
	//clear canvases
	$("board1").getContext('2d').clearRect(0,0,WIDTH,HEIGHT);
	$("board2").getContext('2d').clearRect(0,0,WIDTH,HEIGHT);
	//draw grid
	drawGrid($("board1").getContext('2d'));
	drawGrid($("board2").getContext('2d'));
	//draw stuff
	game.apples.each( function(i) {
		i.draw($("board1").getContext('2d'), $("board2").getContext('2d') );
	});
	game.portals.each( function(i) {
		i.draw($("board1").getContext('2d'), $("board2").getContext('2d') );
	});
	if( game.bluePortal) {
		game.bluePortal.draw($("board1").getContext('2d'), $("board2").getContext('2d') );
	}
	if( game.orangePortal ) {
		game.orangePortal.draw($("board1").getContext('2d'), $("board2").getContext('2d') );
	}
	game.snake.draw($("board1").getContext('2d'), $("board2").getContext('2d') );
	game.frames++;
}

//changes the next direction change
//the actual change to the snake will occur in the loop
function grabInput(e) {

	var key = e.keyCode;
	switch (key) {
		case Event.KEY_UP:
			if( game.snake.direction != DOWN ) {
				game.newDirection = UP;
			}
			return false; //prevents scrolling, i think
		case Event.KEY_RIGHT:
			if( game.snake.direction != LEFT ) {
				game.newDirection = RIGHT;
			}
			return false;
		case Event.KEY_DOWN:
			if( game.snake.direction != UP ) {
				game.newDirection = DOWN;
			}
			return false;
		case Event.KEY_LEFT:
			if( game.snake.direction != RIGHT ) {
				game.newDirection = LEFT;
			}
			return false;

		case 87: //w
			if( game.snake.direction != DOWN ) {
				game.newDirection = UP;
			}
			return false;
		case 68: //d
			if( game.snake.direction != LEFT ) {
				game.newDirection = RIGHT;
			}
			return false;
		case 83: //s
			if( game.snake.direction != UP ) {
				game.newDirection = DOWN;
			}
			return false;
		case 65: //a
			if( game.snake.direction != RIGHT ) {
				game.newDirection = LEFT;
			}
			return false;
	}

}

//spawns new portal, removing old ones if necessary
function spawnPortal(e) {
	var board = e.element();
	var boardNum = board.boardNum;
	var x = e.pointerX() - board.getLayout().get('left') - 20;
	var y = e.pointerY() - board.getLayout().get('top') - 20;
	//round to grid units
	x = GRID*Math.floor(x/GRID)+GRID/2;
	y = GRID*Math.floor(y/GRID)+GRID/2;
	//create new portal, assume left click
	var p = false;
	if( e.isLeftClick() ) {
		p = new Portal(x,y,boardNum, 'blue');
	} else if( e.isRightClick() ) {
		p = new Portal(x,y,boardNum, 'orange');
	}
	//if this portal is valid
	for( var i = 0; i < game.apples.length; i++ ) {
		if( p.intersects(game.apples[i]) ){
			return false;
		}
	}
	//snake intersection
	if( game.snake.intersects(p) ){
		return false;
	}
	//existing portal intersection
	for( var i = 0; i < game.portals.length; i++ ) {
		if( p.intersects(game.portals[i]) ){
			return false;
		}
	}
	//it's good, replace queued portal
	if( e.isLeftClick() ) {
		game.bluePortal = p;
		if( game.orangePortal && !game.snake.intersects(game.orangePortal)) {
			game.bluePortal.active = true;
			game.orangePortal.active = true;
		}
	} else if( e.isRightClick() ) {
		game.orangePortal = p;
		if( game.bluePortal && !game.snake.intersects(game.bluePortal)) {
			game.bluePortal.active = true;
			game.orangePortal.active = true;
		}
	}
	return false; //tries to stop right click
}

$("start").observe('click', function (e) {
	var element = e.element();
	if( element.innerHTML == "Start" ) {
		log("starting game...");
		//initialize variables
		game.snake = new Snake();
		game.apples = [];
		game.portals = [];
		game.bluePortal = false;
		game.orangePortal = false;
		game.newDirection = RIGHT;
		//add event listener for direction changes
		window.onkeydown = grabInput;
		//add event listener for portals
		$('board1').observe('mousedown', spawnPortal);
		//disable context menu
		$('board1').observe('contextmenu', Event.stop);
		$('board1').boardNum = 1;
		$('board2').observe('mousedown', spawnPortal);
		$('board2').observe('contextmenu', Event.stop);
		$('board2').boardNum = 0;
		//start game loop
		game.running = true;
		if(game.interval) {
			clearInterval( game.interval );
		}
		game.interval = setInterval( loop, SPEED );
		game.paused = false;
		element.innerHTML = 'Pause';
		return
	}
	if( element.innerHTML == 'Pause' ) {
		game.paused = true;
		element.innerHTML = 'Unpause';
		clearInterval(game.interval);
		return;
	}
	if( element.innerHTML == 'Unpause' ) {
		if( game.paused ) {
			if(game.interval) {
				clearInterval( game.interval );
			}
			game.interval = setInterval( loop, SPEED );
			game.paused == false;
			element.innerHTML = 'Pause';
			return;
		}
	}

});

$("speed").observe('blur', function (e) {
	var element = e.element();
	SPEED = element.value;
	if ( game.running ) {
		clearInterval( game.interval );
		game.interval = setInterval( loop, SPEED );
	}
});

//draws the grids on page load
drawGrid($("board1").getContext('2d'));
drawGrid($("board2").getContext('2d'));
