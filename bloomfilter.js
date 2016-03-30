(function(exports) {
  exports.BloomFilter = BloomFilter;
  exports.fnv_1a = fnv_1a;
  exports.fnv_1a_b = fnv_1a_b;

  // Creates a new bloom filter.  If *m* is an array-like object, with a length
  // property, then the bloom filter is loaded with data from the array, where
  // each element is a 32-bit integer.  Otherwise, *m* should specify the
  // number of bits.  Note that *m* is rounded up to the nearest multiple of
  // 32.  *k* specifies the number of hashing functions.
  function BloomFilter(bits, hashingFunctions) {
    var bucketCount = Math.ceil(bits / 32);
    this.bits = bucketCount * 32;
    this.hashingFunctions = hashingFunctions;

    this.buckets = new Array(bucketCount);
    this.buckets.fill(0);
}

  // See http://willwhim.wpengine.com/2011/09/03/producing-n-hash-functions-by-hashing-only-once/
  BloomFilter.prototype.locations = function(v) {
    var locations = new Array(this.hashingFunctions),
        a = fnv_1a(v),
        b = fnv_1a_b(a),
        x = a % this.bits;
    for (var i = 0; i < locations.length; ++i) {
      locations[i] = x < 0 ? (x + this.bits) : x;
      x = (x + b) % this.bits;
    }
    return locations;
  };

  BloomFilter.prototype.add = function(v) {
    var locations = this.locations(v + "");

    for (var i = 0; i < locations.length; ++i) {
      var bucket = locations[i];
      this.buckets[Math.floor(bucket / 32)] |= 1 << (bucket % 32);
    }
  };

  BloomFilter.prototype.test = function(v) {
    var locations = this.locations(v + "");

    for (var i = 0; i < locations.length; ++i) {
      var bucket = locations[i];
      if ((this.buckets[Math.floor(bucket / 32)] & (1 << (bucket % 32))) === 0) {
        return false;
      }
    }
    return true;
  };

  // Estimated cardinality.
  BloomFilter.prototype.size = function() {
    var buckets = this.buckets,
        bits = 0;
    for (var i = 0, n = buckets.length; i < n; ++i) bits += popcnt(buckets[i]);
    return -this.bits * Math.log(1 - bits / this.bits) / this.hashingFunctions;
  };

  // http://graphics.stanford.edu/~seander/bithacks.html#CountBitsSetParallel
  function popcnt(v) {
    v -= (v >> 1) & 0x55555555;
    v = (v & 0x33333333) + ((v >> 2) & 0x33333333);
    return ((v + (v >> 4) & 0xf0f0f0f) * 0x1010101) >> 24;
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
