var bf = require("../bloomfilter"),
    BloomFilter = bf.BloomFilter,
    fnv_1a = bf.fnv_1a,
    fnv_1a_b = bf.fnv_1a_b;

var vows = require("vows"),
    assert = require("assert");

var suite = vows.describe("bloomfilter");

var jabberwocky = "`Twas brillig, and the slithy toves\n  Did gyre and gimble in the wabe:\nAll mimsy were the borogoves,\n  And the mome raths outgrabe.\n\n\"Beware the Jabberwock, my son!\n  The jaws that bite, the claws that catch!\nBeware the Jubjub bird, and shun\n  The frumious Bandersnatch!\"\n\nHe took his vorpal sword in hand:\n  Long time the manxome foe he sought --\nSo rested he by the Tumtum tree,\n  And stood awhile in thought.\n\nAnd, as in uffish thought he stood,\n  The Jabberwock, with eyes of flame,\nCame whiffling through the tulgey wood,\n  And burbled as it came!\n\nOne, two! One, two! And through and through\n  The vorpal blade went snicker-snack!\nHe left it dead, and with its head\n  He went galumphing back.\n\n\"And, has thou slain the Jabberwock?\n  Come to my arms, my beamish boy!\nO frabjous day! Callooh! Callay!'\n  He chortled in his joy.\n\n`Twas brillig, and the slithy toves\n  Did gyre and gimble in the wabe;\nAll mimsy were the borogoves,\n  And the mome raths outgrabe.";


var jabberWords = jabberwocky.split(/\s+/).map(function (word) {
  var cleaned = word.replace(/[\.`"',;\s!-]/g, '');
  return cleaned;
}).filter(function (word) {
  return word.length;
});

var BITS = 1000;
var HASHING_FUNCTIONS = 5;

suite.addBatch({
  "locations": {
    topic: function () {
      var f = new BloomFilter(BITS, HASHING_FUNCTIONS);
      var locations = f.locations(jabberwocky);
      return locations;
    },

    "the correct number of values are returned": function (locations) {
      assert.equal(locations.length, HASHING_FUNCTIONS);
    },

    "all values are >= 0": function (locations) {
      locations.forEach(function (location) {
        assert.ok(location >= 0);
      });
    },

    "all values are unique": function (locations) {
      var unique = locations.reduce(function (unique, value) {
        if (unique.indexOf(value) === -1) {
          unique.push(value);
        }

        return unique;
      }, []);

      assert.equal(unique.length, HASHING_FUNCTIONS);
    }
  },

  "bloom filter": {
    "basic": function() {
      var f = new BloomFilter(BITS, HASHING_FUNCTIONS),
          n1 = "Bess",
          n2 = "Jane";
      f.add(n1);
      assert.equal(f.test(n1), true);
      assert.equal(f.test(n2), false);
    },
    "jabberwocky": function() {
      var f = new BloomFilter(BITS, HASHING_FUNCTIONS),
          n1 = jabberwocky,
          n2 = jabberwocky + "\n";
      f.add(n1);
      assert.equal(f.test(n1), true);
      assert.equal(f.test(n2), false);
    },
    "basic uint32": function() {
      var f = new BloomFilter(BITS, HASHING_FUNCTIONS),
          n1 = "\u0100",
          n2 = "\u0101",
          n3 = "\u0103";
      f.add(n1);
      assert.equal(f.test(n1), true);
      assert.equal(f.test(n2), false);
      assert.equal(f.test(n3), false);
    },
    "wtf": function() {
      var f = new BloomFilter(20, 10);
      f.add("abc");
      assert.equal(f.test("wtf"), false);
    },
    "works with integer types": function() {
      var f = new BloomFilter(BITS, HASHING_FUNCTIONS);
      f.add(1);
      assert.equal(f.test(1), true);
      assert.equal(f.test(2), false);
    }
  },

  "union": {
    topic: function () {
      var copy = [].concat(jabberWords);
      var firstHalf = copy.splice(0, jabberWords.length / 2);
      var secondHalf = copy;

      var f1 = new BloomFilter(BITS, HASHING_FUNCTIONS);
      var f2 = new BloomFilter(BITS, HASHING_FUNCTIONS);

      firstHalf.forEach(f1.add.bind(f1));
      secondHalf.forEach(f2.add.bind(f2));

      return f1.union(f2);
    },

    "contains all words from both sets": function (unionFilter) {
      jabberWords.forEach(function (word) {
        assert.isTrue(unionFilter.test(word));
      });
    },

    "returns a new filter that's the union of both": function (unionFilter) {
      assert.isFalse(unionFilter.test("asdf"));
      assert.isFalse(unionFilter.test("brilligs"));
    }
  },

  "intersection": {
    topic: function () {
      var copy = [].concat(jabberWords);
      var firstHalf = copy.splice(0, jabberWords.length / 2);
      var secondHalf = copy;

      var f1 = new BloomFilter(BITS, HASHING_FUNCTIONS);
      var f2 = new BloomFilter(BITS, HASHING_FUNCTIONS);

      firstHalf.forEach(f1.add.bind(f1));
      secondHalf.forEach(f2.add.bind(f2));

      return f1.intersection(f2);
    },

    "returns a new filter that's the interesection of both": function (intersectionFilter) {
      assert.isTrue(intersectionFilter.test("gimble"));
      assert.isFalse(intersectionFilter.test("frumious"));
      assert.isFalse(intersectionFilter.test("asdf"));
    }
  }
});

suite.export(module);
