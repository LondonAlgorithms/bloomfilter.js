(function(exports) {
  'use strict';

  exports.BloomFilter = BloomFilter;
  exports.fnv_1a = fnv_1a;
  exports.fnv_1a_b = fnv_1a_b;

  var hash1 = fnv_1a;
  var hash2 = fnv_1a_b;

  /**
   * Code originally from bloomfilter.js by Jason Davies:
   * https://github.com/jasondavies/bloomfilter.js/
   *
   * London JS Algorithms Study Group presentation:
   * https://shane-tomlinson.github.io/bloomfilter-presentation/
   *
   * An approachable explanation:
   * http://www.michaelnielsen.org/ddi/why-bloom-filters-work-the-way-they-do/
   */

  /**
   * Create a new Bloom Filter
   *
   * @param {integer} m - total number of bits in the hash table
   * @param {integer} k - number of hashing functions to use
   */
  function BloomFilter(m, k) {
    // this.m is the same as this.buckets.length.
    this.m = m;
    this.k = k;
    this.buckets = new Array(m);
    this.buckets.fill(false);
  }

  /**
   * Find all `k` indices in the array where values
   * should be stored or tested.
   *
   * @param {number || string} value
   * @returns [array of numbers]
   */
  BloomFilter.prototype.indices = function(value) {
    var indices = [];

    // Only two hashes are used to simulate n hashes.
    // See http://willwhim.wpengine.com/2011/09/03/producing-n-hash-functions-by-hashing-only-once/
    var hashValueA = hash1(value);      // returns a 32bit signed int
    var hashValueB = hash2(hashValueA); // returns a 32bit signed int

    for (var i = 0; i < this.k; ++i) {
      // index could a huge number, cut off at this.m, which
      // is the highest possible index.
      indices[i] = (hashValueA + (hashValueB * i)) % this.m;
    }

    return indices;
  };

  /**
   * Add `value` to the filter.
   *
   * @param {string || number} value
   */
  BloomFilter.prototype.add = function(value) {
    var buckets = this.buckets;
    // Run hash k times to find the appropriate hashes.
    // Set the value at each returned index to true.
    this.indices(value).forEach(function (index) {
      buckets[index] = true;
    });
  };

  /**
   * Test if `value` is a member of the filter.
   *
   * @param {string || number} value
   * @returns {boolean}
   */
  BloomFilter.prototype.test = function(value) {
    // Run hash k times to find the appropriate hashes.
    // Check if the value at each returned index is true.
    var indices = this.indices(value);

    for (var i = 0; i < indices.length; ++i) {
      var index = indices[i];
      if (! this.buckets[index]) {
        return false;
      }
    }

    return true;
  };

  /**
   * Create a new Bloomfilter that is the union of this filter
   * plus another.
   *
   * @param {BloomFilter} other
   * @returns {BloomFilter}
   */
  BloomFilter.prototype.union = function(other) {
    if (this.m !== other.m) {
      throw new Error('filters must be the same size');
    }

    var unionFilter = new BloomFilter(this.m, this.k);

    for (var i = 0; i < this.buckets.length; ++i) {
      unionFilter.buckets[i] = this.buckets[i] || other.buckets[i];
    }

    return unionFilter;
  };

  /**
   * Create a new Bloomfilter that is the intersection of this
   * filter plus another
   *
   * @param {BloomFilter} filter
   * @returns {BloomFilter}
   */
  BloomFilter.prototype.intersection = function(other) {
    if (this.m !== other.m) {
      throw new Error('filters must be the same size');
    }

    var intersectionFilter = new BloomFilter(this.m, this.k);

    for (var i = 0; i < this.buckets.length; ++i) {
      intersectionFilter.buckets[i] = this.buckets[i] && other.buckets[i];
    }

    return intersectionFilter;
  };

  /*************************
   *
   * HELPERS! Scary stuff below here.
   *
   */

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
    str = '' + str;
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
   * @param {32bit signed int}
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
