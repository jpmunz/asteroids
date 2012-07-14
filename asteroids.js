var TICK_INTERVAL = 200;


var LEFT = 37;
var UP = 38;
var RIGHT = 39;
var DOWN = 40;


// Ship Constants
var SHIP_SIZE = 25;


// Asteroid Constants
var NUM_ASTEROIDS = 4;

var ASTEROID_MIN_POINTS_PER_QUADRANT = 3;
var ASTEROID_MAX_POINTS_PER_QUADRANT = 6;

var ASTEROID_MIN_SIZE = 50;
var ASTEROID_MAX_SIZE = 200;

var ASTEROID_MIN_CORNER_PERCENTAGE = 20;
var ASTEROID_MAX_CORNER_PERCENTAGE = 25;

var MIN_ASTEROID_SPEED = 40 * (TICK_INTERVAL / 1000);
var MAX_ASTEROID_SPEED = 90 * (TICK_INTERVAL / 1000);

var MIN_ASTEROID_ROTATION = 50 * (TICK_INTERVAL / 1000);
var MAX_ASTEROID_ROTATION = 150 * (TICK_INTERVAL / 1000);


function randomInt(min, max) {
  return Math.floor(randomFloat(min,max));
}

function randomFloat(min, max) {
  return ((Math.random() * (max - min + 1)) + min);
}

function flip() {
  return randomInt(0, 1) === 1;
}

function createAsteroid(containerWidth, containerHeight) {
  var size = randomInt(ASTEROID_MIN_SIZE, ASTEROID_MAX_SIZE);

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

  var speed = randomFloat(MIN_ASTEROID_SPEED, MAX_ASTEROID_SPEED),
      direction = randomFloat(0, 2 * Math.PI);

  return {
    points: points,
    dx: speed * Math.cos(direction),
    dy: speed * Math.sin(direction),
    dr: randomFloat(MIN_ASTEROID_ROTATION, MAX_ASTEROID_ROTATION),
    x: randomInt(0, containerWidth),
    y: randomInt(0, containerHeight),
    r: 0,
    size: size,
    translation: size/2
  };
}

function createShip(containerWidth, containerHeight) {

  var size = SHIP_SIZE;
  var translation = size/2;


  var points = [
    [0, size],
    [size/2, 0],
    [size, size]
  ];

  return {
    dx: 0,
    dy: 0,
    dr: 0,
    x: containerWidth/2 - translation,
    y: containerHeight/2 - translation,
    r: 0,
    size: size,
    translation: translation,
    points: points
  };
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
        .attr('class', cssClass)
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

function tick(svgContainer, containerWidth, containerHeight) {
  svgContainer.selectAll(".asteroid, .ship")
    .transition()
    .duration(TICK_INTERVAL)
    .ease("linear")
    .attrTween('x', positionTweener('x', 'dx', 'size', containerWidth))
    .attrTween('y', positionTweener('y', 'dy', 'size', containerHeight))
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

function rotationTweener() {
  return function(d, i, a) {
    var start;

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

function positionTweener(positionAttr, speedAttr, sizeAttr, bounds) {
  return function(d, i, a) {
    d[positionAttr] += d[speedAttr];

    var start = a;

    var positiveBounds = bounds - d.translation;
    var negativeBounds = -d[sizeAttr] - d.translation;

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

var keyHandlers = {
  LEFT: function() {
    console.log('left');

  }
};

$(document).ready(function() {

  var containerWidth = $('#main-container').width();
  var containerHeight = $('#main-container').height();

  var svgContainer = d3.select('#main-container');

  var asteroids = [];

  for(var a = 0; a < NUM_ASTEROIDS; a++) {
    asteroids.push(createAsteroid(containerWidth, containerHeight));
  }

  var ship = createShip(containerWidth, containerHeight);

  //drawPolygons(svgContainer, 'asteroid', asteroids);
  drawPolygons(svgContainer, 'ship', [ship]);

  $(document).keypress(function(e) {
    var handler = keyHandlers[e.keyCode];

    if(handler) {
      handler();
      return false;
    }
  });
  tick(svgContainer, containerWidth, containerHeight);
});
