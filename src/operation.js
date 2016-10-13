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
      if (onSuccess) {
        let callbackResult;
        try {
          callbackResult = onSuccess(operation.result)
        } catch(e) {
          completionOp.fail(e);
          return;
        }
        if (callbackResult && callbackResult.then) {
          callbackResult.forwardCompletion(completionOp);
          return;
        }

        completionOp.succeed(operation.result);

      } else {
        completionOp.succeed(operation.result);
      }
    }

    function errorHandler() {
      if (onError) {
        let callbackResult;
        try {
          callbackResult = onError(operation.error);
        } catch(e) {
          completionOp.fail(e);
          return;
        }

        if (callbackResult && callbackResult.then) {
          callbackResult.forwardCompletion(completionOp);
          return;
        }

        completionOp.succeed(callbackResult);
      } else {
        completionOp.fail(operation.error);
      }
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

  operation.fail = function fail(error) {
    if (operation.complete) {
      return;
    }
    operation.complete = true;
    operation.state = "failed";
    operation.error = error;
    operation.errorReactions.forEach(r => r(error));
  };

  operation.succeed = function succeed(result) {
    if (operation.complete) {
      return;
    }
    operation.complete = true;
    operation.state = "succeed";
    operation.result = result;
    operation.successReactions.forEach(r => r(result));
  };

  operation.nodeCallback = (err, data) => {
    if (err) {
      operation.fail(err);
      return;
    }
    operation.succeed(data);
  };

  operation.forwardCompletion = (op) => {
    operation.onCompletion(op.succeed, op.fail);
  };

  return operation;
};
