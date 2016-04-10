(function(exports) {
  exports.BloomFilter = BloomFilter;
  exports.fnv_1a = fnv_1a;
  exports.fnv_1a_b = fnv_1a_b;

  // Creates a new bloom filter.  *bits* should specify the
  // number of bits. *hashingFunctions* specifies the number of hashing functions.
  function BloomFilter(bits, hashingFunctions) {
    this.hashingFunctions = hashingFunctions;
    var bytes = Math.ceil(bits / 32);
    this.buckets = new Uint32Array(bytes);
    this.buckets.fill(0);
  }

  // See http://willwhim.wpengine.com/2011/09/03/producing-n-hash-functions-by-hashing-only-once/
  BloomFilter.prototype.locations = function(v) {
    var locations = [],
        bits = this.buckets.length * 32,
        a = fnv_1a(v + ""),
        b = fnv_1a_b(a),
        x = a % bits;

    for (var i = 0; i < this.hashingFunctions; ++i) {
      locations[i] = x < 0 ? (x + bits) : x;
      x = (x + b) % bits;
    }
    return locations;
  };

  BloomFilter.prototype.add = function(v) {
    var buckets = this.buckets;
    this.locations(v).forEach(function (location) {
      setLocation(buckets, location);
    });
  };

  BloomFilter.prototype.test = function(v) {
    var buckets = this.buckets;
    return this.locations(v).reduce(function (accumulator, location) {
      return accumulator && isLocationSet(buckets, location);
    }, true);
  };

  function toPosition(buckets, location) {
    var bit = location % 32;
    var index = Math.floor(location / 32);

    return {
      byte: buckets[index],
      index: index,
      mask: 1 << bit
    };
  }

  function setLocation(buckets, location) {
    var position = toPosition(buckets, location);
    buckets[position.index] = position.byte | position.mask;
  }

  function isLocationSet(buckets, location) {
    var position = toPosition(buckets, location);
    return !! (position.byte & position.mask);
  }


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
