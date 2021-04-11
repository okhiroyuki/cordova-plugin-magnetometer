var MagneticField = function(x, y, z, accuracy, magnitude, timestamp) {
  this.x = x;
  this.y = y;
  this.z = z;
  this.accuracy = accuracy;
  this.magnitude = magnitude;
  this.timestamp = timestamp || (new Date()).getTime();
};

module.exports = MagneticField;
