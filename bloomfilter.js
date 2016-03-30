(function(exports) {
  'use strict';

  exports.BloomFilter = BloomFilter;

  /**
   * Two hashes are given for you!
   */
  exports.hash1 = fnv_1a;
  exports.hash2 = fnv_1a_b;

  /**
   * Code originally from bloomfilter.js by Jason Davies:
   * https://github.com/jasondavies/bloomfilter.js/
   *
   * London JS Algorithms Study Group presentation:
   * https://shane-tomlinson.github.io/bloomfilter-presentation/
   *
   * MDN bit operations:
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_Operators
   *
   * An approachable explanation:
   * http://www.michaelnielsen.org/ddi/why-bloom-filters-work-the-way-they-do/
   *
   * A great survey of the math behind filters, and their uses:
   * https://www.eecs.harvard.edu/~michaelm/postscripts/im2005b.pdf
   */

  /**
   * Create a new Bloom Filter
   *
   * @param {integer} m - total number of bits in the hash table
   * @param {integer} k - number of hashing functions to use
   */
  function BloomFilter(m, k) {
    // hint, round the number of buckets up to the nearest 32.
  }

  /**
   * Hash `v` `k` times
   *
   * @param {variant} v
   * @returns [array of numbers]
   */
  BloomFilter.prototype.locations = function(v) {
    // hint, see
    // https://willwhim.wpengine.com/2011/09/03/producing-n-hash-functions-by-hashing-only-once/
  };

  /**
   * Add an item to the filter
   *
   * @param {variant} v
   */
  BloomFilter.prototype.add = function(v) {
  };

  /**
   * Test if an item is in the filter
   *
   * @param {variant} v
   * @returns {boolean}
   */
  BloomFilter.prototype.test = function(v) {
  };

  /**
   * Create a new Bloomfilter that is the union of this filter
   * plus another.
   *
   * @param {BloomFilter} filter
   * @returns {BloomFilter}
   */
  BloomFilter.prototype.union = function(filter) {
  };

  /**
   * Create a new Bloomfilter that is the intersection of this
   * filter plus another
   *
   * @param {BloomFilter} filter
   * @returns {BloomFilter}
   */
  BloomFilter.prototype.intersection = function(filter) {
  };

  /*************************
   *
   * HELPERS!
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
