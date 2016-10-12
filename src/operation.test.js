suite.only("operation test");

function callDone(done) {
  let counter = 0;

  return {
    afterNCalls: function (expectedCount) {
      return function multiDone() {
        counter++;
        if (counter >= expectedCount) {
          // if we go over the count, we'll call done multiple times thus failing the test
          done();
        }
      }
    },
    afterTwoCalls: function () {
      return this.afterNCalls(2);
    }
  }
}

function doLater(func) {
  setTimeout(func, 2);
}

test("fetchCurrentCity pass the callbacks later on", (done) => {
  // initiate operation
  const operation = fetchCurrentCity();

  // register callbacks
  operation.onCompletion(
    result => done(),
    error => done(error)
  );
});

test("pass multiple callbacks - all of them are called", (done) => {
  // initiate operation
  const operation = fetchCurrentCity();

  const multiDone = callDone(done).afterTwoCalls();

  // register callbacks
  operation.onCompletion(result => multiDone());
  operation.onCompletion(result => multiDone());

});

test("noop if no success handler passed", (done) => {
  // initiate operation
  const operation = fetchCurrentCity();

  // noop should register for success handler
  operation.onFailure(err => done(err));

  // trigger success to make sure noop registered
  operation.onCompletion(result => done());

});

test("noop if no error handler passed", (done) => {
  // initiate operation
  const operation = fetchWeather();

  // noop should register for error handler
  operation.onCompletion(result => done(new Error('shouldnt succeed')));

  // trigger failure to make sure noop registered
  operation.onFailure(err => done());

});

test("register success callback async", (done) => {
  const currentCity = fetchCurrentCity();

  doLater(() => {
    currentCity.onCompletion(() => done());
  });
});

test("register error callback async", (done) => {
  const operationWillErrors = fetchWeather();

  doLater(() => {
    operationWillErrors.onFailure(() => done());
  });
});

test("lexical parallelisms", (done) => {
  const city = "NYC";

  let weatherData, forecastData;

  const weatherOp = fetchWeather(city);
  const forecastOp = fetchForecast(city);

  weatherOp.onCompletion((weather) => {
    forecastOp.onCompletion((forecast) => {
      console.log("both done!", `${weather.temp} and ${forecast.fiveDay}`);
      done();
    });
  });
});

test("life is full of async, nesting is inevitable, do sth about it", (done) => {
  let weatherOp = Operation();

  fetchCurrentCity().onCompletion((city) => {
    fetchWeather(city).forwardCompletion(weatherOp);
  });

  // other code needs to use weather response
  weatherOp.onCompletion(weather => done());
});
