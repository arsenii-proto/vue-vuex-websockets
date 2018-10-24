const typeOf = type => data => typeof data === type;
const instanceOf = constructor => instance =>
  typeOf("object")(instance) && instance.constructor === constructor;
const funcResultIs = f => t => data => t === f(data);

const isDeepMatching = (data, expectation) =>
  expectation &&
  ((typeOf("function")(expectation) && expectation(data)) ||
    (data &&
      typeOf("object")(expectation) &&
      typeOf("object")(data) &&
      Object.keys(expectation)
        .map(key => key in data && isDeepMatching(data[key], expectation[key]))
        .reduce((all, result) => all && result, true)));

const checks = {
  be: {
    function: typeOf("function"),
    object: data =>
      typeOf("object")(data) && data !== null && !instanceOf(Array),
    array: instanceOf(Array),
    string: typeOf("string"),
    number: typeOf("number"),
    undefined: typeOf("undefined"),
    match: regex => data => instanceOf(RegExp)(regex) && regex.test(data),
    false: data => !data,
    true: data => !!data,
    null: data => data === null,
    equal: val => data => data === val,
    empty: data =>
      (typeOf("string")(data) && !data) ||
      (instanceOf(Array)(data) && !data.length) ||
      (typeOf("object")(data) && !Object.keys(data).length),
    deepEqual: val => data => isDeepMatching(data, val),
    typeOf,
    instanceOf
  },
  have: {
    length: val => data => instanceOf(Array)(data) && data.length === val,
    prop: (prop, val) => data => typeOf("object")(data) && data[prop] === val,
    props: (...props) => data =>
      typeOf("object")(data) &&
      props
        .map(prop => prop in data)
        .reduce((all, result) => all && result, true)
  }
};

const to = {
  be: {},
  have: {},
  not: {
    be: {},
    have: {}
  }
};

Object.keys(checks.be).forEach(check => {
  to.be[check] = funcResultIs(checks.be[check])(true);
  to.not.be[check] = funcResultIs(checks.be[check](false));
});

Object.keys(checks.have).forEach(check => {
  to.have[check] = funcResultIs(checks.have[check](true));
  to.not.have[check] = funcResultIs(checks.have[check](false));
});

const expect = Object.freeze({
  to
});

export default action => {
  const details = {
    action,
    filters: [],
    subscribers: []
  };

  return {
    having(func) {
      details.filters.push(func(expect));
      return this;
    },

    subscribe(func) {
      details.subscribers.push(func);
      return this;
    },

    trigger(action, data, opts) {
      action === details.action &&
        details.filters
          .map(filter => isDeepMatching(data, filter))
          .reduce((all, result) => all && result, true) &&
        details.subscribers.forEach(subscriber =>
          subscriber(action, data, opts)
        );
    }
  };
};

export { isDeepMatching, expect };
