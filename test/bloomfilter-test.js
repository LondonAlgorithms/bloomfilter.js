(function () {
//global it, before, beforeEach
'use strict';

const BloomFilter = window.BloomFilter;
const assert = window.chai.assert;
const fnv_1a = window.fnv_1a;
const fnv_1a_b = window.fnv_1a_b;

const BITS = 1000;
const HASHING_FUNCTIONS = 5;

const JABBERWOCKY = "`Twas brillig, and the slithy toves\n  Did gyre and gimble in the wabe:\nAll mimsy were the borogoves,\n  And the mome raths outgrabe.\n\n\"Beware the Jabberwock, my son!\n  The jaws that bite, the claws that catch!\nBeware the Jubjub bird, and shun\n  The frumious Bandersnatch!\"\n\nHe took his vorpal sword in hand:\n  Long time the manxome foe he sought --\nSo rested he by the Tumtum tree,\n  And stood awhile in thought.\n\nAnd, as in uffish thought he stood,\n  The Jabberwock, with eyes of flame,\nCame whiffling through the tulgey wood,\n  And burbled as it came!\n\nOne, two! One, two! And through and through\n  The vorpal blade went snicker-snack!\nHe left it dead, and with its head\n  He went galumphing back.\n\n\"And, has thou slain the Jabberwock?\n  Come to my arms, my beamish boy!\nO frabjous day! Callooh! Callay!'\n  He chortled in his joy.\n\n`Twas brillig, and the slithy toves\n  Did gyre and gimble in the wabe;\nAll mimsy were the borogoves,\n  And the mome raths outgrabe.";
const JABBER_WORDS = JABBERWOCKY.split(/\s+/).map((word) => {
  return word.replace(/[\.`"',;\s!-]/g, '');
}).filter((word) => {
  return word.length;
});

describe('bloomfilter', () => {
  describe('initialization', () => {
    let filter;

    before(() => {
      filter = new BloomFilter(BITS, HASHING_FUNCTIONS);
    });

    it('sets all bits to 0', () => {
      filter.buckets.forEach((bucket) => {
        assert.equal(bucket, 0);
      });
    });
  });

  describe('indices (test one hash)', () => {
    let indices;

    beforeEach(() => {
      let filter = new BloomFilter(BITS, 1);
      indices = filter.indices(JABBERWOCKY);
    });

    it('returns the correct number of values', () => {
      assert.lengthOf(indices, 1);
    });

    it('returns value >= 0', () => {
      assert.ok(indices[0] >= 0);
    });
  });

  describe('indices (test 2 hashes)', () => {
    let indices;
    let hashFunctions = 2;

    beforeEach(() => {
      let filter = new BloomFilter(BITS, hashFunctions);
      indices = filter.indices(JABBERWOCKY);
    });

    it('returns the correct number of values', () => {
      assert.lengthOf(indices, hashFunctions);
    });

    it('returns values all >= 0', () => {
      indices.forEach((location) => {
        assert.ok(location >= 0);
      });
    });

    it('returns all unique values', () => {
      let unique = indices.reduce((unique, value) => {
        if (unique.indexOf(value) === -1) {
          unique.push(value);
        }

        return unique;
      }, []);

      assert.equal(unique.length, hashFunctions);
    });
  });

  describe('indices (test arbitrary k)', () => {
    let indices;

    beforeEach(() => {
      let filter = new BloomFilter(BITS, HASHING_FUNCTIONS);
      indices = filter.indices(JABBERWOCKY);
    });

    it('returns the correct number of values', () => {
      assert.lengthOf(indices, HASHING_FUNCTIONS);
    });

    it('returns values all >= 0', () => {
      indices.forEach((location) => {
        assert.ok(location >= 0);
      });
    });

    it('returns all unique values', () => {
      let unique = indices.reduce((unique, value) => {
        if (unique.indexOf(value) === -1) {
          unique.push(value);
        }

        return unique;
      }, []);

      assert.equal(unique.length, HASHING_FUNCTIONS);
    });
  });

  describe('add/test', () => {
    describe('basic', () => {
      let filter;
      let n1 = "Bess";
      let n2 = "Jane";

      before(() => {
        filter = new BloomFilter(BITS, HASHING_FUNCTIONS);
        filter.add(n1);
      });

      it('finds items in the set', () => {
        assert.isTrue(filter.test(n1));
      });

      it('does not find items not in the set', () => {
        assert.isFalse(filter.test(n2));
      });
    });

    describe('with jabberwocky', () => {
      let filter;
      let n1 = JABBERWOCKY;
      let n2 = JABBERWOCKY + "\n";

      before(() => {
        filter = new BloomFilter(BITS, HASHING_FUNCTIONS);
        filter.add(n1);
      });

      it('finds items in the set', () => {
        assert.isTrue(filter.test(n1));
      });

      it('does not find items not in the set', () => {
        assert.isFalse(filter.test(n2));
      });
    });

    describe('wtf', () => {
      let filter;

      before(() => {
        filter = new BloomFilter(20, 10);
        filter.add("abc");
      });

      it('does not find wtf', () => {
        assert.isFalse(filter.test("wtf"));
      });
    });

    describe('with uint32', () => {
      let filter;
      let n1 = "\u0100";
      let n2 = "\u0101";
      let n3 = "\u0103";

      before(() => {
        filter = new BloomFilter(BITS, HASHING_FUNCTIONS);
        filter.add(n1);
      });

      it('finds items in the set', () => {
        assert.isTrue(filter.test(n1));
      });

      it('does not find items not in the set', () => {
        assert.isFalse(filter.test(n2));
        assert.isFalse(filter.test(n3));
      });
    });

    describe("with integers ", () => {
      let filter;

      before(() => {
        filter = new BloomFilter(BITS, HASHING_FUNCTIONS);
        filter.add(1);
      });

      it('finds items in the set', () => {
        assert.isTrue(filter.test(1));
      });

      it('does not find items not in the set', () => {
        assert.isFalse(filter.test(2));
      });
    });
  });

  describe('union', () => {
    let unionFilter;

    before(() => {
      let copy = [].concat(JABBER_WORDS);
      let firstHalf = copy.splice(0, JABBER_WORDS.length / 2);
      let secondHalf = copy;

      let f1 = new BloomFilter(BITS, HASHING_FUNCTIONS);
      let f2 = new BloomFilter(BITS, HASHING_FUNCTIONS);

      firstHalf.forEach(f1.add.bind(f1));
      secondHalf.forEach(f2.add.bind(f2));

      unionFilter = f1.union(f2);
    });

    it("returns a new filter that's the union of both", () => {
      JABBER_WORDS.forEach((word) => {
        assert.isTrue(unionFilter.test(word));
      });

      assert.isFalse(unionFilter.test("asdf"));
      assert.isFalse(unionFilter.test("brilligs"));
    });
  });

  describe('intersection', () => {
    let intersectionFilter;

    before(() => {
      let copy = [].concat(JABBER_WORDS);
      let firstHalf = copy.splice(0, JABBER_WORDS.length / 2);
      let secondHalf = copy;

      let f1 = new BloomFilter(BITS, HASHING_FUNCTIONS);
      let f2 = new BloomFilter(BITS, HASHING_FUNCTIONS);

      firstHalf.forEach(f1.add.bind(f1));
      secondHalf.forEach(f2.add.bind(f2));

      intersectionFilter = f1.intersection(f2);
    });

    it("returns a new filter that's the interesection of both", () => {
      assert.isTrue(intersectionFilter.test("gimble"));
      assert.isFalse(intersectionFilter.test("frumious"));
      assert.isFalse(intersectionFilter.test("asdf"));
    });
  });
});
}());

