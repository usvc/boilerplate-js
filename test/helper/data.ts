export const testBody = {
  number: 1,
  float: 3.141,
  string: 'string',
  boolean: true,
  object: {
    number: 2,
    float: 1.618,
    string: 'another string',
    boolean: false,
  },
};

export const testUrlEncodedBody =
  Object.keys(testBody)
    .reduce((p, c) => {
      return {
        ...p,
        [c]: (typeof testBody[c] === 'object') ?
        Object.keys(testBody[c])
          .reduce((p2, c2) => {
            return {
              ...p2,
              [c2]: testBody[c][c2].toString(),
            };
          }, {})
        : testBody[c].toString(),
      };
    }, {});
