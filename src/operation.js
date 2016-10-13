const delayms = 1;

function getCurrentCity(callback) {
  setTimeout(function () {

    const city = "New York, NY";
    callback(null, city);

  }, delayms)
}

function getWeather(city, callback) {
  setTimeout(function () {

    if (!city) {
      callback(new Error("City required to get weather"));
      return;
    }

    const weather = {
      temp: 50
    };

    callback(null, weather)

  }, delayms)
}

function getForecast(city, callback) {
  setTimeout(function () {

    if (!city) {
      callback(new Error("City required to get forecast"));
      return;
    }

    const fiveDay = {
      fiveDay: [60, 70, 80, 45, 50]
    };

    callback(null, fiveDay)

  }, delayms)
}

function fetchCurrentCity() {
  const operation = Operation();

  getCurrentCity(operation.nodeCallback);

  return operation;
}

function fetchWeather(city) {
  const operation = Operation();

  getWeather(city, operation.nodeCallback);

  return operation;
}

function fetchForecast(city) {
  const operation = Operation();

  getForecast(city, operation.nodeCallback);

  return operation;
}

function Operation() {
  const operation = {
    successReactions: [],
    errorReactions: []
  };

  operation.onCompletion = function onCompletion(onSuccess, onError) {
    const noop = function() {};
    const completionOp = new Operation();

    function successHandler() {
      setTimeout(() => {
        if (onSuccess) {
          let callbackResult;
          try {
            callbackResult = onSuccess(operation.result)
          } catch(e) {
            completionOp.fail(e);
            return;
          }
          completionOp.resolve(callbackResult);
        } else {
          completionOp.resolve(operation.result);
        }
      }, 0);
    }

    function errorHandler() {
      setTimeout(() => {
        if (onError) {
          let callbackResult;
          try {
            callbackResult = onError(operation.error);
          } catch(e) {
            completionOp.fail(e);
            return;
          }
          completionOp.resolve(callbackResult);
        } else {
          completionOp.fail(operation.error);
        }
      }, 0);
    }

    if (operation.state === 'succeed') {
      successHandler();
    }
    else if (operation.state === 'failed') {
      errorHandler();
    } else {
      operation.successReactions.push(successHandler);
      operation.errorReactions.push(errorHandler);
    }

    return completionOp;
  };

  operation.then = operation.onCompletion;

  operation.onFailure = function onFailure(onError) {
    return operation.then(null, onError);
  };

  operation.catch = operation.onFailure;

  operation.reject = function reject(error) {
    if (operation.resolved) {
      return;
    }
    operation.resolved = true;
    internalReject(error);
  };

  operation.fail = operation.reject;

  function internalReject(error) {
    operation.state = "failed";
    operation.error = error;
    operation.errorReactions.forEach(r => r(error));
  }

  operation.resolve = function resolve(value) {
    if (operation.resolved) {
      return;
    }
    operation.resolved = true;

    internalResolve(value);
  };

  function internalResolve(value) {
    // value could be a promise
    if (value && value.then) {
      value.then(internalResolve, internalReject);
      return;
    }
    // or a result
    operation.state = "succeed";
    operation.result = value;
    operation.successReactions.forEach(r => r(value));
  };

  operation.nodeCallback = (err, data) => {
    if (err) {
      operation.reject(err);
      return;
    }
    operation.resolve(data);
  };

  return operation;
};
