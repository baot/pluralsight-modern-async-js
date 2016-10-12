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

    if (operation.state === 'succeed') {
      onSuccess(operation.result);
    }
    else if (operation.state === 'failed') {
      onError(operation.error);
    } else {
      operation.successReactions.push(onSuccess || noop);
      operation.errorReactions.push(onError || noop);
    }

    return Operation();
  };
  operation.onFailure = function onFailure(onError) {
    return operation.onCompletion(null, onError);
  };

  operation.fail = function fail(error) {
    operation.state = "failed";
    operation.error = error;
    operation.errorReactions.forEach(r => r(error));
  };

  operation.succeed = function succeed(result) {
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
