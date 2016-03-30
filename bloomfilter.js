(function(exports) {
  exports.BloomFilter = BloomFilter;
  exports.fnv_1a = fnv_1a;
  exports.fnv_1a_b = fnv_1a_b;

  // Creates a new bloom filter.  *bits* should specify the
  // number of bits. *hashingFunctions* specifies the number of hashing functions.
  function BloomFilter(bits, hashingFunctions) {
    this.hashingFunctions = hashingFunctions;
    this.buckets = new Array(bits);
    this.buckets.fill(0);
}

  // See http://willwhim.wpengine.com/2011/09/03/producing-n-hash-functions-by-hashing-only-once/
  BloomFilter.prototype.locations = function(v) {
    var locations = new Array(this.hashingFunctions),
        bits = this.buckets.length,
        a = fnv_1a(v + ""),
        b = fnv_1a_b(a),
        x = a % bits;

    for (var i = 0; i < locations.length; ++i) {
      locations[i] = x < 0 ? (x + bits) : x;
      x = (x + b) % bits;
    }
    return locations;
  };

  BloomFilter.prototype.add = function(v) {
    this.locations(v).forEach(function (location) {
      this.buckets[location] = 1;
    }, this);
  };

  BloomFilter.prototype.test = function(v) {
    return this.locations(v).reduce(function (accumulator, location) {
      return accumulator && this.buckets[location];
    }.bind(this), true);
  };

  // Estimated cardinality.
  BloomFilter.prototype.size = function() {
    var buckets = this.buckets,
        bits = 0;
    for (var i = 0, n = buckets.length; i < n; ++i) bits += 1;
    return -this.bits * Math.log(1 - bits / this.bits) / this.hashingFunctions;
  };

  // Fowler/Noll/Vo hashing.
  function fnv_1a(v) {
    var a = 2166136261;
    for (var i = 0, n = v.length; i < n; ++i) {
      var c = v.charCodeAt(i),
          d = c & 0xff00;
      if (d) a = fnv_multiply(a ^ d >> 8);
      a = fnv_multiply(a ^ c & 0xff);
    }
    return fnv_mix(a);
  }

  // a * 16777619 mod 2**32
  function fnv_multiply(a) {
    return a + (a << 1) + (a << 4) + (a << 7) + (a << 8) + (a << 24);
  }

  // One additional iteration of FNV, given a hash.
  function fnv_1a_b(a) {
    return fnv_mix(fnv_multiply(a));
  }

  // See https://web.archive.org/web/20131019013225/http://home.comcast.net/~bretm/hash/6.html
  function fnv_mix(a) {
    a += a << 13;
    a ^= a >>> 7;
    a += a << 3;
    a ^= a >>> 17;
    a += a << 5;
    return a & 0xffffffff;
  }
})(typeof exports !== "undefined" ? exports : this);
