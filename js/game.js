
	
( function( ){
	var canvas = document.getElementById( 'world' );
	new World( canvas );

	function World( canvas ){
		var self = this;
		this.canvas = canvas;
		this.sprite = new Image();
		this.spaceship = null;
		this.bullets = [];
		this.context = canvas.getContext( "2d" );
		this.gameLoop = null;
		this.keyMap = {};
		this.sprite.addEventListener( "load", spriteLoadCompleteHandler );
		this.sprite.src = "assets/sprite.png";
		this.startupTime = null;
		this.playTime = null;
		this.lv = 1;

		function spriteLoadCompleteHandler(){
			self.sprite.removeEventListener( "load", spriteLoadCompleteHandler );
			self.startup();
		}

		window.addEventListener( "keydown", function( event ){
			switch( event.keyCode ){
				case 37: self.keyMap[ "L" ]=true; break;
				case 38: self.keyMap[ "U" ]=true; break;
				case 39: self.keyMap[ "R" ]=true; break;
				case 40: self.keyMap[ "D" ]=true; break;
			}
		}, false );

		window.addEventListener( "keyup", function( event ){
			switch( event.keyCode ){
				case 37: self.keyMap[ "L" ]=false; break;
				case 38: self.keyMap[ "U" ]=false; break;
				case 39: self.keyMap[ "R" ]=false; break;
				case 40: self.keyMap[ "D" ]=false; break;
			}
		}, false );
	}

	World.prototype.startup = function(){
		this.startupTime = +new Date();
		this.spaceship = new Spaceship( this.context, this.sprite, this.canvas.width, this.canvas.height );
		this.addBullet( 80 );
		this.run();
	};

	World.prototype.addBullet = function( num ){
		for( var i=0, count=num; i<count ; i+=1 ){
			this.bullets.push( new Bullet( this.context, this.sprite, this.canvas.width, this.canvas.height ) );
		}
	};

	World.prototype.nextLevel = function(){
		//console.log( "lv up" );
		this.addBullet( 10 );
		this.lv++;
	};


	World.prototype.run = function(){
		var self = this;
		var bullet;
		this.gameLoop = window.setInterval( function(){
			self.canvas.width = self.canvas.width;
			self.context.save();
			self.context.font = 'italic 20pt Calibri';
			self.context.fillStyle = "#FFFFFF";
			self.context.fillText( self.playTime/1000 , 10, 30 );
			self.spaceship.render( self.keyMap );

			for( var i=0, count=self.bullets.length ; i<count ; i+=1 ){
				bullet = self.bullets[ i ];
				bullet.render();
				self.spaceship.hitTest( bullet.collisionInfo );
			}

			if( !self.spaceship.isDie ){
				self.playTime = +new Date() - self.startupTime;
				if( self.playTime/1000 > ( self.lv*10 )  ) self.nextLevel();
			}else if( self.spaceship.completeExplosion ){
				self.end();
				return;
			}
			self.context.restore();

		}, 30 );
	};

	World.prototype.pause = function(){

	};

	World.prototype.end = function(){
		window.clearInterval( this.gameLoop );
	};

	function Spaceship( context, sprite, limitWidth, limitHeight ){
		this.context = context;
		this.cellWidth = 50;
		this.cellHeight = 48;
		this.Direction = { U:0, R:2, D:4, L:6 };
		this.currentDirection = this.Direction.R;
		this.sprite = sprite;
		this.fireFlag = 0;
		this.x = 30;
		this.y = 240;
		this.speed = 0.7;
		this.targetX = 0;
		this.targetY = 0;
		this.limitWidth = limitWidth;
		this.limitHeight = limitHeight;
		this.renderCount = 0;
		this.defaultCollisionInfo = { centerX:32, centerY:22, radius:12 };
		this.collisionInfo = { centerX:32, centerY:22, radius:12 };
		this.isDie = false;
		this.completeExplosion = false;
	}

	Spaceship.prototype.render = function( keyMap ){
		++this.renderCount;
		if( this.isDie ){

			if( Math.floor(this.renderCount/4) > 5 ){
				this.completeExplosion = true;
				return;
			}

			this.context.drawImage(
				this.sprite,
				this.renderCount%4*64,
				this.cellHeight+Math.floor(this.renderCount/4)*64,
				64, 64, this.x, this.y, 64, 64 );
			return;
		}
		if( this.renderCount % 2  == 0) {
			this.fireFlag = ( this.fireFlag == 0 ) ? 1 : 0;
			this.renderCount = 0;
		}

		if( keyMap[ "R"] ){
			this.targetX+=this.speed;
			this.currentDirection = this.Direction.R;
		}

		if( keyMap[ "L"] ){
			this.targetX-=this.speed;
			this.currentDirection = this.Direction.L;
		}

		if( keyMap[ "U"] ){
			this.targetY-=this.speed;
			this.currentDirection = this.Direction.U;
		}

		if( keyMap[ "D"] ){
			this.targetY+=this.speed;
			this.currentDirection = this.Direction.D;
		}

		var sx = this.cellWidth * ( this.currentDirection + this.fireFlag );
		var sy = 0;
		var sw = this.cellWidth;
		var sh = this.cellHeight;
		var tw = sw;
		var th = sh;

		this.x += this.targetX;
		this.y += this.targetY;
		if( this.x < 0 ) this.x = 0;
		if( this.y < 0 ) this.y = 0;
		if( this.x+this.cellWidth > this.limitWidth ) this.x = this.limitWidth-this.cellWidth;
		if( this.y+this.cellHeight > this.limitHeight ) this.y = this.limitHeight-this.cellHeight;

		this.targetX *= 0.95;
		this.targetY *= 0.95;

		this.context.drawImage( this.sprite, sx, sy, sw, sh, this.x, this.y, tw, th );
		this.collisionInfo.centerX = this.x + this.defaultCollisionInfo.centerX;
		this.collisionInfo.centerY = this.y + this.defaultCollisionInfo.centerY;
	};

	Spaceship.prototype.hitTest = function( collisionInfo ){

		var bulletCollisionInfo = collisionInfo;
		var spaceShipCenterX = this.collisionInfo.centerX;
		var spaceShipCenterY = this.collisionInfo.centerY;
		var spaceShipRadius = this.collisionInfo.radius;
		var bottom;
		var height;
		var hypo;


		bottom = bulletCollisionInfo.centerX - spaceShipCenterX;
		height = bulletCollisionInfo.centerY - spaceShipCenterY;
		hypo = bulletCollisionInfo.radius + spaceShipRadius;

		if( (bottom*bottom)+(height*height) <= ( hypo*hypo ) ){
			if( !this.isDie ){
				this.isDie = true;
				this.renderCount = 0;
				return true;
			}
		}

		return false;
	};

	function Bullet( context, sprite, limitWidth, limitHeight ){
		this.context = context;
		this.cellWidth = 12;
		this.cellHeight = 12;
		this.sprite = sprite;
		this.speed = 0;
		this.targetX = 0;
		this.targetY = 0;
		this.sizeRate = 0;
		this.limitWidth = limitWidth;
		this.limitHeight = limitHeight;
		this.radius = 0;
		this.radian = 0;
		this.radianDelta = 0;
		this.setInitValue();
	}

	Bullet.prototype.render = function(){
		var sx = 400;
		var sy = 0;
		var sw = this.cellWidth;
		var sh = this.cellHeight;
		var tw = sw * this.sizeRate;
		var th = sh * this.sizeRate;
		this.x -= this.speed;
		this.y += this.radius * Math.sin( 2*Math.PI*this.radian );

		if( this.x < -this.cellWidth ){
			this.setInitValue();
		}

		this.context.drawImage( this.sprite, sx, sy, sw, sh, this.x, this.y, tw, th);
		this.radian += this.radianDelta;
		this.collisionInfo.centerX = this.x + this.defaultCollisionInfo.radius;
		this.collisionInfo.centerY = this.y + this.defaultCollisionInfo.radius;
	};

	Bullet.prototype.setInitValue = function(){
		this.x = Util.random( this.limitWidth, this.limitWidth*2 );
		this.y = Util.random( this.cellHeight/2, this.limitHeight-(this.cellHeight/2) );
		this.sizeRate = Util.random( 0.5, 1 );
		this.speed = Util.random( 1, 5 );
		this.radius = Util.random( 1, 2 );
		this.radianDelta = Util.random( 0.001, 0.01 );
		var tempRadius = this.cellWidth*this.sizeRate/2;
		this.defaultCollisionInfo = { centerX:this.x+tempRadius, centerY:this.y+tempRadius, radius:tempRadius };
		this.collisionInfo = { centerX:this.x+tempRadius, centerY:this.y+tempRadius, radius:tempRadius };
	};


	var Util = {
		random:function( min, max ){
			return  ( Math.random() * ( max - min ) )   + min
		}
	}

})( );


