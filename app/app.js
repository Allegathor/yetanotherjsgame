'use strict'

import * as PIXI from 'pixi.js';

const app = new PIXI.Application();

document.body.appendChild(app.view);

let gameScene, gameOverScene, state, id, msg,
dungeon, door, explorer, treasure, blobs, hpBar;

let isTreasurePickedUp = false;
let carryingPenaltyAmount = 0;
let isExplorerAttacked = false;

PIXI.loader
	.add('mainAtlas', 'assets/img/treasureHunter.json')
	.load(setup);

function collisionCheck(sprite1, sprite2) {

	const halfWidth1 = sprite1.width / 2;
	const halfHeight1 = sprite1.height / 2;

	const halfWidth2 = sprite2.width / 2;
	const halfHeight2 = sprite2.height / 2;

	const centerX1 = sprite1.x + halfWidth1;
	const centerY1 = sprite1.y + halfHeight1;

	const centerX2 = sprite2.x + halfWidth2;
	const centerY2 = sprite2.y + halfHeight2;

	const vx = Math.abs(centerX1 - centerX2);
	const vy = Math.abs(centerY1 - centerY2);

	let hit = false;

	if(vx < halfWidth1 + halfWidth2) {

		if(vy < halfHeight1 + halfHeight2) {
			hit = true;
		} else {
			hit = false;
		}
	} else {
		hit = false;
	}

	return hit;
}

function keyboard(keyCode) {
	let key = {};

	key.code = keyCode;
	key.isDown = false;
	key.isUp = true;
	key.press = null;
	key.release = null;

	key.downHandler = (evt) => {

		if(evt.keyCode == keyCode) {
			if(key.isUp && key.press) key.press();

			key.isUp = false;
			key.isDown = true;

			evt.preventDefault();
		}

	}

	key.upHandler = (evt) => {

		if(evt.keyCode == keyCode) {

			if(key.isDown && key.release) key.release();

			key.isDown = false;
			key.isUp = true;

			evt.preventDefault();
		}
	}

	window.addEventListener('keydown', key.downHandler.bind(key));
	window.addEventListener('keyup', key.upHandler.bind(key));

	return key;
}

function contain(sprite, container) {
	let collision = '';

	if(sprite.x < container.x) {
		sprite.x = container.x;
		collision = 'left';
	}

	if(sprite.y < container.y) {
		sprite.y = container.y;
		collision = 'top';
	}

	if(sprite.x + sprite.width > container.width) {
		sprite.x = container.width - sprite.width;
		collision = 'right';
	}

	if(sprite.y + sprite.height > container.height) {
		sprite.y = container.height - sprite.height;
		collision = 'bottom';
	}

	return collision;
}

function setup() {

	gameScene = new PIXI.Container();
	gameOverScene = new PIXI.Container();

	app.stage.addChild(gameScene);
	app.stage.addChild(gameOverScene);

	gameOverScene.visible = false;

	id = PIXI.loader.resources['mainAtlas'].textures;

	dungeon = new PIXI.Sprite(id['dungeon.png']);
	gameScene.addChild(dungeon);

	door = new PIXI.Sprite(id['door.png']);
	door.position.set(32, 0);
	gameScene.addChild(door);

	explorer = new PIXI.Sprite(id['explorer.png']);
	explorer.x = 68;
	explorer.y = gameScene.height / 2 - explorer.height / 2;
	explorer.vx = 0;
	explorer.vy = 0;

	gameScene.addChild(explorer);

	let space = keyboard(32),
			left = keyboard(37),
			up = keyboard(38),
			right = keyboard(39),
			down = keyboard(40);

	left.press = () => {
		explorer.vx = -(4 - carryingPenaltyAmount);
		explorer.vy = 0;
	}

	left.release = () => {
		if(!right.isDown && explorer.vy == 0) {
			explorer.vx = 0;
		}
	}

	up.press = () => {
		explorer.vx = 0;
		explorer.vy = -(4 - carryingPenaltyAmount);
	}

	up.release = () => {
		if(!down.isDown && explorer.vx == 0) {
			explorer.vy = 0;
		}
	}

	right.press = () => {
		explorer.vx = 4 - carryingPenaltyAmount;
		explorer.vy = 0;
	}

	right.release = () => {
		if(!left.isDown && explorer.vy == 0) {
			explorer.vx = 0;
		}
	}

	down.press = () => {
		explorer.vx = 0;
		explorer.vy = 4 - carryingPenaltyAmount;
	}

	down.release = () => {
		if(!up.isDown && explorer.vx == 0) {
			explorer.vy = 0;
		}
	}

	space.press = () => {
		if(explorer.vx == 0 && explorer.vy == 0 && isTreasurePickedUp) {
			isTreasurePickedUp = false;
			carryingPenaltyAmount = 0;
			treasure.x = explorer.x + explorer.width;
		}
	}


	treasure = new PIXI.Sprite(id['treasure.png']);
	treasure.x = gameScene.width - treasure.width - 48;
	treasure.y = gameScene.height / 2 - treasure.height / 2;
	gameScene.addChild(treasure);

	hpBar = new PIXI.Container();
	hpBar.position.set(app.stage.width - 170, 4);
	gameScene.addChild(hpBar);

	let innerBar = new PIXI.Graphics();
	innerBar.beginFill(0x000000);
	innerBar.drawRect(0, 0, 128, 8);
	innerBar.endFill();
	hpBar.addChild(innerBar);

	let outerBar = new PIXI.Graphics();
	outerBar.beginFill(0xff0000);
	outerBar.drawRect(0, 0, 128, 8);
	outerBar.endFill();
	hpBar.addChild(outerBar);

	hpBar.outer = outerBar;

	let style = new PIXI.TextStyle({
		fontFamily: 'Futura',
		fontSize: 64,
		fill: 'white'
	});

	msg = new PIXI.Text('The end!', style);
	msg.x = 120;
	msg.y = app.stage.height / 2 - 32;
	gameOverScene.addChild(msg);

	let numOfBlobs = 7,
			spacing = 48,
			xOffset = 150,
			speed = 3,
			direction = 1;

	blobs = [];

	for(let i = 0; i < numOfBlobs; i++) {
		let blob = new PIXI.Sprite(id['blob.png']);

		let x = spacing * i + xOffset;
		let maxHeight = app.stage.height - blob.height;

		let y = Math.floor(Math.random() * (maxHeight));

		blob.x = x;
		blob.y = y;

		blob.vy = direction * speed;
		direction *= -1;

		blobs.push(blob);

		gameScene.addChild(blob);
	}
	explorer.interactive = true;
	explorer.on('pointerup', (evt) => {console.log('hey')});

	state = play;
	app.ticker.add(gameLoop);
}

function gameLoop(delta) {
	state(delta);
}

function play(delta) {
	explorer.x += explorer.vx;
	explorer.y += explorer.vy;

	blobs.forEach(blob => {
		blob.y += blob.vy

		let hitWallAt = contain(blob, {x: 28, y: 10, width: 488, height: 480});

		if(hitWallAt == 'top' || hitWallAt == 'bottom') {
			blob.vy *= -1;
		}

		if(collisionCheck(explorer, blob)) {
			isExplorerAttacked = true;
		}

	});

	contain(explorer, {x: 28, y: 10, width: 488, height: 480});

	if(collisionCheck(explorer, treasure)) {
		isTreasurePickedUp = true;
		carryingPenaltyAmount = 2;
		treasure.x = explorer.x + 8;
		treasure.y = explorer.y + 8;
	}

	if(isExplorerAttacked == true) {

		explorer.alpha = 0.5;
		hpBar.outer.width -= 1;
	} else {

		explorer.alpha = 1;
	}

	isExplorerAttacked = false;

	if(hpBar.outer.width < 0) {
		state = end;
		msg.text =
			`You\'ve lost!\nPress Enter to restart`;
	}

	if(collisionCheck(treasure, door)) {
		state = end;
		msg.text =
			`You\'ve won!\nPress Enter to restart`;
	}
}

function end() {
	gameScene.visible = false;
	gameOverScene.visible = true;

	let enter = keyboard(13);

	enter.release = () => {

		explorer.x = 68;
		explorer.y = gameScene.height / 2 - explorer.height / 2;

		treasure.x = gameScene.width - treasure.width - 48;
		treasure.y = gameScene.height / 2 - treasure.height / 2;

		hpBar.outer.width = 128;
		isTreasurePickedUp = false;
		carryingPenaltyAmount = 0;

		gameScene.visible = true;
		gameOverScene.visible = false;

		state = play;
	}

}
