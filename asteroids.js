var TICK_INTERVAL = 200;

var LEFT = 37;
var UP = 38;
var RIGHT = 39;
var DOWN = 40;
var SPACE = 32;

// Ship Constants
var SHIP_SIZE = 25;
var SHIP_INERTIA = .2;
var SHIP_ACCELERATION_RATE = 30 * (TICK_INTERVAL / 1000);
var SHIP_ROTATIONAL_SPEED = 300 * (TICK_INTERVAL / 1000);
var MAX_SHIP_SPEED = 200 * (TICK_INTERVAL / 1000);

var SHIP_RESPAWN_TIME = 2000;
var SHIP_INVULNERABLE_TIME = 1000;

var SHIP_DEBRIS_COUNT = 5;
var SHIP_DEBRIS_SIZE = 20;
var SHIP_DEBRIS_SPIN = 30;

// Asteroid Constants
var NUM_ASTEROIDS = 4;

var ASTEROID_MIN_POINTS_PER_QUADRANT = 3;
var ASTEROID_MAX_POINTS_PER_QUADRANT = 6;

var ASTEROID_LEVELS = {
  1: {max: 200, min: 150, shards: 3, particles: 10 },
  2: {max: 100, min: 50, shards: 0, particles: 4}
};

var ASTEROID_MIN_CORNER_PERCENTAGE = 20;
var ASTEROID_MAX_CORNER_PERCENTAGE = 25;

var MIN_ASTEROID_SPEED = 40 * (TICK_INTERVAL / 1000);
var MAX_ASTEROID_SPEED = 90 * (TICK_INTERVAL / 1000);

var MIN_ASTEROID_ROTATION = 50 * (TICK_INTERVAL / 1000);
var MAX_ASTEROID_ROTATION = 150 * (TICK_INTERVAL / 1000);

// Particles 
var PARTICLE_ANIMATION_TIME = 2000;
var PARTICLE_SIZE = 2;
var MIN_PARTICLE_SPEED = 40 * (TICK_INTERVAL / 1000);
var MAX_PARTICLE_SPEED = 90 * (TICK_INTERVAL / 1000);

// Bullets
var BULLET_SIZE = 2;
var BULLET_SPEED = 400 * (TICK_INTERVAL / 1000);
var BULLET_RANGE = 550;

function randomInt(min, max) {
  return Math.floor(randomFloat(min,max));
}

function randomFloat(min, max) {
  return ((Math.random() * (max - min + 1)) + min);
}

function flip() {
  return randomInt(0, 1) === 1;
}

function createAsteroid(containerWidth, containerHeight, level, x, y) {

  var size = randomInt(ASTEROID_LEVELS[level]['min'], ASTEROID_LEVELS[level]['max']);

  var height = size;
  var width = size;

  var cornerWidth = width * (randomFloat(ASTEROID_MIN_CORNER_PERCENTAGE,
                                         ASTEROID_MIN_CORNER_PERCENTAGE) / 100);

  var cornerHeight = height * (randomFloat(ASTEROID_MIN_CORNER_PERCENTAGE,
                                           ASTEROID_MIN_CORNER_PERCENTAGE) / 100);

  var innerHeight = height - (cornerHeight * 2);
  var innerWidth = width - (cornerWidth * 2);

  var points = [];

  var startX = 0;
  var startY = 0;

  for (var side = 0; side < 4; side++) {

    // Looping through the positive/negative x/y axes
    //    1, 0
    //    0, 1
    //    -1, 0
    //    0, -1
    var xFactor = Math.round(Math.cos(((side / 4) * 360) * (Math.PI / 180)), 2);
    var yFactor = Math.round(Math.sin(((side / 4) * 360) * (Math.PI / 180)), 2);

    //Deal with turning corners;
    if (side == 0) {
      startX += cornerWidth;
    }
    if (side == 1) {
      startY += cornerHeight;
    }
    if (side == 3) {
      startX -= cornerWidth;
    }

    var pointsPerQuandrant = randomInt(ASTEROID_MIN_POINTS_PER_QUADRANT,
                                       ASTEROID_MAX_POINTS_PER_QUADRANT);

    for(var r = 0; r < pointsPerQuandrant; r++) {
      var nextX = startX + ((innerWidth / pointsPerQuandrant) * xFactor);
      var nextY = startY + ((innerHeight / pointsPerQuandrant) * yFactor);

      var xRange = xFactor ? nextX : startX + cornerWidth;
      var yRange = yFactor ? nextY : startY + cornerHeight;

      points.push([randomInt(startX, xRange), randomInt(startY, yRange)]);

      startX = nextX;
      startY = nextY;
     }
  }

  var translation = size/2;

  var speed = randomFloat(MIN_ASTEROID_SPEED, MAX_ASTEROID_SPEED),
      direction = randomFloat(0, 2 * Math.PI);

  var x = (x === undefined) ? randomInt(0, containerWidth) : x;
  var y = (y === undefined) ? randomInt(0, containerHeight) : y;

  return createGameObject({
    points: points,
    dx: speed * Math.cos(direction),
    dy: speed * Math.sin(direction),
    dr: randomFloat(MIN_ASTEROID_ROTATION, MAX_ASTEROID_ROTATION),
    x: x - translation,
    y: y - translation,
    size: size,
    translation: translation,
    level: level
  });
}

function createShip(containerWidth, containerHeight) {

  var size = SHIP_SIZE;
  var translation = size/2;

  var points = [
    [0, size],
    [size/2, 0],
    [size, size],
    [size/2, (2/3)*size]
  ];

  return createGameObject({
    x: containerWidth/2 - translation,
    y: containerHeight/2 - translation,
    angleOffset: 270,
    size: size,
    translation: translation,
    points: points,
    controllable: true
  });
}

function createShipDebris(x, y) {
  var size = SHIP_DEBRIS_SIZE;
  var points = [[0,0],[0,size]];

  var speed = randomFloat(MIN_PARTICLE_SPEED, MAX_PARTICLE_SPEED),
      direction = randomFloat(0, 2 * Math.PI);

  return createGameObject({
    x: x,
    y: y,
    r: randomInt(0, 360),
    dx: speed * Math.cos(direction),
    dy: speed * Math.sin(direction),
    dr: SHIP_DEBRIS_SPIN,
    points: points,
    size: size,
  });
}

function createParticle(x, y) {

  var size = PARTICLE_SIZE;

  var points = [
    [0, 0],
    [size, 0],
    [size, size],
    [0, size]
  ];

  var speed = randomFloat(MIN_PARTICLE_SPEED, MAX_PARTICLE_SPEED),
      direction = randomFloat(0, 2 * Math.PI);

  return createGameObject({
    x: x,
    y: y,
    dx: speed * Math.cos(direction),
    dy: speed * Math.sin(direction),
    points: points,
    size: size,
  });
}

function createBullet(x, y, r) {

  var size = BULLET_SIZE;

  var points = [
    [0, 0],
    [size, 0],
    [size, size],
    [0, size]
  ];

  var speed = BULLET_SPEED;

  var direction = r * (Math.PI/180);

  return createGameObject({
    x: x,
    y: y,
    dx: speed * Math.cos(direction),
    dy: speed * Math.sin(direction),
    points: points,
    size: size,
    distance: 0,
  });
}

function createGameObject(args) {
  return _.defaults(args, {
    x: 0,
    y: 0,
    r: 0,
    dx: 0,
    dy: 0,
    dr: 0,
    ax: 0,
    ay: 0,
    translation: 0,
    controllable: false
  });
}

function getTransform(d) {
  var transform = ' ';

  var rotation = d.translation + d.size/2;

  transform += 'rotate(' + d.r + ',' + rotation + ',' + rotation + ')';
  transform += ' ';
  transform += 'translate(' + d.translation + ',' + d.translation + ')';

  return transform;
}


function drawPolygons(svgContainer, cssClass, data) {

  var asteroidSelection = svgContainer.selectAll(cssClass)
      .data(data)
      .enter()
      .append('svg')
        .classed('game-object', true)
        .classed(cssClass, true)
        .attr('x', function(d) { return d.x.toString(); })
        .attr('y', function(d) { return d.y.toString(); })
        .attr('width', function(d) { return d.size * 2; })
        .attr('height', function(d) { return d.size * 2; })
      .append('g')
        .attr('transform', function(d) {
          return getTransform(d);
        })
      .append("polygon")
        .attr("points", function(d) {
          var stringPoints = [];

          for(var p = 0; p < d.points.length; p++) {
            stringPoints.push(d.points[p].join(','));
          }

          return stringPoints.join(' ');
        });
}

var limit = 0;


function tick(svgContainer, containerWidth, containerHeight) {

  animateParticles(svgContainer, containerWidth, containerHeight);

  fireBullet(svgContainer);
  trackBullet(svgContainer);

  collisionDetect(svgContainer, containerWidth, containerHeight);

  svgContainer.selectAll(".ship.invulnerable")
    .transition()
    .duration(SHIP_INVULNERABLE_TIME)
    .each("end", function() {
      d3.select('.ship.invulnerable').classed('invulnerable', false);
    });

  svgContainer.selectAll(".game-object")
    .transition()
    .duration(TICK_INTERVAL)
    .ease("linear")
    .each(function(d, i) {
      calculateSpeed(d);
    })

    .attrTween('x', positionTweener('x', containerWidth))
    .attrTween('y', positionTweener('y', containerHeight))
    .select('g')
      .attrTween('transform', rotationTweener())
    .each("end", function(d, i) {
      // Listener is invoked for each element in the selection
      // Only want to continue to next tick once
      if(i === 0) {
        tick(svgContainer, containerWidth, containerHeight);
      }
    });
}

function collisionDetect(svgContainer, containerWidth, containerHeight) {

  var asteroids = svgContainer.selectAll('.asteroid');


  asteroids.each(function(d) {

    var bullets = svgContainer.selectAll('.bullet');

    var x = d.x + d.translation;
    var y = d.y + d.translation;
    var size = d.size;

    // Ship Collision
    var ship = svgContainer.selectAll('.ship:not(.invulnerable)');
    if(!ship.empty()) {
      var shipData = ship[0][0].__data__;

      if(shipData.x + shipData.size > x && shipData.x + shipData.size < x + size
        && shipData.y + shipData.size > y && shipData.y + shipData.size < y + size) {

        destroyShip(shipData, svgContainer);
        $(ship[0][0]).remove();

        setTimeout(function() {
          var ship = createShip(containerWidth, containerHeight);
          drawPolygons(svgContainer, 'ship invulnerable', [ship]);

        }, SHIP_RESPAWN_TIME);
      }
    }

    //Bullet collision
    if(!bullets.empty()) {
      //Better way to loop over this?
      for(var i = 0; i < bullets[0].length; i++) {
        var bulletData = bullets[0][i].__data__;

        if(bulletData.x > x && bulletData.x < x + size
          && bulletData.y > y && bulletData.y < y + size) {

          destroyAsteroid(d, svgContainer, containerWidth, containerHeight);

          $(this).remove();
          $(bullets[0][i]).remove();
          return;
        }
      }
    }

  });


}
function fireBullet(svgContainer) {

  if(bulletTriggered) {
    var ship = svgContainer.select('.ship');

    if(!ship.empty()) {
      var shipData = ship.datum();

      var r = shipData.r + shipData.angleOffset;
      var x = (shipData.x + shipData.size) + (shipData.size/2 * Math.cos(r * (Math.PI/180)));
      var y = (shipData.y + shipData.size) + (shipData.size/2 * Math.sin(r * (Math.PI/180)));

      var bullet = createBullet(x, y, r);
      drawPolygons(svgContainer, 'bullet', [bullet]);

    }
    bulletTriggered = false;
  }
}

function trackBullet(svgContainer) {
  svgContainer.selectAll(".bullet")
    .each(function(d) {
      d.distance += Math.sqrt(Math.pow(d.dx, 2) + Math.pow(d.dy, 2));

      if(d.distance >= BULLET_RANGE) {
        $(this).remove();
      }
    });
}

function destroyShip(d, svgContainer) {

  var x = d.x + d.translation;
  var y = d.y + d.translation;

  debris = [];

  for(var a = 0; a < SHIP_DEBRIS_COUNT; a++) {
    debris.push(createShipDebris(x, y));
  }

  drawPolygons(svgContainer, 'ship-debris', debris);
}

function destroyAsteroid(d, svgContainer, containerWidth, containerHeight) {
  if(ASTEROID_LEVELS[d.level]) {

    var x = (d.x + d.translation) + d.size/2;
    var y = (d.y + d.translation) + d.size/2;

    shards = [];
    for(var a = 0; a < ASTEROID_LEVELS[d.level]['shards']; a++) {
      shards.push(createAsteroid(containerWidth, containerHeight, d.level + 1, x, y));
    }

    drawPolygons(svgContainer, 'asteroid', shards);

    particles = [];
    for(var a = 0; a < ASTEROID_LEVELS[d.level]['particles']; a++) {
      particles.push(createParticle(x, y));
    }

    drawPolygons(svgContainer, 'particle', particles);
  }
}

function animateParticles(svgContainer, containerWidth, containerHeight) {
  svgContainer.selectAll('.particle, .ship-debris')
    .transition()
    .duration(PARTICLE_ANIMATION_TIME)
    .style('stroke', '#000')
    .each("end", function() { $(this).remove(); });
}

function clampSpeed(direction, d) {
  var speed = 'd' + direction;
  var acceleration = 'a' + direction;

  if(d[speed] < -MAX_SHIP_SPEED) {
    d[speed] = -MAX_SHIP_SPEED;
    d[acceleration] = 0;
  } else if(d[speed] > MAX_SHIP_SPEED) {
    d[speed] = MAX_SHIP_SPEED;
    d[acceleration] = 0;
  }
}

function calculateSpeed(d) {

  if(d.controllable) {
    if(keyEvents[UP] === 'down' || keyEvents[UP] === 'press') {
      var direction = (d.r + d.angleOffset) * (Math.PI/180);
      d.ax += SHIP_ACCELERATION_RATE * Math.cos(direction);
      d.ay += SHIP_ACCELERATION_RATE * Math.sin(direction);
    }

    d.ax -= (SHIP_INERTIA * d.ax);
    d.ay -= (SHIP_INERTIA * d.ay);

    d.dx += d.ax;
    d.dy += d.ay;

    clampSpeed('x', d);
    clampSpeed('y', d);
  }
}

function rotationTweener() {
  return function(d, i, a) {
    var start;

    if(d.controllable) {
      if(keyEvents[LEFT] === 'down' || keyEvents[LEFT] === 'press') {
        d.dr = -SHIP_ROTATIONAL_SPEED;
      } else if(keyEvents[RIGHT] === 'down' || keyEvents[RIGHT] === 'press') {
        d.dr = SHIP_ROTATIONAL_SPEED;
      } else {
        d.dr = 0;
      }
    }

    d.r += d.dr;

    if(d.r > 360) {
      start = getTransform({
        r: -(360 - (d.r - d.dr)),
        size: d.size
      });

      d.r = d.r % 360;
    } else {
      start = a;
    }

    return d3.interpolate(start, getTransform(d));
  };
}

function positionTweener(positionAttr, bounds) {
  return function(d, i, a) {
    var speedAttr = 'd' + positionAttr;
    d[positionAttr] += d[speedAttr];

    var start = a;

    var positiveBounds = bounds - d.translation;
    var negativeBounds = -d.size - d.translation;

    if(d[positionAttr] < negativeBounds) {
      start = positiveBounds + (negativeBounds - d[positionAttr]);
      d[positionAttr] = positiveBounds;
    } else if(d[positionAttr] > positiveBounds) {
      start = negativeBounds - (d[positionAttr] - positiveBounds);
      d[positionAttr] = negativeBounds;
    }

    return d3.interpolate(start, d[positionAttr]);
  }
}

var keyEvents = {}

keyEvents[LEFT] = 'up';
keyEvents[RIGHT] = 'up';
keyEvents[UP] = 'up';
keyEvents[DOWN] = 'up';
keyEvents[SPACE] = 'up';

var bulletTriggered = false;

function handleKeyEvent(e, type, ship) {

  if(keyEvents[e.keyCode]) {

    if(e.keyCode === SPACE && type !== 'up') {
      bulletTriggered = true;
    }

    keyEvents[e.keyCode] = type;
    return false;
  }

  return true;
}

$(document).ready(function() {

  var containerWidth = $('#main-container').width();
  var containerHeight = $('#main-container').height();

  var svgContainer = d3.select('#main-container');

  var asteroids = [];

  for(var a = 0; a < NUM_ASTEROIDS; a++) {
    asteroids.push(createAsteroid(containerWidth, containerHeight, 1));
  }

  var ship = createShip(containerWidth, containerHeight);

  drawPolygons(svgContainer, 'asteroid', asteroids);
  drawPolygons(svgContainer, 'ship invulnerable', [ship]);

  $(document).keyup(function(e) { return handleKeyEvent(e, 'up'); });
  $(document).keydown(function(e) { return handleKeyEvent(e, 'down'); });
  $(document).keypress(function(e) { return handleKeyEvent(e, 'press'); });

  tick(svgContainer, containerWidth, containerHeight);
});
