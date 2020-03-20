var MagneticField = function(x, y, z, magnitude, timestamp) {
  this.x = x;
  this.y = y;
  this.z = z;
  this.magnitude = magnitude;
  this.timestamp = timestamp || (new Date()).getTime();
};

module.exports = MagneticField;