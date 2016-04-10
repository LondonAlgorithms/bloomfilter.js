(function(exports) {
  exports.BloomFilter = BloomFilter;
  exports.fnv_1a = fnv_1a;
  exports.fnv_1a_b = fnv_1a_b;

  /**
   * An approachable explanation:
   * http://www.michaelnielsen.org/ddi/why-bloom-filters-work-the-way-they-do/
   *
   * A great survey of the math behind filters, and their uses:
   * https://www.eecs.harvard.edu/~michaelm/postscripts/im2005b.pdf
   */

  /**
   * Create a new Bloom Filter
   *
   * @param {integer} bits - total number of bits in the storage table
   * @param {integer} hashingFunctions - number of hashing functions to use
   */
  function BloomFilter(bits, hashingFunctions) {
    this.hashingFunctions = hashingFunctions;
    var bytes = Math.ceil(bits / 32);
    this.maxN = bytes * 32;
    this.buckets = new Uint32Array(bytes);
    this.buckets.fill(0);
  }

  BloomFilter.prototype.locations = function(v) {
    var locations = [];

    // Only two hashes are used to simulate n hashes.
    // See http://willwhim.wpengine.com/2011/09/03/producing-n-hash-functions-by-hashing-only-once/
    var a = fnv_1a(v + ""); // returns a 32bit signed int
    var b = fnv_1a_b(a); // returns a 32bit signed int

    for (var i = 0; i < this.hashingFunctions; ++i) {
      // a + b * i will produce some possibly huge number, cut off at maxN
      var g = (a + b * i) % this.maxN;
      // % in the above calculation will convert the number to a 32bit
      // signed number, which could be negative. All numbers correspond
      // to an index in an array. Ensure the number is positive.
      locations[i] = Math.abs(g);
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

  /**
   * Create a new Bloomfilter that is the union of this filter
   * plus another.
   *
   * @param {BloomFilter} filter
   * @returns {BloomFilter}
   */
  BloomFilter.prototype.union = function(filter) {
    if (this.maxN !== filter.maxN) {
      throw new Error('filters must be the same size');
    }

    var unionFilter = new BloomFilter(this.maxN, this.hashingFunctions);
    unionFilter.buckets = this.buckets.map(function (bucket, index) {
      return bucket | filter.buckets[index];
    });

    return unionFilter;
  };

  BloomFilter.prototype.intersection = function(filter) {
    if (this.maxN !== filter.maxN) {
      throw new Error('filters must be the same size');
    }
    var unionFilter = new BloomFilter(this.maxN, this.hashingFunctions);
    unionFilter.buckets = this.buckets.map(function (bucket, index) {
      return bucket & filter.buckets[index];
    });

    return unionFilter;
  };

  function toPosition(location) {
    var bit = location % 32;
    var index = Math.floor(location / 32);

    return {
      index: index,
      mask: 1 << bit
    };
  }

  function setLocation(buckets, location) {
    var position = toPosition(location);
    var newBucketValue = buckets[position.index] | position.mask;
    buckets[position.index] = newBucketValue;
  }

  function isLocationSet(buckets, location) {
    var position = toPosition(location);
    var bucket = buckets[position.index];
    return !! (bucket & position.mask);
  }

  /**
   * Fowler/Noll/Vo hashing. See
   * https://en.wikipedia.org/wiki/Fowler%E2%80%93Noll%E2%80%93Vo_hash_function#FNV-1a_hash.
   * For offset basis, see
   * http://www.isthe.com/chongo/tech/comp/fnv/index.html#FNV-param
   *
   * @param {string} string to hash
   * @returns 32bit signed int
   */

  //https://gist.githubusercontent.com/vaiorabbit/5657561/raw/8ba52a3e13ad1d0cbf7c18bb93919120f09a8f02/fnv32a.js
  function fnv_1a(str)
  {
    var FNV1_32A_INIT = 0x811c9dc5;
    var hval = FNV1_32A_INIT;
    for ( var i = 0; i < str.length; ++i )
    {
      hval ^= str.charCodeAt(i);
      hval = fnv_multiply(hval);
    }
    // ensure result is a 32 bit signed int
    return hval >>> 0;
  }

  /**
   * Multiply two FNV results
   * a * 16777619 mod 2**32
   *
   * @returns 32bit signed int
   */
  function fnv_multiply(a) {
    var result = a + (a << 1) + (a << 4) + (a << 7) + (a << 8) + (a << 24);
    // ensure result is a 32 bit signed int
    return result >>> 0;
  }

  /**
   * One additional iteration of FNV, given a hash value.
   *
   * @param {32bit signed in}
   * @returns 32bit signed int
   */
  function fnv_1a_b(a) {
    var result = fnv_mix(fnv_multiply(a));
    return result;
  }

  // See https://web.archive.org/web/20131019013225/http://home.comcast.net/~bretm/hash/6.html
  function fnv_mix(a) {
    a += a << 13;
    a ^= a >>> 7;
    a += a << 3;
    a ^= a >>> 17;
    a += a << 5;

    return a >>> 0;
  }

})(typeof exports !== "undefined" ? exports : this);
