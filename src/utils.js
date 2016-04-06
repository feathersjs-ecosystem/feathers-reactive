const promiseMethods = ['then', 'catch'];

export function promisify(obj, promise) {
  promiseMethods.forEach(method => {
    Object.defineProperty(obj, method, {
      enumerable: false,
      value: function(... args) {
        return promise.then(... args);
      }
    });
  });

  return obj;
}
